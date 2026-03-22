import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CommunityPostInput } from "@shared/routes";

export function useCommunityPosts() {
  return useQuery({
    queryKey: [api.community.list.path],
    queryFn: async () => {
      const res = await fetch(api.community.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch community posts");
      return res.json();
    },
  });
}

export function useCreateCommunityPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CommunityPostInput) => {
      const res = await fetch(api.community.create.path, {
        method: api.community.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.community.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.profile.get.path] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isLiked }: { id: number; isLiked: boolean }) => {
      const path = buildUrl(isLiked ? api.community.unlike.path : api.community.like.path, { id });
      const method = isLiked ? api.community.unlike.method : api.community.like.method;
      
      const res = await fetch(path, { method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to toggle like");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.community.list.path] });
    },
  });
}
