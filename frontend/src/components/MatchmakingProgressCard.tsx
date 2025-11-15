import { CyanLoadingDots } from "./CyanLoadingDots";
import { ElectricButton } from "./ElectricButton";
import "./MatchmakingProgressCard.css";

type MatchmakingProgressCardProps = {
  queuePosition?: number;
  estimatedWait?: number;
  error?: string | null;
  onCancel?: () => void;
};

export function MatchmakingProgressCard({
  queuePosition,
  estimatedWait,
  error,
  onCancel,
}: MatchmakingProgressCardProps) {
  return (
    <div className="matchmaking-progress-card">
      <div className="matchmaking-progress-content">
        {/* Title */}
        <h2 className="matchmaking-progress-title">Matchmaking in progress</h2>

        {/* Loading Animation */}
        <div className="matchmaking-progress-loader">
          <CyanLoadingDots size="large" />
        </div>

        {/* Status Text */}
        <p className="matchmaking-progress-status">Finding a rival...</p>

        {/* Queue Status */}
        {queuePosition !== undefined && estimatedWait !== undefined && (
          <div className="matchmaking-progress-queue">
            <span className="matchmaking-progress-queue-item">
              Position in queue: {queuePosition}
            </span>
            <span className="matchmaking-progress-queue-separator">•</span>
            <span className="matchmaking-progress-queue-item">
              Estimated wait: {estimatedWait}s
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="matchmaking-progress-error">
            <p>{error}</p>
          </div>
        )}

        {/* Cancel Button */}
        {onCancel && (
          <div className="matchmaking-progress-actions">
            <ElectricButton onClick={onCancel}>Cancel</ElectricButton>
          </div>
        )}
      </div>
    </div>
  );
}

