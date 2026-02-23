import { UseFormRegisterReturn, FieldError } from "react-hook-form";

interface TextareaProps {
  label: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  helperText?: string;
}

export function Textarea({
  label,
  register,
  error,
  placeholder,
  required = false,
  rows = 3,
  helperText,
}: TextareaProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <textarea
        {...register}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-slate-800 resize-none ${
          error
            ? "border-red-300 focus:ring-red-500"
            : "border-slate-200 focus:ring-emerald-500"
        }`}
      />

      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}
