
import PhoneInputLib from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

export function PhoneInput({ label, value, onChange, required, placeholder = "Enter phone number" }: PhoneInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <div className="flowmart-phone-input-wrapper">
        <PhoneInputLib
          international
          defaultCountry="NG"
          flagUrl="https://flagsapi.com/{XX}/flat/64.png"
          value={value}
          onChange={(v) => onChange(v || '')}
          placeholder={placeholder}
          className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none transition focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary flex items-center gap-2"
        />
      </div>
    </div>
  );
}
