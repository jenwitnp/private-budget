import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
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
      console.log("\n=== useCreateSchedule mutation called ===");
      console.log("User ID:", userId);
      console.log("Input:", input);
      return userId
        ? createSchedule(userId, input)
        : Promise.reject("No user ID available");
    },
    onSuccess: (res) => {
      console.log("✅ Mutation success:", res);
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ["schedules"],
        });
      } else {
        console.error("❌ Mutation returned error:", res.error);
      }
    },
    onError: (err) => {
      console.error("❌ Mutation error:", err);
    },
  });
}

export function useUpdateSchedule(scheduleId: string) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateScheduleInput) => {
      console.log("\n=== useUpdateSchedule mutation called ===");
      console.log("Schedule ID:", scheduleId);
      console.log("User ID:", userId);
      console.log("Input:", input);
      return userId
        ? updateSchedule(userId, scheduleId, input)
        : Promise.reject("No user ID available");
    },
    onSuccess: (res) => {
      console.log("✅ Update mutation success:", res);
      if (res.success) {
        console.log("🔄 Invalidating schedule queries and refetching...");
        // Invalidate all schedule queries and refetch immediately
        queryClient.invalidateQueries({
          queryKey: ["schedules"],
        });
      } else {
        console.error("❌ Update returned error:", res.error);
      }
    },
    onError: (err) => {
      console.error("❌ Update mutation error:", err);
    },
  });
}

export function useDeleteSchedule(scheduleId: string) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      userId ? deleteSchedule(userId, scheduleId) : Promise.reject("No user"),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ["schedules"],
        });
      }
    },
  });
}
