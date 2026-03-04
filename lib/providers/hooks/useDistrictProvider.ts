import { useContext, useMemo } from "react";
import { DistrictContext } from "../contexts/DistrictContext";
import type {
  DistrictData,
  SubDistrictData,
} from "../contexts/DistrictContext";

export function useDistrictProvider() {
  const context = useContext(DistrictContext);

  if (!context) {
    throw new Error("useDistrictProvider must be used within DistrictProvider");
  }

  return context;
}

// Hook for consuming district context
export function useDistricts() {
  const context = useContext(DistrictContext);

  if (!context) {
    throw new Error("useDistricts must be used within DistrictProvider");
  }

  return context;
}

// Hook for getting all districts
export function useAllDistricts() {
  const { districts, isLoading, error } = useDistricts();

  return {
    data: districts,
    districts,
    isLoading,
    error,
  };
}

// Hook for getting sub-districts of a specific district
export function useSubDistrictsByDistrict(districtId: string | null) {
  const { subDistricts } = useDistricts();

  const filtered = useMemo(
    () =>
      districtId
        ? subDistricts.filter((sd) => sd.district_id === districtId)
        : [],
    [subDistricts, districtId],
  );

  return {
    data: filtered,
    ...filtered,
  };
}

// Hook for getting all sub-districts
export function useAllSubDistricts() {
  const { subDistricts } = useDistricts();
  return {
    data: subDistricts,
    ...subDistricts,
  };
}

// Hook for searching districts
export function useSearchDistricts(searchTerm: string) {
  const { districts } = useDistricts();

  const filtered = useMemo(
    () =>
      districts.filter((d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [districts, searchTerm],
  );

  return filtered;
}
