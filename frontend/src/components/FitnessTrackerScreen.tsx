import { BottomNavBar } from "./BottomNavBar";

export function FitnessTrackerScreen() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: "column",
        color: "white",
        overflow: "auto",
        position: "relative",
      }}
    >
      {/* Status Bar Area */}
      <div
        style={{
          height: "44px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
          paddingTop: "8px",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        <span>9:41</span>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: "20px", paddingTop: "10px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Today's Progress
        </h1>
        <p style={{ fontSize: "16px", opacity: 0.9, margin: 0 }}>
          Wednesday, March 20
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          padding: "0 20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>
            1,247
          </div>
          <div style={{ fontSize: "12px", opacity: 0.9 }}>Steps</div>
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>
            8.2
          </div>
          <div style={{ fontSize: "12px", opacity: 0.9 }}>km</div>
        </div>
      </div>

      {/* Workout Section */}
      <div style={{ padding: "0 20px", marginBottom: "20px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            marginBottom: "12px",
          }}
        >
          Active Workout
        </h2>
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div>
              <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
                Push-ups Challenge
              </div>
              <div style={{ fontSize: "14px", opacity: 0.8 }}>
                Round 3 of 5
              </div>
            </div>
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
              💪
            </div>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: "60%",
                height: "100%",
                backgroundColor: "#22c55e",
                borderRadius: "4px",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px",
            }}
          >
            <span>24 / 40 reps</span>
            <span style={{ fontWeight: 600 }}>60%</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "0 20px", marginBottom: "100px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            marginBottom: "12px",
          }}
        >
          Quick Start
        </h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏃</div>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>Run</div>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🧘</div>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>Yoga</div>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏋️</div>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>Gym</div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </div>
  );
}


