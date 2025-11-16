import { useState } from "react";
import { ShimmerCard, ShimmerButton } from "../ShimmerComponents";

type Workout = {
  id: string;
  name: string;
  duration: string;
  intensity: "Beginner" | "Intermediate" | "Advanced";
  description: string;
};

const workouts: Workout[] = [
  {
    id: "warmup",
    name: "Full Body Warmup",
    duration: "5 min",
    intensity: "Beginner",
    description: "Quick warm-up to get your body ready",
  },
  {
    id: "bodyweight",
    name: "Bodyweight Strength",
    duration: "10 min",
    intensity: "Intermediate",
    description: "Build strength with no equipment needed",
  },
  {
    id: "cardio",
    name: "Light Cardio",
    duration: "7 min",
    intensity: "Beginner",
    description: "Get your heart rate up with simple movements",
  },
];

export function WorkoutScreen() {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);

  const handleStartWorkout = (workoutId: string) => {
    setSelectedWorkout(workoutId);
    // TODO: Navigate to camera view
    console.log("Starting workout:", workoutId);
  };

  if (selectedWorkout) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "white",
        }}
      >
        <h2 style={{ marginBottom: "2rem" }}>Workout Camera View</h2>
        <p style={{ opacity: 0.8, marginBottom: "2rem" }}>
          Camera preview will appear here. Ready? Stand in frame.
        </p>
        <button
          onClick={() => setSelectedWorkout(null)}
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
          Back
        </button>
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
        className="audiowide-regular ai-heading-clip"
        style={{
          fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
          fontWeight: 400,
          margin: 0,
          marginBottom: "0.5rem",
          color: "#63ff00",
        }}
      >
        <span className="ai-heading-clip-text">Quick Workout</span>
      </h1>
      <p style={{ opacity: 0.8, marginBottom: "2rem" }}>
        Choose a workout to get started
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {workouts.map((workout, index) => (
          <ShimmerCard
            key={workout.id}
            variant="success"
            className="ai-stagger-card"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                margin: 0,
                marginBottom: "0.5rem",
                color: "#63ff00",
              }}
            >
              {workout.name}
            </h3>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1rem",
                fontSize: "0.875rem",
                opacity: 0.8,
              }}
            >
              <span>⏱️ {workout.duration}</span>
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "12px",
                  background: "rgba(99, 255, 0, 0.2)",
                  color: "#63ff00",
                }}
              >
                {workout.intensity}
              </span>
            </div>
            <p style={{ marginBottom: "1.5rem", opacity: 0.9 }}>
              {workout.description}
            </p>
            <ShimmerButton
              variant="success"
              onClick={() => handleStartWorkout(workout.id)}
            >
              Start
            </ShimmerButton>
          </ShimmerCard>
        ))}
      </div>
    </div>
  );
}

