import { useLang } from "@/i18n/useLang";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, CheckCircle, Clock, Trophy, Zap, Volume2, VolumeX,
  Dumbbell, X, Flame, TrendingUp, TrendingDown, Minus, Plus, SkipForward, Calculator, Mic, MicOff
} from "lucide-react";
import { PlateCalculator } from "@/components/PlateCalculator";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────
interface ExerciseWithVideo {
  id: number;
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
  muscleGroup: string | null;
  notes: string | null;
  orderIndex: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  lastPR: number | null;
  lastPRReps: number | null;
  lastSessionWeight: number | null;
  lastSessionReps: number | null;
}

interface WorkoutPlayerData {
  workout: { id: number; name: string; difficulty: string; notes: string | null };
  exercises: ExerciseWithVideo[];
}

interface SetLog { exerciseName: string; setNumber: number; reps: number; weight: number; isNewPR?: boolean; setType?: SetType }
type SetType = "normal" | "warmup" | "dropset" | "failure"

// ─── Voice Guidance ────────────────────────────────────────────────────────
interface VoiceStep { time: number; text: string }

function getVoiceSteps(muscleGroup: string | null): VoiceStep[] {
  const mg = muscleGroup ?? "";
  if (["chest", "shoulders", "triceps", "forearms"].includes(mg))
    return [{ time: 0, text: "Pregătit" }, { time: 2, text: "Coboară lent" }, { time: 5, text: "Împinge!" }, { time: 8, text: "Sus!" }];
  if (["back", "biceps"].includes(mg))
    return [{ time: 0, text: "Pregătit" }, { time: 2, text: "Trage tare" }, { time: 5, text: "Controlat" }, { time: 8, text: "Extinde" }];
  if (["quads", "hamstrings", "glutes", "calves"].includes(mg))
    return [{ time: 0, text: "Pregătit" }, { time: 2, text: "Coboară" }, { time: 5, text: "Împinge!" }, { time: 8, text: "Sus!" }];
  if (mg === "core")
    return [{ time: 0, text: "Tensionează" }, { time: 3, text: "Ține!" }, { time: 6, text: "Respiră" }, { time: 9, text: "Bine!" }];
  return [{ time: 0, text: "Hai!" }, { time: 3, text: "Ritm!" }, { time: 6, text: "Respiră" }, { time: 9, text: "Termină!" }];
}

function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ro-RO";
  u.rate = 1.1;
  u.pitch = 1.05;
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

function useVoiceGuidance(
  videoRef: React.RefObject<HTMLVideoElement>,
  steps: VoiceStep[],
  enabled: boolean,
  exerciseKey: string,
  onCue?: (text: string) => void,
) {
  const spokenRef = useRef<Set<number>>(new Set());
  const onCueRef = useRef(onCue);
  onCueRef.current = onCue;

  useEffect(() => {
    spokenRef.current = new Set();
  }, [exerciseKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enabled) return;

    const onTimeUpdate = () => {
      const t = Math.floor(video.currentTime);
      for (const step of steps) {
        if (t === step.time && !spokenRef.current.has(step.time)) {
          spokenRef.current.add(step.time);
          speak(step.text);
          onCueRef.current?.(step.text);
          break;
        }
      }
      if (t === 0 && spokenRef.current.size > 1) {
        spokenRef.current = new Set();
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [videoRef, steps, enabled, exerciseKey]);
}

// ─── Epley 1RM ─────────────────────────────────────────────────────────────
function calc1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// ─── Set Timer (overlay video) ─────────────────────────────────────────────
function SetTimer({ exIdx, setIdx }: { exIdx: number; setIdx: number }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  useEffect(() => { setElapsed(0); setRunning(true); }, [exIdx, setIdx]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const m = Math.floor(elapsed / 60), s = elapsed % 60;
  return (
    <div
      className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl cursor-pointer select-none"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}
      onClick={() => setRunning(r => !r)}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${running ? "bg-red-400 animate-pulse" : "bg-white/30"}`} />
      <span className="text-white font-black text-sm tabular-nums">{m}:{String(s).padStart(2, "0")}</span>
    </div>
  );
}

// ─── Rest Timer (inline banner, not full-screen) ────────────────────────────
function RestBanner({ seconds, onDone, nextEx }: { seconds: number; onDone: () => void; nextEx?: ExerciseWithVideo }) {
  const [remaining, setRemaining] = useState(seconds);
  const pct = remaining / seconds;
  const circ = 2 * Math.PI * 20;

  useEffect(() => {
    if (remaining <= 0) { onDone(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="mx-4 mb-3 rounded-2xl overflow-hidden flex-shrink-0"
      style={{ background: "rgba(77,166,255,0.08)", border: "1px solid rgba(77,166,255,0.25)" }}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Circle timer */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(77,166,255,0.15)" strokeWidth="4" />
            <circle cx="24" cy="24" r="20" fill="none" stroke="#4DA6FF" strokeWidth="4"
              strokeLinecap="round" strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-black text-white tabular-nums">{remaining}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-blue-400/80 font-bold uppercase tracking-widest">Odihnă</p>
          {nextEx && (
            <p className="text-xs text-white/60 mt-0.5 truncate">
              Urmează: <span className="text-white font-semibold">{nextEx.name}</span>
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setRemaining(r => r + 30)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-300"
            style={{ background: "rgba(77,166,255,0.15)" }}>+30s</button>
          <button onClick={onDone}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white/60 flex items-center gap-1"
            style={{ background: "rgba(255,255,255,0.07)" }}>
            <SkipForward className="w-3 h-3" /> Skip
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── PR Flash ──────────────────────────────────────────────────────────────
function PRFlash({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="fixed top-16 left-4 right-4 z-50 flex items-center gap-3 p-3 rounded-2xl border"
      style={{ background: "rgba(234,179,8,0.15)", borderColor: "rgba(234,179,8,0.4)" }}
    >
      <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
      <div>
        <p className="text-yellow-400 font-black text-xs">🏆 Record Personal Nou!</p>
        <p className="text-white/60 text-[11px]">{name}</p>
      </div>
    </motion.div>
  );
}

// ─── Completion Screen ─────────────────────────────────────────────────────
const COACH_MESSAGES = [
  "Treabă bună. Gata pentru mâine? 💪",
  "Antrenament complet. Mușchii tăi cresc acum. 🔥",
  "Excelent! Fiecare rep contează. Ne vedem mâine. ⚡",
  "Bine executat. Recuperează-te bine — mâine dăm din nou! 💚",
  "Ești constant. Asta e secretul. Ne vedem mâine! 🎯",
];

function CompletionScreen({ workoutName, duration, totalSets, totalVolume, newPRs, xpEarned, onClose }:
  { workoutName: string; duration: number; totalSets: number; totalVolume: number; newPRs: number; xpEarned: number; onClose: () => void }) {
  const coachMsg = COACH_MESSAGES[Math.floor(Math.random() * COACH_MESSAGES.length)];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ background: "#0B0F1A" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 w-full max-w-sm mx-auto">

        {/* ✓ Icon */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1, stiffness: 260 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "rgba(0,255,163,0.08)" }} />
          <div className="w-full h-full rounded-full flex items-center justify-center border-4" style={{ borderColor: "#00FFA3", background: "rgba(0,255,163,0.06)" }}>
            <CheckCircle className="w-12 h-12" style={{ color: "#00FFA3" }} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-center mb-2">
          <h1 className="text-3xl font-black text-white mb-1">Antrenament Gata!</h1>
          <p className="text-sm text-white/30 truncate max-w-xs">{workoutName}</p>
        </motion.div>

        {/* XP Badge */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35, type: "spring" }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl mb-6 mt-1"
          style={{ background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.2)" }}>
          <Zap className="w-5 h-5" style={{ color: "#00FFA3" }} />
          <span className="text-2xl font-black" style={{ color: "#00FFA3" }}>+{xpEarned} XP</span>
        </motion.div>

        {/* Stats grid */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3 w-full mb-6">
          {[
            { icon: <Clock className="w-4 h-4" style={{ color: "#4DA6FF" }} />, label: "Durată", value: `${Math.floor(duration / 60)} min` },
            { icon: <Dumbbell className="w-4 h-4 text-white/50" />, label: "Seturi", value: String(totalSets) },
            { icon: <Flame className="w-4 h-4 text-orange-400" />, label: "Volum", value: totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : "—" },
            { icon: <Trophy className="w-4 h-4 text-yellow-400" />, label: "PR-uri noi", value: newPRs > 0 ? `${newPRs} 🏆` : "—" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-3.5 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-1.5 mb-1">{s.icon}<p className="text-[10px] text-white/35">{s.label}</p></div>
              <p className="text-xl font-black text-white">{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* AI Coach message */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl mb-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,255,163,0.12)" }}>
            <Zap className="w-4 h-4" style={{ color: "#00FFA3" }} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-0.5">AI Coach</p>
            <p className="text-sm text-white/70 leading-snug">{coachMsg}</p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          onClick={onClose}
          className="w-full py-4.5 rounded-2xl font-black text-lg text-black"
          style={{ background: "#00FFA3", padding: "18px 0", boxShadow: "0 0 30px rgba(0,255,163,0.2)" }}
          data-testid="button-finish-workout">
          Gata! Până mâine 👋
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function WorkoutPlayerPage() {
  const { tx } = useLang();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const workoutId = parseInt(new URLSearchParams(window.location.search).get("id") ?? "0");

  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [repsInput, setRepsInput] = useState("10");
  const [weightInput, setWeightInput] = useState("0");
  const [showRest, setShowRest] = useState(false);
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [muted, setMuted] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentCue, setCurrentCue] = useState<string | null>(null);
  const cueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [startTime] = useState(Date.now());
  const [logsThisSession, setLogsThisSession] = useState<SetLog[]>([]);
  const [prFlash, setPrFlash] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(150);
  const [setType, setSetType] = useState<SetType>("normal");

  const { data, isLoading, error } = useQuery<WorkoutPlayerData>({
    queryKey: ["/api/workout-player", workoutId],
    queryFn: () => fetch(`/api/workout-player/${workoutId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!workoutId,
    staleTime: 0,
  });

  const logSetMutation = useMutation({
    mutationFn: (body: { exerciseName: string; setNumber: number; reps: number; weight: number }) =>
      apiRequest("POST", `/api/workout-player/${workoutId}/log-set`, body),
    onSuccess: async (res: Response) => {
      const json = await res.json().catch(() => ({}));
      if (json?.isNewPR) {
        setPrFlash(currentEx?.name ?? "");
        setTimeout(() => setPrFlash(null), 3000);
      }
    },
  });

  const completeMutation = useMutation({
    mutationFn: (body: { duration: number; totalVolume: number; newPRs: number }) =>
      apiRequest("POST", `/api/workout-player/${workoutId}/complete`, body),
    onSuccess: async (res: Response) => {
      const json = await res.json().catch(() => ({}));
      setXpEarned(json?.xpEarned ?? 150);
      qc.invalidateQueries({ queryKey: ["/api/today-plan"] });
      qc.invalidateQueries({ queryKey: ["/api/workouts"] });
      qc.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  const exercises = data?.exercises ?? [];
  const currentEx = exercises[currentExIdx];
  const nextEx = exercises[currentExIdx + 1];
  const totalSets = currentEx?.sets ?? 3;
  const setsCompletedTotal = exercises.slice(0, currentExIdx).reduce((s, e) => s + e.sets, 0) + (currentSet - 1);
  const totalSetsAll = exercises.reduce((s, e) => s + e.sets, 0);
  const progressPct = totalSetsAll > 0 ? (setsCompletedTotal / totalSetsAll) * 100 : 0;

  // Voice guidance — synced with video currentTime
  const voiceSteps = getVoiceSteps(currentEx?.muscleGroup ?? null);
  useVoiceGuidance(videoRef, voiceSteps, voiceEnabled, `${currentExIdx}-${currentEx?.name}`, (text) => {
    setCurrentCue(text);
    if (cueTimerRef.current) clearTimeout(cueTimerRef.current);
    cueTimerRef.current = setTimeout(() => setCurrentCue(null), 2000);
  });

  // Auto-fill inputs when changing exercise
  useEffect(() => {
    if (currentEx) {
      setRepsInput(String(currentEx.reps ?? 10));
      const suggested = currentEx.lastSessionWeight ?? currentEx.lastPR ?? currentEx.weight ?? 0;
      setWeightInput(String(suggested));
      setCurrentSet(1);
      setSetType("normal"); // resetăm tipul la Normal
    }
  }, [currentExIdx]);

  // Reload video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentExIdx]);

  const handleSetDone = useCallback(async () => {
    const reps = parseInt(repsInput) || (currentEx?.reps ?? 10);
    const weight = parseFloat(weightInput) || 0;
    const log: SetLog = { exerciseName: currentEx.name, setNumber: currentSet, reps, weight, setType };
    setLogsThisSession(prev => [...prev, log]);

    try {
      const res = await logSetMutation.mutateAsync({ exerciseName: currentEx.name, setNumber: currentSet, reps, weight });
      const json = await res.json().catch(() => ({}));
      if (json?.isNewPR) {
        setPrFlash(currentEx?.name ?? "");
        setTimeout(() => setPrFlash(null), 3500);
      }
    } catch {}

    if (currentSet < totalSets) {
      setCurrentSet(s => s + 1);
      setShowRest(true);
    } else if (currentExIdx < exercises.length - 1) {
      setCurrentExIdx(i => i + 1);
      setShowRest(true);
    } else {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const totalVolume = [...logsThisSession, log].reduce((s, l) => s + l.reps * l.weight, 0);
      const newPRs = logsThisSession.filter(l => l.isNewPR).length;
      await completeMutation.mutateAsync({ duration, totalVolume, newPRs });
      setShowCompletion(true);
    }
  }, [currentSet, totalSets, currentExIdx, exercises, repsInput, weightInput, currentEx, logsThisSession, startTime]);

  // Computed values
  const repsNum = parseInt(repsInput) || 0;
  const weightNum = parseFloat(weightInput) || 0;
  const oneRM = calc1RM(weightNum, repsNum);
  const lastW = currentEx?.lastSessionWeight;
  const weightDiff = lastW != null ? weightNum - lastW : null;

  // Sets completed this session for current exercise
  const setsThisEx = logsThisSession.filter(l => l.exerciseName === currentEx?.name);

  // ── Error / loading states ──
  if (!workoutId) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 px-6" style={{ background: "#0B0F1A" }}>
      <Dumbbell className="w-12 h-12 text-primary" />
      <h2 className="text-xl font-black text-white text-center">Niciun workout selectat</h2>
      <button onClick={() => navigate("/workouts")} className="px-6 py-3 rounded-xl font-bold text-black" style={{ background: "#00FFA3" }}>Antrenamente</button>
    </div>
  );
  if (isLoading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "#0B0F1A" }}>
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#00FFA3", borderTopColor: "transparent" }} />
    </div>
  );
  if (error || !data || exercises.length === 0) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 px-6" style={{ background: "#0B0F1A" }}>
      <X className="w-12 h-12 text-red-400" />
      <h2 className="text-xl font-black text-white text-center">Workout negăsit</h2>
      <button onClick={() => navigate("/workouts")} className="px-6 py-3 rounded-xl font-bold text-black" style={{ background: "#00FFA3" }}>Înapoi</button>
    </div>
  );

  const duration = Math.round((Date.now() - startTime) / 1000);
  const totalVolume = logsThisSession.reduce((s, l) => s + l.reps * l.weight, 0);
  const newPRs = logsThisSession.filter(l => l.isNewPR).length;

  return (
    <div className="fixed inset-0 flex flex-col overflow-y-auto" style={{ background: "#0B0F1A" }}>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {showCompletion && <CompletionScreen workoutName={data.workout.name} duration={duration} totalSets={logsThisSession.length} totalVolume={totalVolume} newPRs={newPRs} xpEarned={xpEarned} onClose={() => navigate("/today")} />}
      </AnimatePresence>
      <AnimatePresence>
        {prFlash && <PRFlash name={prFlash} />}
      </AnimatePresence>
      <AnimatePresence>
        {showPlateCalc && (
          <PlateCalculator
            initialWeight={parseFloat(weightInput) || 60}
            onClose={() => setShowPlateCalc(false)}
            onApply={(w) => setWeightInput(String(w))}
          />
        )}
      </AnimatePresence>

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-2 flex-shrink-0 sticky top-0 z-10" style={{ background: "#0B0F1A" }}>
        <button onClick={() => window.history.back()} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <p className="text-[11px] text-white/40 truncate max-w-[160px]">{data.workout.name}</p>
          <p className="text-sm font-black text-white">{currentExIdx + 1}/{exercises.length} · Set {currentSet}/{totalSets}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMuted(m => !m)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }} data-testid="button-toggle-mute">
            {muted ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4" style={{ color: "#4DA6FF" }} />}
          </button>
          <button
            onClick={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              if (next) speak("Coach activat!");
              else window.speechSynthesis?.cancel();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{ background: voiceEnabled ? "rgba(0,255,163,0.15)" : "rgba(255,255,255,0.08)", border: voiceEnabled ? "1px solid rgba(0,255,163,0.3)" : "1px solid transparent" }}
            data-testid="button-toggle-voice"
            title="Voice Coach"
          >
            {voiceEnabled ? <Mic className="w-4 h-4" style={{ color: "#00FFA3" }} /> : <MicOff className="w-4 h-4 text-white/40" />}
          </button>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="px-4 mb-3 flex-shrink-0">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #00FFA3, #4DA6FF)" }}
            animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      {/* ── Video ── */}
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden flex-shrink-0 relative"
        style={{ height: "230px", background: "#000", border: "1px solid rgba(255,255,255,0.07)" }}>
        {currentEx?.videoUrl ? (
          <video ref={videoRef} src={currentEx.videoUrl} autoPlay loop muted={muted} playsInline
            className="w-full h-full" style={{ objectFit: "contain" }} />
        ) : currentEx?.thumbnailUrl ? (
          <img src={currentEx.thumbnailUrl} alt={currentEx.name} className="w-full h-full" style={{ objectFit: "contain" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell className="w-12 h-12 text-white/20" />
          </div>
        )}
        <SetTimer key={`${currentExIdx}-${currentSet}`} exIdx={currentExIdx} setIdx={currentSet} />
        {/* Voice cue overlay */}
        <AnimatePresence>
          {voiceEnabled && currentCue && (
            <motion.div
              key={currentCue}
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none"
            >
              <div className="px-4 py-2 rounded-xl font-black text-sm text-black"
                style={{ background: "#00FFA3", boxShadow: "0 4px 20px rgba(0,255,163,0.5)" }}>
                {currentCue}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Set dots */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {Array.from({ length: totalSets }).map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all" style={{
              width: i === currentSet - 1 ? 20 : 16,
              background: i < currentSet - 1 ? "#00FFA3" : i === currentSet - 1 ? "rgba(0,255,163,0.5)" : "rgba(255,255,255,0.2)",
            }} />
          ))}
        </div>
      </div>

      {/* ── Exercise Name + 1RM ── */}
      <div className="px-4 mb-2 flex items-start justify-between flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-white leading-tight truncate">{currentEx?.name}</h2>
          {currentEx?.muscleGroup && (
            <p className="text-xs capitalize mt-0.5" style={{ color: "#00FFA3" }}>{currentEx.muscleGroup.replace(/_/g, " ")}</p>
          )}
        </div>
        {/* 1RM badge */}
        {oneRM > 0 && (
          <div className="ml-2 px-2.5 py-1.5 rounded-xl text-right flex-shrink-0" style={{ background: "rgba(77,166,255,0.1)", border: "1px solid rgba(77,166,255,0.2)" }}>
            <p className="text-[9px] text-blue-400/70 font-medium">1RM est.</p>
            <p className="text-sm font-black" style={{ color: "#4DA6FF" }}>{oneRM}kg</p>
          </div>
        )}
      </div>

      {/* ── Progressive Overload bar — vizibil și motivant ── */}
      {(currentEx?.lastSessionWeight != null || currentEx?.lastPR != null) && (
        <div className="px-4 mb-3 flex-shrink-0">
          <div className="rounded-2xl p-3" style={{ background: "rgba(0,255,163,0.06)", border: "1px solid rgba(0,255,163,0.15)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(0,255,163,0.7)" }}>
                📊 Sesiunea anterioară
              </p>
              {weightDiff !== null && weightDiff !== 0 && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold`}
                  style={{
                    background: weightDiff > 0 ? "rgba(0,255,163,0.15)" : "rgba(239,68,68,0.1)",
                    color: weightDiff > 0 ? "#00FFA3" : "#f87171",
                  }}>
                  {weightDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {weightDiff > 0 ? `+${weightDiff.toFixed(1)}kg față de ultima sesiune 🔥` : `${weightDiff.toFixed(1)}kg față de ultima sesiune`}
                </div>
              )}
              {weightDiff === 0 && (
                <span className="text-[10px] text-white/40">Aceeași greutate ca ultima sesiune</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Last session info — mare și clar */}
              <div className="flex-1">
                {currentEx?.lastSessionWeight != null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">{currentEx.lastSessionWeight}</span>
                    <span className="text-sm text-white/50">kg</span>
                    <span className="text-white/30 mx-1">×</span>
                    <span className="text-2xl font-black text-white">{currentEx.lastSessionReps ?? "?"}</span>
                    <span className="text-sm text-white/50">reps</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-white/50 mr-1">PR:</span>
                    <span className="text-2xl font-black text-yellow-400">{currentEx?.lastPR}</span>
                    <span className="text-sm text-yellow-400/60">kg</span>
                  </div>
                )}
              </div>

              {/* Butoane rapide auto-fill */}
              <div className="flex flex-col gap-1.5">
                {currentEx?.lastSessionWeight != null && (
                  <>
                    {/* Auto-fill exact */}
                    <button
                      onClick={() => {
                        setWeightInput(String(currentEx.lastSessionWeight!));
                        setRepsInput(String(currentEx.lastSessionReps ?? currentEx.reps ?? 10));
                      }}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
                      data-testid="button-autofill-same"
                    >
                      = Copie
                    </button>
                    {/* Progressive overload +2.5kg */}
                    <button
                      onClick={() => setWeightInput(String(currentEx.lastSessionWeight! + 2.5))}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      style={{ background: "rgba(0,255,163,0.12)", color: "#00FFA3", border: "1px solid rgba(0,255,163,0.2)" }}
                      data-testid="button-progressive-overload"
                    >
                      <Plus className="w-2.5 h-2.5" />2.5kg
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Când nu există sesiune anterioară — mesaj pentru exerciții noi */}
      {currentEx?.lastSessionWeight == null && currentEx?.lastPR == null && currentExIdx === 0 && (
        <div className="px-4 mb-3 flex-shrink-0">
          <div className="px-3 py-2 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] text-white/30">Prima sesiune pentru acest exercițiu — stabilești recordul!</p>
          </div>
        </div>
      )}

      {/* ── Set Type Selector ── */}
      <div className="px-4 mb-3 flex-shrink-0">
        <div className="flex gap-2">
          {([
            { type: "warmup",  label: "🔥 Warmup",  color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)"  },
            { type: "normal",  label: "● Normal",   color: "#ffffff", bg: "rgba(255,255,255,0.1)",  border: "rgba(255,255,255,0.15)" },
            { type: "dropset", label: "⬇ Drop Set", color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)"  },
            { type: "failure", label: "💀 Failure", color: "#f43f5e", bg: "rgba(244,63,94,0.12)",   border: "rgba(244,63,94,0.3)"   },
          ] as { type: SetType; label: string; color: string; bg: string; border: string }[]).map(s => (
            <button
              key={s.type}
              onClick={() => setSetType(s.type)}
              className="flex-1 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95"
              style={{
                background: setType === s.type ? s.bg : "rgba(255,255,255,0.04)",
                border: `1px solid ${setType === s.type ? s.border : "rgba(255,255,255,0.06)"}`,
                color: setType === s.type ? s.color : "rgba(255,255,255,0.3)",
              }}
              data-testid={`button-set-type-${s.type}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {setType === "warmup" && (
          <p className="text-[10px] text-orange-400/60 mt-1.5 text-center">Set de încălzire — nu contează la volum total</p>
        )}
        {setType === "dropset" && (
          <p className="text-[10px] text-blue-400/60 mt-1.5 text-center">Scade greutatea imediat fără pauză</p>
        )}
        {setType === "failure" && (
          <p className="text-[10px] text-red-400/60 mt-1.5 text-center">Ai dus până la eșec muscular — excelent! 💪</p>
        )}
      </div>

      {/* ── Reps + Weight ── */}
      <div className="px-4 mb-3 flex gap-3 flex-shrink-0">
        {/* REPS */}
        <div className="flex-1 rounded-2xl border p-3" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-1.5">Repetări</p>
          <div className="flex items-center gap-2">
            <button data-testid="button-reps-minus"
              onClick={() => setRepsInput(r => String(Math.max(1, parseInt(r || "0") - 1)))}
              className="w-9 h-9 rounded-full text-white font-bold text-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.1)" }}>−</button>
            <input type="number" value={repsInput} onChange={e => setRepsInput(e.target.value)}
              className="flex-1 text-center text-2xl font-black text-white bg-transparent outline-none min-w-0"
              data-testid="input-reps" inputMode="numeric" />
            <button data-testid="button-reps-plus"
              onClick={() => setRepsInput(r => String(parseInt(r || "0") + 1))}
              className="w-9 h-9 rounded-full text-white font-bold text-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.1)" }}>+</button>
          </div>
        </div>
        {/* WEIGHT */}
        <div className="flex-1 rounded-2xl border p-3" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Greutate (kg)</p>
            <button onClick={() => setShowPlateCalc(true)} className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg"
              style={{ background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.2)" }}
              data-testid="button-plate-calculator">
              <Calculator className="w-2.5 h-2.5" style={{ color: "#00FFA3" }} />
              <span className="text-[9px] font-bold" style={{ color: "#00FFA3" }}>Discuri</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button data-testid="button-weight-minus"
              onClick={() => setWeightInput(w => String(Math.max(0, parseFloat(w || "0") - 2.5)))}
              className="w-9 h-9 rounded-full text-white font-bold text-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.1)" }}>−</button>
            <input type="number" value={weightInput} onChange={e => setWeightInput(e.target.value)}
              className="flex-1 text-center text-2xl font-black text-white bg-transparent outline-none min-w-0"
              data-testid="input-weight" inputMode="decimal" />
            <button data-testid="button-weight-plus"
              onClick={() => setWeightInput(w => String(parseFloat(w || "0") + 2.5))}
              className="w-9 h-9 rounded-full text-white font-bold text-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.1)" }}>+</button>
          </div>
        </div>
      </div>

      {/* ── Completed sets in this session ── */}
      {setsThisEx.length > 0 && (
        <div className="px-4 mb-2 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {setsThisEx.map((s, i) => {
              const typeColors: Record<SetType, { bg: string; border: string; color: string; label: string }> = {
                normal:  { bg: "rgba(0,255,163,0.1)",   border: "rgba(0,255,163,0.2)",   color: "#00FFA3", label: "" },
                warmup:  { bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)", color: "#f97316", label: "🔥 " },
                dropset: { bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.25)", color: "#60a5fa", label: "⬇ " },
                failure: { bg: "rgba(244,63,94,0.1)",   border: "rgba(244,63,94,0.25)",  color: "#f43f5e", label: "💀 " },
              };
              const tc = typeColors[s.setType ?? "normal"];
              return (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{ background: tc.bg, border: `1px solid ${tc.border}`, color: tc.color }}>
                  {tc.label}✓ {s.reps}×{s.weight}kg
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Rest Timer (inline) ── */}
      <AnimatePresence>
        {showRest && (
          <RestBanner
            key={`rest-${currentExIdx}-${currentSet}`}
            seconds={90}
            onDone={() => setShowRest(false)}
            nextEx={nextEx}
          />
        )}
      </AnimatePresence>

      {/* ── SET DONE Button ── */}
      <div className="px-4 mb-3 flex-shrink-0">
        <button
          onClick={handleSetDone}
          disabled={logSetMutation.isPending || showRest}
          className="w-full py-4 rounded-2xl font-black text-base text-black transition-all active:scale-95 disabled:opacity-60"
          style={{ background: showRest ? "rgba(0,255,163,0.3)" : "#00FFA3" }}
          data-testid="button-set-done"
        >
          {logSetMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Salvez...
            </span>
          ) : showRest ? (
            "⏱ Pauză..."
          ) : currentSet < totalSets ? (
            `✓ Set ${currentSet} Gata!`
          ) : currentExIdx < exercises.length - 1 ? (
            `✓ Următor: ${exercises[currentExIdx + 1]?.name?.split(" ").slice(0, 2).join(" ") ?? "exercițiu"} →`
          ) : (
            "🎉 Finalizează Antrenamentul!"
          )}
        </button>
      </div>

      {/* ── Exercise Queue ── */}
      {exercises.length > currentExIdx + 1 && (
        <div className="px-4 mb-4 flex-shrink-0">
          <p className="text-[9px] text-white/25 font-bold uppercase tracking-widest mb-2">Urmează</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {exercises.slice(currentExIdx + 1, currentExIdx + 4).map((ex) => (
              <div key={ex.id} className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                {ex.thumbnailUrl ? (
                  <img src={ex.thumbnailUrl} alt={ex.name} className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                    <Dumbbell className="w-3 h-3 text-white/30" />
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold text-white/60 max-w-[72px] truncate">{ex.name}</p>
                  <p className="text-[9px] text-white/30">{ex.sets}×{ex.reps}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
