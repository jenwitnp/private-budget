"use client";

import { useState, useEffect, useRef } from "react";

export type MemberSearchResult = {
  id: string;
  first_name: string;
  last_name: string;
  level: string;
  district: string | null;
  subdistrict: string | null;
  village_no: number | null;
  house_no: string | null;
  district_id: number | null;
  sub_district_id: number | null;
};

/** Bold the portions of `text` that match any word in `query` */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const words = query.trim().split(/\s+/).filter(Boolean);
  const pattern = words
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const parts = text.split(new RegExp(`(${pattern})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="bg-yellow-200 text-slate-900 not-italic rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

interface MemberAutocompleteProps {
  value: string;
  onChange: (member: MemberSearchResult | null) => void;
  initialMember?: Pick<
    MemberSearchResult,
    "id" | "first_name" | "last_name" | "level" | "district" | "subdistrict"
  > | null;
  disabled?: boolean;
}

export function MemberAutocomplete({
  value,
  onChange,
  initialMember,
  disabled = false,
}: MemberAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<MemberSearchResult | null>(
    initialMember ? (initialMember as MemberSearchResult) : null,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync when form is reset externally
  useEffect(() => {
    if (!value && selected) {
      setSelected(null);
      setQuery("");
    }
  }, [value]);

  // Pre-populate when editing an existing schedule.
  // If the join didn't return name data (Supabase schema cache lag after migration),
  // fall back to fetching the member directly by ID.
  useEffect(() => {
    if (!initialMember?.id) return;

    if (initialMember.first_name) {
      setSelected(initialMember as MemberSearchResult);
      return;
    }

    // Name is missing — fetch full member data by ID
    fetch(`/api/members/${initialMember.id}`)
      .then((r) => r.json())
      .then((data: MemberSearchResult | null) => {
        if (data) setSelected(data);
      })
      .catch(() => {
        // Fallback: show what we have (at least ID + level)
        setSelected(initialMember as MemberSearchResult);
      });
  }, [initialMember?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/members/search?q=${encodeURIComponent(val)}`,
        );
        const data: MemberSearchResult[] = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelect = (member: MemberSearchResult) => {
    setSelected(member);
    setQuery("");
    setIsOpen(false);
    setResults([]);
    onChange(member);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    onChange(null);
  };

  // ── Locked (approved / paid / completed) ───────────────────────────────────
  if (disabled) {
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          ผู้แทน / ผู้รับมอบ
        </label>
        {selected ? (
          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <i className="fa-solid fa-user-check text-slate-400 shrink-0"></i>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-600 truncate">
                {selected.first_name} {selected.last_name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                ระดับ {selected.level}
                {selected.subdistrict && ` · ${selected.subdistrict}`}
                {selected.district && ` · ${selected.district}`}
              </p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded flex items-center gap-1 shrink-0">
              <i className="fa-solid fa-lock"></i>
              ล็อค
            </span>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-400">
            ไม่ได้ระบุผู้แทน
          </div>
        )}
      </div>
    );
  }

  // ── Editable ───────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        ผู้แทน / ผู้รับมอบ
        <span className="ml-2 text-xs font-normal text-slate-500">
          (ไม่บังคับ)
        </span>
      </label>

      {selected ? (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <i className="fa-solid fa-user-check text-emerald-600 shrink-0"></i>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {selected.first_name} {selected.last_name}
              <span className="ml-2 text-xs font-mono px-1.5 py-0.5 bg-emerald-200 text-emerald-800 rounded">
                {selected.level}
              </span>
            </p>
            <p className="text-xs text-slate-500 truncate">
              {[selected.subdistrict, selected.district]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 shrink-0"
            title="ล้างข้อมูล"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder="ค้นหาชื่อ, นามสกุล หรือ ชื่อ นามสกุล"
            className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800 text-sm"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"></i>
          {isLoading && (
            <i className="fa-solid fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          )}
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => handleSelect(member)}
                className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <p className="text-sm font-medium text-slate-800">
                  <HighlightText
                    text={`${member.first_name} ${member.last_name}`}
                    query={query}
                  />
                  <span className="ml-2 text-xs font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {member.level}
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {[
                    member.subdistrict,
                    member.district,
                    member.village_no ? `หมู่ ${member.village_no}` : null,
                    member.house_no ? `บ้านเลขที่ ${member.house_no}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* No results */}
      {isOpen && !isLoading && results.length === 0 && query.trim() && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-center text-sm text-slate-500">
          <i className="fa-solid fa-user-slash mr-2 text-slate-400"></i>
          ไม่พบข้อมูลสมาชิก
        </div>
      )}
    </div>
  );
}
