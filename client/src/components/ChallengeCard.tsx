import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Flame, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  exercise: string;
  emoji: string;
  target: number;
  progress: number;
  completed: boolean;
  globalReps: number;
  usersCompleted?: number;
  onAddReps: (reps: number) => void;
  isPending?: boolean;
}

export function ChallengeCard({
  exercise, emoji, target, progress, completed, globalReps, usersCompleted, onAddReps, isPending
}: ChallengeCardProps) {
  const [xpVisible, setXpVisible] = useState(false);
  const pct = Math.min((progress / target) * 100, 100);

  const handleAdd = (reps: number) => {
    onAddReps(reps);
    setXpVisible(true);
    setTimeout(() => setXpVisible(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.3 }}
      className="relative rounded-2xl border border-zinc-800 bg-zinc-900 p-5 overflow-hidden hover:scale-[1.02] transition-all duration-200"
    >
      {xpVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 1, 0], y: [0, -15, -35, -50], scale: [0.6, 1.2, 1, 0.8] }}
          transition={{ duration: 1.2, times: [0, 0.2, 0.7, 1] }}
          className="absolute top-4 right-4 z-10 text-primary font-black text-sm pointer-events-none"
        >
          +10 XP ⚡
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-black text-orange-400 uppercase tracking-[0.15em]">🔥 Daily Challenge</span>
        </div>
        {completed && (
          <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
            ✓ Done
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <h2 className="text-lg font-black text-white">{target} {exercise}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {(usersCompleted ?? globalReps ?? 0).toLocaleString()} users completed today
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-zinc-400">Your progress</span>
          <span className={cn("font-bold", completed ? "text-green-400" : "text-white")}>
            {progress} / {target}
          </span>
        </div>
        <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              completed ? "bg-green-400" : "bg-orange-500"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>

      {!completed ? (
        <div className="flex gap-2">
          <button
            data-testid="button-challenge-add-reps"
            onClick={() => handleAdd(10)}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400 font-bold text-sm hover:bg-orange-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            +10 Reps
          </button>
          <Link href="/challenges">
            <button className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm font-medium hover:text-white transition-all flex items-center gap-1">
              More <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      ) : (
        <Link href="/challenges">
          <button className="w-full py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-sm hover:bg-green-500/15 transition-all">
            View Challenge Results 🏆
          </button>
        </Link>
      )}
    </motion.div>
  );
}
