import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type WorkoutCreateInput } from "@shared/routes";

export function useWorkouts() {
  return useQuery({
    queryKey: [api.workouts.list.path],
    queryFn: async () => {
      const res = await fetch(api.workouts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workouts");
      return res.json();
    },
  });
}

export function useWorkout(id: number) {
  return useQuery({
    queryKey: [api.workouts.get.path, id],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.workouts.get.path, { id }), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workout");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: WorkoutCreateInput) => {
      const res = await fetch(api.workouts.create.path, {
        method: api.workouts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create workout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
    },
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.workouts.complete.path, { id }), {
        method: api.workouts.complete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete workout");
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.workouts.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
      queryClient.invalidateQueries({ queryKey: [api.profile.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.achievements.userAchievements.path] });
    },
  });
}
