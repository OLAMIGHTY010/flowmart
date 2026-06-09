import * as React from "react";
import { cn } from "@/lib/utils";
import Icon from "@/components/Icon";

// Define the interface extending the native HTML input element attributes
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Adding the ? makes className optional so your forms don't crash without it
  className?: string; 
}

function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// VendorInput – branded input with label & optional icon for vendor flows
// ---------------------------------------------------------------------------
interface VendorInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  icon?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function VendorInput({
  label = 'Label',
  placeholder = 'Enter value',
  icon = '',
  value = '',
  onChange,
  className = '',
  ...props
}: VendorInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-body text-foreground font-semibold">{label}</label>
      <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3.5 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        {icon && <Icon i={icon} size={16} className="text-muted-foreground" />}
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-transparent border-none outline-none text-sm font-body p-0 focus:ring-0 focus:outline-none ${
            value ? 'text-foreground font-semibold' : 'text-muted-foreground'
          } ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}

export { Input, VendorInput };