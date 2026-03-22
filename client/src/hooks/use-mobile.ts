import { useCallback, useRef } from "react";

export function useMobile() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const vibrateSuccess = useCallback(() => vibrate([50, 30, 100]), [vibrate]);
  const vibrateError = useCallback(() => vibrate([200, 100, 200]), [vibrate]);
  const vibrateLight = useCallback(() => vibrate(30), [vibrate]);
  const vibrateHeavy = useCallback(() => vibrate([100, 50, 100, 50, 200]), [vibrate]);

  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch {}
    }
  }, []);

  const share = useCallback(async (data: { title?: string; text?: string; url?: string }) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch {
        return false;
      }
    }
    if (data.url && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(data.url);
        return true;
      } catch {}
    }
    return false;
  }, []);

  const shareWorkout = useCallback(async (workout: { name: string; duration?: number; calories?: number }) => {
    return share({
      title: "FitForge AI - Antrenament completat! 🏋️",
      text: `Am completat "${workout.name}"${workout.duration ? ` în ${workout.duration} min` : ""}${workout.calories ? ` și am ars ${workout.calories} calorii` : ""}! 🔥 Antrenez-te cu mine pe FitForge AI!`,
      url: window.location.origin + "/dashboard",
    });
  }, [share]);

  const shareAchievement = useCallback(async (achievement: { name: string; emoji: string }) => {
    return share({
      title: "FitForge AI - Realizare deblocată! 🏆",
      text: `${achievement.emoji} Am deblocat "${achievement.name}" pe FitForge AI! Vino și tu în comunitate!`,
      url: window.location.origin + "/dashboard",
    });
  }, [share]);

  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;
  const canWakeLock = typeof navigator !== "undefined" && "wakeLock" in navigator;

  return {
    vibrate,
    vibrateSuccess,
    vibrateError,
    vibrateLight,
    vibrateHeavy,
    requestWakeLock,
    releaseWakeLock,
    share,
    shareWorkout,
    shareAchievement,
    canShare,
    canVibrate,
    canWakeLock,
  };
}
