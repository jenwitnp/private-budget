import { useState, useRef, useEffect } from "react";
import { searchBanks, type ThaiBank } from "@/lib/thaibanks";

interface BankAutocompleteProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (bank: ThaiBank) => void;
  error?: string;
  disableLogo?: boolean;
}

export function BankAutocomplete({
  label,
  placeholder = "ค้นหาธนาคาร...",
  value = "",
  onChange,
  error,
  disableLogo = false,
}: BankAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [results, setResults] = useState<ThaiBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<ThaiBank | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim()) {
      setResults(searchBanks(searchTerm));
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [searchTerm]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (bank: ThaiBank) => {
    setSelectedBank(bank);
    setSearchTerm(bank.name);
    setIsOpen(false);
    onChange?.(bank);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-slate-200 focus:border-emerald-500"
          }`}
        />
        <i className="fa-solid fa-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {results.map((bank) => (
            <button
              key={bank.code}
              type="button"
              onClick={() => handleSelect(bank)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-b-0"
            >
              {!disableLogo && (
                <img
                  src={bank.logo}
                  alt={bank.name}
                  className="w-8 h-8 rounded-full object-contain bg-white border border-slate-100 p-0.5"
                />
              )}
              <div className="text-left flex-1">
                <p className="font-medium text-slate-800 text-sm">
                  {bank.name}
                </p>
                <p className="text-xs text-slate-500">
                  {bank.shortName} • {bank.nameEn}
                </p>
              </div>
              {selectedBank?.code === bank.code && (
                <i className="fa-solid fa-check text-emerald-500"></i>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isOpen && searchTerm && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-4 text-center text-slate-500">
          <i className="fa-solid fa-inbox text-2xl mb-2 block"></i>
          <p className="text-sm">ไม่พบธนาคารที่ค้นหา</p>
        </div>
      )}

      {/* Selected bank display */}
      {selectedBank && (
        <div className="mt-2 flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
          {!disableLogo && (
            <img
              src={selectedBank.logo}
              alt={selectedBank.name}
              className="w-6 h-6 rounded-full object-contain bg-white border border-emerald-200 p-0.5"
            />
          )}
          <span className="text-sm font-medium text-emerald-900">
            {selectedBank.name}
          </span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
          <i className="fa-solid fa-exclamation-circle"></i>
          {error}
        </p>
      )}
    </div>
  );
}
