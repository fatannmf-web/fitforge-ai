import { useLang } from "@/i18n/useLang";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BodyScan } from "@shared/schema";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  Dumbbell, TrendingUp, Target, Activity, Calendar, Utensils,
  Flame, AlertTriangle, CheckCircle, ArrowRight, ChevronDown,
  ChevronUp, Split, Zap, Trophy, Star, User, Sparkles,
} from "lucide-react";

/* ─────────────────────────────────────────────────── helpers */
const SPLIT_LABELS: Record<string, string> = {
  full_body: "Full Body", upper_lower: "Upper / Lower",
  push_pull_legs: "Push Pull Legs", ppl: "Push Pull Legs", bro_split: "Bro Split",
};

const MUSCLE_VALUE: Record<string, number> = { weak: 28, moderate: 62, strong: 100 };
const MUSCLE_COLOR: Record<string, string> = {
  weak: "#ef4444", moderate: "#f59e0b", strong: "#22c55e",
};

function computeFitForgeScore(scan: BodyScan): number {
  let score = 0;
  if (scan.fitnessScore != null) score += scan.fitnessScore * 7;
  if (scan.postureScore != null) score += scan.postureScore * 20;
  if (scan.fitnessLevel === "advanced") score += 100;
  else if (scan.fitnessLevel === "intermediate") score += 50;
  const weakPenalty = (scan.weakMuscleGroups?.length ?? 0) * 30;
  return Math.max(0, Math.min(1000, Math.round(score - weakPenalty)));
}

function getScoreConfig(score: number) {
  if (score >= 750) return { label: "Elite", color: "#8b5cf6", tier: "🏆" };
  if (score >= 600) return { label: "Avansat", color: "#22c55e", tier: "💪" };
  if (score >= 400) return { label: "Intermediar", color: "#f59e0b", tier: "🎯" };
  return { label: "Începător", color: "#ef4444", tier: "🌱" };
}

/* ─────────────────────────────────────────────────── FitnessGauge */
function FitnessGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const cfg = getScoreConfig(score);
  const cx = 100, cy = 88, r = 72;
  const startAngle = 215;
  const totalAngle = 290;
  const pct = Math.max(0, Math.min(1, animated / 1000));
  const sweepAngle = pct * totalAngle;

  const polarToXY = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const arcPath = (startDeg: number, endDeg: number, rad: number) => {
    const s = polarToXY(startDeg, rad);
    const e = polarToXY(endDeg, rad);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${rad} ${rad} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const endAngle = startAngle + sweepAngle;
  const needlePt = polarToXY(startAngle + sweepAngle, r - 8);

  const ticks = [0, 250, 500, 750, 1000];
  const tickColors = ["#ef4444", "#f97316", "#f59e0b", "#22c55e", "#8b5cf6"];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 145" className="w-64 h-44">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="33%" stopColor="#f59e0b" />
            <stop offset="66%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Track */}
        <path d={arcPath(startAngle, startAngle + totalAngle, r)} fill="none"
          stroke="currentColor" strokeWidth="10" className="text-muted/20" strokeLinecap="round" />

        {/* Gradient rainbow track (faint) */}
        <path d={arcPath(startAngle, startAngle + totalAngle, r)} fill="none"
          stroke="url(#gaugeGrad)" strokeWidth="10" strokeLinecap="round" opacity="0.18" />

        {/* Active arc */}
        {sweepAngle > 2 && (
          <path d={arcPath(startAngle, endAngle, r)} fill="none"
            stroke={cfg.color} strokeWidth="10" strokeLinecap="round"
            filter="url(#gaugeGlow)"
            style={{ transition: "all 1.4s cubic-bezier(0.34,1.56,0.64,1)" }} />
        )}

        {/* Tick marks */}
        {ticks.map((t, i) => {
          const deg = startAngle + (t / 1000) * totalAngle;
          const inner = polarToXY(deg, r - 14);
          const outer = polarToXY(deg, r + 2);
          return (
            <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={tickColors[i]} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          );
        })}

        {/* Needle dot */}
        {sweepAngle > 2 && (
          <circle cx={needlePt.x} cy={needlePt.y} r="5" fill={cfg.color}
            style={{ filter: `drop-shadow(0 0 6px ${cfg.color}cc)`, transition: "all 1.4s cubic-bezier(0.34,1.56,0.64,1)" }} />
        )}

        {/* Center score */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="28" fontWeight="900"
          fill={cfg.color}>{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.5">/1000</text>
        <text x={cx} y={cy + 30} textAnchor="middle" fontSize="18">{cfg.tier}</text>

        {/* Labels */}
        <text x="24" y="130" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.4">0</text>
        <text x="176" y="130" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.4">1000</text>
      </svg>
      <Badge className="mt-1 text-sm px-4 py-1 font-bold"
        style={{ backgroundColor: `${cfg.color}1a`, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
        {cfg.label}
      </Badge>
    </div>
  );
}

/* ─────────────────────────────────────────────────── BodyFatBar */
function BodyFatBar({ value, goal, label }: { value: number; goal?: number; label?: string }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 200);
    return () => clearTimeout(t);
  }, [value]);

  const max = 45;
  const pct = Math.min(100, (animated / max) * 100);
  const idealMin = 10, idealMax = 20;
  const idealMinPct = (idealMin / max) * 100;
  const idealMaxPct = (idealMax / max) * 100;

  const getZoneColor = (v: number) => {
    if (v < 8) return "#60a5fa";
    if (v < 14) return "#22c55e";
    if (v < 20) return "#4ade80";
    if (v < 25) return "#f59e0b";
    if (v < 32) return "#fb923c";
    return "#ef4444";
  };

  const barColor = getZoneColor(value);
  const zones = [
    { label: "Atletic", end: (14 / max) * 100, color: "#22c55e33" },
    { label: "Fitness", end: (20 / max) * 100, color: "#4ade8022" },
    { label: "Acceptabil", end: (28 / max) * 100, color: "#f59e0b22" },
    { label: "Obez", end: 100, color: "#ef444422" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label || "Body Fat %"}</span>
        <span className="text-sm font-black" style={{ color: barColor }}>{value}%</span>
      </div>

      {/* Bar */}
      <div className="relative h-5 rounded-full overflow-hidden bg-muted/30">
        {/* Zone segments */}
        {zones.map((z, i) => {
          const prev = i === 0 ? 0 : zones[i - 1].end;
          return (
            <div key={i} className="absolute top-0 bottom-0 transition-all"
              style={{ left: `${prev}%`, width: `${z.end - prev}%`, backgroundColor: z.color }} />
          );
        })}
        {/* Ideal zone overlay */}
        <div className="absolute top-1 bottom-1 rounded-full border border-green-500/60"
          style={{ left: `${idealMinPct}%`, width: `${idealMaxPct - idealMinPct}%`, backgroundColor: "#22c55e18" }} />

        {/* Fill bar */}
        <div className="absolute top-0 bottom-0 left-0 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: barColor, boxShadow: `0 0 12px ${barColor}88`, transition: "width 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}>
          {/* Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>

        {/* Goal marker */}
        {goal != null && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-purple-500"
            style={{ left: `${Math.min(100, (goal / max) * 100)}%` }} />
        )}
      </div>

      {/* Zone labels */}
      <div className="flex text-[8px] text-muted-foreground/60">
        <span style={{ width: `${(14 / max) * 100}%` }}>Atletic</span>
        <span style={{ width: `${((20 - 14) / max) * 100}%` }}>Fitness</span>
        <span style={{ width: `${((28 - 20) / max) * 100}%` }}>Acceptabil</span>
        <span className="flex-1 text-right">Obez</span>
      </div>

      {goal != null && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
          Țintă: {goal}% <ArrowRight className="w-2.5 h-2.5" />
          <span className="text-green-500 font-semibold">-{Math.max(0, value - goal)}% de redus</span>
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────── PredictionChart */
function PredictionChart({ scan }: { scan: BodyScan }) {
  const bf = scan.bodyFatPercent ?? 0;
  const data = [
    { day: "Acum", bf, label: "Acum" },
    ...(scan.predictedBodyFat30Days != null ? [{ day: "30 zile", bf: scan.predictedBodyFat30Days, label: "30d" }] : []),
    ...(scan.predictedBodyFat90Days != null ? [{ day: "90 zile", bf: scan.predictedBodyFat90Days, label: "90d" }] : []),
    ...(scan.predictedBodyFat180Days != null ? [{ day: "180 zile", bf: scan.predictedBodyFat180Days, label: "180d" }] : []),
  ];

  if (data.length < 2) return null;

  const min = Math.max(0, Math.min(...data.map(d => d.bf)) - 3);
  const max = Math.max(...data.map(d => d.bf)) + 3;
  const goalDate = scan.estimatedGoalDate ? new Date(scan.estimatedGoalDate) : null;
  const daysToGoal = goalDate ? Math.max(0, Math.ceil((goalDate.getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-black text-sm">Predicție Transformare</p>
            <p className="text-[10px] text-muted-foreground">Urmând planul AI recomandat</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-green-500 leading-none">
            -{Math.max(0, bf - (scan.predictedBodyFat180Days ?? bf)).toFixed(1)}%
          </p>
          <p className="text-[9px] text-muted-foreground">în 180 zile</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="bfGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[min, max]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12, padding: "8px 12px" }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
            formatter={(v: any) => [`${v}%`, "Body Fat"]}
          />
          <Area type="monotone" dataKey="bf" stroke="#22c55e" strokeWidth={2.5}
            fill="url(#bfGradient)" dot={{ fill: "#22c55e", r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#22c55e", stroke: "#22c55e44", strokeWidth: 4 }} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Milestones */}
      <div className="grid grid-cols-4 gap-1.5 mt-3">
        {data.map((d, i) => (
          <div key={i} className={`rounded-xl p-2 text-center border ${i === 0 ? "border-red-500/30 bg-red-500/5" : "border-green-500/20 bg-green-500/5"}`}>
            <p className="text-[9px] text-muted-foreground leading-tight">{d.day}</p>
            <p className={`text-sm font-black leading-none mt-0.5 ${i === 0 ? "text-red-500" : "text-green-500"}`}>{d.bf}%</p>
            {i > 0 && d.bf < bf && <p className="text-[8px] text-green-600 font-semibold">-{(bf - d.bf).toFixed(1)}</p>}
          </div>
        ))}
      </div>

      {goalDate && daysToGoal != null && (
        <div className="mt-3 flex items-center gap-3 bg-background/60 rounded-xl p-3 border border-primary/20">
          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold">Data obiectivului</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {goalDate.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-black text-primary leading-none">{daysToGoal}</p>
            <p className="text-[9px] text-muted-foreground">zile</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────── MuscleRadar */
const MUSCLE_KEYS = [
  { key: "chest",     label: "Piept" },
  { key: "back",      label: "Spate" },
  { key: "shoulders", label: "Umeri" },
  { key: "arms",      label: "Brațe" },
  { key: "core",      label: "Core" },
  { key: "legs",      label: "Picioare" },
];

function MuscleRadar({ muscleDev, weakGroups }: { muscleDev: Record<string, string>; weakGroups: Set<string> }) {
  const data = MUSCLE_KEYS.map(({ key, label }) => {
    const level = muscleDev[key] || muscleDev[key.charAt(0).toUpperCase() + key.slice(1)] || "moderate";
    return {
      subject: label,
      key,
      value: MUSCLE_VALUE[level] ?? 62,
      level,
      fullMark: 100,
    };
  }).filter(d => d.value != null);

  if (data.length === 0) return null;

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isWeak = weakGroups.has(payload.key);
    if (!cx || !cy) return null;
    return (
      <circle cx={cx} cy={cy} r={isWeak ? 5 : 3}
        fill={isWeak ? "#ef4444" : "#22c55e"}
        stroke={isWeak ? "#ef444444" : "#22c55e44"} strokeWidth={isWeak ? 4 : 2} />
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-muted/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Dumbbell className="w-3.5 h-3.5 text-purple-500" />
        </div>
        <div>
          <p className="text-sm font-black">Muscle Balance Radar</p>
          <p className="text-[10px] text-muted-foreground">Distribuție forță pe grupe musculare</p>
        </div>
      </div>

      {weakGroups.size > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-[10px] text-red-500 font-semibold">
            Puncte slabe: {Array.from(weakGroups).join(", ")}
          </p>
        </div>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
          <defs>
            <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="subject"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9.5, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Mușchi" dataKey="value" stroke="#22c55e" strokeWidth={2}
            fill="url(#radarGrad)" dot={<CustomDot />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-1.5 mt-1">
        {data.map(({ subject, key, level }) => {
          const isWeak = weakGroups.has(key);
          const col = MUSCLE_COLOR[level] ?? "#f59e0b";
          const labels: Record<string, string> = { weak: "Slab", moderate: "Mediu", strong: "Puternic" };
          return (
            <div key={key} className={`rounded-lg p-2 border text-center ${isWeak ? "border-red-500/30 bg-red-500/5" : "border-border bg-muted/20"}`}>
              <p className="text-[9px] text-muted-foreground mb-0.5">{subject}</p>
              <p className="text-[10px] font-black" style={{ color: col }}>{labels[level] || level}</p>
              {isWeak && <AlertTriangle className="w-2.5 h-2.5 text-red-500 mx-auto mt-0.5" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────── BodySilhouette */
function BodySilhouette({ bodyFat, color, size = "md" }: { bodyFat: number; color: string; size?: "sm" | "md" | "lg" }) {
  const fatFactor = Math.max(0, Math.min(1, (bodyFat - 8) / 28));
  const cx = 50;
  const shoulderW = 42;
  const waistW = 22 + fatFactor * 28;
  const hipW = 36 + fatFactor * 20;
  const bellyBulge = fatFactor * 18;
  const armStroke = 8 + fatFactor * 4;
  const legStroke = 14 + fatFactor * 7;
  const defOpacity = Math.max(0, Math.min(1, (20 - bodyFat) / 10));
  const fatOpacity = fatFactor * 0.32;
  const ls = cx - shoulderW / 2;
  const rs = cx + shoulderW / 2;
  const lw = cx - waistW / 2;
  const rw = cx + waistW / 2;
  const lh = cx - hipW / 2;
  const rh = cx + hipW / 2;
  const uid = `bf${Math.round(bodyFat * 10)}${color.replace("#", "")}`;
  const dimClass = size === "lg" ? "w-28 h-56" : size === "sm" ? "w-14 h-28" : "w-20 h-44";

  return (
    <svg viewBox="0 0 100 225" className={`${dimClass} mx-auto`}>
      <defs>
        <linearGradient id={`bg${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.60" />
        </linearGradient>
        <filter id={`glow${uid}`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Head */}
      <ellipse cx={cx} cy="15" rx="13" ry="14" fill={`url(#bg${uid})`} />
      {/* Neck */}
      <rect x={cx - 5.5} y="27" width="11" height="11" rx="2" fill={`url(#bg${uid})`} />

      {/* Torso */}
      <path d={`M ${ls} 38 C ${ls - 6} 56,${lw - bellyBulge} 76,${lw} 94 C ${lh} 110,${lh} 124,${lh} 136 L ${rh} 136 C ${rh} 124,${rh} 110,${rw} 94 C ${rw + bellyBulge} 76,${rs + 6} 56,${rs} 38 Z`}
        fill={`url(#bg${uid})`} />

      {/* Arms */}
      <path d={`M ${ls} 44 C ${ls - 10} 62,${ls - 13} 88,${ls - 9} 110`}
        stroke={`url(#bg${uid})`} strokeWidth={armStroke} strokeLinecap="round" fill="none" />
      <path d={`M ${rs} 44 C ${rs + 10} 62,${rs + 13} 88,${rs + 9} 110`}
        stroke={`url(#bg${uid})`} strokeWidth={armStroke} strokeLinecap="round" fill="none" />

      {/* Legs */}
      <path d={`M ${lh + 7} 136 C ${lh + 3} 166,${cx - 14} 186,${cx - 11} 222`}
        stroke={`url(#bg${uid})`} strokeWidth={legStroke} strokeLinecap="round" fill="none" />
      <path d={`M ${rh - 7} 136 C ${rh - 3} 166,${cx + 14} 186,${cx + 11} 222`}
        stroke={`url(#bg${uid})`} strokeWidth={legStroke} strokeLinecap="round" fill="none" />

      {/* Muscle definition (visible below ~20% BF) */}
      {defOpacity > 0.08 && (
        <g opacity={defOpacity} filter={`url(#glow${uid})`}>
          <path d={`M ${cx} 49 L ${cx} 67`} stroke="white" strokeWidth="0.65" strokeLinecap="round" opacity="0.55" />
          <path d={`M ${cx - 11} 51 Q ${cx - 3} 60 ${cx} 67`} stroke="white" strokeWidth="0.55" fill="none" opacity="0.42" />
          <path d={`M ${cx + 11} 51 Q ${cx + 3} 60 ${cx} 67`} stroke="white" strokeWidth="0.55" fill="none" opacity="0.42" />
          <line x1={cx - 7} y1={73} x2={cx + 7} y2={73} stroke="white" strokeWidth="0.55" opacity="0.48" />
          <line x1={cx - 7} y1={81} x2={cx + 7} y2={81} stroke="white" strokeWidth="0.55" opacity="0.45" />
          <line x1={cx - 7} y1={89} x2={cx + 7} y2={89} stroke="white" strokeWidth="0.55" opacity="0.40" />
          <line x1={cx} y1={67} x2={cx} y2={97} stroke="white" strokeWidth="0.5" opacity="0.35" />
          <path d={`M ${ls + 5} 41 Q ${cx - 8} 46 ${cx} 51`} stroke="white" strokeWidth="0.5" fill="none" opacity="0.32" />
          <path d={`M ${rs - 5} 41 Q ${cx + 8} 46 ${cx} 51`} stroke="white" strokeWidth="0.5" fill="none" opacity="0.32" />
        </g>
      )}

      {/* Fat overlay */}
      {fatOpacity > 0.02 && (
        <>
          <ellipse cx={cx} cy="78" rx={waistW / 2 + 9} ry="23" fill="#f97316" opacity={fatOpacity} />
          <ellipse cx={cx} cy="63" rx={waistW / 2 + 4} ry="13" fill="#f97316" opacity={fatOpacity * 0.55} />
        </>
      )}
    </svg>
  );
}

/* body-fat zone label */
function bfLabel(bf: number) {
  if (bf < 8)  return { text: "Prea slab",   bg: "bg-blue-500/20",   text_c: "text-blue-500"  };
  if (bf < 14) return { text: "Atletic",      bg: "bg-green-500/20",  text_c: "text-green-500" };
  if (bf < 20) return { text: "Fitness",      bg: "bg-emerald-500/20",text_c: "text-emerald-500"};
  if (bf < 25) return { text: "Acceptabil",   bg: "bg-amber-500/20",  text_c: "text-amber-500" };
  if (bf < 32) return { text: "Supraponderal",bg: "bg-orange-500/20", text_c: "text-orange-500"};
  return       { text: "Obez",               bg: "bg-red-500/20",    text_c: "text-red-500"   };
}

/* ─────────────────────────────────────────────────── FutureBodySection */
function FutureBodySection({ scan }: { scan: BodyScan }) {
  const now  = scan.bodyFatPercent ?? null;
  const bf30  = scan.predictedBodyFat30Days  ?? null;
  const bf90  = scan.predictedBodyFat90Days  ?? null;
  const bf180 = scan.predictedBodyFat180Days ?? null;

  if (now == null || (bf30 == null && bf90 == null && bf180 == null)) return null;

  const finalBF = bf180 ?? bf90 ?? bf30 ?? now;
  const totalLoss = Math.max(0, now - finalBF);
  const timeLabel = bf180 != null ? "6 luni" : bf90 != null ? "3 luni" : "1 lună";

  const milestones = [
    { label: "Acum",     bf: now,   color: "#ef4444", dayLabel: "Zi 0"   },
    ...(bf30  != null ? [{ label: "30 zile",  bf: bf30,  color: "#f59e0b", dayLabel: "Luna 1" }] : []),
    ...(bf90  != null ? [{ label: "90 zile",  bf: bf90,  color: "#22c55e", dayLabel: "Luna 3" }] : []),
    ...(bf180 != null ? [{ label: "180 zile", bf: bf180, color: "#8b5cf6", dayLabel: "6 Luni" }] : []),
  ];

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5 p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-purple-500" />
          </div>
          <div>
            <p className="font-black text-sm flex items-center gap-1.5">
              Your Future Body <span className="text-purple-400">✨</span>
            </p>
            <p className="text-[10px] text-muted-foreground">Simulare AI — urmând planul recomandat</p>
          </div>
        </div>
        {totalLoss > 0 && (
          <div className="text-right">
            <p className="text-xl font-black text-green-500 leading-none">-{totalLoss.toFixed(1)}%</p>
            <p className="text-[9px] text-muted-foreground">în {timeLabel}</p>
          </div>
        )}
      </div>

      {/* ── BEFORE / AFTER big comparison ── */}
      <div className="relative">
        <div className="grid grid-cols-2 gap-3">
          {/* NOW card */}
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3 flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-2 self-start">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">Acum</span>
            </div>
            <BodySilhouette bodyFat={now} color="#ef4444" size="lg" />
            <div className="mt-2 text-center">
              <p className="text-3xl font-black text-red-500 leading-none">{now}%</p>
              <p className="text-[9px] text-muted-foreground">grăsime corporală</p>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${bfLabel(now).bg} ${bfLabel(now).text_c}`}>
                {bfLabel(now).text}
              </span>
            </div>
          </div>

          {/* FUTURE card */}
          <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-3 flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-2 self-start">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider">{timeLabel}</span>
            </div>
            <BodySilhouette bodyFat={finalBF} color="#8b5cf6" size="lg" />
            <div className="mt-2 text-center">
              <p className="text-3xl font-black text-purple-500 leading-none">{finalBF}%</p>
              <p className="text-[9px] text-muted-foreground">grăsime corporală</p>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${bfLabel(finalBF).bg} ${bfLabel(finalBF).text_c}`}>
                {bfLabel(finalBF).text}
              </span>
            </div>
          </div>
        </div>

        {/* VS badge in center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-9 h-9 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-xl">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* ── JOURNEY MILESTONES ── */}
      {milestones.length > 2 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Progres Lunar</p>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 right-8 top-9 h-0.5 bg-gradient-to-r from-red-400 via-amber-400 via-green-400 to-purple-400 opacity-30" />
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${milestones.length}, 1fr)` }}>
              {milestones.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 relative z-10">
                  <BodySilhouette bodyFat={m.bf} color={m.color} size="sm" />
                  <div className="w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center"
                    style={{ borderColor: m.color }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black leading-none" style={{ color: m.color }}>{m.bf}%</p>
                    <p className="text-[8px] text-muted-foreground">{m.label}</p>
                    {i > 0 && m.bf < now && (
                      <p className="text-[8px] font-bold text-green-500">-{(now - m.bf).toFixed(1)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BODY COMPOSITION BARS ── */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Compoziție Corporală</p>
        <div className="space-y-2">
          {milestones.map((m, i) => {
            const musclePct = Math.min(50, Math.max(30, 48 - m.bf * 0.4));
            const otherPct  = Math.max(0, 100 - m.bf - musclePct);
            return (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-semibold" style={{ color: m.color }}>{m.label}</span>
                  <span className="text-[9px] text-muted-foreground">{m.bf}% grăsime</span>
                </div>
                <div className="h-4 rounded-full overflow-hidden flex">
                  {/* Fat segment */}
                  <div className="h-full flex items-center justify-center text-[7px] text-white font-bold"
                    style={{ width: `${m.bf}%`, backgroundColor: m.color, minWidth: m.bf > 5 ? undefined : 0 }}>
                    {m.bf >= 10 ? `${m.bf}%` : ""}
                  </div>
                  {/* Muscle segment */}
                  <div className="h-full bg-blue-500/70 flex items-center justify-center text-[7px] text-white font-bold"
                    style={{ width: `${musclePct}%` }}>
                    {musclePct >= 12 ? `${Math.round(musclePct)}% m` : ""}
                  </div>
                  {/* Other (water/bone) */}
                  <div className="h-full bg-muted flex-1" />
                </div>
              </div>
            );
          })}
          <div className="flex gap-3 mt-1.5">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500" /><span className="text-[8px] text-muted-foreground">Grăsime</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-blue-500/70" /><span className="text-[8px] text-muted-foreground">Masă musculară</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-muted border border-border" /><span className="text-[8px] text-muted-foreground">Apă / Oase</span></div>
          </div>
        </div>
      </div>

      {/* ── DELTA SUMMARY ── */}
      {totalLoss > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 p-3.5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-green-500">Transformare vizuală estimată</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Vei pierde <span className="font-bold text-green-500">{totalLoss.toFixed(1)}% grăsime corporală</span> în {timeLabel} urmând planul AI.
              Corpul tău va arăta semnificativ mai definit și mai atletic.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────── SummaryCard */
function SummaryCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: any; color: string; sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-base font-black capitalize">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────── PAGE */
export default function TransformationReportPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showDetails, setShowDetails] = useState(false);

  const { data: scan, isLoading } = useQuery<BodyScan | null>({
    queryKey: ["/api/body-scans/latest"],
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/body-scan/generate-workout"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "✅ Plan AI generat!",
        description: `${data.count} antrenamente personalizate create bazate pe Body Scan-ul tău.`,
      });
      navigate("/workouts");
    },
    onError: (err: any) => {
      toast({ title: "Eroare", description: err.message || "Nu s-a putut genera planul.", variant: "destructive" });
    },
  });

  const handleMeetCoach = () => {
    if (scan) {
      try {
        sessionStorage.setItem("fitforge_scan_context", JSON.stringify({
          bodyFatPercent: scan.bodyFatPercent,
          fitnessLevel: scan.fitnessLevel,
          goalType: (scan as any).goalType,
          weakMuscleGroups: scan.weakMuscleGroups,
          fitnessScore: scan.fitnessScore,
          predictedBodyFat30Days: scan.predictedBodyFat30Days,
          predictedBodyFat180Days: scan.predictedBodyFat180Days,
        }));
      } catch {}
    }
    navigate("/ai-coach");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 border-4 border-t-primary border-muted rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Se încarcă raportul...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-black">Niciun Body Scan</h2>
          <p className="text-sm text-muted-foreground">Completează un Body Scan pentru a vedea raportul de transformare.</p>
          <Button className="w-full gap-2" onClick={() => navigate("/body-scan")} data-testid="button-go-to-scan">
            <Zap className="w-4 h-4" /> Mergi la Body Scan
          </Button>
        </div>
      </div>
    );
  }

  const fitForgeScore = computeFitForgeScore(scan);
  const scoreCfg = getScoreConfig(fitForgeScore);

  let muscleDev: Record<string, string> = {};
  try { if (scan.muscleDistribution) muscleDev = JSON.parse(scan.muscleDistribution); } catch { }

  const weakGroups = new Set(scan.weakMuscleGroups ?? []);
  const hasPredictions = scan.predictedBodyFat30Days != null || scan.predictedBodyFat90Days != null;
  const hasMuscles = Object.keys(muscleDev).length > 0;

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* ── HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight">AI Transformation Report</h1>
              <p className="text-[10px] text-muted-foreground">
                Generat {new Date(scan.createdAt!).toLocaleDateString("ro-RO", { day: "numeric", month: "long" })}
              </p>
            </div>
          </div>
          <Badge style={{ backgroundColor: `${scoreCfg.color}1a`, color: scoreCfg.color, border: `1px solid ${scoreCfg.color}44` }}
            className="text-xs font-bold px-2 py-0.5">{scoreCfg.tier} {scoreCfg.label}
          </Badge>
        </div>

        {/* ── SECTION 1: FITNESS SCORE GAUGE */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-background to-muted/20 p-5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-center mb-1">
            FitForge Score
          </p>
          <div className="flex justify-center">
            <FitnessGauge score={fitForgeScore} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-1">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Fitness</p>
              <p className="text-lg font-black" style={{ color: scoreCfg.color }}>{scan.fitnessScore ?? "—"}</p>
              <p className="text-[9px] text-muted-foreground">/100</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-[10px] text-muted-foreground mb-1">Postură</p>
              <p className="text-lg font-black text-amber-500">{scan.postureScore ?? "—"}</p>
              <p className="text-[9px] text-muted-foreground">/10</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Mușchi</p>
              <p className="text-lg font-black text-purple-500">{scan.muscleScore ?? "—"}</p>
              <p className="text-[9px] text-muted-foreground">/10</p>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: BODY FAT PROGRESS BAR */}
        {scan.bodyFatPercent != null && (
          <div className="rounded-2xl border border-border bg-muted/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-black">Body Fat Analysis</p>
                <p className="text-[10px] text-muted-foreground">Estimare AI din Body Scan</p>
              </div>
            </div>
            <BodyFatBar
              value={scan.bodyFatPercent}
              goal={scan.predictedBodyFat180Days ?? undefined}
              label="Procent corp gras"
            />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-xl bg-muted/30 p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Acum</p>
                <p className="text-2xl font-black text-red-500">{scan.bodyFatPercent}%</p>
              </div>
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Obiectiv 6 luni</p>
                <p className="text-2xl font-black text-green-500">{scan.predictedBodyFat180Days ?? "—"}%</p>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 3: TRANSFORMATION SUMMARY */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Transformation Summary
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {scan.fitnessLevel && (
              <SummaryCard label="Nivel Fitness" value={scan.fitnessLevel} icon={Star}
                color="#f59e0b" sub={scan.fitnessLevel === "advanced" ? "Top 20%" : scan.fitnessLevel === "intermediate" ? "Top 50%" : "În creștere"} />
            )}
            {scan.bodyType && (
              <SummaryCard label="Tip Corp" value={scan.bodyType} icon={Target}
                color="#8b5cf6" sub="Analiză AI vizuală" />
            )}
            {scan.bmi != null && (
              <SummaryCard label="IMC" value={`${scan.bmi.toFixed(1)}`} icon={Activity}
                color="#22c55e" sub={scan.bmi < 18.5 ? "Sub normă" : scan.bmi < 25 ? "Normal" : scan.bmi < 30 ? "Supraponderal" : "Obez"} />
            )}
            {scan.fitnessScore != null && (
              <SummaryCard label="Fitness Score" value={`${scan.fitnessScore}/100`} icon={Trophy}
                color={scoreCfg.color} sub={`FitForge: ${fitForgeScore}/1000`} />
            )}
          </div>
        </div>

        {/* ── SECTION 4: PREDICTION CHART */}
        {hasPredictions && scan.bodyFatPercent != null && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Predicție Transformare
            </h2>
            <PredictionChart scan={scan} />
          </div>
        )}

        {/* ── SECTION 4b: AI FUTURE BODY */}
        <FutureBodySection scan={scan} />

        {/* ── SECTION 5: MUSCLE RADAR */}
        {hasMuscles && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Dumbbell className="w-3.5 h-3.5" /> Muscle Balance
            </h2>
            <MuscleRadar muscleDev={muscleDev} weakGroups={weakGroups} />
          </div>
        )}

        {/* ── SECTION 6: RECOMMENDED PLAN */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Split className="w-3.5 h-3.5" /> Plan Recomandat
          </h2>
          <div className="space-y-2.5">
            {scan.recommendedTrainingSplit && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Split className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Training Split</p>
                  <p className="text-base font-black">{SPLIT_LABELS[scan.recommendedTrainingSplit] || scan.recommendedTrainingSplit}</p>
                  {scan.trainingFrequency && (
                    <p className="text-[10px] text-muted-foreground">{scan.trainingFrequency}× / săptămână</p>
                  )}
                </div>
              </div>
            )}
            {scan.recommendedCalories && (
              <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Utensils className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Calorii Zilnice</p>
                  <p className="text-base font-black">{scan.recommendedCalories.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kcal/zi</span></p>
                  <p className="text-[10px] text-muted-foreground">Target pentru: {scan.goalType || "general"}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── POSTURE + DETAILS COLLAPSIBLE */}
        {(scan.postureDetails || scan.analysis || (scan.strengths && scan.strengths.length > 0)) && (
          <div className="rounded-2xl border border-border bg-muted/10">
            <button className="flex items-center justify-between w-full p-4 text-sm font-bold"
              onClick={() => setShowDetails(!showDetails)} data-testid="button-toggle-details">
              <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-amber-500" /> Analiză Detaliată</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showDetails && (
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                {scan.postureDetails && (
                  <div>
                    <p className="text-xs font-semibold text-amber-500 mb-1 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Postură
                    </p>
                    <p className="text-sm text-muted-foreground">{scan.postureDetails}</p>
                    {scan.postureIssues && scan.postureIssues.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {scan.postureIssues.map((issue, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium border border-amber-500/20">{issue}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {scan.analysis && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{scan.analysis}</p>
                )}
                {scan.strengths && scan.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-500 mb-1.5 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Puncte forte
                    </p>
                    {scan.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm mb-1">
                        <span className="text-green-500 flex-shrink-0">✓</span><span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {scan.improvements && scan.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-orange-500 mb-1.5 flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5" /> De îmbunătățit
                    </p>
                    {scan.improvements.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm mb-1">
                        <ArrowRight className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" /><span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {scan.recommendedPlan && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Recomandare AI Personalizată
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{scan.recommendedPlan}</p>
          </div>
        )}

        {/* ── FLOW INDICATOR */}
        <div className="rounded-xl bg-muted/30 p-4 border border-border">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider text-center mb-3">Product Engine Flow</p>
          <div className="flex items-center justify-center gap-2 text-[10px] flex-wrap">
            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 font-bold">✓ Body Scan</span>
            <ArrowRight className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
            <span className="px-2 py-1 rounded-full bg-primary/20 text-primary font-bold">✓ Raport AI</span>
            <ArrowRight className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
            <span className="px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 font-bold">Plan Workout</span>
            <ArrowRight className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
            <span className="px-2 py-1 rounded-full bg-muted border border-border text-muted-foreground font-bold">Daily Training</span>
          </div>
        </div>

      </div>

      {/* ── STICKY CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-3 pb-6 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-lg mx-auto space-y-2">
          {/* Primary: Meet AI Coach */}
          <Button
            className="w-full h-14 text-base font-black gap-3 bg-gradient-to-r from-emerald-500 to-primary hover:from-emerald-400 hover:to-primary/90 text-white shadow-2xl shadow-emerald-500/20"
            onClick={handleMeetCoach}
            data-testid="button-meet-ai-coach"
          >
            <Sparkles className="w-5 h-5" />
            Pornește cu AI Coach
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
          {/* Secondary row */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs gap-1.5"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              data-testid="button-generate-workout-plan"
            >
              {generateMutation.isPending ? (
                <div className="w-3 h-3 border border-foreground/30 border-t-foreground rounded-full animate-spin" />
              ) : (
                <Dumbbell className="w-3 h-3" />
              )}
              Generează Plan
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={() => navigate("/body-scan")} data-testid="button-back-to-scan">
              <Zap className="w-3 h-3" /> Nou Scan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
