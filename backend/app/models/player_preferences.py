from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class PlayerPreferences(SQLModel, table=True):
    """Player preferences and settings"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)
    
    # Notification Settings
    email_notifications: bool = Field(default=True)
    push_notifications: bool = Field(default=True)
    match_notifications: bool = Field(default=True)
    achievement_notifications: bool = Field(default=True)
    
    # Privacy Settings
    profile_visibility: str = Field(default="public")  # "public", "friends", "private"
    show_stats: bool = Field(default=True)
    show_workout_history: bool = Field(default=True)
    
    # Game Preferences
    preferred_exercises: Optional[str] = None  # JSON array of exercise IDs
    difficulty_level: str = Field(default="medium")  # "easy", "medium", "hard", "expert"
    auto_match: bool = Field(default=True)  # Auto-match with other players
    
    # Workout Preferences
    default_workout_duration: int = Field(default=30)  # Minutes
    rest_time_between_exercises: int = Field(default=60)  # Seconds
    enable_cv_detection: bool = Field(default=True)  # Enable computer vision form detection
    
    # Display Preferences
    units: str = Field(default="metric")  # "metric" or "imperial"
    theme: str = Field(default="dark")  # "light", "dark", "auto"
    language: str = Field(default="en")  # Language code
    
    # Timestamps
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

