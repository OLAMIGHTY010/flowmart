import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:opacity-90",
        outline:
          "border border-border bg-transparent hover:bg-muted",
        ghost:
          "hover:bg-muted",
        destructive:
          "bg-destructive text-white hover:opacity-90",
      },
      size: {
        default: "h-12 px-4",
        sm: "h-10 px-3",
        lg: "h-14 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// VendorButton – opinionated CTA used across the vendor onboarding flow
// ---------------------------------------------------------------------------
interface VendorButtonProps extends React.ComponentProps<"button"> {
  children?: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  full?: boolean;
}

function VendorButton({
  children = 'Continue',
  variant = 'primary',
  full = true,
  className = '',
  ...props
}: VendorButtonProps) {
  const base = `font-body text-base rounded-xl py-4 flex items-center justify-center font-bold transition-all active:scale-[0.98] cursor-pointer ${
    full ? 'w-full' : 'px-6'
  }`;

  const variants: Record<string, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    outline: 'bg-surface border-2 border-primary text-primary hover:bg-primary/5',
    ghost: 'bg-transparent text-primary hover:bg-muted/50',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export { Button, buttonVariants, VendorButton }
