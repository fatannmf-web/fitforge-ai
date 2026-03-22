import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/use-profile";
import { useDashboardStats } from "@/hooks/use-stats";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Zap, Flame, Swords, ChevronRight, Plus, Play, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getRank } from "@shared/schema";
import { useLang } from "@/i18n/useLang";

interface TodayChallenge {
  id: number;
  exercise: string;
  targetReps: number;
  emoji: string;
  globalReps: number;
  pointsReward: number;
}

interface MyProgress {
  repsCompleted: number;
  completed: boolean;
}

interface ActiveBattle {
  battle: { id: number; status: string };
  challenge: { exercise: string; targetReps: number };
  creator: { profile: { displayName: string | null }; progress: { repsCompleted: number } | null };
  opponent: { profile: { displayName: string | null }; progress: { repsCompleted: number } | null } | null;
}

function getGreeting(tx: any) {
  const h = new Date().getHours();
  if (h < 12) return tx.greeting.morning;
  if (h < 17) return tx.greeting.afternoon;
  return tx.greeting.evening;
}

function XpBadge({ xp, visible }: { xp: number; visible: boolean }) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 0], y: [0, -20, -40, -60], scale: [0.5, 1.2, 1, 0.8] }}
      transition={{ duration: 1.2, times: [0, 0.25, 0.7, 1] }}
      className="absolute top-2 right-4 z-20 text-primary font-black text-lg pointer-events-none"
    >
      +{xp} XP ⚡
    </motion.div>
  );
}

const QUICK_PREVIEW = [
  { icon: "🦵", text: "20 Squats" },
  { icon: "💪", text: "10 Push-ups" },
  { icon: "🧘", text: "30s Plank" },
];

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const { tx } = useLang();
  const { data: stats } = useDashboardStats();
  const { toast } = useToast();
  const [xpVisible, setXpVisible] = useState(false);
  const [xpAmount] = useState(10);

  const { data: challenge } = useQuery<TodayChallenge>({
    queryKey: ["/api/challenge/today"],
    staleTime: 1000 * 60 * 5,
  });

  const { data: myProgress, refetch: refetchProgress } = useQuery<MyProgress>({
    queryKey: ["/api/challenge/my-progress"],
    enabled: !!challenge,
    staleTime: 0,
  });

  const { data: activeBattle } = useQuery<ActiveBattle | null>({
    queryKey: ["/api/challenge/active-battle"],
    staleTime: 1000 * 30,
  });

  const addRepsMutation = useMutation({
    mutationFn: (reps: number) => apiRequest("POST", "/api/challenge/progress", { reps }),
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/challenge/my-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenge/today"] });
      setXpVisible(true);
      setTimeout(() => setXpVisible(false), 1400);
      if (data.justCompleted) {
        toast({ title: "🎉 Challenge Completat!", description: `+${challenge?.pointsReward} XP câștigat!` });
      }
    },
  });

  const firstName = profile?.displayName?.split(" ")[0] || "Champion";
  const streak = stats?.currentStreak ?? 0;
  const rank = getRank(profile?.points || 0);
  const userReps = myProgress?.repsCompleted ?? 0;
  const targetReps = challenge?.targetReps ?? 100;
  const userPct = Math.min((userReps / targetReps) * 100, 100);
  const isCompleted = myProgress?.completed ?? false;

  const myBattleReps = activeBattle?.creator?.progress?.repsCompleted ?? 0;
  const opponentReps = activeBattle?.opponent?.progress?.repsCompleted ?? 0;
  const opponentName = activeBattle?.opponent?.profile?.displayName ?? "Opponent";
  const battleTarget = activeBattle?.challenge?.targetReps ?? 100;
  const myBattlePct = Math.min((myBattleReps / battleTarget) * 100, 100);
  const opponentPct = Math.min((opponentReps / battleTarget) * 100, 100);
  const myLead = myBattleReps - opponentReps;

  return (
    <div className="space-y-4 pb-4 animate-in fade-in duration-300">

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between pt-1"
      >
        <div>
          <p className="text-muted-foreground text-sm font-medium">{getGreeting(tx)},</p>
          <h1 className="text-2xl font-black text-foreground leading-tight" data-testid="text-greeting">
            {firstName} {rank.emoji}
          </h1>
        </div>
        <Link href="/profile">
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-2xl border cursor-pointer transition-all",
            streak > 0
              ? "bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20"
              : "bg-secondary border-border hover:bg-secondary/80"
          )}>
            <span className={cn("text-lg", streak > 0 && "flame-animate")}>🔥</span>
            <span className={cn("font-black text-sm", streak > 0 ? "text-orange-400" : "text-muted-foreground")}>
              {streak} Day Streak
            </span>
          </div>
        </Link>
      </motion.div>

      {/* ── AI COACH CARD ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }}>
        <Link href="/ai-coach">
          <div className="relative rounded-2xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/20 p-4 cursor-pointer hover:border-accent/40 transition-all group">
            <div className="absolute top-3 right-3">
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-xs font-bold text-accent uppercase tracking-widest mb-0.5">AI Coach</div>
                <p className="text-sm font-semibold text-foreground">Ready for today's training?</p>
                {activeBattle?.opponent ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {myLead > 0
                      ? `You're ahead of ${opponentName} by ${myLead} reps! Keep going 🔥`
                      : myLead < 0
                      ? `${opponentName} is ahead — close the gap! ⚔️`
                      : `Tied with ${opponentName}! Push harder 💪`
                    }
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {streak > 0 ? `${streak} day streak — don't break it!` : "Start your training journey today"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── QUICK START CARD (HERO) ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/8 to-accent/5 border border-primary/25 p-5">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-primary/15 to-transparent rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-black text-primary uppercase tracking-widest">Quick Start</span>
            </div>
            <p className="text-lg font-black text-foreground mb-3">2 minute workout</p>
            <div className="space-y-1.5 mb-4">
              {QUICK_PREVIEW.map((ex, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                  <span>{ex.icon}</span>
                  <span>{ex.text}</span>
                </div>
              ))}
            </div>
            <Link href="/workouts">
              <button
                data-testid="button-quick-start"
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-base tracking-wide hover:opacity-90 transition-all btn-glow flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                START
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── GLOBAL CHALLENGE CARD ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-4">
          <XpBadge xp={xpAmount} visible={xpVisible} />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Global Challenge</span>
            </div>
            <Link href="/challenges">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">See all →</span>
            </Link>
          </div>

          {challenge ? (
            <>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xl">{challenge.emoji}</span>
                <span className="text-xl font-black text-foreground uppercase">{challenge.targetReps} {challenge.exercise}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Your progress</span>
                <span className={cn("font-bold", isCompleted ? "text-green-400" : "text-foreground")}>
                  {userReps} / {targetReps} {isCompleted && "✓"}
                </span>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden mb-3">
                <motion.div
                  className={cn("h-full rounded-full", isCompleted ? "bg-green-400" : "bg-gradient-to-r from-orange-400 to-primary")}
                  initial={{ width: 0 }}
                  animate={{ width: `${userPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Global progress</div>
                  <div className="text-sm font-bold text-foreground">
                    {challenge.globalReps.toLocaleString()} completed
                  </div>
                </div>
                {!isCompleted ? (
                  <button
                    data-testid="button-add-reps-dashboard"
                    onClick={() => addRepsMutation.mutate(10)}
                    disabled={addRepsMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400 font-bold text-sm hover:bg-orange-500/25 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    +10 Reps
                  </button>
                ) : (
                  <Link href="/challenges">
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/25 text-green-400 font-bold text-sm cursor-pointer hover:bg-green-500/25 transition-colors">
                      Done! 🎉
                    </div>
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading challenge...</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── BATTLE CARD ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
        {activeBattle?.opponent ? (
          <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Swords className="w-4 h-4 text-red-400" />
              <span className="text-xs font-black text-red-400 uppercase tracking-widest">Battle</span>
              <span className="ml-auto text-xs text-muted-foreground">{activeBattle.challenge.exercise}</span>
            </div>

            <div className="space-y-3">
              {/* YOU */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-black text-primary">YOU</span>
                  <span className="text-sm font-bold text-foreground">{myBattleReps} reps</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${myBattlePct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="text-center text-xs font-black text-muted-foreground tracking-widest">VS</div>

              {/* OPPONENT */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-black text-accent">{opponentName.toUpperCase()}</span>
                  <span className="text-sm font-bold text-foreground">{opponentReps} reps</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${opponentPct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 text-center text-xs font-semibold text-muted-foreground">
              {myLead > 0 && <span className="text-green-400">You're ahead by {myLead} reps 🔥</span>}
              {myLead < 0 && <span className="text-red-400">You're behind by {Math.abs(myLead)} reps — catch up! ⚡</span>}
              {myLead === 0 && <span className="text-yellow-400">It's a tie! Push harder 💪</span>}
            </div>
          </div>
        ) : (
          <Link href="/challenges">
            <div className="rounded-2xl bg-gradient-to-br from-red-500/8 to-orange-500/5 border border-red-500/15 p-4 cursor-pointer hover:border-red-500/30 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Swords className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-black text-red-400 uppercase tracking-widest mb-0.5">Battle</div>
                  <p className="text-sm font-semibold text-foreground">No active battle</p>
                  <p className="text-xs text-muted-foreground">Challenge a friend to beat today's exercise</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
              </div>
            </div>
          </Link>
        )}
      </motion.div>

      {/* ── RANK PROGRESS ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.3 }}>
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{rank.emoji}</span>
              <div>
                <p className="font-bold text-sm text-foreground">{rank.title}</p>
                <p className="text-xs text-muted-foreground">Level {profile?.level || 1} · {(profile?.points || 0).toLocaleString()} XP</p>
              </div>
            </div>
            <div className="text-right text-xs">
              <p className="text-muted-foreground">Next: {rank.next}</p>
              <p className="text-primary font-semibold">{Math.max(0, rank.nextPoints - (profile?.points || 0))} to go</p>
            </div>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, ((profile?.points || 0) / rank.nextPoints) * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

    </div>
  );
}
