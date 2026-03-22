import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useTodayCheckin() {
  return useQuery({
    queryKey: ["/api/checkin/today"],
    queryFn: async () => {
      const res = await fetch("/api/checkin/today", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });
}

export function useCheckinHistory() {
  return useQuery({
    queryKey: ["/api/checkin"],
    queryFn: async () => {
      const res = await fetch("/api/checkin", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useCreateCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      energyLevel: number;
      sleepHours: number;
      stressLevel: number;
      mood: string;
      notes?: string;
    }) => {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save check-in");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkin/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checkin"] });
    },
  });
}

export function useDailyMessage() {
  return useQuery({
    queryKey: ["/api/ai-coach/daily-message"],
    queryFn: async () => {
      const res = await fetch("/api/ai-coach/daily-message", { credentials: "include" });
      if (!res.ok) return { message: "Fiecare pas contează. Continuă!" };
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}
