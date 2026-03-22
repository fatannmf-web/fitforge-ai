import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Play, Clock, Target, Zap, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkoutExercise } from "@/api/todayPlan";

interface WorkoutCardProps {
  title: string;
  duration: string;
  muscle: string;
  workoutId?: number | null;
  exercises?: WorkoutExercise[];
}

function ExerciseRow({ ex, index }: { ex: WorkoutExercise; index: number }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 py-2 border-b border-zinc-700/40 last:border-0"
    >
      <div className="w-10 h-10 rounded-lg bg-zinc-700/60 flex-shrink-0 overflow-hidden">
        {ex.thumbnail && !imgError ? (
          <img src={ex.thumbnail} alt={ex.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-zinc-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
        <p className="text-xs text-zinc-500">{ex.sets} sets × {ex.reps} reps</p>
      </div>
      <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full flex-shrink-0">
        {ex.sets}×{ex.reps}
      </span>
    </motion.div>
  );
}

export function WorkoutCard({ title, duration, muscle, workoutId, exercises = [] }: WorkoutCardProps) {
  const [showExercises, setShowExercises] = useState(false);
  const [, navigate] = useLocation();
  const hasExercises = exercises.length > 0;

  const handleStart = () => {
    if (workoutId) {
      navigate(`/workout/play?id=${workoutId}`);
    } else {
      navigate("/workouts");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 shadow-2xl p-6 hover:scale-[1.01] transition-all duration-200"
    >
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-black text-primary uppercase tracking-[0.18em]">
            ⚡ Today's Workout
          </span>
        </div>

        <h2 className="text-2xl font-black text-white mb-1 leading-tight">{title}</h2>

        <div className="flex items-center gap-4 text-sm text-zinc-400 mb-5">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> {duration}
          </span>
          <span className="flex items-center gap-1.5 capitalize">
            <Target className="w-4 h-4" /> {muscle}
          </span>
          {hasExercises && (
            <span className="flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4" /> {exercises.length} exercises
            </span>
          )}
        </div>

        {/* Exercise list toggle */}
        {hasExercises && (
          <div className="mb-4">
            <button
              data-testid="button-toggle-exercises"
              onClick={() => setShowExercises(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:text-white text-xs font-semibold transition-all mb-1"
            >
              <span>{showExercises ? "Hide" : "Show"} exercises</span>
              {showExercises ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showExercises && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="bg-zinc-800/40 rounded-xl px-3 pt-1 pb-2 mt-1">
                    {exercises.map((ex, i) => (
                      <ExerciseRow key={i} ex={ex} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          data-testid="button-start-workout"
          onClick={handleStart}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-base tracking-wide transition-all duration-200 active:scale-95 shadow-lg shadow-green-500/25"
        >
          <Play className="w-5 h-5 fill-current" />
          {workoutId ? "START WORKOUT" : "QUICK START"}
        </button>
      </div>
    </motion.div>
  );
}
