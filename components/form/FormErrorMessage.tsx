import { FieldError } from "react-hook-form";

interface FormErrorMessageProps {
  error?: string;
}

export function FormErrorMessage({ error }: FormErrorMessageProps) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {error}
    </div>
  );
}
