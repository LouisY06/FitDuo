import "./index.css";
import { VantaBackground } from "./components/VantaBackground";

function App() {
  return (
    <VantaBackground>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          FitDuo Arena
        </h1>

        <p
          style={{
            maxWidth: 600,
            marginBottom: "1.5rem",
            fontSize: "1.05rem",
            opacity: 0.9,
          }}
        >
          Match with a rival, battle through AI-refereed workouts, and stay
          accountable from the comfort of home.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "999px",
              border: "none",
              background: "#22c55e",
              color: "black",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Start Solo Session
          </button>

          <button
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "999px",
              border: "1px solid #ffffff80",
              background: "transparent",
              color: "white",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Find a Rival
          </button>
        </div>
      </div>
    </VantaBackground>
  );
}

export default App;
