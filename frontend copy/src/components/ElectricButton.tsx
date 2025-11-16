import "./ElectricButton.css";

type ElectricButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ElectricButton({
  children,
  onClick,
  disabled = false,
  className = "",
}: ElectricButtonProps) {
  return (
    <button
      className={`electric-button ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {/* Electric Border Effect */}
      <div className="electric-button-border">
        <div className="electric-button-border-inner"></div>
      </div>

      {/* Button Content */}
      <span className="electric-button-content">
        <span className="electric-button-text">{children}</span>
        <svg
          className="electric-button-arrow"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </span>
    </button>
  );
}

