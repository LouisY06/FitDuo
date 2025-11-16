import { useNavigate } from "react-router-dom";
import { ShimmerButton } from "./ShimmerComponents";
import type React from "react";

export function WorkoutDiscovery() {
  const navigate = useNavigate();

  const handleStart = () => {
    // Navigate to main app with bottom nav
    navigate("/app");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem 1.5rem",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "3rem",
        }}
      >
        <h1
          className="audiowide-regular"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            fontWeight: 400,
            margin: 0,
            marginBottom: "1rem",
            background: "linear-gradient(135deg, #63ff00 0%, #ffffff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}
        >
          Battle Pass
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", opacity: 0.9, margin: 0 }}>
          Unlock rewards as you compete and dominate the arena
        </p>
      </div>

      {/* Battle Pass placeholder (no mock tiers / progress) */}
      <p
        style={{
          width: "100%",
          maxWidth: "800px",
          marginBottom: "3rem",
          textAlign: "center",
          fontSize: "0.95rem",
          opacity: 0.8,
        }}
      >
        Battle Pass rewards will be unlocked in a future update once live battle
        stats are wired to the backend.
      </p>

      {/* Start Button */}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ShimmerButton variant="success" onClick={handleStart} type="button">
          Start Battle
        </ShimmerButton>
      </div>

      {/* Info Text */}
      <p
        style={{
          marginTop: "2rem",
          fontSize: "0.875rem",
          opacity: 0.7,
          textAlign: "center",
        }}
      >
        Complete battles and challenges to unlock exclusive rewards
      </p>
    </div>
  );
}
