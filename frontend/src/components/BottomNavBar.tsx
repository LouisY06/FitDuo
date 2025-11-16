type BottomNavBarProps = {
  activeTab?: "workout" | "time" | "battle" | "coach" | "profile";
  onTabChange?: (tab: "workout" | "time" | "battle" | "coach" | "profile") => void;
};

export function BottomNavBar({ activeTab = "battle", onTabChange }: BottomNavBarProps) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingBottom: "20px",
        zIndex: 100,
      }}
    >
      {/* Yellow Battle Button - Overlapping */}
      <div
        onClick={() => onTabChange?.("battle")}
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: activeTab === "battle" ? "#FFD700" : "#FFD700",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "-32px",
          zIndex: 101,
          boxShadow: activeTab === "battle" ? "0 4px 20px rgba(255, 215, 0, 0.6)" : "0 4px 12px rgba(0, 0, 0, 0.3)",
          border: "3px solid white",
          cursor: "pointer",
          transition: "all 0.2s ease",
          transform: activeTab === "battle" ? "scale(1.1)" : "scale(1)",
        }}
        title="Matchmaking Battle Mode - Get paired with a live rival for real-time, computer-vision–refereed exercise battles"
      >
        {/* High-five icon - two stick figures */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left figure */}
          <circle cx="10" cy="8" r="3" fill="#000" />
          <line x1="10" y1="11" x2="10" y2="20" stroke="#000" strokeWidth="2" />
          <line x1="10" y1="14" x2="6" y2="18" stroke="#000" strokeWidth="2" />
          <line x1="10" y1="14" x2="14" y2="18" stroke="#000" strokeWidth="2" />
          <line x1="10" y1="20" x2="7" y2="26" stroke="#000" strokeWidth="2" />
          <line x1="10" y1="20" x2="13" y2="26" stroke="#000" strokeWidth="2" />
          {/* Left hand */}
          <circle cx="6" cy="18" r="2" fill="#000" />
          
          {/* Right figure */}
          <circle cx="22" cy="8" r="3" fill="#000" />
          <line x1="22" y1="11" x2="22" y2="20" stroke="#000" strokeWidth="2" />
          <line x1="22" y1="14" x2="18" y2="18" stroke="#000" strokeWidth="2" />
          <line x1="22" y1="14" x2="26" y2="18" stroke="#000" strokeWidth="2" />
          <line x1="22" y1="20" x2="19" y2="26" stroke="#000" strokeWidth="2" />
          <line x1="22" y1="20" x2="25" y2="26" stroke="#000" strokeWidth="2" />
          {/* Right hand */}
          <circle cx="26" cy="18" r="2" fill="#000" />
          
          {/* High-five impact */}
          <circle cx="16" cy="18" r="3" fill="#fff" opacity="0.8" />
          <circle cx="16" cy="18" r="2" fill="#FFD700" opacity="0.6" />
        </svg>
      </div>

      {/* Dark Glass Navigation Bar */}
      <div
        style={{
          width: "calc(100% - 40px)",
          maxWidth: "335px",
          backgroundColor: "rgba(17, 24, 39, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(99, 255, 0, 0.2)",
          borderRadius: "30px 30px 20px 20px",
          paddingTop: "40px",
          paddingBottom: "12px",
          paddingLeft: "20px",
          paddingRight: "20px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          boxShadow: "0 -2px 20px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Running Icon - General Workout Mode */}
        <div
          onClick={() => onTabChange?.("workout")}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
            opacity: activeTab === "workout" ? 1 : 0.6,
            transform: activeTab === "workout" ? "scale(1.1)" : "scale(1)",
            transition: "all 0.2s ease",
          }}
          title="General Workout Mode - Standard exercise sessions, warm-ups, and cardio routines"
        >
          <div style={{ fontSize: "24px" }}>🏃</div>
        </div>

        {/* Stopwatch Icon - Time Trials Mode */}
        <div
          onClick={() => onTabChange?.("time")}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
            opacity: activeTab === "time" ? 1 : 0.6,
            transform: activeTab === "time" ? "scale(1.1)" : "scale(1)",
            transition: "all 0.2s ease",
          }}
          title="Time Trials Mode - Compete against the clock to complete as many high-quality reps as possible"
        >
          <div style={{ fontSize: "24px" }}>⏱️</div>
        </div>

        {/* Battle Button Space (invisible, for spacing) */}
        <div style={{ width: "64px" }} />

        {/* Dumbbell Icon - AI Training Agent */}
        <div
          onClick={() => onTabChange?.("coach")}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
            opacity: activeTab === "coach" ? 1 : 0.6,
            transform: activeTab === "coach" ? "scale(1.1)" : "scale(1)",
            transition: "all 0.2s ease",
          }}
          title="AI Training Agent - Analyzes your form, gives feedback, and helps you improve stats across different exercises"
        >
          <div style={{ fontSize: "24px" }}>🏋️</div>
        </div>

        {/* Profile Icon */}
        <div
          onClick={() => onTabChange?.("profile")}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
            opacity: activeTab === "profile" ? 1 : 0.6,
            transform: activeTab === "profile" ? "scale(1.1)" : "scale(1)",
            transition: "all 0.2s ease",
          }}
          title="Profile - Match history, performance breakdowns, rankings, and personal settings"
        >
          {/* Crossed swords icon inspired by your battle visuals */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              stroke={activeTab === "profile" ? "#63FF00" : "#9CA3AF"}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Left sword */}
              <path d="M5.5 4.5L10.5 9.5L8 12L3 7" />
              <path d="M8.5 11.5L4.5 15.5" />
              <path d="M3.5 16.5L5.5 18.5" />

              {/* Right sword */}
              <path d="M18.5 4.5L13.5 9.5L16 12L21 7" />
              <path d="M15.5 11.5L19.5 15.5" />
              <path d="M20.5 16.5L18.5 18.5" />

              {/* Crossing detail */}
              <path d="M9 13L15 7" />
              <path d="M15 13L9 7" />
            </g>
          </svg>
        </div>
      </div>

      {/* Home Indicator */}
      <div
        style={{
          width: "134px",
          height: "5px",
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          borderRadius: "3px",
          marginTop: "8px",
        }}
      />
    </div>
  );
}


