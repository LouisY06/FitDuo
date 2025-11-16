import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "default" | "sm";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-black";

    const variants: Record<ButtonProps["variant"], string> = {
      default:
        "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.7)]",
      outline:
        "border border-emerald-300/60 bg-transparent text-emerald-100 hover:bg-emerald-400/10",
    };

    const sizes: Record<ButtonProps["size"], string> = {
      default: "h-9 px-4 py-2",
      sm: "h-7 px-3 text-xs",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";


