import { useState, useRef, useEffect } from "react";

interface AutocompleteProps {
  label?: string;
  placeholder?: string;
  data: any[];
  displayKey: string | number | symbol;
  valueKey: string | number | symbol;
  value: any | null;
  searchValue?: string; // Current search input value from parent
  onChange: (item: any) => void;
  onInputChange?: (value: string) => void; // Callback when user types in input
  onSearch?: (query: string, data: any[]) => any[];
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  error?: string | null;
  renderItem?: (item: any) => React.ReactNode;
}

export function Autocomplete({
  label,
  placeholder = "ค้นหา...",
  data,
  displayKey,
  valueKey,
  value,
  searchValue = "",
  onChange,
  onInputChange,
  onSearch,
  onKeyDown,
  isLoading = false,
  error,
  renderItem,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Use data prop directly (for fresh API results from parent component)
  const results = data;

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

  const handleSelect = (item: any) => {
    onChange(item);
    setSearchTerm("");
    setIsOpen(false);
  };

  // Open dropdown when results are available or search is active
  useEffect(() => {
    if (searchValue && results.length > 0) {
      setIsOpen(true);
    } else if (!searchValue && !results.length) {
      setIsOpen(false);
    }
  }, [results, searchValue]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {error && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={searchValue || (value ? String(value[displayKey]) : "")}
          onChange={(e) => {
            const newValue = e.target.value;
            // Update parent search input state
            onInputChange?.(newValue);
            // Clear selection if user clears input
            if (newValue === "" && value) {
              onChange(null);
            }
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors pr-10 ${
            error && !value
              ? "border-red-300 focus:ring-red-500"
              : "border-slate-200 focus:ring-emerald-500"
          }`}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setSearchTerm("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
            title="ลบการเลือก"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        ) : (
          <i className="fa-solid fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-center text-slate-500">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              กำลังค้นหา...
            </div>
          ) : results.length > 0 ? (
            results.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors flex items-center justify-between border-b border-slate-100 last:border-b-0"
              >
                <div className="flex-1">
                  {renderItem ? renderItem(item) : String(item[displayKey])}
                </div>
                {value && value[valueKey] === item[valueKey] && (
                  <i className="fa-solid fa-check text-emerald-500"></i>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-slate-500">
              ไม่พบข้อมูล
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && !value && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
