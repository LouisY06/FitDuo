import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShimmerButton } from "../ShimmerComponents";
import { CyanLoadingDots } from "../CyanLoadingDots";
import { useMatchmaking } from "../../hooks/useMatchmaking";
import type { MatchFoundPayload } from "../../services/matchmaking";

export function BattleScreen() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<number | null>(null);

  const {
    isSearching,
    queueStatus,
    error,
    loading,
    startSearching,
    stopSearching,
  } = useMatchmaking({
    autoConnect: true,
    onMatchFound: (payload: MatchFoundPayload) => {
      console.log("🎮 Match found in BattleScreen!", payload);
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
          // Navigate to battle with game ID
          console.log("🚀 Navigating to battle:", payload.game_id);
          navigate(`/app/battle/${payload.game_id}`);
        }
      }, 1000);
    },
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
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#020617",
          color: "white",
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

  return (
    <div
      style={{
        padding: "2rem 1.5rem",
        color: "white",
        maxWidth: "800px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 200px)",
      }}
    >
      <h1
        className="audiowide-regular"
        style={{
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 400,
          margin: 0,
          marginBottom: "1rem",
          color: "#63ff00",
          textAlign: "center",
        }}
      >
        Matchmaking Battles
      </h1>
      <p
        style={{
          opacity: 0.8,
          marginBottom: "3rem",
          textAlign: "center",
          fontSize: "1.125rem",
        }}
      >
        Get matched with a live rival. Best reps wins.
      </p>

      {error && !isSearching && (
        <div style={{ 
          padding: "1rem", 
          backgroundColor: "rgba(255, 68, 68, 0.1)", 
          border: "1px solid rgba(255, 68, 68, 0.3)",
          borderRadius: "8px",
          marginBottom: "1rem",
          color: "#ff4444"
        }}>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>{error}</p>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.75rem", opacity: 0.8 }}>
            Check browser console (F12) for details
          </p>
        </div>
      )}

      {isSearching ? (
        <div style={{ textAlign: "center" }}>
          <CyanLoadingDots size="large" />
          <p style={{ fontSize: "1.25rem", opacity: 0.9, marginTop: "1.5rem" }}>
            Finding a rival...
          </p>
          {queueStatus && queueStatus.in_queue && (
            <p style={{ fontSize: "0.875rem", opacity: 0.7, marginTop: "0.5rem" }}>
              Position in queue: {queueStatus.queue_position} • 
              Estimated wait: {queueStatus.estimated_wait}s
            </p>
          )}
          {error && (
            <p style={{ fontSize: "0.875rem", color: "#ff4444", marginTop: "0.5rem" }}>
              {error}
            </p>
          )}
          <div style={{ marginTop: "1.5rem" }}>
            <ShimmerButton
              variant="secondary"
              onClick={handleCancel}
            >
              Cancel
            </ShimmerButton>
          </div>
        </div>
      ) : (
        <ShimmerButton 
          variant="success" 
          onClick={handleFindRival}
          disabled={loading}
        >
          {loading ? "Joining queue..." : "Find a Rival"}
        </ShimmerButton>
      )}

      <p
        style={{
          marginTop: "2rem",
          fontSize: "0.875rem",
          opacity: 0.6,
          textAlign: "center",
        }}
      >
        We'll match you with similar level / intensity.
      </p>
    </div>
  );
}

