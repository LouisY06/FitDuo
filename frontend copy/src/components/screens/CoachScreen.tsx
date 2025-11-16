import { useState } from "react";
import { ShimmerButton, ShimmerCard } from "../ShimmerComponents";

type Exercise = {
  id: string;
  name: string;
  description: string;
};

const exercises: Exercise[] = [
  {
    id: "squats",
    name: "Squats",
    description: "Perfect your squat form with real-time feedback",
  },
  {
    id: "pushups",
    name: "Pushups",
    description: "Get tips on depth and form for maximum effectiveness",
  },
  {
    id: "lunges",
    name: "Lunges",
    description: "Improve your lunge technique and balance",
  },
];

export function CoachScreen() {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const handleStart = (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    setIsActive(true);
  };

  const handleEnd = () => {
    setIsActive(false);
    setSelectedExercise(null);
  };

  if (isActive && selectedExercise) {
    const exercise = exercises.find((e) => e.id === selectedExercise);
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
        {/* Top Info */}
        <div
          style={{
            padding: "1.5rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(99, 255, 0, 0.2)",
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: "#63ff00" }}>{exercise?.name}</h3>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.8, fontSize: "0.875rem" }}>
              {exercise?.description}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>Reps</div>
            <div style={{ fontSize: "2rem", color: "#63ff00" }}>0</div>
          </div>
        </div>

        {/* Camera Area */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "1rem",
            padding: "2rem",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(99, 255, 0, 0.1)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(99, 255, 0, 0.2)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📹</div>
              <p style={{ opacity: 0.8 }}>Camera view</p>
            </div>
          </div>

          {/* Tips Panel */}
          <div
            style={{
              backgroundColor: "rgba(17, 24, 39, 0.8)",
              borderRadius: "20px",
              padding: "1.5rem",
              border: "1px solid rgba(99, 255, 0, 0.2)",
            }}
          >
            <h4 style={{ margin: "0 0 1rem 0", color: "#63ff00" }}>Live Tips</h4>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(99, 255, 0, 0.1)",
                borderRadius: "12px",
                marginBottom: "1rem",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.875rem" }}>
                Stand in frame and get ready
              </p>
            </div>

            <div style={{ marginTop: "2rem" }}>
              <h4 style={{ margin: "0 0 1rem 0", color: "#63ff00" }}>Form Meter</h4>
              <div
                style={{
                  height: "8px",
                  backgroundColor: "rgba(99, 255, 0, 0.2)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "75%",
                    backgroundColor: "#63ff00",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", opacity: 0.8 }}>
                Good form
              </p>
            </div>
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
              border: "1px solid rgba(99, 255, 0, 0.5)",
              background: "transparent",
              color: "#63ff00",
              fontFamily: "Audiowide, sans-serif",
              cursor: "pointer",
            }}
          >
            End Session
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
        AI Coach
      </h1>
      <p style={{ opacity: 0.8, marginBottom: "2rem" }}>
        Get real-time feedback on form and pacing.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {exercises.map((exercise) => (
          <ShimmerCard key={exercise.id} variant="success">
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                margin: 0,
                marginBottom: "0.5rem",
                color: "#63ff00",
              }}
            >
              {exercise.name}
            </h3>
            <p style={{ marginBottom: "1.5rem", opacity: 0.9 }}>
              {exercise.description}
            </p>
            <ShimmerButton
              variant="success"
              onClick={() => handleStart(exercise.id)}
            >
              Start Session
            </ShimmerButton>
          </ShimmerCard>
        ))}
      </div>
    </div>
  );
}

