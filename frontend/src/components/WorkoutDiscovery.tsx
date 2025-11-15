import { useNavigate } from "react-router-dom";
import { ShimmerButton } from "./ShimmerComponents";
import { FaTrophy, FaMedal, FaCrown, FaFire } from "react-icons/fa";

type BattlePassTier = {
  level: number;
  reward: string;
  icon: React.ReactNode;
  unlocked: boolean;
};

const battlePassTiers: BattlePassTier[] = [
  {
    level: 1,
    reward: "Starter Badge",
    icon: <FaMedal size={24} />,
    unlocked: true,
  },
  {
    level: 5,
    reward: "Warrior Title",
    icon: <FaTrophy size={24} />,
    unlocked: false,
  },
  {
    level: 10,
    reward: "Elite Status",
    icon: <FaCrown size={24} />,
    unlocked: false,
  },
  {
    level: 15,
    reward: "Legendary Skin",
    icon: <FaFire size={24} />,
    unlocked: false,
  },
];

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

      {/* Battle Pass Tiers */}
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          marginBottom: "3rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {battlePassTiers.map((tier) => (
            <div
              key={tier.level}
              style={{
                backgroundColor: tier.unlocked
                  ? "rgba(99, 255, 0, 0.1)"
                  : "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                borderRadius: "20px",
                padding: "1.5rem",
                border: tier.unlocked
                  ? "1px solid rgba(99, 255, 0, 0.5)"
                  : "1px solid rgba(99, 255, 0, 0.2)",
                textAlign: "center",
                opacity: tier.unlocked ? 1 : 0.6,
                boxShadow: tier.unlocked
                  ? "0 8px 32px rgba(99, 255, 0, 0.2)"
                  : "0 8px 32px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div
                style={{
                  fontSize: "2.5rem",
                  marginBottom: "1rem",
                  color: tier.unlocked ? "#63ff00" : "rgba(255, 255, 255, 0.5)",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {tier.icon}
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: tier.unlocked ? "#63ff00" : "rgba(255, 255, 255, 0.8)",
                }}
              >
                Level {tier.level}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  opacity: 0.8,
                }}
              >
                {tier.reward}
              </div>
              {tier.unlocked && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    fontSize: "0.7rem",
                    color: "#63ff00",
                    fontFamily: "Audiowide, sans-serif",
                  }}
                >
                  ✓ UNLOCKED
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "1.5rem",
            border: "1px solid rgba(99, 255, 0, 0.2)",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
              fontSize: "0.875rem",
            }}
          >
            <span>Current Level: 1</span>
            <span style={{ color: "#63ff00" }}>Next: Level 5</span>
          </div>
          <div
            style={{
              width: "100%",
              height: "12px",
              backgroundColor: "rgba(99, 255, 0, 0.2)",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "25%",
                height: "100%",
                background: "linear-gradient(90deg, #63ff00, #52d700)",
                borderRadius: "6px",
                boxShadow: "0 0 10px rgba(99, 255, 0, 0.5)",
              }}
            />
          </div>
          <div
            style={{
              marginTop: "0.5rem",
              fontSize: "0.75rem",
              opacity: 0.8,
              textAlign: "center",
            }}
          >
            250 / 1000 XP to next level
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div style={{ width: "100%", maxWidth: "400px" }}>
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
