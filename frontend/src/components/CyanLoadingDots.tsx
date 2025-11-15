import React from 'react';
import './CyanLoadingDots.css';

type CyanLoadingDotsProps = {
  size?: 'small' | 'medium' | 'large';
  dotCount?: number;
  className?: string;
};

/**
 * CyanLoadingDots - Animated loading indicator with wave effect
 * 
 * @param {string} size - Size variant: 'small', 'medium', 'large' (default: 'medium')
 * @param {number} dotCount - Number of dots to display (default: 3)
 * @param {string} className - Additional CSS classes
 */
export function CyanLoadingDots({ 
  size = 'medium',
  dotCount = 3,
  className = ''
}: CyanLoadingDotsProps) {
  const sizeClass = size !== 'medium' ? size : '';
  const classes = `loading-dots ${sizeClass} ${className}`.trim();

  return (
    <div className={classes}>
      {[...Array(dotCount)].map((_, index) => (
        <div key={index} className="dot" />
      ))}
    </div>
  );
}

