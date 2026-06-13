import * as React from "react";
import { cn } from "@/lib/utils";
import Icon from "@/components/Icon";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full h-11 rounded-sm border border-gray-300 bg-background px-3 py-[14px] text-sm text-foreground placeholder:text-muted-foreground outline-none transition",
        "focus:border-primary focus:ring-2 focus:ring-primary/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}

// ------------------------------------------------------------
// UserInput (Design System aligned)
// ------------------------------------------------------------
interface UserInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  icon?: string | React.ReactNode;
  rightIcon?: React.ReactNode;
  value?: string;
  ref?: React.RefObject<HTMLInputElement>;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function UserInput({
  label = "Label",
  placeholder = "Enter value",
  icon,
  rightIcon,
  value = "",
  ref,
  onChange,
  className = "",
  ...props
}: UserInputProps) {
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
          "border border-gray-300 rounded-md",
          "px-3 py-[14px]",
          "bg-background",
          "transition",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
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
    </div>
  );
}

// ------------------------------------------------------------
// VendorInput (legacy compat — delegates to UserInput styling)
// ------------------------------------------------------------
interface VendorInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

function VendorInput({ label, className, ...props }: VendorInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full h-12 rounded-md border border-gray-300 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    </div>
  );
}

export { Input, UserInput, VendorInput };