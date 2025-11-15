import { useState } from "react";
import { FaRunning, FaStopwatch, FaFistRaised, FaDumbbell, FaUser, FaSearch, FaFilter } from "react-icons/fa";

type WorkoutMode = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  difficulty: number;
  featured?: boolean;
};

const workoutModes: WorkoutMode[] = [
  {
    id: "general",
    name: "General Workout",
    description: "Standard exercise sessions, warm-ups, and cardio routines",
    icon: <FaRunning size={32} />,
    category: "Training",
    difficulty: 2,
  },
  {
    id: "time-trials",
    name: "Time Trials",
    description: "Compete against the clock for speed-based challenges",
    icon: <FaStopwatch size={32} />,
    category: "Competition",
    difficulty: 3,
  },
  {
    id: "battle",
    name: "Battle Mode",
    description: "Real-time battles with live rivals and AI refereeing",
    icon: <FaFistRaised size={32} />,
    category: "Battle",
    difficulty: 4,
    featured: true,
  },
  {
    id: "ai-training",
    name: "AI Training",
    description: "Form analysis and personalized feedback",
    icon: <FaDumbbell size={32} />,
    category: "Training",
    difficulty: 2,
  },
];

export function WorkoutDiscovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(workoutModes.map((m) => m.category)));

  const filteredModes = workoutModes.filter((mode) => {
    const matchesSearch =
      mode.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mode.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || mode.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        paddingBottom: "6rem",
        color: "white",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "2.5rem",
        }}
      >
        <h1
          className="audiowide-regular"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 400,
            margin: 0,
            marginBottom: "0.5rem",
            background: "linear-gradient(135deg, #63ff00 0%, #ffffff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}
        >
          Discover Workouts
        </h1>
        <p style={{ fontSize: "1rem", opacity: 0.8, margin: 0, color: "white" }}>
          Choose your challenge and dominate the arena
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            flex: "1",
            minWidth: "300px",
            position: "relative",
          }}
        >
          <FaSearch
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: "1rem",
            }}
          />
          <input
            type="text"
            placeholder="Search workouts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.875rem 1rem 0.875rem 2.75rem",
              borderRadius: "12px",
              border: "1px solid rgba(99, 255, 0, 0.3)",
              background: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(10px)",
              color: "white",
              fontSize: "1rem",
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color 0.3s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.6)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.3)";
            }}
          />
        </div>

        {/* Category Filter */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: "0.875rem 1.25rem",
              borderRadius: "12px",
              border: selectedCategory === null ? "2px solid #63ff00" : "1px solid rgba(99, 255, 0, 0.3)",
              background:
                selectedCategory === null
                  ? "rgba(99, 255, 0, 0.15)"
                  : "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(10px)",
              color: selectedCategory === null ? "#63ff00" : "white",
              fontFamily: "Audiowide, sans-serif",
              fontSize: "0.9rem",
              fontWeight: 400,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: "0.875rem 1.25rem",
                borderRadius: "12px",
                border: selectedCategory === category ? "2px solid #63ff00" : "1px solid rgba(99, 255, 0, 0.3)",
                background:
                  selectedCategory === category
                    ? "rgba(99, 255, 0, 0.15)"
                    : "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(10px)",
                color: selectedCategory === category ? "#63ff00" : "white",
                fontFamily: "Audiowide, sans-serif",
                fontSize: "0.9rem",
                fontWeight: 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Workout Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {filteredModes.map((mode) => (
          <div
            key={mode.id}
            onClick={() => {
              // Handle workout mode selection
              console.log("Selected:", mode.id);
            }}
            style={{
              backgroundColor: mode.featured
                ? "rgba(99, 255, 0, 0.1)"
                : "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "2rem",
              border: mode.featured
                ? "2px solid rgba(99, 255, 0, 0.5)"
                : "1px solid rgba(99, 255, 0, 0.2)",
              cursor: "pointer",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
              boxShadow: mode.featured
                ? "0 0 30px rgba(99, 255, 0, 0.2)"
                : "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.borderColor = mode.featured
                ? "rgba(99, 255, 0, 0.8)"
                : "rgba(99, 255, 0, 0.5)";
              e.currentTarget.style.boxShadow = mode.featured
                ? "0 0 40px rgba(99, 255, 0, 0.4)"
                : "0 8px 32px rgba(99, 255, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = mode.featured
                ? "rgba(99, 255, 0, 0.5)"
                : "rgba(99, 255, 0, 0.2)";
              e.currentTarget.style.boxShadow = mode.featured
                ? "0 0 30px rgba(99, 255, 0, 0.2)"
                : "none";
            }}
          >
            {/* Featured Badge */}
            {mode.featured && (
              <div
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "12px",
                  background: "rgba(99, 255, 0, 0.2)",
                  border: "1px solid rgba(99, 255, 0, 0.5)",
                  fontSize: "0.75rem",
                  fontFamily: "Audiowide, sans-serif",
                  color: "#63ff00",
                  fontWeight: 400,
                }}
              >
                FEATURED
              </div>
            )}

            {/* Icon */}
            <div
              style={{
                fontSize: "3rem",
                marginBottom: "1.5rem",
                color: mode.featured ? "#63ff00" : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {mode.icon}
            </div>

            {/* Name */}
            <h3
              className="audiowide-regular"
              style={{
                fontSize: "1.5rem",
                fontWeight: 400,
                margin: 0,
                marginBottom: "0.75rem",
                color: mode.featured ? "#63ff00" : "white",
              }}
            >
              {mode.name}
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: "0.95rem",
                opacity: 0.85,
                margin: 0,
                marginBottom: "1.25rem",
                lineHeight: 1.6,
                color: "white",
              }}
            >
              {mode.description}
            </p>

            {/* Footer Info */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(99, 255, 0, 0.2)",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.7,
                  fontFamily: "Audiowide, sans-serif",
                }}
              >
                {mode.category}
              </span>
              <div
                style={{
                  display: "flex",
                  gap: "0.25rem",
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor:
                        i < mode.difficulty
                          ? mode.featured
                            ? "#63ff00"
                            : "rgba(99, 255, 0, 0.6)"
                          : "rgba(255, 255, 255, 0.2)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation (Desktop-friendly) */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(32, 36, 40, 0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(99, 255, 0, 0.2)",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "center",
          gap: "3rem",
        }}
      >
        <button
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.6)",
            cursor: "pointer",
            transition: "color 0.2s ease",
            padding: "0.5rem 1rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#63ff00";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
          }}
        >
          <FaRunning size={20} />
          <span style={{ fontSize: "0.75rem", fontFamily: "Audiowide, sans-serif" }}>Workouts</span>
        </button>

        <button
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.6)",
            cursor: "pointer",
            transition: "color 0.2s ease",
            padding: "0.5rem 1rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#63ff00";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
          }}
        >
          <FaFistRaised size={20} />
          <span style={{ fontSize: "0.75rem", fontFamily: "Audiowide, sans-serif" }}>Battle</span>
        </button>

        <button
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            background: "transparent",
            border: "none",
            color: "#63ff00",
            cursor: "pointer",
            transition: "color 0.2s ease",
            padding: "0.5rem 1rem",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "50%",
              transform: "translateX(-50%)",
              width: "40px",
              height: "3px",
              background: "#63ff00",
              borderRadius: "2px",
            }}
          />
          <FaSearch size={20} />
          <span style={{ fontSize: "0.75rem", fontFamily: "Audiowide, sans-serif" }}>Discover</span>
        </button>

        <button
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.6)",
            cursor: "pointer",
            transition: "color 0.2s ease",
            padding: "0.5rem 1rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#63ff00";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
          }}
        >
          <FaDumbbell size={20} />
          <span style={{ fontSize: "0.75rem", fontFamily: "Audiowide, sans-serif" }}>Training</span>
        </button>

        <button
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.6)",
            cursor: "pointer",
            transition: "color 0.2s ease",
            padding: "0.5rem 1rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#63ff00";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
          }}
        >
          <FaUser size={20} />
          <span style={{ fontSize: "0.75rem", fontFamily: "Audiowide, sans-serif" }}>Profile</span>
        </button>
      </div>
    </div>
  );
}

