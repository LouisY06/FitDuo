from fastapi import WebSocket
from typing import Dict


class ConnectionManager:
    """Manages WebSocket connections for active game sessions"""
    
    def __init__(self):
        # Structure: {game_id: {player_id: websocket}}
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, game_id: int, player_id: int):
        """Accept and register a WebSocket connection"""
        await websocket.accept()
        if game_id not in self.active_connections:
            self.active_connections[game_id] = {}
        self.active_connections[game_id][player_id] = websocket

    def disconnect(self, game_id: int, player_id: int):
        """Remove a WebSocket connection"""
        if game_id in self.active_connections:
            if player_id in self.active_connections[game_id]:
                del self.active_connections[game_id][player_id]
            # Clean up empty game sessions
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]

    async def send_personal_message(self, message: dict, game_id: int, player_id: int):
        """Send a message to a specific player in a game"""
        if game_id in self.active_connections and player_id in self.active_connections[game_id]:
            websocket = self.active_connections[game_id][player_id]
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error sending message to player {player_id} in game {game_id}: {e}")

    async def broadcast_to_game(self, message: dict, game_id: int, exclude_player: int = None):
        """Broadcast a message to all players in a game"""
        if game_id in self.active_connections:
            for pid, websocket in self.active_connections[game_id].items():
                if pid != exclude_player:
                    try:
                        await websocket.send_json(message)
                    except Exception as e:
                        print(f"Error broadcasting to player {pid} in game {game_id}: {e}")

    def get_connected_players(self, game_id: int) -> list[int]:
        """Get list of connected player IDs for a game"""
        if game_id in self.active_connections:
            return list(self.active_connections[game_id].keys())
        return []

