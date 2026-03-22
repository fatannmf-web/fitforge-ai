import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PushSettings {
  notifyWorkout: boolean;
  notifyStreak: boolean;
  notifyAchievement: boolean;
  notifyMotivation: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [isSupported] = useState(
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: settings } = useQuery<PushSettings>({
    queryKey: ["/api/push/settings"],
    enabled: isSubscribed,
  });

  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    }).catch(() => {});
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") { setIsLoading(false); return false; }

      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await fetch("/api/push/vapid-key").then(r => r.json());
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await apiRequest("POST", "/api/push/subscribe", { subscription: sub.toJSON() });
      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiRequest("DELETE", "/api/push/unsubscribe", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    }
    setIsLoading(false);
  }, [isSupported]);

  const sendTest = useMutation({
    mutationFn: () => apiRequest("POST", "/api/push/test", {}),
  });

  const updateSettings = useMutation({
    mutationFn: (s: Partial<PushSettings>) => apiRequest("PATCH", "/api/push/settings", s),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/push/settings"] }),
  });

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    settings,
    subscribe,
    unsubscribe,
    sendTest,
    updateSettings,
  };
}
