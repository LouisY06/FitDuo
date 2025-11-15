from sqlmodel import SQLModel, Field
from typing import Optional


class Exercise(SQLModel, table=True):
    """Exercise model - defines available exercises"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    category: str = Field(index=True)  # "push", "pull", "core", "legs", "cardio"
    description: Optional[str] = None
    is_static_hold: bool = Field(default=False)  # True for Plank, Wall Sit, etc.

