import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MatchmakingStats } from "../MatchmakingStats";
import { ElectricButton } from "../ElectricButton";
import { MatchmakingProgressCard } from "../MatchmakingProgressCard";
import VantaHaloBackground from "../VantaHaloBackground";
import { useMatchmaking } from "../../hooks/useMatchmaking";
import type { MatchFoundPayload } from "../../services/matchmaking";
import "./BattleScreen.css";

export function BattleScreen({ onNavigateToProfile }: { onNavigateToProfile?: () => void }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<number | null>(null);

  // Wrap onMatchFound in useCallback to prevent WebSocket reconnections
  const handleMatchFound = useCallback(
    (payload: MatchFoundPayload) => {
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
          // Navigate to battle screen with gameId in the URL
          console.log("🚀 Match found! Game ID:", payload.game_id);
          navigate(`/app/battle/${payload.game_id}`);
        }
      }, 1000);
    },
    [navigate]
  );

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

  // Cleanup on unmount - useMatchmaking hook handles WebSocket cleanup
  // No need to manually call stopSearching here
  // useEffect(() => {
  //   return () => {
  //     if (isSearching) {
  //       stopSearching().catch(console.error);
  //     }
  //   };
  // }, [isSearching, stopSearching]);

  if (countdown !== null) {
    // Countdown screen: no halo; focus user on upcoming battle
    return (
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
    );
  }

  // Note: The actual battle screen will be at /app/battle/:gameId
  // This component only handles matchmaking and countdown

  const taglineWords = [
    "Get",
    "matched",
    "with",
    "a",
    "live",
    "rival.",
    "Best",
    "reps",
    "wins.",
  ];

  const readyToBattleWords = ["Ready", "to", "battle?"];

  return (
    <>
      {isSearching && <VantaHaloBackground />}
      <div className="matchmaking-page">
        {isSearching ? (
          <div className="matchmaking-loading-container">
            {/* Header */}
            <header className="matchmaking-header">
              <h1 className="matchmaking-title">Matchmaking Battles</h1>
              <p className="matchmaking-subtitle">
                {taglineWords.map((word, index) => (
                  <span
                    key={`${word}-${index}`}
                    className="tagline-word"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {word}&nbsp;
                  </span>
                ))}
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
                {taglineWords.map((word, index) => (
                  <span
                    key={`${word}-${index}`}
                    className="tagline-word"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {word}&nbsp;
                  </span>
                ))}
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

              {/* Right Column - Ready to battle CTA */}
              <div className="matchmaking-right">
                <div className="matchmaking-cta-card">
                  <div>
                    <h2 className="matchmaking-cta-title">
                      {readyToBattleWords.map((word, index) => (
                        <span
                          key={`ready-${word}-${index}`}
                          className="tagline-word"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {word}&nbsp;
                        </span>
                      ))}
                    </h2>
                    <p className="matchmaking-cta-subtitle">
                      Jump into a live 1-minute rep race against a matched rival.
                    </p>
                  </div>
                  <div className="matchmaking-cta-row">
                    <ElectricButton onClick={handleFindRival} disabled={loading}>
                      {loading ? "Joining queue..." : "Find a Rival"}
                    </ElectricButton>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom CTA row no longer needed; button lives in right card */}
          </>
        )}
      </div>
    </>
  );
}
