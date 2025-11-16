import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShimmerButton } from "./ShimmerComponents";
import {
  BattlePassUsageCalendar,
  type DayUsage,
} from "@/components/ui/battlepass-usage-calendar";

function buildMockUsage(): DayUsage[] {
  const today = new Date();
  const days: DayUsage[] = [];

  // Last 28 days (4 weeks)
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);

    let status: DayUsage["status"] = "none";
    const dow = d.getDay(); // 0=Sun ... 6=Sat
    const dom = d.getDate();

    // Example pattern:
    // Mon/Wed/Fri = full session
    if (dow === 1 || dow === 3 || dow === 5) {
      status = "session";
    }
    // every 4th day = login only (if not already session)
    else if (dom % 4 === 0) {
      status = "login";
    }

    days.push({ date: iso, status });
  }

  return days;
}

export function WorkoutDiscovery() {
  const navigate = useNavigate();

  const days = useMemo(() => buildMockUsage(), []);
  const sessionCount = days.filter((d) => d.status === "session").length;

  const handleStart = () => {
    // Navigate to main app with bottom nav
    navigate("/app");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "1.5rem 1.5rem 1.75rem",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background:
            "radial-gradient(circle at top left, rgba(56,189,248,0.22), transparent 55%), rgba(15,23,42,0.18)",
          borderRadius: "24px",
          border: "1px solid rgba(56, 189, 248, 0.4)",
          boxShadow:
            "0 18px 38px rgba(15, 23, 42, 0.75), 0 0 32px rgba(56, 189, 248, 0.4)",
          padding: "1.75rem 2rem 2rem",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          textAlign: "left",
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: "1.75rem",
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
              textShadow: "0 0 25px rgba(56, 189, 248, 0.85)",
            }}
        >
          Welcome Back
        </h1>
          <p
            style={{
              fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)",
              opacity: 0.9,
              margin: 0,
              color: "rgba(226, 232, 240, 0.95)",
            }}
          >
            Unlock rewards as you compete and dominate the arena
          </p>
        </div>

        {/* Welcome Back placeholder (no mock tiers / progress) */}
        <p
          style={{
            width: "100%",
            marginBottom: "1.75rem",
            fontSize: "0.95rem",
            opacity: 0.85,
            color: "rgba(226, 232, 240, 0.9)",
          }}
        >
          Welcome Back rewards will be unlocked in a future update once live battle
          stats are wired to the backend.
        </p>

        {/* Usage calendar */}
        <div style={{ marginBottom: "1.5rem" }}>
          <BattlePassUsageCalendar
            label="Usage history"
            title="Training Calendar"
            summaryText={`${sessionCount} battle / training sessions in the last 28 days.`}
            days={days}
          />
        </div>

        {/* Start Button */}
        <div
          style={{
            width: "100%",
            maxWidth: "320px",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <ShimmerButton
            variant="primary"
            onClick={handleStart}
            type="button"
          >
            Start Battle
          </ShimmerButton>
        </div>

        {/* Info Text */}
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.875rem",
            opacity: 0.8,
            color: "rgba(191, 219, 254, 0.95)",
          }}
        >
          Complete battles and challenges to unlock exclusive rewards.
        </p>
      </div>
    </div>
  );
}
