import { useLang } from "@/i18n/useLang";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { fetchTodayPlan, addChallengeReps, type TodayPlanData } from "@/api/todayPlan";
import { Play, Flame, Clock, Dumbbell, ChevronDown, ChevronUp, Check, Zap, Menu } from "lucide-react";

// ── Greeting ────────────────────────────────────────────────────────────────
function getGreeting(tx: any) {
  const h = new Date().getHours();
  if (h < 12) return tx.greeting.morning;
  if (h < 17) return tx.greeting.afternoon;
  return tx.greeting.evening;
}

// ── Coach message ────────────────────────────────────────────────────────────
function getCoachMsg(streak: number, challengePct: number): string {
  if (streak >= 7) return `${streak} zile consecutiv. Ești de neoprit. 🔥`;
  if (streak >= 3) return `Streak de ${streak} zile activ. Nu rupe lanțul! 💪`;
  if (challengePct > 0 && challengePct < 100) return `Ești ${challengePct}% din provocarea zilei. Termină-o! ⚡`;
  if (streak === 0) return "Azi e ziua ta. Fă prima mișcare. 🎯";
  return "Antrenamentul de azi te aduce mai aproape de obiectiv.";
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#0B0F1A" }}>
      <div className="flex-1 px-5 pt-14 space-y-4 animate-pulse">
        <div className="h-10 rounded-2xl bg-white/5 w-2/3" />
        <div className="h-5 rounded-xl bg-white/5 w-1/2" />
        <div className="h-52 rounded-3xl bg-white/5 mt-6" />
        <div className="h-24 rounded-2xl bg-white/5" />
      </div>
      <div className="px-5 pb-10">
        <div className="h-16 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

// ── Exercise thumbnail row ────────────────────────────────────────────────────
function ExerciseList({ exercises }: { exercises: TodayPlanData["workout"]["exercises"] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? exercises : exercises.slice(0, 3);

  return (
    <div>
      <div className="space-y-2">
        {shown.map((ex, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 py-2 border-b last:border-0"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              {ex.thumbnail ? (
                <img src={ex.thumbnail} alt={ex.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-white/20" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
              <p className="text-xs text-white/35">{ex.sets} seturi × {ex.reps} rep</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(0,255,163,0.1)", color: "#00FFA3" }}>
              {ex.sets}×{ex.reps}
            </span>
          </motion.div>
        ))}
      </div>
      {exercises.length > 3 && (
        <button onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 pt-2 text-xs font-bold text-white/30 hover:text-white/60 transition-colors">
          {expanded ? <><ChevronUp className="w-3 h-3" />Ascunde</> : <><ChevronDown className="w-3 h-3" />{exercises.length - 3} mai mult</>}
        </button>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TodayPlanPage() {
  const { tx } = useLang();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [challengeInput, setChallengeInput] = useState("10");
  const [showChallenge, setShowChallenge] = useState(false);

  const { data: plan, isLoading } = useQuery<TodayPlanData>({
    queryKey: ["/api/today-plan"],
    queryFn: fetchTodayPlan,
    staleTime: 0,
  });

  const addRepsMutation = useMutation({
    mutationFn: (reps: number) => addChallengeReps(reps),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/today-plan"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenge/my-progress"] });
      if (data.justCompleted) {
        toast({ title: "🎉 Provocare completă!", description: `+${plan?.challenge?.target ?? 100} XP câștigat!` });
      }
    },
    onError: () => {
      toast({ title: "Eroare", description: "Încearcă din nou.", variant: "destructive" });
    },
  });

  if (isLoading) return <Skeleton />;
  if (!plan) return null;

  const { workout, challenge, streak, name } = plan;
  const challengePct = challenge ? Math.round((challenge.progress / challenge.target) * 100) : 0;
  const challengeDone = challenge?.completed ?? false;

  const handleStart = () => {
    if (workout.workoutId) navigate(`/workout/play?id=${workout.workoutId}`);
    else navigate("/workouts");
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-y-auto" style={{ background: "#0B0F1A" }}>

      {/* ── Top nav bar ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          data-testid="button-nav-menu"
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          <Menu size={20} color="rgba(255,255,255,0.7)" />
        </button>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
          Planul Zilei
        </span>
        <div className="w-10" />
      </div>

      {/* ── Scroll content ── */}
      <div className="flex-1 px-5 pt-3 pb-4 space-y-4 min-h-0">

        {/* GREETING + STREAK */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/40">{getGreeting(tx)},</p>
            <h1 className="text-3xl font-black text-white leading-tight" data-testid="text-today-greeting">
              {name} 👋
            </h1>
          </div>
          <motion.div
            animate={streak > 0 ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="flex flex-col items-center px-3.5 py-2 rounded-2xl"
            style={{
              background: streak > 0 ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${streak > 0 ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.08)"}`,
            }}>
            <span className="text-xl">{streak > 0 ? "🔥" : "💤"}</span>
            <span className="text-sm font-black mt-0.5" style={{ color: streak > 0 ? "#fb923c" : "rgba(255,255,255,0.3)" }}>
              {streak}z
            </span>
          </motion.div>
        </motion.div>

        {/* AI COACH MESSAGE */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="flex items-start gap-2.5 rounded-2xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
            style={{ background: "rgba(0,255,163,0.12)", border: "1px solid rgba(0,255,163,0.2)" }}>
            <Zap className="w-3.5 h-3.5" style={{ color: "#00FFA3" }} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-0.5">AI Coach</p>
            <p className="text-sm text-white/70 leading-snug" data-testid="coach-message">
              {getCoachMsg(streak, challengePct)}
            </p>
          </div>
        </motion.div>

        {/* WORKOUT CARD */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

          {/* Card header */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(0,255,163,0.12)" }}>
                <Zap className="w-3.5 h-3.5" style={{ color: "#00FFA3" }} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Antrenamentul de azi
              </span>
            </div>

            <h2 className="text-xl font-black text-white mb-2 leading-tight">{workout.title}</h2>

            <div className="flex items-center gap-3 text-xs text-white/35 mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />{workout.duration}
              </span>
              <span className="flex items-center gap-1 capitalize">
                <Dumbbell className="w-3.5 h-3.5" />{workout.muscle}
              </span>
              {workout.exercises?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />{workout.exercises.length} exerciții
                </span>
              )}
            </div>

            {/* Exercises */}
            {workout.exercises?.length > 0 && (
              <ExerciseList exercises={workout.exercises} />
            )}
          </div>
        </motion.div>

        {/* CHALLENGE (secondary, collapsed) */}
        {challenge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
            <button onClick={() => setShowChallenge(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              data-testid="button-challenge-toggle">
              <span className="text-xl">{challenge.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white/50">Provocarea zilei</p>
                <p className="text-sm font-semibold text-white truncate">
                  {challenge.exercise} — {challenge.progress}/{challenge.target} rep
                </p>
              </div>
              {challengeDone ? (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,255,163,0.15)" }}>
                  <Check className="w-3.5 h-3.5" style={{ color: "#00FFA3" }} />
                </div>
              ) : (
                <div className="w-14 h-1.5 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${challengePct}%`, background: "#00FFA3" }} />
                </div>
              )}
              {showChallenge ? <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />}
            </button>

            {/* Expanded challenge */}
            <AnimatePresence>
              {showChallenge && !challengeDone && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden">
                  <div className="flex gap-2 px-1 pt-2">
                    {[10, 20, 30, 50].map(n => (
                      <button key={n} onClick={() => addRepsMutation.mutate(n)}
                        disabled={addRepsMutation.isPending}
                        className="flex-1 py-2 rounded-xl text-xs font-black text-black transition-all active:scale-95"
                        style={{ background: "#00FFA3" }}
                        data-testid={`button-add-reps-${n}`}>
                        +{n}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── MAIN CTA — sticky bottom ── */}
      <div className="px-5 pb-8 pt-3 flex-shrink-0"
        style={{ background: "linear-gradient(to top, #0B0F1A 80%, transparent)" }}>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 24 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          className="w-full flex items-center justify-center gap-3 rounded-2xl font-black text-lg text-black"
          style={{
            background: "linear-gradient(135deg, #00FFA3 0%, #00d4a8 100%)",
            padding: "18px 0",
            boxShadow: "0 0 40px rgba(0,255,163,0.25), 0 4px 20px rgba(0,0,0,0.4)",
          }}
          data-testid="button-start-workout">
          <Play className="w-6 h-6 fill-current" />
          ÎNCEPE ANTRENAMENTUL
        </motion.button>
      </div>
    </div>
  );
}
