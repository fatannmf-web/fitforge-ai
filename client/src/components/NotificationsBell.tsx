import { useState } from "react";
import { Bell, BellOff, BellRing, Check, X, Settings, Zap } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const {
    isSupported, isSubscribed, isLoading, permission,
    settings, subscribe, unsubscribe, sendTest, updateSettings
  } = usePushNotifications();

  if (!isSupported) return null;

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) {
      toast({ title: "🔔 Notificări activate!", description: "Vei primi reminder-uri pentru antrenamente și streak." });
    } else if (permission === "denied") {
      toast({ title: "Permisiune refuzată", description: "Activează notificările din setările browserului.", variant: "destructive" });
    }
    setOpen(false);
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
    toast({ title: "Notificări dezactivate", description: "Nu vei mai primi notificări push." });
    setOpen(false);
  };

  const handleTest = async () => {
    await sendTest.mutateAsync({});
    toast({ title: "📨 Test trimis!", description: "Ar trebui să primești o notificare în câteva secunde." });
  };

  const NOTIFY_OPTIONS = [
    { key: "notifyWorkout" as const, label: "Reminder antrenament", emoji: "💪", desc: "Daily workout reminders" },
    { key: "notifyStreak" as const, label: "Alerte streak", emoji: "🔥", desc: "Când streak-ul e în pericol" },
    { key: "notifyAchievement" as const, label: "Realizări deblocate", emoji: "🏆", desc: "Când câștigi un badge" },
    { key: "notifyMotivation" as const, label: "Motivație zilnică", emoji: "⚡", desc: "Mesaje motivaționale" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        data-testid="button-notifications-bell"
        className={cn(
          "relative w-9 h-9 rounded-xl flex items-center justify-center transition-all",
          isSubscribed
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "bg-muted/50 text-muted-foreground hover:bg-muted"
        )}
      >
        {isSubscribed ? (
          <>
            <BellRing className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
          </>
        ) : (
          <Bell className="w-4 h-4" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">Notificări Push</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!isSubscribed ? (
                <>
                  <div className="text-center py-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-semibold text-sm mb-1">Activează notificările</p>
                    <p className="text-xs text-muted-foreground">
                      Primește reminder-uri pentru antrenamente, alerte streak și realizări chiar și când aplicația e închisă.
                    </p>
                  </div>

                  {permission === "denied" ? (
                    <div className="bg-destructive/10 text-destructive text-xs rounded-xl p-3 text-center">
                      Notificările sunt blocate în browser. Mergi la Setări → Site Settings → Notifications.
                    </div>
                  ) : (
                    <button
                      onClick={handleSubscribe}
                      disabled={isLoading}
                      data-testid="button-enable-notifications"
                      className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <BellRing className="w-4 h-4" />
                      )}
                      Activează notificările
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-primary/5 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary">Notificări active</p>
                      <p className="text-xs text-muted-foreground">Primești alerte pe acest dispozitiv</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Settings className="w-3 h-3" /> Tipuri de notificări
                    </p>
                    {NOTIFY_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => updateSettings.mutate({ [opt.key]: !(settings?.[opt.key] ?? true) })}
                        data-testid={`toggle-notify-${opt.key}`}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="text-lg">{opt.emoji}</span>
                        <div className="flex-1">
                          <p className="text-xs font-medium">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                        <div className={cn(
                          "w-9 h-5 rounded-full transition-colors flex items-center",
                          (settings?.[opt.key] ?? true) ? "bg-primary" : "bg-muted"
                        )}>
                          <div className={cn(
                            "w-3.5 h-3.5 rounded-full bg-white shadow transition-transform mx-0.5",
                            (settings?.[opt.key] ?? true) ? "translate-x-4" : "translate-x-0"
                          )} />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <button
                      onClick={handleTest}
                      disabled={sendTest.isPending}
                      data-testid="button-test-notification"
                      className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary bg-primary/10 rounded-xl py-2.5 hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" /> Test
                    </button>
                    <button
                      onClick={handleUnsubscribe}
                      disabled={isLoading}
                      data-testid="button-disable-notifications"
                      className="flex items-center justify-center gap-1.5 text-xs font-medium text-destructive bg-destructive/10 rounded-xl py-2.5 hover:bg-destructive/20 transition-colors"
                    >
                      <BellOff className="w-3.5 h-3.5" /> Dezactivează
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
