import { useState } from "react";
import { BottomNav } from "./BottomNav";
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
        paddingBottom: "100px", // Space for bottom nav
        position: "relative",
      }}
    >
      {/* Content Area */}
      <div style={{ flex: 1, overflow: "auto" }}>{renderContent()}</div>

      {/* Bottom Navigation */}
      <BottomNav
        activeItem={activeTab}
        onItemClick={(key) => setActiveTab(key as Tab)}
        fixed={true}
      />
    </div>
  );
}

