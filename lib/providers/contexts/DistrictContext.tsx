"use client";

import { createContext, useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAllDistricts,
  getSubDistrictsByDistrict,
} from "@/server/districts.server";
import type { District, SubDistrict } from "@/server/districts.server";

export interface DistrictData {
  id: string;
  name: string;
  province: string;
}

export interface SubDistrictData {
  id: string;
  name: string;
  district_id: string;
}

interface DistrictContextType {
  districts: DistrictData[];
  subDistricts: SubDistrictData[];
  isLoading: boolean;
  error: string | null;
  getSubDistrictsByDistrict: (districtId: string) => SubDistrictData[];
  refetch: () => Promise<void>;
}

export type { DistrictContextType };

export const DistrictContext = createContext<DistrictContextType | undefined>(
  undefined,
);

interface DistrictProviderProps {
  children: React.ReactNode;
  initialDistricts?: DistrictData[];
  initialSubDistricts?: SubDistrictData[];
}

interface FetchDistrictsResponse {
  districts: DistrictData[];
  subDistricts: SubDistrictData[];
}

async function fetchDistricts(): Promise<FetchDistrictsResponse> {
  const districts = await getAllDistricts();

  // Fetch all sub-districts by getting them for each district
  const subDistrictsByDistrict = await Promise.all(
    districts.map((d: District) => getSubDistrictsByDistrict(d.id)),
  );

  const allSubDistricts = subDistrictsByDistrict.flat();

  return {
    districts: districts.map((d: District) => ({
      id: d.id,
      name: d.name,
      province: d.province,
    })),
    subDistricts: allSubDistricts.map((sd: SubDistrict) => ({
      id: sd.id,
      name: sd.name,
      district_id: sd.district_id,
    })),
  };
}

export function DistrictProvider({
  children,
  initialDistricts = [],
  initialSubDistricts = [],
}: DistrictProviderProps) {
  const [districts, setDistricts] = useState<DistrictData[]>(initialDistricts);
  const [subDistricts, setSubDistricts] =
    useState<SubDistrictData[]>(initialSubDistricts);
  const [error, setError] = useState<string | null>(null);

  // Use React Query for caching
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<FetchDistrictsResponse>({
    queryKey: ["districts"],
    queryFn: fetchDistricts,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Update state when query data changes
  useEffect(() => {
    if (data) {
      setDistricts(data.districts);
      setSubDistricts(data.subDistricts);
      setError(null);
    } else if (queryError) {
      setError(
        queryError instanceof Error ? queryError.message : "Unknown error",
      );
    }
  }, [data, queryError]);

  const getSubDistrictsByDistrict = useCallback(
    (districtId: string): SubDistrictData[] => {
      return subDistricts.filter((sd) => sd.district_id === districtId);
    },
    [subDistricts],
  );

  const value: DistrictContextType = {
    districts,
    subDistricts,
    isLoading,
    error,
    getSubDistrictsByDistrict,
    refetch: async () => {
      await refetch();
    },
  };

  return (
    <DistrictContext.Provider value={value}>
      {children}
    </DistrictContext.Provider>
  );
}
