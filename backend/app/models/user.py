from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class User(SQLModel, table=True):
    """User model - linked to Firebase Authentication via firebase_uid"""
    id: Optional[int] = Field(default=None, primary_key=True)
    firebase_uid: str = Field(unique=True, index=True)  # Firebase Authentication UID
    username: str = Field(index=True)
    email: Optional[str] = None
    
    # Player Profile Fields
    display_name: Optional[str] = None  # Optional display name (can differ from username)
    avatar_url: Optional[str] = None  # URL to profile picture
    bio: Optional[str] = None  # Player bio/description
    level: int = Field(default=1)  # Player level (can be calculated from stats)
    experience_points: int = Field(default=0)  # XP points
    
    # Status
    is_active: bool = Field(default=True)
    is_online: bool = Field(default=False)
    last_seen_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    profile_data: Optional[str] = None  # JSON string for additional profile info

