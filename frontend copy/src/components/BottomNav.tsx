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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
  },
  {
    key: "time",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    ),
  },
  {
    key: "battle",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
  },
  {
    key: "coach",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6"></path>
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

