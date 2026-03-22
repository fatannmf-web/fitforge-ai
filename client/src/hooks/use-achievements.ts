import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAllAchievements() {
  return useQuery({
    queryKey: [api.achievements.list.path],
    queryFn: async () => {
      const res = await fetch(api.achievements.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
  });
}

export function useUserAchievements() {
  return useQuery({
    queryKey: [api.achievements.userAchievements.path],
    queryFn: async () => {
      const res = await fetch(api.achievements.userAchievements.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user achievements");
      return res.json();
    },
  });
}
