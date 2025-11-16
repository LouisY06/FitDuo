import { useState } from "react";
import "./BottomNav.css";

type NavItem = {
  key: string;
  icon: React.ReactNode;
  label?: string;
};

type BottomNavProps = {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (key: string) => void;
  fixed?: boolean;
};

// Default navigation items for FitDuo
const defaultItems: NavItem[] = [
  {
    key: "workout",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Dumbbell icon */}
        {/* Left plates */}
        <rect x="2.5" y="8" width="2.5" height="8" rx="0.8" />
        <rect x="5.2" y="9" width="1.8" height="6" rx="0.9" />
        {/* Right plates */}
        <rect x="19" y="8" width="2.5" height="8" rx="0.8" />
        <rect x="16.9" y="9" width="1.8" height="6" rx="0.9" />
        {/* Bar */}
        <rect x="7.3" y="10.3" width="9.4" height="3.4" rx="1.1" />
      </svg>
    ),
  },
  {
    key: "time",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {/* Timer body */}
        <circle cx="12" cy="13" r="7"></circle>
        {/* Top bar/handle */}
        <rect x="9" y="4" width="6" height="2" rx="1" ry="1"></rect>
        {/* Crown button */}
        <line x1="15" y1="4" x2="17" y2="2"></line>
        {/* Timer hand */}
        <polyline points="12 13 12 9 15 11"></polyline>
      </svg>
    ),
  },
  {
    key: "battle",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Globe icon for matchmaking / global rivals */}
        <circle cx="12" cy="12" r="7" />
        {/* Meridians */}
        <path d="M12 5a9.5 9.5 0 0 1 3 7 9.5 9.5 0 0 1-3 7" />
        <path d="M12 5a9.5 9.5 0 0 0-3 7 9.5 9.5 0 0 0 3 7" />
        {/* Parallels */}
        <path d="M5 12h14" />
        <path d="M6.5 8.5h11" />
        <path d="M6.5 15.5h11" />
      </svg>
    ),
  },
  {
    key: "coach",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {/* Robot head */}
        <rect x="7" y="7" width="10" height="8" rx="2" ry="2"></rect>
        {/* Antenna */}
        <line x1="12" y1="4" x2="12" y2="7"></line>
        <circle cx="12" cy="3" r="1"></circle>
        {/* Eyes */}
        <circle cx="10" cy="10" r="1"></circle>
        <circle cx="14" cy="10" r="1"></circle>
        {/* Mouth */}
        <line x1="9" y1="13" x2="15" y2="13"></line>
      </svg>
    ),
  },
  {
    key: "profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
  },
];

export function BottomNav({
  items = defaultItems,
  activeItem: controlledActive,
  onItemClick,
  fixed = true,
}: BottomNavProps) {
  const [activeItem, setActiveItem] = useState(controlledActive || items[0]?.key || "battle");

  const handleItemClick = (itemKey: string) => {
    setActiveItem(itemKey);

    // Haptic feedback on mobile
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }

    // Call parent callback if provided
    if (onItemClick) {
      onItemClick(itemKey);
    }
  };

  const currentActive = controlledActive !== undefined ? controlledActive : activeItem;

  return (
    <nav className={`bottom-nav ${fixed ? "fixed" : ""}`}>
      <div className="nav-items">
        {items.map((item) => (
          <div
            key={item.key}
            className={`nav-item ${currentActive === item.key ? "active" : ""}`}
            onClick={() => handleItemClick(item.key)}
            data-page={item.key}
          >
            <div className="nav-icon">{item.icon}</div>
            <div className="nav-indicator"></div>
          </div>
        ))}
      </div>
    </nav>
  );
}

