export function BottomNavBar() {
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
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: "#FFD700",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "-32px",
          zIndex: 101,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          border: "3px solid white",
          cursor: "pointer",
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

      {/* White Navigation Bar */}
      <div
        style={{
          width: "calc(100% - 40px)",
          maxWidth: "335px",
          backgroundColor: "white",
          borderRadius: "30px 30px 20px 20px",
          paddingTop: "40px",
          paddingBottom: "12px",
          paddingLeft: "20px",
          paddingRight: "20px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Running Icon - General Workout Mode */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
          }}
          title="General Workout Mode - Standard exercise sessions, warm-ups, and cardio routines"
        >
          <div style={{ fontSize: "24px" }}>🏃</div>
        </div>

        {/* Stopwatch Icon - Time Trials Mode */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
          }}
          title="Time Trials Mode - Compete against the clock to complete as many high-quality reps as possible"
        >
          <div style={{ fontSize: "24px" }}>⏱️</div>
        </div>

        {/* Battle Button Space (invisible, for spacing) */}
        <div style={{ width: "64px" }} />

        {/* Dumbbell Icon - AI Training Agent */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
          }}
          title="AI Training Agent - Analyzes your form, gives feedback, and helps you improve stats across different exercises"
        >
          <div style={{ fontSize: "24px" }}>🏋️</div>
        </div>

        {/* Profile Icon */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
          }}
          title="Profile - Match history, performance breakdowns, rankings, and personal settings"
        >
          <div style={{ fontSize: "24px" }}>👤</div>
        </div>
      </div>

      {/* Home Indicator */}
      <div
        style={{
          width: "134px",
          height: "5px",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          borderRadius: "3px",
          marginTop: "8px",
        }}
      />
    </div>
  );
}


