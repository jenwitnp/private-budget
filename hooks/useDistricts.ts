import { useQuery } from "@tanstack/react-query";
import {
  getDistrictsByProvince,
  getSubDistrictsByDistrict,
  getAllDistricts,
  type District,
  type SubDistrict,
} from "@/server/districts.server";

/**
 * Hook to fetch districts for a specific province
 */
export function useDistrictsByProvince(province: string | null) {
  return useQuery({
    queryKey: ["districts", "province", province],
    queryFn: () => {
      if (!province) throw new Error("Province is required");
      return getDistrictsByProvince(province);
    },
    enabled: !!province,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to fetch sub-districts for a specific district
 */
export function useSubDistrictsByDistrict(districtId: string | null) {
  return useQuery({
    queryKey: ["subDistricts", "district", districtId],
    queryFn: () => {
      if (!districtId) throw new Error("District ID is required");
      return getSubDistrictsByDistrict(districtId);
    },
    enabled: !!districtId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to fetch all districts
 */
export function useAllDistricts() {
  return useQuery({
    queryKey: ["districts", "all"],
    queryFn: getAllDistricts,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}
