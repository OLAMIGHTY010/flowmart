import React, { useRef, useState, useEffect } from "react";

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
}

export default function OtpInput({
  length = 6,
  onComplete,
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    const combined = newOtp.join("");

    if (combined.length === length && !newOtp.includes("")) {
      onComplete(combined);
    }

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      const newOtp = [...otp];

      if (newOtp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft") {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight") {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");

    const newOtp = [...otp];

    pasted.split("").forEach((char, i) => {
      if (i < length) newOtp[i] = char;
    });

    setOtp(newOtp);

    if (newOtp.join("").length === length) {
      onComplete(newOtp.join(""));
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              if (el) inputRefs.current[i] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            maxLength={1}
            inputMode="numeric"
            className="
              h-14
              w-12
              sm:h-16
              sm:w-14
              rounded-xl
              border
              border-border
              bg-background
              text-center
              text-xl
              font-bold
              text-foreground
              shadow-sm
              transition-all
              outline-none
              focus:border-primary
              focus:ring-4
              focus:ring-primary/10
            "
          />
        ))}
      </div>
    </div>
  );
}