import { useState, useRef, useEffect } from "react";

interface AutocompleteProps {
  label?: string;
  placeholder?: string;
  data: any[];
  displayKey: string | number | symbol;
  valueKey: string | number | symbol;
  value: any | null;
  onChange: (item: any) => void;
  onSearch?: (query: string, data: any[]) => any[];
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
  onChange,
  onSearch,
  error,
  renderItem,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim()) {
      if (onSearch) {
        setResults(onSearch(searchTerm, data));
      } else {
        // Default search by displayKey
        const lowerQuery = searchTerm.toLowerCase();
        setResults(
          data.filter((item) =>
            String(item[displayKey]).toLowerCase().includes(lowerQuery),
          ),
        );
      }
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [searchTerm, data, displayKey, onSearch]);

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
          value={searchTerm || (value ? String(value[displayKey]) : "")}
          onChange={(e) => {
            const newValue = e.target.value;
            setSearchTerm(newValue);
            if (newValue === "" && value) {
              onChange(null);
            }
          }}
          onFocus={() => {
            setSearchTerm("");
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
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
          {results.map((item, idx) => (
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
          ))}
        </div>
      )}

      {/* Error message */}
      {error && !value && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
