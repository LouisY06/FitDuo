import { useState } from "react";
import { ShimmerButton, ShimmerCard } from "../ShimmerComponents";

type TrialMode = {
  id: string;
  name: string;
  duration: string;
  description: string;
};

const trialModes: TrialMode[] = [
  {
    id: "squat-30",
    name: "30s Squat Blitz",
    duration: "30 seconds",
    description: "Maximum squats in 30 seconds",
  },
  {
    id: "pushup-45",
    name: "45s Pushup Sprint",
    duration: "45 seconds",
    description: "Push yourself to the limit",
  },
  {
    id: "mixed-60",
    name: "60s Mixed Jacks",
    duration: "60 seconds",
    description: "Jumping jacks for a full minute",
  },
];

export function TimeTrialsScreen() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const handleStart = (modeId: string) => {
    setSelectedMode(modeId);
    setIsActive(true);
    // TODO: Start timer and CV detection
  };

  const handleEnd = () => {
    setIsActive(false);
    setSelectedMode(null);
  };

  if (isActive && selectedMode) {
    const mode = trialModes.find((m) => m.id === selectedMode);
    return (
      <div
        style={{
          height: "100vh",
          backgroundColor: "#020617",
          color: "white",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Timer and Info */}
        <div
          style={{
            padding: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>{mode?.name}</div>
          </div>
          <div
            style={{
              fontFamily: "VT323, monospace",
              fontSize: "3rem",
              color: "#63ff00",
              fontWeight: "bold",
            }}
          >
            00:30
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>Reps</div>
            <div style={{ fontSize: "2rem", color: "#63ff00" }}>0</div>
          </div>
        </div>

        {/* Camera Area Placeholder */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(99, 255, 0, 0.1)",
            margin: "1rem",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(99, 255, 0, 0.2)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📹</div>
            <p style={{ opacity: 0.8 }}>Camera view will appear here</p>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            padding: "2rem",
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
          }}
        >
          <button
            onClick={handleEnd}
            style={{
              padding: "0.875rem 2rem",
              borderRadius: "12px",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              background: "transparent",
              color: "#ef4444",
              fontFamily: "Audiowide, sans-serif",
              cursor: "pointer",
            }}
          >
            Quit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem 1.5rem",
        color: "white",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1
        className="audiowide-regular"
        style={{
          fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
          fontWeight: 400,
          margin: 0,
          marginBottom: "0.5rem",
          color: "#63ff00",
        }}
      >
        Time Trials
      </h1>
      <p style={{ opacity: 0.8, marginBottom: "2rem" }}>
        Compete against the clock for speed-based challenges
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {trialModes.map((mode) => (
          <ShimmerCard key={mode.id} variant="success">
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                margin: 0,
                marginBottom: "0.5rem",
                color: "#63ff00",
              }}
            >
              {mode.name}
            </h3>
            <div
              style={{
                fontSize: "0.875rem",
                opacity: 0.8,
                marginBottom: "1rem",
              }}
            >
              ⏱️ {mode.duration}
            </div>
            <p style={{ marginBottom: "1.5rem", opacity: 0.9 }}>
              {mode.description}
            </p>
            <ShimmerButton
              variant="success"
              onClick={() => handleStart(mode.id)}
            >
              Start Trial
            </ShimmerButton>
          </ShimmerCard>
        ))}
      </div>
    </div>
  );
}

