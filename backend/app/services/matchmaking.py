"""
Matchmaking Service

Handles player queue management and skill-based matching for multiplayer battles.
"""

from typing import Optional, Dict, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from sqlmodel import Session, select
from app.models import User, PlayerStats, GameSession, GameStatus
from collections import OrderedDict
import asyncio
import logging

logger = logging.getLogger(__name__)


@dataclass
class QueuedPlayer:
    """Represents a player in the matchmaking queue"""
    player_id: int
    user_id: int  # Firebase UID reference
    level: int
    experience_points: int
    win_rate: float
    exercise_id: Optional[int] = None  # Preferred exercise
    queued_at: datetime = field(default_factory=datetime.utcnow)
    search_range_expanded: bool = False  # Whether we've expanded search criteria


class MatchmakingQueue:
    """
    In-memory matchmaking queue with skill-based matching algorithm.
    
    For production scaling, consider using Redis or a database-backed queue.
    """
    
    def __init__(self):
        # Use OrderedDict to preserve insertion order for FIFO matching
        self.queue: OrderedDict[int, QueuedPlayer] = OrderedDict()  # player_id -> QueuedPlayer (preserves order)
        self.matchmaking_websockets: Dict[int, any] = {}  # player_id -> WebSocket
        self.lock = asyncio.Lock()
        self.matching_lock = asyncio.Lock()  # Separate lock for matching to prevent concurrent matches
        # Match threshold no longer used (FIFO matching)
        self.match_threshold = 100.0  # Kept for backward compatibility but not used
        self.queue_timeout = timedelta(minutes=5)  # Remove stale players after 5 minutes
        self._matching_task: Optional[asyncio.Task] = None
        
    async def add_player(
        self,
        player_id: int,
        user_id: int,
        level: int,
        experience_points: int,
        win_rate: float,
        exercise_id: Optional[int] = None,
    ) -> bool:
        """
        Add a player to the matchmaking queue.
        
        Returns True if added successfully, False if already in queue.
        Note: Creates its own database session for async matching operations.
        """
        async with self.lock:
            # Check and add atomically to prevent race conditions
            if player_id in self.queue:
                logger.warning(f"Player {player_id} already in queue (idempotent request ignored)")
                return False
            
            queued_player = QueuedPlayer(
                player_id=player_id,
                user_id=user_id,
                level=level,
                experience_points=experience_points,
                win_rate=win_rate,
                exercise_id=exercise_id,
            )
            
            # Add to queue inside the lock to make it atomic
            self.queue[player_id] = queued_player
            queue_size = len(self.queue)
            logger.info(f"Player {player_id} added to matchmaking queue (total in queue: {queue_size})")
        
        # Wait for WebSocket to connect, then try matching
        async def wait_for_websocket_then_match():
            # Wait for WebSocket to register
            max_wait = 3.0  # seconds
            wait_interval = 0.1  # check every 100ms
            waited = 0.0
            
            while waited < max_wait:
                if player_id in self.matchmaking_websockets:
                    logger.info(f"Player {player_id} WebSocket registered, attempting match")
                    # Create a new session for the async task
                    from app.database.connection import get_session
                    with next(get_session()) as new_session:
                        await self._try_match_and_notify(player_id, new_session)
                    return
                await asyncio.sleep(wait_interval)
                waited += wait_interval
            
            # Timeout - try anyway
            logger.warning(f"Player {player_id} WebSocket not registered after {max_wait}s, matching anyway")
            # Create a new session for the async task
            from app.database.connection import get_session
            with next(get_session()) as new_session:
                await self._try_match_and_notify(player_id, new_session)
        
        asyncio.create_task(wait_for_websocket_then_match())
        
        return True
    
    async def remove_player(self, player_id: int) -> bool:
        """Remove a player from the queue."""
        async with self.lock:
            if player_id in self.queue:
                del self.queue[player_id]
                logger.info(f"Player {player_id} removed from queue")
                return True
            return False
    
    async def get_queue_status(self, player_id: int) -> Dict:
        """Get queue status for a player (FIFO position)."""
        async with self.lock:
            if player_id not in self.queue:
                return {
                    "in_queue": False,
                    "queue_position": 0,
                    "estimated_wait": 0,
                }
            
            # Calculate actual position in FIFO queue
            queue_items = list(self.queue.items())
            player_position = None
            for idx, (pid, _) in enumerate(queue_items):
                if pid == player_id:
                    player_position = idx
                    break
            
            if player_position is None:
                return {
                    "in_queue": False,
                    "queue_position": 0,
                    "estimated_wait": 0,
                }
            
            # Position in queue (0-indexed, so add 1 for display)
            # If you're first (position 0), you need 1 more player
            # If you're second (position 1), you're next to be matched
            queue_position = player_position + 1
            
            # Estimate wait time based on position
            # If you're first, wait for 1 more player (could be instant or take time)
            # If you're second, you're next (should be instant)
            # If you're third+, estimate based on how many players ahead
            if player_position == 0:
                # First in queue - waiting for second player
                estimated_wait = 30  # Average wait for next player to join
            elif player_position == 1:
                # Second in queue - should match immediately
                estimated_wait = 5
            else:
                # Third or later - estimate based on position
                # Each pair ahead = ~30 seconds (time for a match to complete + new player to join)
                pairs_ahead = player_position // 2
                estimated_wait = max(10, pairs_ahead * 30)
            
            return {
                "in_queue": True,
                "queue_position": queue_position,
                "estimated_wait": estimated_wait,
            }
    
    async def _try_match_and_notify(
        self,
        player_id: int,
        session: Optional[Session] = None
    ):
        """Try to find a match and notify players if found."""
        match_result = await self._try_match_player(player_id, session)
        if match_result:
            # Notify both players (include game_id in payload)
            game_id = match_result["game_id"]
            await self.notify_match_found(
                match_result["player1"]["player_id"],
                {**match_result["player1"], "game_id": game_id},
            )
            await self.notify_match_found(
                match_result["player2"]["player_id"],
                {**match_result["player2"], "game_id": game_id},
            )
    
    async def _try_match_player(
        self,
        player_id: int,
        session: Optional[Session] = None
    ) -> Optional[Dict]:
        """
        Try to find a match for a player (strict FIFO - matches first two players in queue).
        Returns match info if found, None otherwise.
        """
        # Use matching lock to ensure only one match happens at a time
        async with self.matching_lock:
            async with self.lock:
                # Check if player is still in queue
                if player_id not in self.queue:
                    return None
                
                # Need at least 2 players for a match
                if len(self.queue) < 2:
                    logger.info(f"Not enough players for match (queue size: {len(self.queue)})")
                    return None
                
                # Get first two players in queue (FIFO order)
                queue_items = list(self.queue.items())
                first_player_id, first_player = queue_items[0]
                second_player_id, second_player = queue_items[1]
                
                # Verify both players are still in queue (they might have left)
                if first_player_id not in self.queue or second_player_id not in self.queue:
                    logger.warning("Players left queue during matching, retrying...")
                    return None
                
                # Match the first two players in queue (strict FIFO)
                logger.info(f"Match found! Player {first_player_id} vs Player {second_player_id} (FIFO: first two in queue)")
                return await self._create_match(first_player, second_player, session)
    
    def _calculate_match_score(self, player1: QueuedPlayer, player2: QueuedPlayer) -> float:
        """
        Calculate match score between two players (DEPRECATED - not used for FIFO matching).
        Kept for backward compatibility.
        """
        # No longer used - matching is now FIFO (first-come-first-serve)
        return 0.0
    
    async def _try_match_all_players(self, session: Optional[Session] = None):
        """Try to match players in the queue (FIFO - matches first two players)."""
        async with self.lock:
            queue_size = len(self.queue)
        
        # Only try to match if we have at least 2 players
        if queue_size >= 2:
            # Get first player in queue for matching attempt
            async with self.lock:
                if len(self.queue) >= 2:
                    first_player_id = next(iter(self.queue))
                    logger.info(f"Trying to match players in queue (size: {queue_size}, matching first player: {first_player_id})")
                else:
                    return
            
            # Create a new session if none provided
            if session is None:
                from app.database.connection import get_session
                with next(get_session()) as new_session:
                    await self._try_match_and_notify(first_player_id, new_session)
            else:
                await self._try_match_and_notify(first_player_id, session)
    
    async def _create_match(
        self,
        player1: QueuedPlayer,
        player2: QueuedPlayer,
        session: Optional[Session] = None
    ) -> Optional[Dict]:
        """
        Create a game session for two matched players.
        Returns match info with game_id.
        """
        if not session:
            logger.error("Cannot create match without database session")
            return None
        
        try:
            # Determine exercise (prefer player1's choice, fallback to player2's)
            exercise_id = player1.exercise_id or player2.exercise_id
            
            # Create game session
            game_session = GameSession(
                player_a_id=player1.player_id,
                player_b_id=player2.player_id,
                status=GameStatus.WAITING.value,
                current_exercise_id=exercise_id,
            )
            
            session.add(game_session)
            session.commit()
            session.refresh(game_session)
            
            logger.info(
                f"Match created: Game {game_session.id} - "
                f"Player {player1.player_id} vs Player {player2.player_id}"
            )
            
            # Remove both players from queue
            await self.remove_player(player1.player_id)
            await self.remove_player(player2.player_id)
            
            # Get opponent info for notifications
            opponent1_user = session.get(User, player2.player_id)
            opponent2_user = session.get(User, player1.player_id)
            
            return {
                "game_id": game_session.id,
                "player1": {
                    "player_id": player1.player_id,
                    "opponent_id": player2.player_id,
                    "opponent_name": opponent1_user.username if opponent1_user else "Opponent",
                    "exercise_id": exercise_id,
                },
                "player2": {
                    "player_id": player2.player_id,
                    "opponent_id": player1.player_id,
                    "opponent_name": opponent2_user.username if opponent2_user else "Opponent",
                    "exercise_id": exercise_id,
                },
            }
        except Exception as e:
            logger.error(f"Error creating match: {e}")
            session.rollback()
            return None
    
    async def cleanup_stale_players(self):
        """Remove players who have been in queue too long."""
        async with self.lock:
            now = datetime.utcnow()
            stale_players = [
                player_id
                for player_id, player in self.queue.items()
                if now - player.queued_at > self.queue_timeout
            ]
            
            for player_id in stale_players:
                await self.remove_player(player_id)
                logger.info(f"Removed stale player {player_id} from queue")
    
    def register_matchmaking_websocket(self, player_id: int, websocket: any):
        """Register a WebSocket connection for matchmaking updates."""
        self.matchmaking_websockets[player_id] = websocket
    
    def unregister_matchmaking_websocket(self, player_id: int):
        """Unregister a WebSocket connection."""
        if player_id in self.matchmaking_websockets:
            del self.matchmaking_websockets[player_id]
    
    async def notify_match_found(self, player_id: int, match_info: Dict):
        """Notify a player that a match was found via WebSocket."""
        if player_id in self.matchmaking_websockets:
            websocket = self.matchmaking_websockets[player_id]
            try:
                await websocket.send_json({
                    "type": "MATCH_FOUND",
                    "payload": match_info,
                })
                logger.info(f"Match notification sent to player {player_id}")
            except Exception as e:
                logger.error(f"Error sending match notification to player {player_id}: {e}")
        else:
            logger.warning(f"Player {player_id} not connected to matchmaking WebSocket (has {len(self.matchmaking_websockets)} connections)")


# Global matchmaking queue instance
matchmaking_queue = MatchmakingQueue()


async def start_matchmaking_cleanup_task():
    """Background task to clean up stale players from queue."""
    while True:
        await asyncio.sleep(60)  # Run every minute
        await matchmaking_queue.cleanup_stale_players()

