import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ProgressCreateInput } from "@shared/routes";

export function useProgressMeasurements() {
  return useQuery({
    queryKey: [api.progress.list.path],
    queryFn: async () => {
      const res = await fetch(api.progress.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
  });
}

export function useCreateProgressMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProgressCreateInput) => {
      const res = await fetch(api.progress.create.path, {
        method: api.progress.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create progress measurement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.progress.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.profile.get.path] });
    },
  });
}
