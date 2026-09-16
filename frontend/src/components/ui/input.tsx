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
interface VendorInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  icon?: string | React.ReactNode;
  rightIcon?: React.ReactNode;
  value?: string;
  ref?: React.RefObject<HTMLInputElement>;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isError?: boolean;
}

function VendorInput({
  label = "Label",
  placeholder = "Enter value",
  icon,
  rightIcon,
  value = "",
  ref,
  onChange,
  className = "",
  isError = false,
  ...props
}: VendorInputProps) {
  return (
    <div className="flex flex-col gap-[10px] w-full">
      
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div
        className={cn(
          "flex items-center w-full gap-[10px]",
          isError ? "border-red-500 ring-2 ring-red-500/10" : "border-gray-300",
          "rounded-lg",
          "px-3 py-[14px]",
          "bg-background",
          "transition",
          isError ? "" : "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
        )}
      >
        {/* Left icon — string (mapped) or ReactNode */}
        {icon && (
          typeof icon === "string"
            ? <Icon i={icon} size={16} className="text-muted-foreground" />
            : <span className="text-muted-foreground flex-shrink-0">{icon}</span>
        )}

        <input
          ref={ref}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
             "w-full bg-transparent outline-none text-sm",
             "placeholder:text-muted-foreground",
             value ? "text-foreground font-medium" : "text-muted-foreground",
             className
          )}
          {...props}
        />

        {/* Right icon */}
        {rightIcon && (
          <span className="text-muted-foreground flex-shrink-0 cursor-pointer hover:text-foreground transition">
            {rightIcon}
          </span>
        )}
      </div>
      {isError && (
        <span className="text-xs text-red-500 font-medium -mt-1">
          This field is required
        </span>
      )}
    </div>
  );
}

export { Input, VendorInput, VendorInput as UserInput };