"""
Matchmaking Router

Handles matchmaking queue operations and real-time match notifications.
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models import User, PlayerStats
from app.middleware.auth import require_auth
from app.services.matchmaking import matchmaking_queue
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/matchmaking", tags=["matchmaking"])


class JoinQueueRequest(BaseModel):
    exercise_id: Optional[int] = None


class QueueStatusResponse(BaseModel):
    in_queue: bool
    queue_position: int
    estimated_wait: int  # seconds


@router.post("/queue", response_model=QueueStatusResponse)
async def join_queue(
    request: JoinQueueRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(require_auth),
):
    """
    Join the matchmaking queue.
    
    The current user will be added to the queue and matched with a suitable opponent.
    """
    logger.info(f"Join queue request from user: {current_user.get('uid', 'unknown')}")
    # Get user ID from Firebase UID
    user = session.exec(
        select(User).where(User.firebase_uid == current_user["uid"])
    ).first()
    
    if not user:
        logger.warning(f"User not found for Firebase UID: {current_user.get('uid', 'unknown')}")
        raise HTTPException(status_code=404, detail="User not found")
    
    logger.info(f"Found user ID {user.id} for Firebase UID {current_user['uid']}")
    
    # Get player stats for skill-based matching
    player_stats = session.exec(
        select(PlayerStats).where(PlayerStats.user_id == user.id)
    ).first()
    
    # Use stats if available, otherwise use defaults
    level = user.level if user.level else 1
    experience_points = user.experience_points if user.experience_points else 0
    win_rate = player_stats.win_rate if player_stats else 0.0
    
    # Add player to queue
    added = await matchmaking_queue.add_player(
        player_id=user.id,
        user_id=user.id,  # For now, using same ID
        level=level,
        experience_points=experience_points,
        win_rate=win_rate,
        exercise_id=request.exercise_id,
        session=session,
    )
    
    if not added:
        # Already in queue, return current status
        status = await matchmaking_queue.get_queue_status(user.id)
        return QueueStatusResponse(**status)
    
    # Get queue status
    status = await matchmaking_queue.get_queue_status(user.id)
    
    return QueueStatusResponse(**status)


@router.delete("/queue")
async def leave_queue(
    session: Session = Depends(get_session),
    current_user: dict = Depends(require_auth),
):
    """Leave the matchmaking queue."""
    # Get user ID from Firebase UID
    user = session.exec(
        select(User).where(User.firebase_uid == current_user["uid"])
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    removed = await matchmaking_queue.remove_player(user.id)
    
    if not removed:
        raise HTTPException(status_code=404, detail="Not in queue")
    
    return {"status": "removed", "message": "Left matchmaking queue"}


@router.get("/status", response_model=QueueStatusResponse)
async def get_queue_status(
    session: Session = Depends(get_session),
    current_user: dict = Depends(require_auth),
):
    """Get current queue status for the authenticated user."""
    # Get user ID from Firebase UID
    user = session.exec(
        select(User).where(User.firebase_uid == current_user["uid"])
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    status = await matchmaking_queue.get_queue_status(user.id)
    return QueueStatusResponse(**status)


@router.websocket("/ws/{player_id}")
async def matchmaking_websocket(websocket: WebSocket, player_id: int):
    """
    WebSocket endpoint for real-time matchmaking updates.
    
    Players connect here to receive notifications when a match is found.
    """
    await websocket.accept()
    
    # Register WebSocket for this player
    matchmaking_queue.register_matchmaking_websocket(player_id, websocket)
    
    logger.info(f"Player {player_id} connected to matchmaking WebSocket")
    
    try:
        # Keep connection alive and listen for messages
        while True:
            # Check for match periodically (this is handled by the queue service)
            # For now, just keep the connection alive
            data = await websocket.receive_text()
            
            # Handle ping/pong if needed
            if data == "PING":
                await websocket.send_text("PONG")
            
    except WebSocketDisconnect:
        logger.info(f"Player {player_id} disconnected from matchmaking WebSocket")
        matchmaking_queue.unregister_matchmaking_websocket(player_id)
    except Exception as e:
        logger.error(f"Error in matchmaking WebSocket for player {player_id}: {e}")
        matchmaking_queue.unregister_matchmaking_websocket(player_id)

