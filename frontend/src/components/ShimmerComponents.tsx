// ShimmerComponents.tsx
import React from 'react';
import './ShimmerComponents.css';

// ============================================
// SHIMMER BUTTON
// ============================================

type ShimmerButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'rainbow';
  disabled?: boolean;
  className?: string;
};

export function ShimmerButton({
  children,
  onClick,
  type = 'button',
  variant = 'success',
  disabled = false,
  className = '',
}: ShimmerButtonProps) {
  const handleClick = () => {
    console.log("🔴 ShimmerButton clicked!", { disabled, hasOnClick: !!onClick });
    if (disabled) {
      console.warn("⚠️ Button is disabled - onClick will not be called");
      return;
    }
    if (!onClick) {
      console.warn("⚠️ No onClick handler provided");
      return;
    }
    console.log("✅ Calling onClick handler...");
    try {
      onClick();
      console.log("✅ onClick handler completed");
    } catch (error) {
      console.error("❌ Error in onClick handler:", error);
    }
  };
  
  return (
    <div className={`shimmer-wrapper shimmer-wrapper--${variant} ${className}`}>
      <button 
        className="shimmer-btn" 
        onClick={handleClick}
        type={type}
        disabled={disabled}
      >
        {children}
      </button>
    </div>
  );
}

// ============================================
// SHIMMER CARD
// ============================================

type ShimmerCardProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'rainbow';
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
};

export function ShimmerCard({
  children,
  variant = 'success',
  className = '',
  onClick,
  style,
}: ShimmerCardProps) {
  return (
    <div 
      className={`shimmer-wrapper shimmer-wrapper--${variant} shimmer-wrapper--card ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      <div className="shimmer-card-content">
        {children}
      </div>
    </div>
  );
}

// ============================================
// SHIMMER INPUT
// ============================================

type ShimmerInputProps = {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  variant?: 'primary' | 'secondary' | 'success' | 'rainbow';
  icon?: React.ReactNode;
  className?: string;
};

export function ShimmerInput({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  variant = 'success',
  icon,
  className = '',
}: ShimmerInputProps) {
  return (
    <div className={`shimmer-wrapper shimmer-wrapper--${variant} shimmer-wrapper--input ${className}`}>
      <div className="shimmer-input-container">
        {icon && <div className="shimmer-input-icon">{icon}</div>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="shimmer-input"
        />
      </div>
    </div>
  );
}

// ============================================
// SHIMMER TEXTAREA
// ============================================

type ShimmerTextareaProps = {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  variant?: 'primary' | 'secondary' | 'success' | 'rainbow';
  rows?: number;
  className?: string;
};

export function ShimmerTextarea({
  placeholder = '',
  value,
  onChange,
  variant = 'success',
  rows = 4,
  className = '',
}: ShimmerTextareaProps) {
  return (
    <div className={`shimmer-wrapper shimmer-wrapper--${variant} shimmer-wrapper--input ${className}`}>
      <div className="shimmer-input-container">
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows}
          className="shimmer-textarea"
        />
      </div>
    </div>
  );
}

