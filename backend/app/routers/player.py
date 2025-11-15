"""
Player Router - Endpoints for managing individual player data
- Player statistics
- Workout history
- Player preferences
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from typing import Optional, List
from datetime import datetime, timedelta
from app.database.connection import get_session
from app.models import (
    User,
    PlayerStats,
    PlayerWorkout,
    PlayerPreferences,
    Exercise,
)
from app.middleware.auth import require_auth
from pydantic import BaseModel

router = APIRouter(prefix="/api/player", tags=["player"])


# ==================== Response Models ====================

class PlayerStatsResponse(BaseModel):
    """Player statistics response"""
    user_id: int
    total_games: int
    games_won: int
    games_lost: int
    games_tied: int
    win_rate: float
    total_reps: int
    total_workouts: int
    total_workout_time: int
    best_pushups: int
    best_squats: int
    best_pullups: int
    best_burpees: int
    best_plank_time: int
    best_wall_sit_time: int
    current_win_streak: int
    longest_win_streak: int
    current_workout_streak: int
    longest_workout_streak: int
    last_workout_at: Optional[datetime]
    last_game_at: Optional[datetime]
    level: int
    experience_points: int

    class Config:
        from_attributes = True


class WorkoutResponse(BaseModel):
    """Workout history response"""
    id: int
    exercise_id: Optional[int]
    exercise_name: str
    exercise_category: str
    reps: Optional[int]
    duration_seconds: Optional[int]
    score: int
    workout_type: str
    form_rating: Optional[float]
    completed_at: datetime

    class Config:
        from_attributes = True


class PreferencesResponse(BaseModel):
    """Player preferences response"""
    email_notifications: bool
    push_notifications: bool
    match_notifications: bool
    achievement_notifications: bool
    profile_visibility: str
    show_stats: bool
    show_workout_history: bool
    preferred_exercises: Optional[str]
    difficulty_level: str
    auto_match: bool
    default_workout_duration: int
    rest_time_between_exercises: int
    enable_cv_detection: bool
    units: str
    theme: str
    language: str

    class Config:
        from_attributes = True


class UpdatePreferencesRequest(BaseModel):
    """Request model for updating preferences"""
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    match_notifications: Optional[bool] = None
    achievement_notifications: Optional[bool] = None
    profile_visibility: Optional[str] = None
    show_stats: Optional[bool] = None
    show_workout_history: Optional[bool] = None
    preferred_exercises: Optional[str] = None
    difficulty_level: Optional[str] = None
    auto_match: Optional[bool] = None
    default_workout_duration: Optional[int] = None
    rest_time_between_exercises: Optional[int] = None
    enable_cv_detection: Optional[bool] = None
    units: Optional[str] = None
    theme: Optional[str] = None
    language: Optional[str] = None


# ==================== Helper Functions ====================

def get_or_create_player_stats(user_id: int, session: Session) -> PlayerStats:
    """Get existing player stats or create new ones"""
    stats = session.exec(
        select(PlayerStats).where(PlayerStats.user_id == user_id)
    ).first()
    
    if not stats:
        stats = PlayerStats(user_id=user_id)
        session.add(stats)
        session.commit()
        session.refresh(stats)
    
    return stats


def get_or_create_player_preferences(user_id: int, session: Session) -> PlayerPreferences:
    """Get existing player preferences or create new ones"""
    prefs = session.exec(
        select(PlayerPreferences).where(PlayerPreferences.user_id == user_id)
    ).first()
    
    if not prefs:
        prefs = PlayerPreferences(user_id=user_id)
        session.add(prefs)
        session.commit()
        session.refresh(prefs)
    
    return prefs


def calculate_win_rate(stats: PlayerStats) -> float:
    """Calculate win rate"""
    if stats.total_games == 0:
        return 0.0
    return round(stats.games_won / stats.total_games, 2)


def update_workout_streak(user_id: int, session: Session):
    """Update workout streak based on last workout date"""
    stats = get_or_create_player_stats(user_id, session)
    
    if not stats.last_workout_at:
        stats.current_workout_streak = 1
        stats.longest_workout_streak = 1
        return
    
    # Check if last workout was yesterday or today
    now = datetime.utcnow()
    last_workout = stats.last_workout_at
    
    # Reset time to midnight for comparison
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    last_workout_day = last_workout.replace(hour=0, minute=0, second=0, microsecond=0)
    
    days_diff = (today - last_workout_day).days
    
    if days_diff == 0:
        # Workout today, streak continues
        pass
    elif days_diff == 1:
        # Workout yesterday, streak continues
        stats.current_workout_streak += 1
    else:
        # Streak broken
        if stats.current_workout_streak > stats.longest_workout_streak:
            stats.longest_workout_streak = stats.current_workout_streak
        stats.current_workout_streak = 1
    
    session.add(stats)
    session.commit()


# ==================== Endpoints ====================

@router.get("/stats", response_model=PlayerStatsResponse)
async def get_player_stats(
    current_user: dict = Depends(require_auth),
    session: Session = Depends(get_session),
):
    """Get current player's statistics"""
    firebase_uid = current_user.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    # Get user
    user = session.exec(
        select(User).where(User.firebase_uid == firebase_uid)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get or create stats
    stats = get_or_create_player_stats(user.id, session)
    
    # Calculate win rate
    stats.win_rate = calculate_win_rate(stats)
    
    # Return response with user level and XP
    return PlayerStatsResponse(
        user_id=user.id,
        total_games=stats.total_games,
        games_won=stats.games_won,
        games_lost=stats.games_lost,
        games_tied=stats.games_tied,
        win_rate=stats.win_rate,
        total_reps=stats.total_reps,
        total_workouts=stats.total_workouts,
        total_workout_time=stats.total_workout_time,
        best_pushups=stats.best_pushups,
        best_squats=stats.best_squats,
        best_pullups=stats.best_pullups,
        best_burpees=stats.best_burpees,
        best_plank_time=stats.best_plank_time,
        best_wall_sit_time=stats.best_wall_sit_time,
        current_win_streak=stats.current_win_streak,
        longest_win_streak=stats.longest_win_streak,
        current_workout_streak=stats.current_workout_streak,
        longest_workout_streak=stats.longest_workout_streak,
        last_workout_at=stats.last_workout_at,
        last_game_at=stats.last_game_at,
        level=user.level,
        experience_points=user.experience_points,
    )


@router.get("/workouts", response_model=List[WorkoutResponse])
async def get_workout_history(
    current_user: dict = Depends(require_auth),
    session: Session = Depends(get_session),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    exercise_id: Optional[int] = None,
    workout_type: Optional[str] = None,
):
    """Get player's workout history"""
    firebase_uid = current_user.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    # Get user
    user = session.exec(
        select(User).where(User.firebase_uid == firebase_uid)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build query
    query = select(PlayerWorkout).where(PlayerWorkout.user_id == user.id)
    
    if exercise_id:
        query = query.where(PlayerWorkout.exercise_id == exercise_id)
    
    if workout_type:
        query = query.where(PlayerWorkout.workout_type == workout_type)
    
    # Order by most recent first
    query = query.order_by(PlayerWorkout.completed_at.desc())
    
    # Apply pagination
    workouts = session.exec(query.offset(offset).limit(limit)).all()
    
    return [WorkoutResponse(**workout.dict()) for workout in workouts]


@router.post("/workouts")
async def create_workout(
    current_user: dict = Depends(require_auth),
    session: Session = Depends(get_session),
    exercise_id: Optional[int] = None,
    exercise_name: str = None,
    exercise_category: str = None,
    reps: Optional[int] = None,
    duration_seconds: Optional[int] = None,
    score: int = 0,
    workout_type: str = "solo",
    game_session_id: Optional[int] = None,
    form_rating: Optional[float] = None,
    notes: Optional[str] = None,
):
    """Record a new workout"""
    firebase_uid = current_user.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    # Get user
    user = session.exec(
        select(User).where(User.firebase_uid == firebase_uid)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get exercise info if exercise_id provided
    if exercise_id:
        exercise = session.get(Exercise, exercise_id)
        if not exercise:
            raise HTTPException(status_code=404, detail="Exercise not found")
        exercise_name = exercise.name
        exercise_category = exercise.category
    
    if not exercise_name or not exercise_category:
        raise HTTPException(
            status_code=400,
            detail="exercise_name and exercise_category are required"
        )
    
    # Create workout
    workout = PlayerWorkout(
        user_id=user.id,
        exercise_id=exercise_id,
        exercise_name=exercise_name,
        exercise_category=exercise_category,
        reps=reps,
        duration_seconds=duration_seconds,
        score=score,
        workout_type=workout_type,
        game_session_id=game_session_id,
        form_rating=form_rating,
        notes=notes,
    )
    
    session.add(workout)
    
    # Update player stats
    stats = get_or_create_player_stats(user.id, session)
    stats.total_workouts += 1
    stats.last_workout_at = datetime.utcnow()
    
    if reps:
        stats.total_reps += reps
        # Update best scores for specific exercises
        exercise_name_lower = exercise_name.lower()
        if "pushup" in exercise_name_lower and reps > stats.best_pushups:
            stats.best_pushups = reps
        elif "squat" in exercise_name_lower and reps > stats.best_squats:
            stats.best_squats = reps
        elif "pullup" in exercise_name_lower and reps > stats.best_pullups:
            stats.best_pullups = reps
        elif "burpee" in exercise_name_lower and reps > stats.best_burpees:
            stats.best_burpees = reps
    
    if duration_seconds:
        stats.total_workout_time += duration_seconds
        # Update best times
        exercise_name_lower = exercise_name.lower()
        if "plank" in exercise_name_lower and duration_seconds > stats.best_plank_time:
            stats.best_plank_time = duration_seconds
        elif "wall sit" in exercise_name_lower and duration_seconds > stats.best_wall_sit_time:
            stats.best_wall_sit_time = duration_seconds
    
    # Update workout streak
    update_workout_streak(user.id, session)
    
    # Add XP (simple: 10 XP per workout)
    user.experience_points += 10
    # Simple level calculation: level = XP / 1000 + 1
    user.level = (user.experience_points // 1000) + 1
    
    session.commit()
    session.refresh(workout)
    
    return {"message": "Workout recorded", "workout_id": workout.id}


@router.get("/preferences", response_model=PreferencesResponse)
async def get_player_preferences(
    current_user: dict = Depends(require_auth),
    session: Session = Depends(get_session),
):
    """Get player preferences"""
    firebase_uid = current_user.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    # Get user
    user = session.exec(
        select(User).where(User.firebase_uid == firebase_uid)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get or create preferences
    prefs = get_or_create_player_preferences(user.id, session)
    
    return PreferencesResponse(**prefs.dict())


@router.put("/preferences", response_model=PreferencesResponse)
async def update_player_preferences(
    request: UpdatePreferencesRequest,
    current_user: dict = Depends(require_auth),
    session: Session = Depends(get_session),
):
    """Update player preferences"""
    firebase_uid = current_user.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    # Get user
    user = session.exec(
        select(User).where(User.firebase_uid == firebase_uid)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get or create preferences
    prefs = get_or_create_player_preferences(user.id, session)
    
    # Update only provided fields
    update_data = request.dict(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(prefs, key):
            setattr(prefs, key, value)
    
    prefs.updated_at = datetime.utcnow()
    session.add(prefs)
    session.commit()
    session.refresh(prefs)
    
    return PreferencesResponse(**prefs.dict())

