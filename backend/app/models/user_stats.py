from sqlmodel import Field, SQLModel
from datetime import datetime
from typing import Optional


class UserStats(SQLModel, table=True):
    """
    User statistics and profile data
    """
    __tablename__ = "userstats"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)
    
    # Battle Stats
    total_battles: int = Field(default=0)
    wins: int = Field(default=0)
    losses: int = Field(default=0)
    ties: int = Field(default=0)
    
    # Rep Stats
    total_reps: int = Field(default=0)
    best_reps_single_round: int = Field(default=0)
    
    # Exercise-specific best reps
    best_pushups: int = Field(default=0)
    best_squats: int = Field(default=0)
    best_plank_seconds: int = Field(default=0)
    best_situps: int = Field(default=0)
    best_lunges: int = Field(default=0)
    
    # Ranking
    mmr: int = Field(default=1000)  # Matchmaking Rating (starts at 1000)
    tier: str = Field(default="Bronze")  # Bronze, Silver, Gold, Platinum, Diamond
    
    # Streak
    current_streak: int = Field(default=0)
    longest_streak: int = Field(default=0)
    
    # Time tracking
    total_workout_minutes: int = Field(default=0)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @property
    def win_rate(self) -> float:
        """Calculate win rate percentage"""
        if self.total_battles == 0:
            return 0.0
        return round((self.wins / self.total_battles) * 100, 1)
    
    @property
    def avg_reps(self) -> float:
        """Calculate average reps per battle"""
        if self.total_battles == 0:
            return 0.0
        return round(self.total_reps / self.total_battles, 1)
    
    def update_tier(self):
        """Update tier based on MMR"""
        if self.mmr >= 2000:
            self.tier = "Diamond"
        elif self.mmr >= 1600:
            self.tier = "Platinum"
        elif self.mmr >= 1300:
            self.tier = "Gold"
        elif self.mmr >= 1000:
            self.tier = "Silver"
        else:
            self.tier = "Bronze"

