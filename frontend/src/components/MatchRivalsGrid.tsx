import "./MatchRivalsGrid.css";
import { MatchRivalCard } from "./MatchRivalCard";

type Rival = {
  id: string;
  name: string;
  tier: string;
  mmr: number;
  winRate: number;
  avgReps: number;
  featured?: boolean;
};

type MatchRivalsGridProps = {
  rivals: Rival[];
  onRivalSelect?: (rivalId: string) => void;
};

export function MatchRivalsGrid({
  rivals,
  onRivalSelect,
}: MatchRivalsGridProps) {
  return (
    <div className="match-rivals-grid">
      {rivals.map((rival) => (
        <MatchRivalCard
          key={rival.id}
          rivalName={rival.name}
          tier={rival.tier}
          mmr={rival.mmr}
          winRate={rival.winRate}
          avgReps={rival.avgReps}
          featured={rival.featured}
          onClick={() => onRivalSelect?.(rival.id)}
        />
      ))}
    </div>
  );
}

