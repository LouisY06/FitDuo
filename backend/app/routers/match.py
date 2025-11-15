from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models import GameSession, User, Exercise, GameStatus
from app.middleware.auth import require_auth
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(prefix="/api/matches", tags=["matches"])


class CreateMatchRequest(BaseModel):
    player_a_id: int
    player_b_id: int
    exercise_id: Optional[int] = None


class MatchResponse(BaseModel):
    id: int
    player_a_id: int
    player_b_id: int
    player_a_score: int
    player_b_score: int
    current_round: int
    status: str
    current_exercise_id: Optional[int] = None
    created_at: str

    class Config:
        from_attributes = True


@router.post("", response_model=MatchResponse)
async def create_match(
    request: CreateMatchRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(require_auth),
):
    """Create a new game session/match"""
    # Verify players exist
    player_a = session.get(User, request.player_a_id)
    player_b = session.get(User, request.player_b_id)
    
    if not player_a:
        raise HTTPException(status_code=404, detail=f"Player A (ID: {request.player_a_id}) not found")
    if not player_b:
        raise HTTPException(status_code=404, detail=f"Player B (ID: {request.player_b_id}) not found")
    
    # Verify exercise exists if provided
    if request.exercise_id:
        exercise = session.get(Exercise, request.exercise_id)
        if not exercise:
            raise HTTPException(status_code=404, detail=f"Exercise (ID: {request.exercise_id}) not found")
    
    # Create game session
    game_session = GameSession(
        player_a_id=request.player_a_id,
        player_b_id=request.player_b_id,
        status=GameStatus.WAITING.value,
        current_exercise_id=request.exercise_id,
    )

    session.add(game_session)
    session.commit()
    session.refresh(game_session)

    return MatchResponse(
        id=game_session.id,
        player_a_id=game_session.player_a_id,
        player_b_id=game_session.player_b_id,
        player_a_score=game_session.player_a_score,
        player_b_score=game_session.player_b_score,
        current_round=game_session.current_round,
        status=game_session.status,
        current_exercise_id=game_session.current_exercise_id,
        created_at=game_session.created_at.isoformat(),
    )


@router.get("/{match_id}", response_model=MatchResponse)
async def get_match(
    match_id: int,
    session: Session = Depends(get_session),
):
    """Get a specific match by ID"""
    game_session = session.get(GameSession, match_id)
    if not game_session:
        raise HTTPException(status_code=404, detail="Match not found")
    
    return MatchResponse(
        id=game_session.id,
        player_a_id=game_session.player_a_id,
        player_b_id=game_session.player_b_id,
        player_a_score=game_session.player_a_score,
        player_b_score=game_session.player_b_score,
        current_round=game_session.current_round,
        status=game_session.status,
        current_exercise_id=game_session.current_exercise_id,
        created_at=game_session.created_at.isoformat(),
    )


@router.get("", response_model=list[MatchResponse])
async def list_matches(
    player_id: Optional[int] = None,
    status: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """List all matches, optionally filtered by player or status"""
    from sqlmodel import select
    
    statement = select(GameSession)
    
    if player_id:
        statement = statement.where(
            (GameSession.player_a_id == player_id) | 
            (GameSession.player_b_id == player_id)
        )
    
    if status:
        statement = statement.where(GameSession.status == status)
    
    matches = session.exec(statement).all()
    
    return [
        MatchResponse(
            id=m.id,
            player_a_id=m.player_a_id,
            player_b_id=m.player_b_id,
            player_a_score=m.player_a_score,
            player_b_score=m.player_b_score,
            current_round=m.current_round,
            status=m.status,
            current_exercise_id=m.current_exercise_id,
            created_at=m.created_at.isoformat(),
        )
        for m in matches
    ]

