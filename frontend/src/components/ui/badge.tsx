import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]";

    const variants: Record<BadgeProps["variant"], string> = {
      default: "bg-emerald-500/15 border-emerald-400/80 text-emerald-200",
      outline: "border-emerald-300/60 text-emerald-100",
    };

    return (
      <div
        ref={ref}
        className={cn(base, variants[variant], className)}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";


