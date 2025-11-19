import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary)] text-white shadow-[0_18px_35px_rgba(37,99,235,0.3)] hover:bg-[var(--color-primary-strong)]",
        secondary:
          "border border-[var(--color-border-strong)] bg-white/90 text-[var(--color-foreground)] hover:bg-white hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]",
        ghost:
          "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]",
        danger:
          "bg-[var(--color-danger)] text-white shadow-[0_18px_35px_rgba(239,68,68,0.25)] hover:bg-[#dc2626]",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-3 text-base",
        icon: "h-10 w-10 rounded-full p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
