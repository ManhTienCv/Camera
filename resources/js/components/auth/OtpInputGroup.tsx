import React, { useRef, useEffect } from 'react';

export interface OtpInputGroupProps {
  values: string[];
  onChange: (values: string[]) => void;
  autoFocus?: boolean;
}

export const OtpInputGroup: React.FC<OtpInputGroupProps> = ({
  values,
  onChange,
  autoFocus = false,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...values];
    next[index] = digit;
    onChange(next);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...values];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    onChange(next);

    const nextFocusIndex = Math.min(pasted.length, 5);
    inputsRef.current[nextFocusIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-1.5 sm:gap-2" onPaste={handlePaste}>
      {values.map((val, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputsRef.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          className="w-8 h-10 sm:w-9 sm:h-11 text-center font-mono font-bold text-base sm:text-lg bg-cream-50/70 dark:bg-ink-800/80 border-2 border-cream-200 dark:border-ink-700 rounded-xl focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/20 text-ink-900 dark:text-cream-100 transition-all shadow-2xs"
        />
      ))}
    </div>
  );
};
