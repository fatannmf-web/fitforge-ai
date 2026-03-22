import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface PlanInfo {
  plan: "free" | "pro";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export function useSubscription() {
  return useQuery<PlanInfo>({
    queryKey: ["/api/stripe/subscription"],
    staleTime: 60_000,
  });
}

export function useIsPro(): boolean {
  const { data } = useSubscription();
  return data?.plan === "pro";
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (priceId: string): Promise<string> => {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId });
      const data = await res.json();
      return data.url;
    },
    onSuccess: (url) => {
      if (url) window.location.href = url;
    },
  });
}

export function usePortal() {
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const res = await apiRequest("POST", "/api/stripe/portal", {});
      const data = await res.json();
      return data.url;
    },
    onSuccess: (url) => {
      if (url) window.location.href = url;
    },
  });
}
