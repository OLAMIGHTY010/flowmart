import React from 'react';

interface VendorButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  full?: boolean;
}

export default function VendorButton({
  children = 'Continue',
  variant = 'primary',
  full = true,
  className = '',
  ...props
}: VendorButtonProps) {
  const base = `font-body text-base rounded-xl py-4 flex items-center justify-center font-bold transition-all active:scale-[0.98] cursor-pointer ${
    full ? 'w-full' : 'px-6'
  }`;

  const variants = {
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
