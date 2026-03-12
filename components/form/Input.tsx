import { UseFormRegisterReturn, FieldError } from "react-hook-form";
import { useState } from "react";

interface InputProps {
  label: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  type?: "text" | "number" | "email" | "password" | "date" | "time";
  placeholder?: string;
  required?: boolean;
  step?: string;
  min?: number | string;
  max?: number | string;
  prefix?: string;
  helperText?: string;
  formatNumber?: boolean;
}

export function Input({
  label,
  register,
  error,
  type = "text",
  placeholder,
  required = false,
  step,
  min,
  max,
  prefix,
  helperText,
  formatNumber = false,
}: InputProps) {
  const [displayValue, setDisplayValue] = useState("");

  const formatNumberWithCommas = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericOnly = value.replace(/[^\d.]/g, "");
    if (!numericOnly) return "";
    // Format with thousand separators
    const [integerPart, decimalPart] = numericOnly.split(".");
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    // Always show 2 decimal places
    const decimals = decimalPart
      ? decimalPart.slice(0, 2).padEnd(2, "0")
      : "00";
    return `${formatted}.${decimals}`;
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formatNumber) {
      const rawValue = e.target.value.replace(/,/g, "");
      const formatted = formatNumberWithCommas(rawValue);
      setDisplayValue(formatted);
      // Update the actual field value without commas
      e.target.value = rawValue;
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-semibold">
            {prefix}
          </span>
        )}

        <input
          {...register}
          type={formatNumber ? "text" : type}
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          value={formatNumber ? displayValue : undefined}
          onChange={(e) => {
            handleFormatChange(e);
            register.onChange?.(e);
          }}
          onBlur={(e) => {
            if (formatNumber && e.target.value) {
              setDisplayValue(formatNumberWithCommas(e.target.value));
            }
            register.onBlur?.(e);
          }}
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-slate-800 ${
            prefix ? "pl-8" : ""
          } ${
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-slate-200 focus:ring-emerald-500"
          }`}
        />
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}
