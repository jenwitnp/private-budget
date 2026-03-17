import { useQuery } from "@tanstack/react-query";
import { fetchScheduleImagesAction } from "@/actions/schedule-images";

export function useScheduleImages(scheduleId: string | number) {
  return useQuery({
    queryKey: ["schedule-images", scheduleId.toString()],
    queryFn: async () => {
      const result = await fetchScheduleImagesAction(scheduleId);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch images");
      }
      return result.images || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!scheduleId,
  });
}
