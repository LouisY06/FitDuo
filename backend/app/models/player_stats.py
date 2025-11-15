from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime


class PlayerStats(SQLModel, table=True):
    """Player statistics - tracks individual player performance metrics"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)
    
    # Game Statistics
    total_games: int = Field(default=0)
    games_won: int = Field(default=0)
    games_lost: int = Field(default=0)
    games_tied: int = Field(default=0)
    win_rate: float = Field(default=0.0)  # Calculated: games_won / total_games
    
    # Exercise Statistics
    total_reps: int = Field(default=0)  # Total reps across all exercises
    total_workouts: int = Field(default=0)  # Total workout sessions completed
    total_workout_time: int = Field(default=0)  # Total time in seconds
    
    # Best Scores (for rep-based exercises)
    best_pushups: int = Field(default=0)
    best_squats: int = Field(default=0)
    best_pullups: int = Field(default=0)
    best_burpees: int = Field(default=0)
    
    # Best Times (for time-based exercises, in seconds)
    best_plank_time: int = Field(default=0)
    best_wall_sit_time: int = Field(default=0)
    
    # Streaks
    current_win_streak: int = Field(default=0)
    longest_win_streak: int = Field(default=0)
    current_workout_streak: int = Field(default=0)  # Days in a row
    longest_workout_streak: int = Field(default=0)
    
    # Timestamps
    last_workout_at: Optional[datetime] = None
    last_game_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship
    # user: User = Relationship(back_populates="stats")

