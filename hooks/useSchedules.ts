import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  getSchedulesByMonth,
  getSchedulesByDate,
  getUpcomingSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  type Schedule,
  type CreateScheduleInput,
  type UpdateScheduleInput,
} from "@/server/schedule.server";

export function useSchedulesByMonth(year: number, month: number) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  return useQuery({
    queryKey: ["schedules", "month", year, month, userId],
    queryFn: () =>
      userId
        ? getSchedulesByMonth(userId, year, month).then((res) => res.data || [])
        : Promise.resolve([]),
    enabled: !!userId,
  });
}

export function useSchedulesByDate(date: string) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  return useQuery({
    queryKey: ["schedules", "date", date, userId],
    queryFn: () =>
      userId
        ? getSchedulesByDate(userId, date).then((res) => res.data || [])
        : Promise.resolve([]),
    enabled: !!userId,
  });
}

export function useUpcomingSchedules(daysAhead: number = 7) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  return useQuery({
    queryKey: ["schedules", "upcoming", daysAhead, userId],
    queryFn: () =>
      userId
        ? getUpcomingSchedules(userId, daysAhead).then((res) => res.data || [])
        : Promise.resolve([]),
    enabled: !!userId,
  });
}

export function useCreateSchedule() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateScheduleInput) => {
      return userId
        ? createSchedule(userId, input)
        : Promise.reject("No user ID available");
    },
    onSuccess: (res) => {
      if (res.success) {
        // Invalidate all schedule queries to force refetch
        queryClient.invalidateQueries({
          queryKey: ["schedules"],
          refetchType: "all", // Refetch all schedule queries, including inactive ones
        });
      }
    },
  });
}

export function useUpdateSchedule(scheduleId: string) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateScheduleInput) => {
      return userId
        ? updateSchedule(userId, scheduleId, input)
        : Promise.reject("No user ID available");
    },
    onSuccess: (res) => {
      if (res.success) {
        // Invalidate all schedule queries and refetch immediately
        queryClient.invalidateQueries({
          queryKey: ["schedules"],
          refetchType: "all", // Refetch all schedule queries, including inactive ones
        });
      }
    },
  });
}

export function useDeleteSchedule() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) =>
      userId ? deleteSchedule(userId, scheduleId) : Promise.reject("No user"),
    onSuccess: (res) => {
      if (res.success) {
        // Invalidate all schedule queries and refetch immediately
        queryClient.invalidateQueries({
          queryKey: ["schedules"],
          refetchType: "all",
        });
      }
    },
  });
}

/**
 * Search schedules with debounce
 * Queries fresh data directly from API endpoint for autocomplete
 */
export function useScheduleSearch(query: string) {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Query fresh data directly from API endpoint
        const searchParams = new URLSearchParams({ q: query });
        const response = await fetch(
          `/api/schedules/search?${searchParams.toString()}`,
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setResults(data.data);
        } else {
          setError("Failed to parse search results");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [query]);

  return { results, isLoading, error };
}
