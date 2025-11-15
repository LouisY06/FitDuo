import { useState } from "react";
import { ShimmerButton } from "../ShimmerComponents";

export function BattleScreen() {
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleFindRival = () => {
    setIsMatchmaking(true);
    // Simulate matchmaking
    setTimeout(() => {
      setIsMatchmaking(false);
      setIsMatched(true);
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
        }
      }, 1000);
    }, 2000);
  };

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

  if (isMatched) {
    return (
      <div
        style={{
          height: "100vh",
          backgroundColor: "#020617",
          color: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            padding: "1rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(99, 255, 0, 0.2)",
          }}
        >
          <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
            Round 1: Squats – 30s
          </div>
          <div
            style={{
              fontFamily: "VT323, monospace",
              fontSize: "2rem",
              color: "#63ff00",
            }}
          >
            00:30
          </div>
        </div>

        {/* Battle View */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            padding: "2rem",
          }}
        >
          {/* You */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h3 style={{ margin: 0, color: "#63ff00" }}>You</h3>
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(99, 255, 0, 0.1)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(99, 255, 0, 0.2)",
                minHeight: "300px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📹</div>
                <p style={{ opacity: 0.8 }}>Your camera</p>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", color: "#63ff00" }}>0</div>
              <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>Reps</div>
            </div>
          </div>

          {/* Opponent */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h3 style={{ margin: 0, color: "#63ff00" }}>Opponent</h3>
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(99, 255, 0, 0.1)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(99, 255, 0, 0.2)",
                minHeight: "300px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>👤</div>
                <p style={{ opacity: 0.8 }}>Opponent view</p>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", color: "#63ff00" }}>0</div>
              <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>Reps</div>
            </div>
          </div>
        </div>

        {/* Bottom Hints */}
        <div
          style={{
            padding: "1rem 2rem",
            borderTop: "1px solid rgba(99, 255, 0, 0.2)",
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            fontSize: "0.875rem",
            opacity: 0.8,
          }}
        >
          <span>👍 = send encouragement</span>
          <span>👎 = send taunt</span>
        </div>
      </div>
    );
  }

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

      {isMatchmaking ? (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
              animation: "spin 1s linear infinite",
              display: "inline-block",
            }}
          >
            ⚡
          </div>
          <p style={{ fontSize: "1.25rem", opacity: 0.9 }}>
            Finding a rival...
          </p>
        </div>
      ) : (
        <ShimmerButton variant="success" onClick={handleFindRival}>
          Find a Rival
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

