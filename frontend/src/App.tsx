import "./index.css";
import { VantaBackground } from "./components/VantaBackground";
import { FaRunning, FaStopwatch, FaFistRaised, FaDumbbell } from "react-icons/fa";

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
          padding: "2rem 1.5rem",
          gap: "3rem",
        }}
      >
        {/* Main Hero Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "800px",
            gap: "1.5rem",
          }}
        >
          <h1
            className="audiowide-regular"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 5rem)",
              fontWeight: 400,
              margin: 0,
              background: "linear-gradient(135deg, #63ff00 0%, #ffffff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            FitDuo Arena
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              opacity: 0.9,
              lineHeight: 1.6,
              maxWidth: "600px",
              margin: 0,
            }}
          >
            Match with a rival, battle through AI-refereed workouts, and stay
            accountable from the comfort of home.
          </p>
        </div>

        {/* Feature Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            maxWidth: "900px",
            width: "100%",
          }}
        >
          {/* General Workout Mode */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "2rem 1.5rem",
              border: "1px solid rgba(99, 255, 0, 0.2)",
              textAlign: "center",
              transition: "transform 0.3s ease, border-color 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.2)";
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem", display: "flex", justifyContent: "center", color: "white" }}>
              <FaRunning size={48} />
            </div>
            <h3 className="audiowide-regular" style={{ fontSize: "1.25rem", fontWeight: 400, marginBottom: "0.5rem", margin: 0 }}>
              General Workout
            </h3>
            <p style={{ fontSize: "0.9rem", opacity: 0.8, margin: 0 }}>
              Standard exercise sessions, warm-ups, and cardio routines
            </p>
          </div>

          {/* Time Trials */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "2rem 1.5rem",
              border: "1px solid rgba(99, 255, 0, 0.2)",
              textAlign: "center",
              transition: "transform 0.3s ease, border-color 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.2)";
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem", display: "flex", justifyContent: "center", color: "white" }}>
              <FaStopwatch size={48} />
            </div>
            <h3 className="audiowide-regular" style={{ fontSize: "1.25rem", fontWeight: 400, marginBottom: "0.5rem", margin: 0 }}>
              Time Trials
            </h3>
            <p style={{ fontSize: "0.9rem", opacity: 0.8, margin: 0 }}>
              Compete against the clock for speed-based challenges
            </p>
          </div>

          {/* Battle Mode - Highlighted */}
          <div
            style={{
              backgroundColor: "rgba(99, 255, 0, 0.1)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "2rem 1.5rem",
              border: "2px solid rgba(99, 255, 0, 0.5)",
              textAlign: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(99, 255, 0, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(99, 255, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(99, 255, 0, 0.2)";
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem", display: "flex", justifyContent: "center", color: "#63ff00" }}>
              <FaFistRaised size={48} />
            </div>
            <h3 className="audiowide-regular" style={{ fontSize: "1.25rem", fontWeight: 400, marginBottom: "0.5rem", margin: 0, color: "#63ff00" }}>
              Battle Mode
            </h3>
            <p style={{ fontSize: "0.9rem", opacity: 0.9, margin: 0 }}>
              Real-time battles with live rivals and AI refereeing
            </p>
          </div>

          {/* AI Training */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "2rem 1.5rem",
              border: "1px solid rgba(99, 255, 0, 0.2)",
              textAlign: "center",
              transition: "transform 0.3s ease, border-color 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.2)";
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem", display: "flex", justifyContent: "center", color: "white" }}>
              <FaDumbbell size={48} />
            </div>
            <h3 className="audiowide-regular" style={{ fontSize: "1.25rem", fontWeight: 400, marginBottom: "0.5rem", margin: 0 }}>
              AI Training
            </h3>
            <p style={{ fontSize: "0.9rem", opacity: 0.8, margin: 0 }}>
              Form analysis and personalized feedback
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "1rem",
          }}
        >
          <button
            style={{
              padding: "1rem 2rem",
              borderRadius: "50px",
              border: "none",
              background: "linear-gradient(135deg, #63ff00 0%, #52d700 100%)",
              color: "#202428",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "1rem",
              boxShadow: "0 4px 20px rgba(99, 255, 0, 0.3)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 25px rgba(99, 255, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(99, 255, 0, 0.3)";
            }}
          >
            Start Solo Session
          </button>

          <button
            style={{
              padding: "1rem 2rem",
              borderRadius: "50px",
              border: "2px solid rgba(99, 255, 0, 0.5)",
              background: "rgba(99, 255, 0, 0.1)",
              backdropFilter: "blur(10px)",
              color: "#63ff00",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "1rem",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99, 255, 0, 0.2)";
              e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.8)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99, 255, 0, 0.1)";
              e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.5)";
              e.currentTarget.style.transform = "translateY(0)";
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
