import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type NutritionCreateInput } from "@shared/routes";

export function useNutritionLogs() {
  return useQuery({
    queryKey: [api.nutrition.list.path],
    queryFn: async () => {
      const res = await fetch(api.nutrition.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch nutrition logs");
      return res.json();
    },
  });
}

export function useCreateNutritionLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: NutritionCreateInput) => {
      const res = await fetch(api.nutrition.create.path, {
        method: api.nutrition.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create nutrition log");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.nutrition.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
      queryClient.invalidateQueries({ queryKey: [api.profile.get.path] });
    },
  });
}

export function useAnalyzeNutrition() {
  return useMutation({
    mutationFn: async (description: string) => {
      const res = await fetch(api.nutrition.analyze.path, {
        method: api.nutrition.analyze.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to analyze nutrition");
      return res.json();
    }
  });
}

export function useDeleteNutritionLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.nutrition.delete.path, { id }), {
        method: api.nutrition.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete nutrition log");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.nutrition.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
    },
  });
}
