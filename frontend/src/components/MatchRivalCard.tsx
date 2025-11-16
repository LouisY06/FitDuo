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
              className="match-rival-handshake"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Globe icon: circle with latitude/longitude lines */}
              <circle cx="12" cy="12" r="7" />
              {/* Meridians */}
              <path d="M12 5a9.5 9.5 0 0 1 3 7 9.5 9.5 0 0 1-3 7" />
              <path d="M12 5a9.5 9.5 0 0 0-3 7 9.5 9.5 0 0 0 3 7" />
              {/* Parallels */}
              <path d="M5 12h14" />
              <path d="M6.5 8.5h11" />
              <path d="M6.5 15.5h11" />
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

