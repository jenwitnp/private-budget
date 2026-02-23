import { UseFormRegisterReturn, FieldError } from "react-hook-form";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  label: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function Select({
  label,
  register,
  error,
  options,
  placeholder,
  required = false,
  disabled = false,
}: SelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <select
        {...register}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-slate-800 ${
          disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
        } ${
          error
            ? "border-red-300 focus:ring-red-500"
            : "border-slate-200 focus:ring-emerald-500"
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );
}
