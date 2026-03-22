import { useLang } from "@/i18n/useLang";
import { EmptyLeaderboardFriends, EmptyLeaderboardCity } from "@/components/EmptyState";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui";
import { Medal, Flame, Trophy, Globe, Users, MapPin, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { getRank } from "@shared/schema";
import { useProfile } from "@/hooks/use-profile";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type LeaderboardType = "global" | "friends" | "city";

const POSITION_STYLES = [
  { bg: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30", text: "text-yellow-400", icon: "🥇" },
  { bg: "from-gray-400/20 to-gray-400/5 border-gray-400/30", text: "text-gray-300", icon: "🥈" },
  { bg: "from-orange-600/20 to-orange-600/5 border-orange-600/30", text: "text-orange-400", icon: "🥉" },
];

const TABS: { type: LeaderboardType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: "global", label: tx.leaderboard.global, icon: Globe, desc: "Top 20 utilizatori din toată lumea" },
  { type: "friends", label: tx.leaderboard.friends, icon: Users, desc: "Utilizatori pe care îi urmărești" },
  { type: "city", label: "Oraș", icon: MapPin, desc: "Top din orașul tău" },
];

function useLeaderboard(type: LeaderboardType) {
  return useQuery({
    queryKey: ["/api/stats/leaderboard", type],
    queryFn: async () => {
      const res = await fetch(`/api/stats/leaderboard?type=${type}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function useFollowing() {
  return useQuery<string[]>({
    queryKey: ["/api/follows"],
    queryFn: async () => {
      const res = await fetch("/api/follows", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export default function LeaderboardPage() {
  const { tx } = useLang();
  const [tab, setTab] = useState<LeaderboardType>("global");
  const { data: leaders = [], isLoading } = useLeaderboard(tab);
  const { data: profile } = useProfile();
  const { data: following = [] } = useFollowing();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const followMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("POST", `/api/follows/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/leaderboard"] });
      toast({ title: "Urmărești acum acest utilizator! 👥" });
    },
    onError: () => toast({ title: "Eroare", description: "Nu s-a putut urmări utilizatorul", variant: "destructive" }),
  });

  const unfollowMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/follows/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/leaderboard"] });
    },
  });

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  const myPosition = leaders.findIndex((l: any) => l.userId === profile?.userId) + 1;
  const currentTab = TABS.find(t => t.type === tab)!;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" /> Clasament
        </h1>
        <p className="text-muted-foreground mt-1">{currentTab.desc}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-muted/40 rounded-xl" data-testid="leaderboard-tabs">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.type}
              onClick={() => setTab(t.type)}
              data-testid={`tab-${t.type}`}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                tab === t.type
                  ? "bg-background text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* My position banner */}
      {myPosition > 0 && !isLoading && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-primary" />
            <p className="font-semibold text-sm">
              Poziția ta: <span className="text-primary font-bold">#{myPosition}</span> din {leaders.length}
            </p>
          </div>
        </Card>
      )}

      {/* Empty state hints */}
      {tab === "friends" && leaders.length === 0 && !isLoading && <EmptyLeaderboardFriends />}

      {tab === "city" && leaders.length === 0 && !isLoading && <EmptyLeaderboardCity />}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Top 3 Podium */}
      {!isLoading && top3.length >= 2 && (
        <div className="grid grid-cols-3 gap-3 items-end max-w-lg mx-auto">
          {[top3[1], top3[0], top3[2]].map((leader, idx) => {
            if (!leader) return <div key={idx} />;
            const podiumIndex = idx === 0 ? 1 : idx === 1 ? 0 : 2;
            const style = POSITION_STYLES[podiumIndex];
            const heights = ["h-28", "h-36", "h-24"];
            return (
              <div
                key={leader.userId}
                className={`flex flex-col items-center justify-end gap-1.5 bg-gradient-to-b ${style.bg} border rounded-2xl p-3 ${heights[idx]}`}
                data-testid={`podium-${podiumIndex + 1}`}
              >
                <span className="text-xl">{style.icon}</span>
                <img
                  src={leader.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.displayName || "U")}&background=random&size=40`}
                  alt={leader.displayName}
                  className="w-9 h-9 rounded-full border-2 border-border"
                />
                <p className={`text-[11px] font-bold ${style.text} truncate w-full text-center`}>{leader.displayName || "FitForger"}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{leader.points || 0} pct</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard */}
      {!isLoading && leaders.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold flex items-center gap-2">
              <Medal className="w-4 h-4 text-primary" /> Clasament complet
            </h3>
          </div>
          <div className="divide-y divide-border/30">
            {leaders.map((leader: any, index: number) => {
              const rank = getRank(leader.points || 0);
              const isMe = leader.userId === profile?.userId;
              const isFollowed = following.includes(leader.userId);
              const isPending = followMutation.isPending || unfollowMutation.isPending;

              return (
                <div
                  key={leader.userId}
                  className={`flex items-center gap-4 p-4 transition-colors ${isMe ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}
                  data-testid={`leaderboard-row-${index}`}
                >
                  <div className="w-8 text-center flex-shrink-0">
                    {index < 3 ? (
                      <span className="text-lg">{POSITION_STYLES[index].icon}</span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>
                  <img
                    src={leader.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.displayName || "U")}&background=random&size=40`}
                    alt={leader.displayName}
                    className="w-10 h-10 rounded-full border border-border flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{leader.displayName || "FitForger"}</p>
                      {isMe && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-medium">Tu</span>}
                      {leader.city && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />{leader.city}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{rank.emoji} {rank.title} • Nivel {leader.level || 1}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-primary text-sm">{leader.points || 0} pct</p>
                      <div className="flex items-center gap-1 justify-end">
                        <Flame className="w-3 h-3 text-accent" />
                        <span className="text-xs text-muted-foreground">{leader.streak || 0}z</span>
                      </div>
                    </div>
                    {!isMe && (
                      <button
                        onClick={() => isFollowed ? unfollowMutation.mutate(leader.userId) : followMutation.mutate(leader.userId)}
                        disabled={isPending}
                        data-testid={`follow-btn-${leader.userId}`}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isFollowed
                            ? "bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                      >
                        {isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isFollowed ? (
                          <><UserMinus className="w-3 h-3" /><span className="hidden sm:inline ml-1">Urmărești</span></>
                        ) : (
                          <><UserPlus className="w-3 h-3" /><span className="hidden sm:inline ml-1">Urmărește</span></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {leaders.length === 0 && !isLoading && tab === "global" && (
        <Card className="p-12 text-center">
          <Medal className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-display font-bold text-lg">Clasamentul e gol</p>
          <p className="text-muted-foreground text-sm mt-1">Fii primul! Completează un antrenament.</p>
        </Card>
      )}
    </div>
  );
}
