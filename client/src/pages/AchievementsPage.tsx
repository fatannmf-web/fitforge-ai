import { useLang } from "@/i18n/useLang";
import { EmptyAchievements } from "@/components/EmptyState";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui";
import { Trophy, Lock, Star } from "lucide-react";
import { formatDate } from "@/lib/utils";

function useAchievements() {
  return useQuery({
    queryKey: ["/api/achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function useUserAchievements() {
  return useQuery({
    queryKey: ["/api/achievements/user"],
    queryFn: async () => {
      const res = await fetch("/api/achievements/user", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export default function AchievementsPage() {
  const { tx } = useLang();
  const { data: allAchievements = [], isLoading } = useAchievements();
  const { data: userAchievements = [] } = useUserAchievements();

  const earnedMap = new Map(userAchievements.map((ua: any) => [ua.achievementId, ua]));
  const earned = allAchievements.filter((a: any) => earnedMap.has(a.id));
  const locked = allAchievements.filter((a: any) => !earnedMap.has(a.id));

  if (isLoading) return <div className="animate-pulse p-8 text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">{tx.achievements.title}</h1>
        <p className="text-muted-foreground mt-1">
          Ai deblocat <span className="text-primary font-semibold">{earned.length}</span> din{" "}
          <span className="font-semibold">{allAchievements.length}</span> realizări
        </p>
      </div>

      {/* Progress Bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm">Progres Total</p>
          <p className="text-primary font-bold">{Math.round((earned.length / Math.max(allAchievements.length, 1)) * 100)}%</p>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
            style={{ width: `${(earned.length / Math.max(allAchievements.length, 1)) * 100}%` }}
          />
        </div>
      </Card>

      {/* Earned */}
      {earned.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> {tx.achievements.unlocked} ({earned.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earned.map((a: any) => {
              const ua = earnedMap.get(a.id);
              return (
                <Card key={a.id} className="p-5 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent" data-testid={`achievement-earned-${a.id}`}>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl flex-shrink-0">{a.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold truncate">{a.name}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{a.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-primary font-semibold">+{a.pointsReward} pct</span>
                        {ua && <span className="text-xs text-muted-foreground">• {formatDate(ua.earnedAt)}</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" /> De Deblocat ({locked.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((a: any) => (
              <Card key={a.id} className="p-5 opacity-60" data-testid={`achievement-locked-${a.id}`}>
                <div className="flex items-start gap-4">
                  <div className="text-4xl grayscale flex-shrink-0">{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold truncate">{a.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{a.description}</p>
                    <span className="text-xs text-muted-foreground font-medium mt-2 block">+{a.pointsReward} pct la deblocare</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {allAchievements.length === 0 && <EmptyAchievements />}
    </div>
  );
}
