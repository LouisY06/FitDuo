from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models import Exercise
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/api/exercises", tags=["exercises"])


class ExerciseResponse(BaseModel):
    id: int
    name: str
    category: str
    description: str | None
    is_static_hold: bool

    class Config:
        from_attributes = True


@router.get("", response_model=List[ExerciseResponse])
async def list_exercises(
    category: str | None = None,
    session: Session = Depends(get_session),
):
    """Get all exercises, optionally filtered by category"""
    statement = select(Exercise)
    
    if category:
        statement = statement.where(Exercise.category == category)
    
    exercises = session.exec(statement).all()
    return exercises


@router.get("/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(
    exercise_id: int,
    session: Session = Depends(get_session),
):
    """Get a specific exercise by ID"""
    exercise = session.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise


@router.post("", response_model=ExerciseResponse)
async def create_exercise(
    exercise: Exercise,
    session: Session = Depends(get_session),
):
    """Create a new exercise (admin function)"""
    # Check if exercise with same name already exists
    existing = session.exec(
        select(Exercise).where(Exercise.name == exercise.name)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Exercise with name '{exercise.name}' already exists"
        )
    
    session.add(exercise)
    session.commit()
    session.refresh(exercise)
    return exercise

