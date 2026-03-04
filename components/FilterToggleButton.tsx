export interface FilterToggleButtonProps {
  isExpanded: boolean;
  onClick: () => void;
  filters: {
    searchTerm: string;
    statusFilter: string;
    dateStart: string;
    dateEnd: string;
    categoryId: string;
    districtId: string;
    subDistrictId: string;
  };
}

export function FilterToggleButton({
  isExpanded,
  onClick,
  filters,
}: FilterToggleButtonProps) {
  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "statusFilter") {
      return value !== "all";
    }
    return value !== "";
  }).length;

  return (
    <div className="relative md:hidden">
      <button
        onClick={onClick}
        className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
          isExpanded
            ? "bg-emerald-600 text-white shadow-md"
            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
        }`}
      >
        <i className={`fas fa-${isExpanded ? "times" : "sliders-h"}`}></i>
        <span className="text-sm">{isExpanded ? "ปิด" : "ตัวกรอง"}</span>
      </button>

      {/* Filter Count Badge */}
      {activeFilterCount > 0 && (
        <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
          {activeFilterCount > 9 ? "9+" : activeFilterCount}
        </div>
      )}
    </div>
  );
}
