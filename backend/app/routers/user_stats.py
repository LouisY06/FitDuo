from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.user_stats import UserStats
from app.models.user import User
from datetime import datetime

router = APIRouter(prefix="/api/users", tags=["user_stats"])


@router.get("/{user_id}/stats")
async def get_user_stats(
    user_id: int,
    session: Session = Depends(get_session),
):
    """
    Get user statistics
    """
    # Check if user exists
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get or create user stats
    user_stats = session.exec(
        select(UserStats).where(UserStats.user_id == user_id)
    ).first()
    
    if not user_stats:
        # Create default stats for new user
        user_stats = UserStats(user_id=user_id)
        session.add(user_stats)
        session.commit()
        session.refresh(user_stats)
    
    return {
        "userId": user_stats.user_id,
        "totalBattles": user_stats.total_battles,
        "wins": user_stats.wins,
        "losses": user_stats.losses,
        "ties": user_stats.ties,
        "winRate": user_stats.win_rate,
        "totalReps": user_stats.total_reps,
        "avgReps": user_stats.avg_reps,
        "bestRepsSingleRound": user_stats.best_reps_single_round,
        "bestPushups": user_stats.best_pushups,
        "bestSquats": user_stats.best_squats,
        "bestPlankSeconds": user_stats.best_plank_seconds,
        "bestSitups": user_stats.best_situps,
        "bestLunges": user_stats.best_lunges,
        "mmr": user_stats.mmr,
        "tier": user_stats.tier,
        "currentStreak": user_stats.current_streak,
        "longestStreak": user_stats.longest_streak,
        "totalWorkoutMinutes": user_stats.total_workout_minutes,
        "createdAt": user_stats.created_at.isoformat(),
        "updatedAt": user_stats.updated_at.isoformat(),
    }


async def update_user_stats_after_game(
    user_id: int,
    won: bool,
    tied: bool,
    total_reps: int,
    exercise_name: str,
    session: Session,
):
    """
    Update user stats after a game ends
    
    Args:
        user_id: ID of the user
        won: Whether the user won the game
        tied: Whether the game was a tie
        total_reps: Total reps scored by user across all rounds
        exercise_name: Name of the exercise (for tracking bests)
        session: Database session
    """
    # Get or create user stats
    user_stats = session.exec(
        select(UserStats).where(UserStats.user_id == user_id)
    ).first()
    
    if not user_stats:
        user_stats = UserStats(user_id=user_id)
        session.add(user_stats)
    
    # Update battle counts
    user_stats.total_battles += 1
    if won:
        user_stats.wins += 1
        user_stats.current_streak += 1
        if user_stats.current_streak > user_stats.longest_streak:
            user_stats.longest_streak = user_stats.current_streak
    elif tied:
        user_stats.ties += 1
    else:
        user_stats.losses += 1
        user_stats.current_streak = 0  # Reset streak on loss
    
    # Update rep stats
    user_stats.total_reps += total_reps
    if total_reps > user_stats.best_reps_single_round:
        user_stats.best_reps_single_round = total_reps
    
    # Update exercise-specific bests
    exercise_lower = exercise_name.lower()
    if "push" in exercise_lower and total_reps > user_stats.best_pushups:
        user_stats.best_pushups = total_reps
    elif "squat" in exercise_lower and total_reps > user_stats.best_squats:
        user_stats.best_squats = total_reps
    elif "plank" in exercise_lower and total_reps > user_stats.best_plank_seconds:
        user_stats.best_plank_seconds = total_reps
    elif "sit" in exercise_lower and total_reps > user_stats.best_situps:
        user_stats.best_situps = total_reps
    elif "lunge" in exercise_lower and total_reps > user_stats.best_lunges:
        user_stats.best_lunges = total_reps
    
    # Update MMR (simple Elo-like system)
    if won:
        user_stats.mmr += 25
    elif not tied:
        user_stats.mmr = max(0, user_stats.mmr - 20)  # Don't go below 0
    
    # Update tier based on new MMR
    user_stats.update_tier()
    
    # Update workout time (assume 3 minutes per game: 3 rounds x 1 min)
    user_stats.total_workout_minutes += 3
    
    # Update timestamp
    user_stats.updated_at = datetime.utcnow()
    
    session.add(user_stats)
    session.commit()
    session.refresh(user_stats)
    
    return user_stats

