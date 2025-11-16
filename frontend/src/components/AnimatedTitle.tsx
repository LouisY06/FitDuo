import React, { useMemo } from "react";

interface AnimatedTitleProps {
  text: string;
  className?: string;
  /**
   * Base delay in milliseconds between characters. Default: 60ms.
   */
  staggerMs?: number;
}

/**
 * AnimatedTitle
 *
 * Renders text with per-letter animation using the `letter-reveal` keyframes.
 * Each character gets a 60ms (configurable) staggered delay.
 */
export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  text,
  className,
  staggerMs = 60,
}) => {
  const chars = useMemo(() => text.split(""), [text]);

  return (
    <span className={className}>
      {chars.map((ch, index) => {
        if (ch === " ") {
          return (
            <span key={`${index}-space`} className="inline-block">
              &nbsp;
            </span>
          );
        }

        const delaySeconds = (index * staggerMs) / 1000;

        return (
          <span
            key={index}
            className="letter-reveal"
            style={{ animationDelay: `${delaySeconds}s` }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};


