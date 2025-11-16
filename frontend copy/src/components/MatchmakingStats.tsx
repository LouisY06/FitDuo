import { Trophy, TrendingUp, Target, Zap } from "lucide-react";
import { StatDisplayCards } from "./ui/StatDisplayCards";
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
  const statCards = [
    {
      icon: <Trophy style={{ width: "16px", height: "16px" }} />,
      title: "Tier",
      value: tier,
    },
    {
      icon: <TrendingUp style={{ width: "16px", height: "16px" }} />,
      title: "MMR",
      value: mmr,
    },
    {
      icon: <Target style={{ width: "16px", height: "16px" }} />,
      title: "Win Rate",
      value: `${winRate}%`,
    },
    {
      icon: <Zap style={{ width: "16px", height: "16px" }} />,
      title: "Avg Reps",
      value: avgReps,
    },
  ];

  return (
    <div className="matchmaking-stats-container">
      <h3 className="stats-title">Your Stats</h3>
      <div className="stats-cards-wrapper">
        <StatDisplayCards cards={statCards} />
      </div>
    </div>
  );
}

