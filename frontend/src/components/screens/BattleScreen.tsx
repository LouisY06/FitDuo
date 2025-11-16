import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MatchmakingStats } from "../MatchmakingStats";
import { ElectricButton } from "../ElectricButton";
import { MatchmakingProgressCard } from "../MatchmakingProgressCard";
import VantaHaloBackground from "../VantaHaloBackground";
import { useMatchmaking } from "../../hooks/useMatchmaking";
import type { MatchFoundPayload } from "../../services/matchmaking";
import "./BattleScreen.css";

export function BattleScreen() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<number | null>(null);

  // Wrap onMatchFound in useCallback to prevent WebSocket reconnections
  const handleMatchFound = useCallback((payload: MatchFoundPayload) => {
    console.log("Match found!", payload);
    // Start countdown
    let cd = 3;
    setCountdown(cd);
    const interval = setInterval(() => {
      cd--;
      if (cd > 0) {
        setCountdown(cd);
      } else {
        clearInterval(interval);
        setCountdown(null);
        // Navigate to battle screen (game ID is stored for later use)
        console.log("🚀 Match found! Game ID:", payload.game_id);
        // TODO: Store game_id and navigate to actual battle view
        navigate(`/app`);
      }
    }, 1000);
  }, [navigate]);

  const {
    isSearching,
    queueStatus,
    error,
    loading,
    startSearching,
    stopSearching,
  } = useMatchmaking({
    autoConnect: true,
    onMatchFound: handleMatchFound,
  });

  const handleFindRival = async () => {
    console.log("Find Rival clicked - starting matchmaking...");
    try {
      await startSearching();
      console.log("Matchmaking started successfully");
    } catch (err) {
      console.error("Failed to start matchmaking:", err);
      alert(`Failed to start matchmaking: ${(err as any)?.message || "Unknown error"}`);
    }
  };

  const handleCancel = async () => {
    try {
      await stopSearching();
    } catch (err) {
      console.error("Failed to cancel matchmaking:", err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSearching) {
        stopSearching().catch(console.error);
      }
    };
  }, [isSearching, stopSearching]);

  if (countdown !== null) {
    return (
      <>
        <VantaHaloBackground />
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "8rem",
                fontFamily: "VT323, monospace",
                color: "#63ff00",
                fontWeight: "bold",
              }}
            >
              {countdown}
            </div>
            <p style={{ fontSize: "1.5rem", opacity: 0.8 }}>Get ready!</p>
          </div>
        </div>
      </>
    );
  }

  // Note: The actual battle screen will be at /app/battle/:gameId
  // This component only handles matchmaking and countdown

  return (
    <>
      <VantaHaloBackground />
      <div className="matchmaking-page">
        {isSearching ? (
          <div className="matchmaking-loading-container">
            {/* Header */}
            <header className="matchmaking-header">
              <h1 className="matchmaking-title">Matchmaking Battles</h1>
              <p className="matchmaking-subtitle">
                Get matched with a live rival. Best reps wins.
              </p>
            </header>

            {/* Matchmaking Progress Card */}
            <div className="matchmaking-progress-wrapper">
              <MatchmakingProgressCard
                queuePosition={queueStatus?.queue_position}
                estimatedWait={queueStatus?.estimated_wait}
                error={error}
                onCancel={handleCancel}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Header Section */}
            <header className="matchmaking-header">
              <h1 className="matchmaking-title">Matchmaking Battles</h1>
              <p className="matchmaking-subtitle">
                Get matched with a live rival. Best reps wins.
              </p>
            </header>

            {/* Error Message */}
            {error && !isSearching && (
              <div className="matchmaking-error">
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500 }}>
                  {error}
                </p>
                <p
                  style={{
                    margin: "0.5rem 0 0 0",
                    fontSize: "0.75rem",
                    opacity: 0.8,
                  }}
                >
                  Check browser console (F12) for details
                </p>
              </div>
            )}

            {/* Hero Row - 2 Column Layout */}
            <section className="matchmaking-hero">
              {/* Left Column - Stats Cards */}
              <div className="matchmaking-left">
                <MatchmakingStats tier="Silver" mmr={1250} winRate={62} avgReps={38} />
              </div>

              {/* Right Column - Explanation Card with Halo Integration */}
              <div className="matchmaking-right">
                <div className="matchmaking-explanation-card">
                  <p className="matchmaking-explanation-text">
                    We use your tier, win rate, and average reps to match you with
                    players at a similar level.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA Section - Button centered under right column */}
            <div className="matchmaking-cta">
              <ElectricButton onClick={handleFindRival} disabled={loading}>
                {loading ? "Joining queue..." : "Find a Rival"}
              </ElectricButton>
            </div>
          </>
        )}
      </div>
    </>
  );
}
