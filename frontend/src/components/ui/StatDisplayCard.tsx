import React from "react";
import "./StatDisplayCard.css";

interface StatDisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  value?: string | number;
  iconClassName?: string;
  titleClassName?: string;
}

export function StatDisplayCard({
  className = "",
  icon,
  title = "Stat",
  value = "0",
  iconClassName = "",
  titleClassName = "",
}: StatDisplayCardProps) {
  return (
    <div className={`stat-display-card ${className}`}>
      <div className="stat-card-content">
        <div className="stat-card-header">
          {icon && (
            <span className={`stat-card-icon ${iconClassName}`}>{icon}</span>
          )}
          <p className={`stat-card-title ${titleClassName}`}>{title}</p>
        </div>
        <p className="stat-card-value">{value}</p>
      </div>
    </div>
  );
}

