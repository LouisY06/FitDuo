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
      <span className="electric-button-content">{children}</span>
    </button>
  );
}

