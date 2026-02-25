import CurrencyInputLibrary from "react-currency-input-field";
import { UseFormRegisterReturn, FieldError } from "react-hook-form";
import { useRef } from "react";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleValueChange = (value: string | undefined) => {
    // This is the actual numeric value from the library (without formatting/prefix)
    const numericValue = value ? parseFloat(value) : 0;

    if (inputRef.current) {
      // Update the actual input value with numeric only
      inputRef.current.value = numericValue.toString();

      // Trigger onChange for React Hook Form
      const event = new Event("change", { bubbles: true });
      Object.defineProperty(event, "target", {
        writable: false,
        value: inputRef.current,
      });
      inputRef.current.dispatchEvent(event);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <CurrencyInputLibrary
        ref={inputRef}
        onValueChange={handleValueChange}
        prefix={prefix}
        placeholder={placeholder}
        decimalsLimit={decimalsLimit}
        decimalSeparator="."
        groupSeparator=","
        value={value}
        {...register}
        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-slate-800 pl-4 ${
          error
            ? "border-red-300 focus:ring-red-500"
            : "border-slate-200 focus:ring-emerald-500"
        }`}
      />

      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );
}
