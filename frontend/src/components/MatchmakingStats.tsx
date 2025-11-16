import { Trophy, TrendingUp, Target, Zap } from "lucide-react";
import "./MatchmakingStats.css";

type MatchmakingStatsProps = {
  tier: string;
  mmr: number;
  winRate: number;
  avgReps: number;
  /**
   * Total ranked games played. Used to decide whether to show
   * placeholder messaging for new users.
   */
  totalGames?: number;
};

export function MatchmakingStats({
  tier,
  mmr,
  winRate,
  avgReps,
  totalGames,
}: MatchmakingStatsProps) {
  const isNewPlayer = !totalGames || totalGames === 0;
  const stats = [
    {
      icon: <Trophy style={{ width: "16px", height: "16px" }} />,
      label: "Tier",
      value: tier,
    },
    {
      icon: <TrendingUp style={{ width: "16px", height: "16px" }} />,
      label: "MMR",
      value: mmr,
    },
    {
      icon: <Target style={{ width: "16px", height: "16px" }} />,
      label: "Win Rate",
      value: `${winRate}%`,
    },
    {
      icon: <Zap style={{ width: "16px", height: "16px" }} />,
      label: "Avg Reps",
      value: avgReps,
    },
  ];

  return (
    <section className="matchmaking-stats">
      <h3 className="matchmaking-stats-heading">Your Stats</h3>
      {isNewPlayer && (
        <p className="matchmaking-stats-subtitle">
          You haven&apos;t played a ranked battle yet. These values start at{" "}
          <strong>0</strong> and will update after your first match.
        </p>
      )}
      <div className="matchmaking-stats-electric-frame">
        <div className="electric-button-border">
          <div className="electric-button-border-inner" />
        </div>
        <div className="matchmaking-stats-card">
          {stats.map((stat, index) => (
            <div
              className="matchmaking-stat-row"
              key={stat.label}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="matchmaking-stat-label">
                {stat.icon && <span className="matchmaking-stat-icon">{stat.icon}</span>}
                <span>{stat.label}</span>
              </div>
              <div className="matchmaking-stat-value">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

