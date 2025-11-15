import "./MatchmakingStats.css";

type MatchmakingStatsProps = {
  tier: string;
  mmr: number;
  winRate: number;
  avgReps: number;
};

export function MatchmakingStats({
  tier,
  mmr,
  winRate,
  avgReps,
}: MatchmakingStatsProps) {
  return (
    <div className="matchmaking-stats-container">
      {/* Electric Border Effect */}
      <div className="electric-border">
        <div className="electric-border-inner"></div>
      </div>

      {/* Stats Content */}
      <div className="matchmaking-stats-content">
        <h3 className="stats-title">Your Stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Tier</div>
            <div className="stat-value">{tier}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">MMR</div>
            <div className="stat-value">{mmr}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Win Rate</div>
            <div className="stat-value">{winRate}%</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Avg Reps / Round</div>
            <div className="stat-value">{avgReps}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

