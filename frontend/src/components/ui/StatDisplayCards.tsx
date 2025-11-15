import React from "react";
import { StatDisplayCard } from "./StatDisplayCard";
import "./StatDisplayCards.css";

interface StatCardData {
  icon?: React.ReactNode;
  title?: string;
  value?: string | number;
  iconClassName?: string;
  titleClassName?: string;
  className?: string;
}

interface StatDisplayCardsProps {
  cards?: StatCardData[];
}

export function StatDisplayCards({ cards }: StatDisplayCardsProps) {
  if (!cards || cards.length === 0) {
    return null;
  }

  // Limit to 4 cards for the stacked effect
  const displayCards = cards.slice(0, 4);

  return (
    <div className="stat-display-cards-container">
      {displayCards.map((cardProps, index) => {
        const stackClass = `stack-${index + 1}`;
        const combinedClassName = `${cardProps.className || ""} ${stackClass}`.trim();
        
        return (
          <StatDisplayCard
            key={index}
            {...cardProps}
            className={combinedClassName}
          />
        );
      })}
    </div>
  );
}

