import { useState, useEffect, useRef } from "react";
import { findExercise, type ExerciseData } from "@/data/exerciseLibrary";
import { X, CheckCircle, AlertTriangle, Zap, Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExerciseAnimationPlayer } from "@/components/ExerciseAnimationPlayer";

const TRAINER_COLORS: Record<string, string> = {
  strength: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  beginner: "text-green-400 bg-green-400/10 border-green-400/20",
  fatLoss: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};
const TRAINER_META: Record<string, { name: string; photo: string; gradient: string }> = {
  strength: { name: "Max",  photo: "/coaches/max.png",  gradient: "from-red-500 to-orange-600" },
  beginner: { name: "Alex", photo: "/coaches/alex.png", gradient: "from-emerald-400 to-green-600" },
  fatLoss:  { name: "Vera", photo: "/coaches/vera.png", gradient: "from-orange-400 to-red-500"  },
};
const TRAINER_NAMES: Record<string, string> = {
  strength: "Strength Coach",
  beginner: "Beginner Coach",
  fatLoss: "Fat Loss Coach",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-500 border-green-500/30",
  intermediate: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  advanced: "bg-red-500/10 text-red-500 border-red-500/30",
};

const CAT_EMOJI: Record<string, string> = {
  chest: "💪", back: "🦅", legs: "🦵", shoulders: "☝️",
  arms: "💪", core: "🔥", cardio: "🏃", full_body: "⚡",
};

function VideoPlayer({ exercise }: { exercise: ExerciseData }) {
  return (
    <ExerciseAnimationPlayer
      exerciseId={exercise.id}
      category={exercise.category}
      exerciseName={exercise.name}
      primaryMuscles={exercise.primaryMuscles}
      data-testid="exercise-animation-player"
    />
  );
}

function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current); onDone(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const pct = ((seconds - remaining) / seconds) * 100;
  const r = 44, circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center py-6 gap-4 animate-in fade-in-0 duration-300">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Odihnă</p>
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
            strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s linear" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black">{remaining}</span>
          <span className="text-xs text-muted-foreground">sec</span>
        </div>
      </div>
      <Button variant="outline" size="sm" className="gap-2" onClick={onDone} data-testid="button-skip-rest">
        <RotateCcw className="w-3 h-3" /> Skip Rest
      </Button>
    </div>
  );
}

export function WorkoutPlayerSheet({ exerciseName, setNumber, totalSets, restSeconds, onSetComplete, onNextExercise, isLastExercise }: {
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  restSeconds: number;
  onSetComplete: () => void;
  onNextExercise: () => void;
  isLastExercise: boolean;
}) {
  const [phase, setPhase] = useState<"exercise" | "rest">("exercise");
  const exData = findExercise(exerciseName);
  const [selectedTrainer, setSelectedTrainer] = useState<keyof ExerciseData["trainerTips"]>("beginner");

  const handleCompleteSet = () => {
    onSetComplete();
    if (setNumber < totalSets) {
      setPhase("rest");
    }
  };

  const handleRestDone = () => {
    setPhase("exercise");
  };

  if (!exData) {
    return (
      <div className="p-6 text-center">
        <p className="font-bold text-lg mb-2">{exerciseName}</p>
        <Button className="w-full gap-2 mt-4" onClick={handleCompleteSet} data-testid="button-complete-set-simple">
          <CheckCircle className="w-4 h-4" /> Completează Seria {setNumber}/{totalSets}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-2 bg-primary rounded-full transition-all duration-500"
            style={{ width: `${((setNumber - 1) / totalSets) * 100}%` }} />
        </div>
        <span className="text-xs text-muted-foreground font-mono">Seria {setNumber}/{totalSets}</span>
      </div>

      <VideoPlayer exercise={exData} />

      {/* Exercise name + badges */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xl font-black">{exData.name}</h3>
          {exData.nameRo && exData.nameRo !== exData.name && (
            <p className="text-sm text-muted-foreground">{exData.nameRo}</p>
          )}
        </div>
        <Badge variant="outline" className={`text-xs shrink-0 ${DIFFICULTY_COLORS[exData.difficulty]}`}>
          {exData.difficulty}
        </Badge>
      </div>

      {/* Stats pills */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-semibold">
          <Zap className="w-3.5 h-3.5 text-primary" /> {exData.defaultSets} serii × {exData.defaultReps} rep
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-sm">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" /> {exData.defaultRestSeconds}s odihnă
        </div>
      </div>

      {/* Muscles */}
      <div className="rounded-xl bg-muted/30 border border-border p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">Primary</p>
            {exData.primaryMuscles.map(m => (
              <div key={m} className="flex items-center gap-1.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-medium">{m}</span>
              </div>
            ))}
          </div>
          {exData.secondaryMuscles.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">Secondary</p>
              {exData.secondaryMuscles.map(m => (
                <div key={m} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
          Instrucțiuni pas cu pas
        </p>
        <div className="space-y-2">
          {exData.instructions.map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="leading-relaxed text-foreground/90">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Common mistakes */}
      <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
        <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Greșeli Comune
        </p>
        <div className="space-y-1.5">
          {exData.commonMistakes.map((m, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className="text-red-500 mt-0.5 flex-shrink-0 text-xs">✗</span>
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* Trainer tip */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sfat Antrenor AI</p>
        <div className="flex gap-1.5 mb-2">
          {(["strength", "beginner", "fatLoss"] as const).map(t => (
            <button key={t} onClick={() => setSelectedTrainer(t)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                selectedTrainer === t ? TRAINER_COLORS[t] : "bg-muted/30 border-border text-muted-foreground"
              }`}>
              <div className={`w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br ${TRAINER_META[t].gradient}`}>
                <img src={TRAINER_META[t].photo} alt={TRAINER_META[t].name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              {TRAINER_META[t].name}
            </button>
          ))}
        </div>
        <div className={`rounded-xl border p-3 text-sm leading-relaxed ${TRAINER_COLORS[selectedTrainer]}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br ${TRAINER_META[selectedTrainer].gradient}`}>
              <img src={TRAINER_META[selectedTrainer].photo} alt={TRAINER_META[selectedTrainer].name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <span className="font-semibold text-xs">{TRAINER_META[selectedTrainer].name} · {TRAINER_NAMES[selectedTrainer]}</span>
          </div>
          {exData.trainerTips[selectedTrainer as keyof typeof exData.trainerTips]}
        </div>
      </div>

      {/* Rest timer or complete set */}
      {phase === "rest" ? (
        <RestTimer seconds={restSeconds || exData.defaultRestSeconds} onDone={handleRestDone} />
      ) : (
        <div className="pt-2">
          <Button
            className="w-full h-14 gap-2 bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-base"
            onClick={handleCompleteSet}
            data-testid="button-complete-set"
          >
            <CheckCircle className="w-5 h-5" />
            {setNumber < totalSets ? `Completează Seria ${setNumber}/${totalSets}` : isLastExercise ? "Finalizează Antrenamentul!" : "Exercițiu Complet →"}
          </Button>
          {setNumber === totalSets && !isLastExercise && (
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={onNextExercise} data-testid="button-next-exercise">
              Exercițiu următor →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ExerciseDetailSheet({ exerciseName, open, onClose }: {
  exerciseName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [selectedTrainer, setSelectedTrainer] = useState<keyof ExerciseData["trainerTips"]>("beginner");
  const exData = findExercise(exerciseName);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background w-full max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-2xl overflow-y-auto shadow-2xl border border-border animate-in slide-in-from-bottom-4 duration-300">
        {/* Handle bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-5 pt-3 pb-3 border-b border-border">
          <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{exData?.emoji || "💪"}</span>
              <div>
                <h2 className="font-bold text-base leading-tight">{exData?.name || exerciseName}</h2>
                {exData?.nameRo && exData.nameRo !== exData.name && (
                  <p className="text-xs text-muted-foreground">{exData.nameRo}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center" data-testid="button-close-exercise-sheet">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-8 pt-4 space-y-5">
          {!exData ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="font-semibold mb-1">{exerciseName}</p>
              <p className="text-sm">Detalii complete disponibile în curând.</p>
            </div>
          ) : (
            <>
              <VideoPlayer exercise={exData} />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Serii", val: exData.defaultSets },
                  { label: "Repetări", val: exData.defaultReps },
                  { label: "Odihnă", val: `${exData.defaultRestSeconds}s` },
                ].map(s => (
                  <div key={s.label} className="text-center bg-muted/30 rounded-xl p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
                    <p className="text-xl font-black">{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Muscles */}
              <div className="rounded-xl bg-muted/30 border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Mușchi Lucrați</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-primary uppercase tracking-wider mb-2 font-bold">Primary</p>
                    {exData.primaryMuscles.map(m => (
                      <div key={m} className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-2 h-2 rounded-full bg-primary" /> {m}
                      </div>
                    ))}
                  </div>
                  {exData.secondaryMuscles.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-bold">Secondary</p>
                      {exData.secondaryMuscles.map(m => (
                        <div key={m} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" /> {m}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Instrucțiuni Pas cu Pas
                </p>
                <div className="space-y-3">
                  {exData.instructions.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-0.5">Step {i + 1}</p>
                        <p className="text-sm leading-relaxed">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common mistakes */}
              <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
                <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Greșeli Comune
                </p>
                <div className="space-y-2">
                  {exData.commonMistakes.map((m, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-destructive mt-0.5 text-xs flex-shrink-0">✗</span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trainer tips */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Sfat de la Antrenorul AI
                </p>
                <div className="flex gap-2 mb-3">
                  {(["strength", "beginner", "fatLoss"] as const).map(t => (
                    <button key={t} onClick={() => setSelectedTrainer(t)}
                      data-testid={`button-trainer-${t}`}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedTrainer === t ? TRAINER_COLORS[t] : "bg-muted/40 border-border text-muted-foreground"
                      }`}>
                      <div className={`w-5 h-5 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br ${TRAINER_META[t].gradient}`}>
                        <img src={TRAINER_META[t].photo} alt={TRAINER_META[t].name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                      {TRAINER_META[t].name}
                    </button>
                  ))}
                </div>
                <div className={`rounded-xl border p-4 text-sm leading-relaxed ${TRAINER_COLORS[selectedTrainer]}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br ${TRAINER_META[selectedTrainer].gradient}`}>
                      <img src={TRAINER_META[selectedTrainer].photo} alt={TRAINER_META[selectedTrainer].name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div>
                      <p className="font-bold text-xs leading-tight">{TRAINER_META[selectedTrainer].name}</p>
                      <p className="text-[10px] opacity-70 leading-tight">{TRAINER_NAMES[selectedTrainer]}</p>
                    </div>
                  </div>
                  {exData.trainerTips[selectedTrainer as keyof typeof exData.trainerTips]}
                </div>
              </div>

              {/* Equipment */}
              {exData.equipment.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground">Echipament:</p>
                  {exData.equipment.map(eq => (
                    <span key={eq} className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border capitalize">{eq}</span>
                  ))}
                </div>
              )}
              {exData.equipment.length === 0 && (
                <div className="text-center text-xs text-green-500 bg-green-500/5 border border-green-500/20 rounded-xl p-2">
                  ✓ Fără echipament necesar
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
