import { useState } from "react";
import { BottomNav } from "./BottomNav";
import { WorkoutScreen } from "./screens/WorkoutScreen";
import { TimeTrialsScreen } from "./screens/TimeTrialsScreen";
import { BattleScreen } from "./screens/BattleScreen";
import { CoachScreen } from "./screens/CoachScreen";
import { ProfileScreen } from "./screens/ProfileScreen";

type Tab = "workout" | "time" | "battle" | "coach" | "profile";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("app_initial_tab") as Tab | null;
      if (stored === "workout" || stored === "time" || stored === "battle" || stored === "coach" || stored === "profile") {
        // Clear after reading so subsequent visits use the default
        window.localStorage.removeItem("app_initial_tab");
        return stored;
      }
    }
    return "battle";
  });

  const renderContent = () => {
    switch (activeTab) {
      case "workout":
        return <WorkoutScreen />;
      case "time":
        return <TimeTrialsScreen />;
      case "battle":
        return <BattleScreen />;
      case "coach":
        return <CoachScreen />;
      case "profile":
        return <ProfileScreen />;
      default:
        return <BattleScreen />;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "100px", // Space for bottom nav
        position: "relative",
      }}
    >
      {/* Blur Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(2, 6, 23, 0.3)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeItem={activeTab}
        onItemClick={(key) => setActiveTab(key as Tab)}
        fixed={true}
      />
    </div>
  );
}

