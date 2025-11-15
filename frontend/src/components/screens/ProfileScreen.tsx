import { useState, useEffect } from "react";
import { getCurrentUser } from "../../services/auth";
import { CyanLoadingDots } from "../CyanLoadingDots";

interface UserProfile {
  id: number;
  firebase_uid: string;
  username: string;
  email?: string;
}

interface Match {
  id: string;
  rivalName: string;
  mode: string;
  result: "Win" | "Loss";
  reps: number;
  timeAgo: string;
}

export function ProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBattles: 0,
    winRate: 0,
    totalReps: 0,
    longestStreak: 0,
  });
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [badges] = useState([
    { id: "first", name: "First Rival", earned: true },
    { id: "globe", name: "Across the Globe", earned: false },
    { id: "noquit", name: "No Quit", earned: true },
  ]);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setUser({
            id: userData.id || 0,
            firebase_uid: userData.firebase_uid || "",
            username: userData.username || "User",
            email: userData.email,
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        // Set mock data for demo
        setUser({
          id: 1,
          firebase_uid: "demo_uid",
          username: "Demo User",
          email: "demo@example.com",
        });
      }

      // Mock stats for demo
      setStats({
        totalBattles: 12,
        winRate: 75,
        totalReps: 450,
        longestStreak: 5,
      });

      // Mock matches
      setRecentMatches([
        {
          id: "1",
          rivalName: "Alex",
          mode: "Squats",
          result: "Win",
          reps: 42,
          timeAgo: "2 hours ago",
        },
        {
          id: "2",
          rivalName: "Sam",
          mode: "Mixed",
          result: "Loss",
          reps: 38,
          timeAgo: "1 day ago",
        },
        {
          id: "3",
          rivalName: "Jordan",
          mode: "Pushups",
          result: "Win",
          reps: 55,
          timeAgo: "3 days ago",
        },
      ]);
      setIsLoading(false);
    };

    loadProfile();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 200px)",
          color: "white",
          padding: "4rem 2rem",
          boxSizing: "border-box",
        }}
      >
        <CyanLoadingDots size="large" />
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
      {/* User Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          marginBottom: "3rem",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "rgba(99, 255, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#63ff00",
            border: "2px solid rgba(99, 255, 0, 0.5)",
          }}
        >
          {user ? getInitials(user.username) : "U"}
        </div>
        <div>
          <h1
            className="audiowide-regular"
            style={{
              fontSize: "2rem",
              fontWeight: 400,
              margin: 0,
              color: "#63ff00",
            }}
          >
            {user?.username || "User"}
          </h1>
          {user?.email && (
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.8 }}>
              {user.email}
            </p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
          marginBottom: "3rem",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(99, 255, 0, 0.1)",
            borderRadius: "20px",
            padding: "1.5rem",
            border: "1px solid rgba(99, 255, 0, 0.2)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", color: "#63ff00", fontWeight: "bold" }}>
            {stats.totalBattles}
          </div>
          <div style={{ fontSize: "0.875rem", opacity: 0.8, marginTop: "0.5rem" }}>
            Total Battles
          </div>
        </div>
        <div
          style={{
            backgroundColor: "rgba(99, 255, 0, 0.1)",
            borderRadius: "20px",
            padding: "1.5rem",
            border: "1px solid rgba(99, 255, 0, 0.2)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", color: "#63ff00", fontWeight: "bold" }}>
            {stats.winRate}%
          </div>
          <div style={{ fontSize: "0.875rem", opacity: 0.8, marginTop: "0.5rem" }}>
            Win Rate
          </div>
        </div>
        <div
          style={{
            backgroundColor: "rgba(99, 255, 0, 0.1)",
            borderRadius: "20px",
            padding: "1.5rem",
            border: "1px solid rgba(99, 255, 0, 0.2)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", color: "#63ff00", fontWeight: "bold" }}>
            {stats.totalReps}
          </div>
          <div style={{ fontSize: "0.875rem", opacity: 0.8, marginTop: "0.5rem" }}>
            Total Reps
          </div>
        </div>
        <div
          style={{
            backgroundColor: "rgba(99, 255, 0, 0.1)",
            borderRadius: "20px",
            padding: "1.5rem",
            border: "1px solid rgba(99, 255, 0, 0.2)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", color: "#63ff00", fontWeight: "bold" }}>
            {stats.longestStreak}
          </div>
          <div style={{ fontSize: "0.875rem", opacity: 0.8, marginTop: "0.5rem" }}>
            Longest Streak
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <div style={{ marginBottom: "3rem" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
            color: "#63ff00",
            fontFamily: "Audiowide, sans-serif",
          }}
        >
          Recent Matches
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {recentMatches.map((match) => (
            <div
              key={match.id}
              style={{
                backgroundColor: "rgba(17, 24, 39, 0.8)",
                borderRadius: "16px",
                padding: "1.5rem",
                border: "1px solid rgba(99, 255, 0, 0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                  vs {match.rivalName}
                </div>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  {match.mode} • {match.reps} reps • {match.timeAgo}
                </div>
              </div>
              <div
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "12px",
                  backgroundColor:
                    match.result === "Win"
                      ? "rgba(99, 255, 0, 0.2)"
                      : "rgba(239, 68, 68, 0.2)",
                  color: match.result === "Win" ? "#63ff00" : "#ef4444",
                  fontFamily: "Audiowide, sans-serif",
                  fontSize: "0.875rem",
                }}
              >
                {match.result}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
            color: "#63ff00",
            fontFamily: "Audiowide, sans-serif",
          }}
        >
          Badges
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {badges.map((badge) => (
            <div
              key={badge.id}
              style={{
                backgroundColor: badge.earned
                  ? "rgba(99, 255, 0, 0.1)"
                  : "rgba(17, 24, 39, 0.8)",
                borderRadius: "16px",
                padding: "1.5rem",
                border: `1px solid ${
                  badge.earned ? "rgba(99, 255, 0, 0.5)" : "rgba(99, 255, 0, 0.2)"
                }`,
                textAlign: "center",
                opacity: badge.earned ? 1 : 0.5,
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                {badge.earned ? "🏆" : "🔒"}
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                {badge.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

