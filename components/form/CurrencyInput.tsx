"use client";

import { useState, useEffect } from "react";
import { UseFormRegisterReturn, FieldError } from "react-hook-form";

interface CurrencyInputProps {
  label: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  placeholder?: string;
  required?: boolean;
  prefix?: string;
  decimalsLimit?: number;
  value?: string | number;
}

/** Format a raw numeric string with comma thousands separators, preserving a trailing dot. */
function formatDisplay(raw: string): string {
  if (!raw) return "";
  const dotIdx = raw.indexOf(".");
  const intPart = dotIdx >= 0 ? raw.slice(0, dotIdx) : raw;
  const decPart = dotIdx >= 0 ? raw.slice(dotIdx) : ""; // includes the "."
  const formattedInt = intPart
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : "";
  return formattedInt + decPart;
}

export function CurrencyInput({
  label,
  register,
  error,
  placeholder = "0.00",
  required = false,
  prefix = "฿",
  decimalsLimit = 2,
  value,
}: CurrencyInputProps) {
  const [display, setDisplay] = useState("");

  // Sync when an external value is set (edit pre-fill via reset())
  useEffect(() => {
    const raw = String(value ?? "").replace(/,/g, "");
    if (!raw) {
      setDisplay("");
      return;
    }
    const num = Number(raw);
    if (!isNaN(num)) {
      setDisplay(formatDisplay(raw));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip everything except digits and a single decimal point
    const stripped = e.target.value.replace(/[^0-9.]/g, "");
    const parts = stripped.split(".");
    const clean =
      parts.length > 1
        ? `${parts[0]}.${parts.slice(1).join("").slice(0, decimalsLimit)}`
        : parts[0];

    if (!clean || clean === ".") {
      setDisplay("");
      register.onChange({
        target: { name: register.name, value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
      return;
    }

    setDisplay(formatDisplay(clean));
    // Pass the raw numeric string to RHF — no prefix, no commas
    register.onChange({
      target: { name: register.name, value: clean },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium pointer-events-none select-none">
          {prefix}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={display}
          name={register.name}
          ref={register.ref}
          onBlur={register.onBlur}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full pl-8 py-2.5 pr-4 rounded-lg border-2 focus:outline-none text-slate-800 ${
            error
              ? "border-red-300 focus:border-red-500"
              : "border-slate-200 focus:border-emerald-500"
          }`}
        />
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );
}
