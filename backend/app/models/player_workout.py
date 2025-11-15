from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class PlayerWorkout(SQLModel, table=True):
    """Individual workout session - tracks each workout a player completes"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    # Workout Details
    exercise_id: Optional[int] = Field(default=None, foreign_key="exercise.id")
    exercise_name: str  # Denormalized for quick access
    exercise_category: str  # Denormalized
    
    # Performance Metrics
    reps: Optional[int] = None  # For rep-based exercises
    duration_seconds: Optional[int] = None  # For time-based exercises
    score: int = Field(default=0)  # Calculated score for this workout
    
    # Workout Type
    workout_type: str = Field(default="solo")  # "solo", "battle", "practice"
    game_session_id: Optional[int] = Field(default=None, foreign_key="gamesession.id")  # If part of a battle
    
    # Additional Data
    form_rating: Optional[float] = None  # 0.0 to 1.0, if CV detection is used
    notes: Optional[str] = None  # Optional notes about the workout
    
    # Timestamps
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

