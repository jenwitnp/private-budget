import { useQuery } from "@tanstack/react-query";

interface StatsResponse {
  pending: number;
  approved: number;
  rejected: number;
  paid: number;
}

interface UseTransactionStatsParams {
  search?: string;
  categoryId?: string;
  districtId?: string;
  subDistrictId?: string;
  dateStart?: string;
  dateEnd?: string;
}

export function useTransactionStats(params: UseTransactionStatsParams) {
  return useQuery({
    queryKey: [
      "transaction-stats",
      params.search,
      params.categoryId,
      params.districtId,
      params.subDistrictId,
      params.dateStart,
      params.dateEnd,
    ],
    queryFn: async (): Promise<StatsResponse> => {
      const queryParams = new URLSearchParams();

      if (params.search) queryParams.append("search", params.search);
      if (params.categoryId)
        queryParams.append("categoryId", params.categoryId);
      if (params.districtId)
        queryParams.append("districtId", params.districtId);
      if (params.subDistrictId)
        queryParams.append("subDistrictId", params.subDistrictId);
      if (params.dateStart) queryParams.append("dateStart", params.dateStart);
      if (params.dateEnd) queryParams.append("dateEnd", params.dateEnd);

      const response = await fetch(
        `/api/transaction-stats?${queryParams.toString()}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch transaction stats: ${response.status}`,
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch stats");
      }

      return data.data;
    },
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 30 * 1000, // 30 seconds (formerly cacheTime)
  });
}
