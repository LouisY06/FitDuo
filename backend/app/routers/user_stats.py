from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models.user_stats import UserStats
from app.models.user import User

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

