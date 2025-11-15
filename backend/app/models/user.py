from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class User(SQLModel, table=True):
    """User model - linked to Firebase Authentication via firebase_uid"""
    id: Optional[int] = Field(default=None, primary_key=True)
    firebase_uid: str = Field(unique=True, index=True)  # Firebase Authentication UID
    username: str = Field(index=True)
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    profile_data: Optional[str] = None  # JSON string for additional profile info

