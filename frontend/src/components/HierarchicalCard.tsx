import "./HierarchicalCard.css";
import { ShimmerButton } from "./ShimmerComponents";

type HierarchicalCardProps = {
  title: string;
  subtitle?: string;
  bodyText?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  variant?: "primary" | "secondary" | "success";
  className?: string;
  children?: React.ReactNode;
};

export function HierarchicalCard({
  title,
  subtitle,
  bodyText,
  ctaText,
  onCtaClick,
  variant = "success",
  className = "",
  children,
}: HierarchicalCardProps) {
  return (
    <div className={`hierarchical-card ${className}`}>
      {/* Title - Largest, Most Prominent */}
      <h2 className="hierarchical-card-title">{title}</h2>

      {/* Subtitle - Medium Size */}
      {subtitle && (
        <h3 className="hierarchical-card-subtitle">{subtitle}</h3>
      )}

      {/* Body Text - Smallest */}
      {bodyText && (
        <p className="hierarchical-card-body">{bodyText}</p>
      )}

      {/* Children Content */}
      {children && (
        <div className="hierarchical-card-content">{children}</div>
      )}

      {/* Call-to-Action Button - Prominent */}
      {ctaText && (
        <div className="hierarchical-card-cta">
          <ShimmerButton variant={variant} onClick={onCtaClick}>
            {ctaText}
          </ShimmerButton>
        </div>
      )}
    </div>
  );
}

