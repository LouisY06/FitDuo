import { useState } from "react";
import { BottomNavBar } from "./BottomNavBar";
import { WorkoutScreen } from "./screens/WorkoutScreen";
import { TimeTrialsScreen } from "./screens/TimeTrialsScreen";
import { BattleScreen } from "./screens/BattleScreen";
import { CoachScreen } from "./screens/CoachScreen";
import { ProfileScreen } from "./screens/ProfileScreen";

type Tab = "workout" | "time" | "battle" | "coach" | "profile";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("battle");

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
        paddingBottom: "120px", // Space for bottom nav
        position: "relative",
      }}
    >
      {/* Content Area */}
      <div style={{ flex: 1, overflow: "auto" }}>{renderContent()}</div>

      {/* Bottom Navigation */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

