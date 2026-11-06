import React, { useRef } from 'react';
import { formatRibuan, parseRibuan } from '../utils/format';

/**
 * Reusable MoneyInput component with automatic dot thousand separators (id-ID)
 * Allows users to input currency/nominal values with real-time dot formatting (e.g., 50.000.000)
 * Returns the raw numeric string to onChange so parent state stores clean numbers.
 */
export const MoneyInput = ({
  value = '',
  onChange,
  placeholder = '0',
  className = '',
  disabled = false,
  required = false,
  id,
  name,
  prefix,
  ...props
}) => {
  const inputRef = useRef(null);
  const displayValue = formatRibuan(value);

  const handleChange = (e) => {
    const input = e.target;
    const rawVal = input.value;
    const selStart = input.selectionStart || 0;

    // Count how many digits existed before the cursor
    const digitsBefore = rawVal.slice(0, selStart).replace(/\D/g, '').length;

    // Cleaned raw numeric string
    const parsed = parseRibuan(rawVal);
    const newFormatted = formatRibuan(parsed);

    if (onChange) {
      onChange(parsed, e);
    }

    // Preserve cursor position across render
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      let digitCount = 0;
      let newCursorPos = newFormatted.length;

      for (let i = 0; i < newFormatted.length; i++) {
        if (/\d/.test(newFormatted[i])) {
          digitCount++;
          if (digitCount >= digitsBefore) {
            newCursorPos = i + 1;
            break;
          }
        }
      }

      if (digitsBefore === 0) {
        newCursorPos = 0;
      }

      try {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      } catch (err) {
        // Safe fallback for browsers/environments that don't support selection on text
      }
    });
  };

  return (
    <div className="relative w-full">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${prefix ? 'pl-9 ' : ''}${className}`}
        {...props}
      />
    </div>
  );
};

