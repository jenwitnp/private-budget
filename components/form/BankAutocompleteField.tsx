import { BankAutocomplete } from "./BankAutocomplete";
import type { ThaiBank } from "@/lib/thaibanks";

interface BankAutocompleteFieldProps {
  label?: string;
  placeholder?: string;
  value: ThaiBank | null;
  onChange: (bank: ThaiBank) => void;
  error?: string;
}

export function BankAutocompleteField({
  label,
  placeholder = "ค้นหาธนาคาร...",
  value,
  onChange,
  error,
}: BankAutocompleteFieldProps) {
  return (
    <div>
      <BankAutocomplete
        label={label}
        placeholder={placeholder}
        value={value?.name || ""}
        onChange={(bank) => onChange(bank)}
      />
      {error && !value && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
