import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "gold";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Quando true, estiliza o único filho (ex.: <Link>) em vez de renderizar <button>. */
  asChild?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-nero text-crema hover:bg-champagne hover:text-nero",
  gold: "bg-champagne text-nero hover:brightness-105",
  outline: "border border-nero/30 text-nero hover:border-champagne-deep hover:text-champagne-deep",
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", asChild, children, ...props }, ref) => {
    const classes = cn(base, variants[variant], className);
    if (asChild && React.isValidElement<{ className?: string }>(children)) {
      return React.cloneElement(children, {
        className: cn(classes, children.props.className),
      });
    }
    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

