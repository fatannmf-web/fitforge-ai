import { useLang } from "@/i18n/useLang";
import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useProGate } from "@/hooks/use-pro-gate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMobile } from "@/hooks/use-mobile";
import type { BodyScan } from "@shared/schema";
import {
  Camera, Upload, Zap, TrendingUp, Target, Activity, Star,
  CheckCircle, ArrowRight, Share2, History, ChevronDown, ChevronUp,
  RotateCcw, ChevronRight, Dumbbell, Flame, Calendar, Trophy,
  AlertTriangle, Utensils, Split,
} from "lucide-react";

const GOALS = [
  { value: "weight_loss", label: "Slăbire", emoji: "🔥" },
  { value: "muscle_gain", label: "Masă Musculară", emoji: "💪" },
  { value: "endurance", label: "Rezistență", emoji: "🏃" },
  { value: "flexibility", label: "Flexibilitate", emoji: "🧘" },
  { value: "general_fitness", label: "Fitness General", emoji: "⚡" },
];

const MUSCLE_LEVEL_COLOR: Record<string, string> = {
  weak: "bg-red-500", moderate: "bg-amber-500", strong: "bg-green-500",
  Slab: "bg-red-500", Mediu: "bg-amber-500", Puternic: "bg-green-500",
};
const MUSCLE_LEVEL_WIDTH: Record<string, number> = {
  weak: 33, moderate: 66, strong: 100,
  Slab: 33, Mediu: 66, Puternic: 100,
};
const MUSCLE_LEVEL_LABEL: Record<string, string> = {
  weak: "Slab", moderate: "Mediu", strong: "Puternic",
};

const SPLIT_LABELS: Record<string, string> = {
  full_body: "Full Body", upper_lower: "Upper / Lower",
  push_pull_legs: "Push Pull Legs", ppl: "Push Pull Legs", bro_split: "Bro Split",
};

function compressImage(file: File, maxSize = 900, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize; }
        else { width = Math.round((width * maxSize) / height); height = maxSize; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = (err) => { URL.revokeObjectURL(objectUrl); reject(err); };
    img.src = objectUrl;
  });
}

function SilhouetteFront() {
  return (
    <svg viewBox="0 0 120 280" className="w-24 h-56 text-primary/60" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="60" cy="28" rx="18" ry="22" />
      <line x1="60" y1="50" x2="60" y2="140" />
      <line x1="60" y1="68" x2="25" y2="110" />
      <line x1="25" y1="110" x2="20" y2="135" />
      <line x1="60" y1="68" x2="95" y2="110" />
      <line x1="95" y1="110" x2="100" y2="135" />
      <path d="M38 140 Q60 150 82 140 L78 220 Q70 225 60 225 Q50 225 42 220 Z" />
      <line x1="50" y1="220" x2="46" y2="278" />
      <line x1="70" y1="220" x2="74" y2="278" />
    </svg>
  );
}

function SilhouetteSide() {
  return (
    <svg viewBox="0 0 80 280" className="w-16 h-56 text-primary/60" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="38" cy="28" rx="16" ry="20" />
      <path d="M30 48 Q38 52 42 48" />
      <line x1="38" y1="50" x2="38" y2="140" />
      <path d="M38 68 Q22 80 18 110 L16 135" />
      <path d="M38 68 Q52 80 56 110 L58 135" />
      <path d="M24 140 Q38 148 52 140 L50 220 Q44 226 38 226 Q32 226 26 220 Z" />
      <line x1="33" y1="220" x2="30" y2="278" />
      <line x1="44" y1="220" x2="47" y2="278" />
    </svg>
  );
}

function ScoreRing({ value, max, label, color, unit = "" }: { value: number; max: number; label: string; color: string; unit?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const r = 32, circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[72px] h-[72px]">
        <svg className="w-[72px] h-[72px] -rotate-90" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/20" />
          <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-black leading-none">{value}{unit}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

function PhotoStep({
  step, total, title, subtitle, instructions, silhouette,
  onCapture, fileRef, cameraRef,
}: {
  step: number; total: number; title: string; subtitle: string;
  instructions: string[]; silhouette: React.ReactNode;
  onCapture: (file: File) => void;
  fileRef: React.RefObject<HTMLInputElement>;
  cameraRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-400">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{step}</span>
        <div>
          <p className="font-bold text-base">{title}</p>
          <p className="text-xs text-muted-foreground">Pasul {step} din {total}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-muted/20 p-5 mb-4">
        <div className="flex items-start gap-5">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">{silhouette}</div>
            <p className="text-[10px] text-primary font-semibold">{subtitle}</p>
          </div>
          <div className="flex-1 space-y-2 pt-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Instrucțiuni</p>
            {instructions.map((ins, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-12 gap-2 text-sm" onClick={() => cameraRef.current?.click()} data-testid={`button-camera-step${step}`}>
          <Camera className="w-4 h-4" /> Cameră
        </Button>
        <Button variant="outline" className="h-12 gap-2 text-sm" onClick={() => fileRef.current?.click()} data-testid={`button-gallery-step${step}`}>
          <Upload className="w-4 h-4" /> Galerie
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && onCapture(e.target.files[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files?.[0] && onCapture(e.target.files[0])} />
    </div>
  );
}

function PhotoPreview({ dataUrl, label, onRetake, onConfirm }: {
  dataUrl: string; label: string; onRetake: () => void; onConfirm: () => void;
}) {
  return (
    <div className="animate-in fade-in-0 duration-300 space-y-3">
      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-muted">
        <img src={dataUrl} alt={label} className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3">
          <Badge className="bg-black/70 text-white border-0 text-xs">{label}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-11 gap-2" onClick={onRetake} data-testid="button-retake">
          <RotateCcw className="w-4 h-4" /> Retrage
        </Button>
        <Button className="h-11 gap-2 bg-gradient-to-r from-primary to-purple-600 text-white" onClick={onConfirm} data-testid="button-confirm-photo">
          Folosește aceasta <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function AnalyzeAnimation() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { emoji: "📸", text: "Analyzing posture...", subtext: "Detectăm alinierea coloanei" },
    { emoji: "🔥", text: "Estimating body fat...", subtext: "Calculăm compoziția corporală" },
    { emoji: "💪", text: "Analyzing muscle balance...", subtext: "Identificăm grupele slabe" },
    { emoji: "📊", text: "Calculating fitness score...", subtext: "Evaluăm nivelul de fitness" },
    { emoji: "🔮", text: "Building transformation prediction...", subtext: "Predicție 30/90/180 zile" },
  ];

  useEffect(() => {
    if (activeStep >= steps.length) return;
    const t = setTimeout(() => setActiveStep(prev => prev + 1), 900);
    return () => clearTimeout(t);
  }, [activeStep]);

  const currentStepText = steps[Math.min(activeStep, steps.length - 1)];
  const progressPct = Math.min(100, (activeStep / steps.length) * 100);

  return (
    <div className="flex flex-col items-center py-10 px-4 space-y-8 animate-in fade-in-0 duration-500 min-h-[400px] justify-center">
      {/* Pulsing scanner ring */}
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 rounded-full border-4 border-primary/15 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute inset-2 rounded-full border-4 border-primary/25 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
        <div className="absolute inset-0 rounded-full border-4 border-t-primary border-primary/20 animate-spin" style={{ animationDuration: "1.2s" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-3xl animate-pulse">{currentStepText.emoji}</div>
        </div>
      </div>

      {/* Current step text */}
      <div className="text-center space-y-1">
        <p className="text-lg font-black text-foreground">{currentStepText.text}</p>
        <p className="text-sm text-muted-foreground">{currentStepText.subtext}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs space-y-2">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">{Math.round(progressPct)}% completat</p>
      </div>

      {/* Steps checklist */}
      <div className="space-y-2 text-left w-full max-w-xs">
        {steps.map((s, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${done ? "opacity-100" : active ? "opacity-100" : "opacity-30"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                done ? "bg-primary text-primary-foreground" : active ? "bg-primary/20 border-2 border-primary" : "bg-muted"
              }`}>
                {done ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : active ? (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <span className={done ? "text-foreground font-medium" : active ? "text-foreground font-semibold" : "text-muted-foreground"}>
                {s.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MuscleBar({ label, level }: { label: string; level: string }) {
  const colorClass = MUSCLE_LEVEL_COLOR[level] || "bg-muted";
  const width = MUSCLE_LEVEL_WIDTH[level] || 33;
  const displayLabel = MUSCLE_LEVEL_LABEL[level] || level;
  const isWeak = level === "weak" || level === "Slab";
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs w-20 flex-shrink-0 ${isWeak ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${colorClass} transition-all duration-1000`} style={{ width: `${width}%` }} />
      </div>
      <span className={`text-xs font-semibold w-14 text-right ${isWeak ? "text-red-500" : ""}`}>{displayLabel}</span>
    </div>
  );
}

function PredictionBar({ label, current, predicted, days, color }: {
  label: string; current: number; predicted: number; days: number; color: string;
}) {
  const change = predicted - current;
  const isGood = change < 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-14 text-center flex-shrink-0">
        <p className="text-[10px] text-muted-foreground">{days} zile</p>
        <p className="text-xs font-bold" style={{ color }}>{predicted}%</p>
      </div>
      <div className="flex-1">
        <div className="h-2.5 bg-muted rounded-full overflow-hidden relative">
          <div className="h-2.5 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, (predicted / 45) * 100)}%`, backgroundColor: color }} />
        </div>
      </div>
      <div className="w-14 text-right flex-shrink-0">
        <span className={`text-xs font-bold ${isGood ? "text-green-500" : "text-red-500"}`}>
          {isGood ? "" : "+"}{change}%
        </span>
      </div>
    </div>
  );
}

function ScanResultFull({ scan, onShare, onNewScan, onGoToWorkouts }: {
  scan: BodyScan; onShare: () => void; onNewScan: () => void; onGoToWorkouts: () => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [expandPlan, setExpandPlan] = useState(false);
  const score = scan.fitnessScore ?? 0;
  const scoreColor = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score >= 75 ? "🏆 Excelent" : score >= 50 ? "💪 Bun" : "🎯 În progres";

  let muscleDist: Record<string, string> = {};
  try { if (scan.muscleDistribution) muscleDist = JSON.parse(scan.muscleDistribution); } catch { }

  const hasPredictions = scan.predictedBodyFat30Days != null || scan.predictedBodyFat90Days != null;
  const hasMuscleDev = Object.keys(muscleDist).length >= 4;
  const hasWeakGroups = scan.weakMuscleGroups && scan.weakMuscleGroups.length > 0;

  const goalDate = scan.estimatedGoalDate ? new Date(scan.estimatedGoalDate) : null;
  const daysToGoal = goalDate ? Math.max(0, Math.ceil((goalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  const { data: allScans = [] } = useQuery<BodyScan[]>({ queryKey: ["/api/body-scans"] });
  const prev = allScans[1];

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">

      {/* === FITFORGE SCORE HEADER === */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-background to-muted/20 p-5">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/5 -translate-y-10 translate-x-10" />
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">FitForge Score</p>
            <div className="flex items-end gap-1 mt-0.5">
              <span className="text-6xl font-black leading-none" style={{ color: scoreColor }}>{score}</span>
              <span className="text-xl text-muted-foreground mb-1">/100</span>
            </div>
          </div>
          <div className="text-right space-y-1">
            <Badge className="text-xs font-semibold">{scoreLabel}</Badge>
            {scan.fitnessLevel && (
              <p className="text-xs text-muted-foreground">Nivel: <span className="font-semibold text-foreground capitalize">{scan.fitnessLevel}</span></p>
            )}
            {scan.bodyType && (
              <p className="text-xs text-muted-foreground">Tip: <span className="font-semibold text-foreground capitalize">{scan.bodyType}</span></p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {scan.bodyFatPercent != null && <ScoreRing value={scan.bodyFatPercent} max={45} label="% Grăsime" color="#3b82f6" unit="%" />}
          {scan.muscleScore != null && <ScoreRing value={scan.muscleScore} max={10} label="Muscle" color="#8b5cf6" />}
          {scan.postureScore != null && <ScoreRing value={scan.postureScore} max={10} label="Postură" color="#f59e0b" />}
          {scan.bmi != null && <ScoreRing value={Math.round(scan.bmi)} max={35} label="IMC" color="#22c55e" />}
        </div>
      </div>

      {/* === TRANSFORMATION PREDICTIONS === */}
      {hasPredictions && scan.bodyFatPercent != null && (
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-black text-sm">AI Transformation Prediction</p>
              <p className="text-[10px] text-muted-foreground">Dacă urmezi programul recomandat</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] text-muted-foreground w-14">Acum</span>
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-2.5 rounded-full bg-red-400 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (scan.bodyFatPercent / 45) * 100)}%` }} />
              </div>
              <span className="text-xs font-bold text-red-400 w-14 text-right">{scan.bodyFatPercent}%</span>
            </div>
            {scan.predictedBodyFat30Days != null && (
              <PredictionBar label="30 zile" current={scan.bodyFatPercent} predicted={scan.predictedBodyFat30Days} days={30} color="#f59e0b" />
            )}
            {scan.predictedBodyFat90Days != null && (
              <PredictionBar label="90 zile" current={scan.bodyFatPercent} predicted={scan.predictedBodyFat90Days} days={90} color="#22c55e" />
            )}
            {scan.predictedBodyFat180Days != null && (
              <PredictionBar label="180 zile" current={scan.bodyFatPercent} predicted={scan.predictedBodyFat180Days} days={180} color="#8b5cf6" />
            )}
          </div>

          {goalDate && daysToGoal != null && (
            <div className="flex items-center gap-3 bg-background/60 rounded-xl p-3 border border-primary/20">
              <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold">Data estimată a obiectivului</p>
                <p className="text-[10px] text-muted-foreground">{goalDate.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-primary leading-none">{daysToGoal}</p>
                <p className="text-[10px] text-muted-foreground">zile</p>
              </div>
            </div>
          )}

          {/* Viral Share Button */}
          <Button className="w-full mt-3 h-11 bg-gradient-to-r from-primary to-purple-600 text-white font-bold gap-2"
            onClick={onShare} data-testid="button-share-prediction">
            <Share2 className="w-4 h-4" /> Share predicția mea de transformare
          </Button>
        </div>
      )}

      {/* === MUSCLE DEVELOPMENT MAP === */}
      {(hasMuscleDev || (muscleDist.upper || muscleDist.lower || muscleDist.core)) && (
        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-bold mb-3 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-purple-500" /> Hartă Musculară
          </p>
          <div className="space-y-2.5">
            {hasMuscleDev ? (
              <>
                {muscleDist.chest && <MuscleBar label="Piept" level={muscleDist.chest} />}
                {muscleDist.back && <MuscleBar label="Spate" level={muscleDist.back} />}
                {muscleDist.shoulders && <MuscleBar label="Umeri" level={muscleDist.shoulders} />}
                {muscleDist.arms && <MuscleBar label="Brațe" level={muscleDist.arms} />}
                {muscleDist.core && <MuscleBar label="Core" level={muscleDist.core} />}
                {muscleDist.legs && <MuscleBar label="Picioare" level={muscleDist.legs} />}
              </>
            ) : (
              <>
                {muscleDist.upper && <MuscleBar label="Upper Body" level={muscleDist.upper} />}
                {muscleDist.core && <MuscleBar label="Core" level={muscleDist.core} />}
                {muscleDist.lower && <MuscleBar label="Lower Body" level={muscleDist.lower} />}
              </>
            )}
          </div>
        </div>
      )}

      {/* === WEAK MUSCLE GROUPS === */}
      {hasWeakGroups && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm font-bold mb-2 flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-4 h-4" /> Grupe Musculare Slabe
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {scan.weakMuscleGroups!.map((g, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-semibold border border-red-500/20 capitalize">
                {g}
              </span>
            ))}
          </div>
          <Button size="sm" className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white"
            onClick={onGoToWorkouts} data-testid="button-fix-weak-muscles">
            <Dumbbell className="w-3.5 h-3.5" /> Generează program pentru aceste zone
          </Button>
        </div>
      )}

      {/* === TRAINING PLAN CARDS === */}
      <div className="grid grid-cols-2 gap-3">
        {scan.recommendedTrainingSplit && (
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Split className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold">Training Split</span>
            </div>
            <p className="text-sm font-black">{SPLIT_LABELS[scan.recommendedTrainingSplit] || scan.recommendedTrainingSplit}</p>
            {scan.trainingFrequency && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{scan.trainingFrequency}x / săptămână</p>
            )}
          </div>
        )}
        {scan.recommendedCalories && (
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Utensils className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-bold">Calorii Recomandate</span>
            </div>
            <p className="text-sm font-black">{scan.recommendedCalories.toLocaleString()} kcal</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">per zi</p>
          </div>
        )}
      </div>

      {/* === POSTURE === */}
      {scan.postureScore != null && (
        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" /> Postură
            </p>
            <Badge variant="outline" className="text-xs">
              {scan.postureScore >= 8 ? "Excelentă" : scan.postureScore >= 5 ? "Bună" : "De îmbunătățit"}
            </Badge>
          </div>
          {scan.postureDetails && <p className="text-xs text-muted-foreground mb-2">{scan.postureDetails}</p>}
          {scan.postureIssues && scan.postureIssues.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {scan.postureIssues.map((issue, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium border border-amber-500/20">
                  {issue}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === STRENGTHS + IMPROVEMENTS === */}
      {((scan.strengths && scan.strengths.length > 0) || (scan.improvements && scan.improvements.length > 0)) && (
        <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
          {scan.strengths && scan.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-500 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Puncte forte
              </p>
              <div className="space-y-1.5">
                {scan.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span><span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {scan.improvements && scan.improvements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-500 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> De îmbunătățit
              </p>
              <div className="space-y-1.5">
                {scan.improvements.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" /><span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === ANALYSIS TEXT === */}
      {scan.analysis && (
        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-3">{scan.analysis}</p>
      )}

      {/* === AI RECOMMENDED PLAN === */}
      {scan.recommendedPlan && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <button onClick={() => setExpandPlan(!expandPlan)}
            className="flex items-center justify-between w-full text-sm font-bold text-primary" data-testid="button-toggle-plan">
            <span className="flex items-center gap-2"><Target className="w-4 h-4" /> Plan AI Personalizat</span>
            {expandPlan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandPlan && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{scan.recommendedPlan}</p>
          )}
        </div>
      )}

      {/* === ACTION BUTTONS === */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-11 gap-2" onClick={onNewScan} data-testid="button-new-scan">
          <Camera className="w-4 h-4" /> Nou Scan
        </Button>
        <Button className="h-11 gap-2" onClick={onGoToWorkouts} data-testid="button-go-workouts">
          <Dumbbell className="w-4 h-4" /> Antrenamente
        </Button>
      </div>

      {/* === BEFORE / AFTER === */}
      {prev && (
        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Progres față de scanul anterior
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {prev.bodyFatPercent != null && scan.bodyFatPercent != null && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Grăsime</p>
                <p className="text-xs text-muted-foreground">{prev.bodyFatPercent}%</p>
                <ArrowRight className="w-3 h-3 text-primary mx-auto my-0.5" />
                <p className="text-sm font-bold text-green-500">{scan.bodyFatPercent}%</p>
              </div>
            )}
            {prev.muscleScore != null && scan.muscleScore != null && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Mușchi</p>
                <p className="text-xs text-muted-foreground">{prev.muscleScore}/10</p>
                <ArrowRight className="w-3 h-3 text-primary mx-auto my-0.5" />
                <p className="text-sm font-bold text-green-500">{scan.muscleScore}/10</p>
              </div>
            )}
            {prev.fitnessScore != null && scan.fitnessScore != null && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Score</p>
                <p className="text-xs text-muted-foreground">{prev.fitnessScore}</p>
                <ArrowRight className="w-3 h-3 text-primary mx-auto my-0.5" />
                <p className="text-sm font-bold text-green-500">{scan.fitnessScore}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === SCAN HISTORY === */}
      {allScans.length > 1 && (
        <div className="rounded-2xl border border-border bg-muted/10 p-4">
          <button className="flex items-center justify-between w-full text-sm font-semibold"
            onClick={() => setShowHistory(!showHistory)} data-testid="button-toggle-history">
            <span className="flex items-center gap-2"><History className="w-4 h-4" /> Scan History ({allScans.length})</span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {allScans.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary">
                    {idx === 0 ? <Trophy className="w-4 h-4" /> : `D${(allScans.length - idx) * 30}`}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{new Date(s.createdAt!).toLocaleDateString("ro-RO")}</p>
                    {s.bodyFatPercent != null && <p className="text-[10px] text-muted-foreground">BF {s.bodyFatPercent}% · Score {s.fitnessScore}/100 {s.fitnessLevel ? `· ${s.fitnessLevel}` : ""}</p>}
                  </div>
                  <Badge variant="outline" className="text-[10px]">{s.fitnessScore ?? "—"}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type FlowStep = "goal" | "front-capture" | "front-preview" | "side-capture" | "side-preview" | "analyzing" | "done";

export default function BodyScanPage() {
  const { tx } = useLang();
  const { toast } = useToast();
  const handleProError = useProGate();
  const { share } = useMobile();
  const [, navigate] = useLocation();
  const frontFileRef = useRef<HTMLInputElement>(null);
  const frontCamRef = useRef<HTMLInputElement>(null);
  const sideFileRef = useRef<HTMLInputElement>(null);
  const sideCamRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<FlowStep>("goal");
  const [selectedGoal, setSelectedGoal] = useState("general_fitness");
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [sidePhoto, setSidePhoto] = useState<string | null>(null);

  const { data: scans = [], isLoading: scansLoading } = useQuery<BodyScan[]>({ queryKey: ["/api/body-scans"] });
  const latestScan = scans[0];

  const scanMutation = useMutation({
    mutationFn: async ({ front, side }: { front: string; side: string | null }) => {
      setStep("analyzing");
      return apiRequest<BodyScan>("POST", "/api/body-scan", {
        frontImageBase64: front,
        sideImageBase64: side || undefined,
        goalType: selectedGoal,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/body-scans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/body-scans/latest"] });
      toast({ title: "✅ AI Transformation Engine complet!", description: "Analiza și predicțiile au fost generate. +50 puncte!" });
      navigate("/transformation-report");
    },
    onError: (err: any) => {
      if (handleProError(err)) return;
      setStep("front-capture");
      toast({ title: "Eroare analiză", description: err.message || "Încearcă din nou.", variant: "destructive" });
    },
  });

  const handleFrontCapture = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    try {
      const compressed = await compressImage(file);
      setFrontPhoto(compressed);
      setStep("front-preview");
    } catch { toast({ title: "Eroare", description: "Nu s-a putut citi imaginea.", variant: "destructive" }); }
  }, [toast]);

  const handleSideCapture = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    try {
      const compressed = await compressImage(file);
      setSidePhoto(compressed);
      setStep("side-preview");
    } catch { toast({ title: "Eroare", description: "Nu s-a putut citi imaginea.", variant: "destructive" }); }
  }, [toast]);

  const startAnalysis = () => {
    if (!frontPhoto) return;
    scanMutation.mutate({ front: frontPhoto, side: sidePhoto });
  };

  const handleShare = (scan: BodyScan) => {
    const pred30 = scan.predictedBodyFat30Days;
    const pred90 = scan.predictedBodyFat90Days;
    const text = pred90
      ? `🔥 AI Body Scan pe FitForge!\n\nAcum: ${scan.bodyFatPercent}% grăsime\n30 zile → ${pred30}%\n90 zile → ${pred90}%\n\nTyp corp: ${scan.bodyType || "—"} | Nivel: ${scan.fitnessLevel || "—"}\n💪 Încearcă și tu analiza AI gratuită!`
      : `🔥 FitForge Score: ${scan.fitnessScore}/100 | Grăsime: ${scan.bodyFatPercent}% | Tip: ${scan.bodyType || "—"}\n💪 Analizează-ți corpul gratuit pe FitForge AI!`;
    share({
      title: "🔥 AI Transformation Prediction — FitForge",
      text,
      url: window.location.origin + "/body-scan",
    });
  };

  const resetFlow = () => {
    setStep("goal");
    setFrontPhoto(null);
    setSidePhoto(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black">AI Transformation Engine</h1>
            <p className="text-sm text-muted-foreground">Body scan + predicții 30/90/180 zile</p>
          </div>
        </div>

        {/* Goal Selection */}
        {step === "goal" && (
          <div className="animate-in fade-in-0 duration-300 space-y-5">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs gap-1"><Zap className="w-3 h-3" /> Body Fat %</Badge>
              <Badge variant="secondary" className="text-xs gap-1"><Dumbbell className="w-3 h-3" /> Hartă Musculară</Badge>
              <Badge variant="secondary" className="text-xs gap-1"><TrendingUp className="w-3 h-3" /> Predicții AI</Badge>
              <Badge variant="secondary" className="text-xs gap-1"><Calendar className="w-3 h-3" /> Data Obiectiv</Badge>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Obiectivul tău</p>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map(g => (
                  <button key={g.value} onClick={() => setSelectedGoal(g.value)} data-testid={`button-goal-${g.value}`}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium border transition-all ${
                      selectedGoal === g.value
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/30 border-border hover:border-primary/40"
                    }`}>
                    <span className="text-base">{g.emoji}</span> {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Ce generează AI-ul</p>
              <div className="space-y-2">
                {[
                  { n: "1", t: "Body composition", d: "Body fat, fitness level, tip corp" },
                  { n: "2", t: "Hartă musculară", d: "Piept, spate, umeri, brațe, core, picioare" },
                  { n: "3", t: "Predicții transformare", d: "BF% în 30, 90 și 180 de zile" },
                  { n: "4", t: "Plan complet", d: "Training split, calorii, program" },
                ].map(item => (
                  <div key={item.n} className="flex items-start gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{item.n}</span>
                    <div><span className="font-semibold">{item.t}</span><span className="text-muted-foreground"> — {item.d}</span></div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-base gap-2"
              onClick={() => setStep("front-capture")} data-testid="button-start-scan">
              <Camera className="w-5 h-5" /> Start AI Transformation Scan
            </Button>

            {!scansLoading && latestScan && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Ultimul scan</p>
                  <span className="text-xs text-muted-foreground">{new Date(latestScan.createdAt!).toLocaleDateString("ro-RO")}</span>
                </div>
                <ScanResultFull scan={latestScan} onShare={() => handleShare(latestScan)} onNewScan={resetFlow} onGoToWorkouts={() => navigate("/workouts")} />
              </div>
            )}

            {!scansLoading && scans.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Primul tău scan! AI-ul va genera predicții complete de transformare. <span className="font-semibold text-primary">+50 puncte</span>
              </div>
            )}
          </div>
        )}

        {/* Front Photo Capture */}
        {step === "front-capture" && (
          <PhotoStep step={1} total={2} title="Poza din față" subtitle="FAȚĂ"
            instructions={["Stand straight", "Arms slightly away from body", "Full body visible", "Good lighting, simple background"]}
            silhouette={<SilhouetteFront />}
            onCapture={handleFrontCapture} fileRef={frontFileRef} cameraRef={frontCamRef} />
        )}

        {/* Front Photo Preview */}
        {step === "front-preview" && frontPhoto && (
          <PhotoPreview dataUrl={frontPhoto} label="Față"
            onRetake={() => { setFrontPhoto(null); setStep("front-capture"); }}
            onConfirm={() => setStep("side-capture")} />
        )}

        {/* Side Photo Capture */}
        {step === "side-capture" && (
          <div className="space-y-4">
            <PhotoStep step={2} total={2} title="Poza din lateral" subtitle="LATERAL"
              instructions={["Stai lateral față de cameră", "Picioarele împreunate", "Corpul complet vizibil", "Brațele pe lângă corp"]}
              silhouette={<SilhouetteSide />}
              onCapture={handleSideCapture} fileRef={sideFileRef} cameraRef={sideCamRef} />
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={startAnalysis} data-testid="button-skip-side">
              Sari peste → Analizează cu o singură poză
            </Button>
          </div>
        )}

        {/* Side Photo Preview */}
        {step === "side-preview" && sidePhoto && (
          <div className="space-y-3">
            <PhotoPreview dataUrl={sidePhoto} label="Lateral"
              onRetake={() => { setSidePhoto(null); setStep("side-capture"); }}
              onConfirm={startAnalysis} />
            {frontPhoto && (
              <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
                <img src={frontPhoto} alt="Față" className="w-12 h-16 object-cover rounded-lg" />
                <div>
                  <p className="text-xs font-semibold">Poza din față ✓</p>
                  <p className="text-xs text-muted-foreground">Capturată</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analyzing */}
        {step === "analyzing" && <AnalyzeAnimation />}

        {/* Done */}
        {step === "done" && latestScan && (
          <ScanResultFull scan={latestScan} onShare={() => handleShare(latestScan)} onNewScan={resetFlow} onGoToWorkouts={() => navigate("/workouts")} />
        )}
      </div>
    </div>
  );
}
