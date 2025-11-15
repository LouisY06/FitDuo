import "./MatchRivalCard.css";

type MatchRivalCardProps = {
  rivalName: string;
  tier: string;
  mmr: number;
  winRate: number;
  avgReps: number;
  featured?: boolean;
  onClick?: () => void;
};

export function MatchRivalCard({
  rivalName,
  tier,
  mmr,
  winRate,
  avgReps,
  featured = false,
  onClick,
}: MatchRivalCardProps) {
  return (
    <button
      className={`match-rival-card ${featured ? "featured" : ""}`}
      onClick={onClick}
      type="button"
    >
      {/* Electric Border Effect */}
      <div className="match-rival-electric-border">
        <div className="match-rival-electric-border-inner"></div>
      </div>

      {/* Card Content */}
      <div className="match-rival-content">
        <div className="match-rival-header">
          <div className="match-rival-name-wrapper">
            <h3 className="match-rival-name">{rivalName}</h3>
            <svg
              className="match-rival-arrow"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
          <span className="match-rival-tier">{tier}</span>
        </div>

        <div className="match-rival-stats">
          <div className="match-rival-stat-item">
            <span className="match-rival-stat-label">MMR</span>
            <span className="match-rival-stat-value">{mmr}</span>
          </div>
          <div className="match-rival-stat-item">
            <span className="match-rival-stat-label">Win Rate</span>
            <span className="match-rival-stat-value">{winRate}%</span>
          </div>
          <div className="match-rival-stat-item">
            <span className="match-rival-stat-label">Avg Reps</span>
            <span className="match-rival-stat-value">{avgReps}</span>
          </div>
        </div>

        {featured && (
          <div className="match-rival-featured-badge">Perfect Match</div>
        )}
      </div>
    </button>
  );
}

