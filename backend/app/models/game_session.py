from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from enum import Enum


class GameStatus(str, Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    ROUND_END = "round_end"
    FINISHED = "finished"


class GameSession(SQLModel, table=True):
    """Game session model - tracks a battle between two players"""
    id: Optional[int] = Field(default=None, primary_key=True)
    player_a_id: int = Field(foreign_key="user.id", index=True)
    player_b_id: int = Field(foreign_key="user.id", index=True)
    player_a_score: int = Field(default=0)
    player_b_score: int = Field(default=0)
    player_a_rounds_won: int = Field(default=0)
    player_b_rounds_won: int = Field(default=0)
    current_round: int = Field(default=1)
    status: str = Field(default=GameStatus.WAITING.value)
    current_exercise_id: Optional[int] = Field(default=None, foreign_key="exercise.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

