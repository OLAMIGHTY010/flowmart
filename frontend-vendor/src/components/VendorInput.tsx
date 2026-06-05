import React from 'react';
import Icon from './Icon';

interface VendorInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  icon?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function VendorInput({
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
