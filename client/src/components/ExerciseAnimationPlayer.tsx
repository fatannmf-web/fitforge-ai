import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Play, ChevronRight, Zap, Eye, Activity, MessageCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AnimType =
  | "squat" | "pushup" | "pullup" | "deadlift" | "curl" | "overhead"
  | "plank" | "crunch" | "lunge" | "row" | "dip" | "fly"
  | "lateral" | "calfraise" | "glute" | "jumpsquat" | "mountainclimber"
  | "burpee" | "highknees" | "twist" | "legrise" | "bicycle";

type Phase = "intro" | "demo" | "muscles" | "tip";

interface Props {
  exerciseId: string;
  category: string;
  exerciseName: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  coachId?: string;
}

// ─── Data Maps ────────────────────────────────────────────────────────────────
const ANIM_MAP: Record<string, AnimType> = {
  "squat": "squat", "jump-squats": "jumpsquat", "lunges": "lunge",
  "glute-bridge": "glute", "romanian-deadlift": "deadlift", "deadlift": "deadlift",
  "calf-raises": "calfraise", "bench-press": "pushup", "push-ups": "pushup",
  "incline-dumbbell-press": "pushup", "dumbbell-chest-fly": "fly",
  "pull-ups": "pullup", "lat-pulldown": "pullup", "bent-over-row": "row",
  "overhead-press": "overhead", "lateral-raises": "lateral", "face-pulls": "row",
  "bicep-curl": "curl", "hammer-curl": "curl", "tricep-dips": "dip",
  "tricep-pushdown": "dip", "plank": "plank", "crunches": "crunch",
  "mountain-climbers": "mountainclimber", "russian-twist": "twist",
  "bicycle-crunches": "bicycle", "leg-raises": "legrise",
  "burpees": "burpee", "high-knees": "highknees",
};

const CAT_DEFAULTS: Record<string, AnimType> = {
  chest: "pushup", back: "pullup", legs: "squat", shoulders: "overhead",
  arms: "curl", core: "plank", cardio: "highknees", full_body: "burpee",
};

const CAT_COACH: Record<string, { id: string; name: string; title: string; gradientVivid: string }> = {
  chest:     { id: "atlas",  name: "Atlas",  title: "Strength Coach", gradientVivid: "from-amber-400 via-orange-500 to-red-600" },
  back:      { id: "atlas",  name: "Atlas",  title: "Strength Coach", gradientVivid: "from-amber-400 via-orange-500 to-red-600" },
  legs:      { id: "max",    name: "Max",    title: "Strength Coach", gradientVivid: "from-red-500 to-orange-600" },
  shoulders: { id: "max",    name: "Max",    title: "Strength Coach", gradientVivid: "from-red-500 to-orange-600" },
  arms:      { id: "bruno",  name: "Bruno",  title: "Muscle Coach",   gradientVivid: "from-blue-500 to-violet-600" },
  core:      { id: "kai",    name: "Kai",    title: "Mind Coach",     gradientVivid: "from-violet-500 to-purple-700" },
  cardio:    { id: "vera",   name: "Vera",   title: "Fat Loss Coach", gradientVivid: "from-orange-400 to-red-500" },
  full_body: { id: "nova",   name: "Nova",   title: "Performance",    gradientVivid: "from-violet-400 via-purple-500 to-indigo-600" },
};

const TECH_TIPS: Record<string, string[]> = {
  squat:          ["Picioare la lățimea umerilor", "Menține pieptul sus", "Genunchii urmează vârfurile", "Împinge prin călcâie"],
  pushup:         ["Corp drept cap-călcâie", "Coatele la 45°", "Pieptul atinge solul", "Contractă abdomenul"],
  pullup:         ["Prindere fermă bara", "Coatele spre corp", "Controlează coborârea", "Nu balansa"],
  deadlift:       ["Spatele drept", "Bara aproape de corp", "Împinge cu picioarele", "Extinde șoldurile"],
  curl:           ["Coatele fixe", "Controlează coborârea", "Gama completă", "Nu balansa trunchiul"],
  overhead:       ["Core contractat", "Bara deasupra capului", "Nu arcui spatele", "Privire înainte"],
  plank:          ["Corp aliniat", "Abdomen contractat", "Nu ridica șoldurile", "Respiră regulat"],
  crunch:         ["Mentonul sus", "Nu trage de gât", "Contractă abdomenul", "Mișcare controlată"],
  lunge:          ["Pasul mare", "Genunchiul nu depășește vârful", "Trunchiul drept", "Împinge prin călcâi"],
  row:            ["Spatele drept", "Trage spre șold", "Comprimă omoplații", "Controlul coborârii"],
  dip:            ["Corpul ușor înclinat", "Coatele înapoi", "Gama completă", "Nu balanța"],
  fly:            ["Ușoară flexie coate", "Linia pieptului", "Nu coborî prea mult", "Expiră la contracție"],
  lateral:        ["Coatele ușor flexate", "Ridicare laterală", "Nu legăna", "Coboară lent"],
  calfraise:      ["Gama completă", "Menține echilibrul", "Vârfurile spre interior", "Pauza sus"],
  glute:          ["Împinge cu șoldurile", "Contractă gluteii sus", "Picioarele paralele", "Meneine pauza"],
  jumpsquat:      ["Aterizare moale", "Genunchii flexați la aterizare", "Explosivitate", "Menține controlul"],
  mountainclimber:["Corp plank", "Alternați rapid", "Core activ", "Respirație constantă"],
  burpee:         ["Aterizare moale", "Plank complet", "Salt exploziv", "Menține ritmul"],
  highknees:      ["Genunchii la șold", "Brațele active", "Menține ritmul", "Calcâiele ridicate"],
  twist:          ["Core contractat", "Spatele drept", "Rotație din talie", "Nu din umeri"],
  legrise:        ["Spatele plat", "Controlează coborârea", "Nu balansa picioarele", "Contractă abdomenul"],
  bicycle:        ["Mentonul sus", "Coatele largi", "Rotație completă", "Ritm constant"],
};

const MUSCLE_TIPS: Record<string, string> = {
  squat:       "Cvadricepsul și gluteii sunt principalii mușchi activi. Simte arderea în coapsele din față!",
  pushup:      "Pectoralii fac munca principală. Gândește-te că 'împingi podeaua' de tine.",
  pullup:      "Latissimus dorsi — cel mai mare mușchi al spatelui. Inițiază mișcarea din omoplați.",
  deadlift:    "Lanțul posterior complet: fesieri, ischiogambieri, spate. Cel mai funcțional exercițiu.",
  curl:        "Bicepsul brahial în focus total. Concentrează-te pe contracția maximă sus.",
  overhead:    "Deltoidul anterior și medial. Core-ul stabilizează toată mișcarea.",
  plank:       "Core total activ: transvers abdominal, oblici, stabilizatori spinali.",
  lateral:     "Deltoidul medial — umărul rotund și lat se construiește cu lateral raises.",
};

// ─── Muscle Groups for Body Diagram ───────────────────────────────────────────
const FRONT_MUSCLES: Record<string, { cx: number; cy: number; rx: number; ry: number; label: string }> = {
  "Chest":       { cx: 100, cy: 85,  rx: 28, ry: 16, label: "Piept" },
  "Shoulders":   { cx: 100, cy: 68,  rx: 38, ry: 10, label: "Umeri" },
  "Biceps":      { cx: 100, cy: 98,  rx: 38, ry: 10, label: "Biceps" },
  "Forearms":    { cx: 100, cy: 115, rx: 34, ry: 8,  label: "Antebraț" },
  "Abs":         { cx: 100, cy: 108, rx: 18, ry: 18, label: "Abdomen" },
  "Core":        { cx: 100, cy: 108, rx: 18, ry: 18, label: "Core" },
  "Quadriceps":  { cx: 100, cy: 148, rx: 30, ry: 22, label: "Cvadriceps" },
  "Calves":      { cx: 100, cy: 185, rx: 22, ry: 14, label: "Gambe" },
};

const BACK_MUSCLES: Record<string, { cx: number; cy: number; rx: number; ry: number; label: string }> = {
  "Back":        { cx: 100, cy: 85,  rx: 28, ry: 22, label: "Spate" },
  "Lats":        { cx: 100, cy: 90,  rx: 32, ry: 18, label: "Lats" },
  "Triceps":     { cx: 100, cy: 100, rx: 38, ry: 10, label: "Triceps" },
  "Glutes":      { cx: 100, cy: 126, rx: 28, ry: 14, label: "Fesieri" },
  "Hamstrings":  { cx: 100, cy: 152, rx: 28, ry: 20, label: "Ischiogambieri" },
  "Calves":      { cx: 100, cy: 185, rx: 22, ry: 14, label: "Gambe" },
};

function isFrontMuscle(muscle: string): boolean {
  return Object.keys(FRONT_MUSCLES).some(k => muscle.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(muscle.toLowerCase()));
}

// ─── SVG Animation Components ─────────────────────────────────────────────────
const W = 200, H = 200, cx = W / 2;
const dur = "1.8s", ease = "ease-in-out", inf = "infinite";
const anim = (name: string, d = dur) => `${name} ${d} ${ease} ${inf}`;

const STYLES = `
  @keyframes squat-body  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(24px)} }
  @keyframes squat-knee  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(52deg)} }
  @keyframes squat-knee2 { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-52deg)} }
  @keyframes push-arm    { 0%,100%{transform:rotate(-38deg)} 50%{transform:rotate(-78deg)} }
  @keyframes pull-bob    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
  @keyframes pull-arm    { 0%,100%{transform:rotate(28deg)} 50%{transform:rotate(-28deg)} }
  @keyframes dead-bob    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(14px)} }
  @keyframes curl-lower  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-95deg)} }
  @keyframes over-up     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
  @keyframes plank-pulse { 0%,100%{opacity:1} 50%{opacity:.72} }
  @keyframes crunch-up   { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-42deg)} }
  @keyframes lat-arm     { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(68deg)} }
  @keyframes leg-rise    { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-78deg)} }
  @keyframes twist-body  { 0%,100%{transform:rotate(-28deg)} 50%{transform:rotate(28deg)} }
  @keyframes mtn-leg     { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-88deg)} }
  @keyframes jump-body   { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-28px)} 60%{transform:translateY(-28px)} }
  @keyframes run-leg-f   { 0%,100%{transform:rotate(-28deg)} 50%{transform:rotate(38deg)} }
  @keyframes run-leg-b   { 0%,100%{transform:rotate(38deg)} 50%{transform:rotate(-28deg)} }
  @keyframes burp-down   { 0%,33%{transform:translateY(0)} 34%,66%{transform:translateY(48px)} 67%,100%{transform:translateY(0)} }
  @keyframes glute-hip   { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-33deg)} }
  @keyframes row-arm     { 0%,100%{transform:rotate(18deg)} 50%{transform:rotate(-38deg)} }
  @keyframes dip-body    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(22px)} }
  @keyframes fly-arm     { 0%,100%{transform:rotate(68deg)} 50%{transform:rotate(8deg)} }
  @keyframes calf-body   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
  @keyframes lunge-split { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(18deg)} }
  @keyframes bicy-left   { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(60deg)} }
  @keyframes bicy-right  { 0%,100%{transform:rotate(60deg)} 50%{transform:rotate(-20deg)} }
  @keyframes glow-pulse  { 0%,100%{opacity:0.7;filter:drop-shadow(0 0 6px #22c55e)} 50%{opacity:1;filter:drop-shadow(0 0 14px #22c55e)} }
`;

const SC = "#22c55e"; // stick color (green theme)
const SC2 = "#16a34a";
const HEAD_R = 12;

function Stick({ x = cx, children }: { x?: number; children?: React.ReactNode }) {
  return (
    <g style={{ animation: `glow-pulse 3s ease-in-out infinite` }}>
      <circle cx={x} cy={HEAD_R + 8} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
      {children}
    </g>
  );
}

function SquatAnim() {
  return (
    <g style={{ animation: anim("squat-body"), transformOrigin: `${cx}px 60px` }}>
      <Stick />
      <line x1={cx} y1={32} x2={cx} y2={88} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <line x1={cx} y1={52} x2={cx - 22} y2={72} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx} y1={52} x2={cx + 22} y2={72} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <g style={{ animation: anim("squat-knee"), transformOrigin: `${cx - 8}px 88px` }}>
        <line x1={cx - 8} y1={88} x2={cx - 18} y2={128} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      <g style={{ animation: anim("squat-knee2"), transformOrigin: `${cx + 8}px 88px` }}>
        <line x1={cx + 8} y1={88} x2={cx + 18} y2={128} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      <line x1={cx - 18} y1={128} x2={cx - 24} y2={155} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + 18} y1={128} x2={cx + 24} y2={155} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function PushupAnim() {
  return (
    <g>
      <circle cx={cx - 42} cy={90} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
      <line x1={cx - 42} y1={102} x2={cx + 35} y2={102} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <g style={{ animation: anim("push-arm"), transformOrigin: `${cx - 18}px 102px` }}>
        <line x1={cx - 18} y1={102} x2={cx - 18} y2={132} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      <g style={{ animation: anim("push-arm"), transformOrigin: `${cx + 16}px 102px` }}>
        <line x1={cx + 16} y1={102} x2={cx + 16} y2={132} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      <line x1={cx + 35} y1={102} x2={cx + 45} y2={136} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 45} y1={136} x2={cx + 52} y2={158} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function PullupAnim() {
  return (
    <g>
      <rect x={18} y={14} width={164} height={7} rx={3.5} fill={SC2} opacity={0.6} />
      <g style={{ animation: anim("pull-bob", "2s"), transformOrigin: `${cx}px 35px` }}>
        <circle cx={cx} cy={46} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
        <line x1={cx} y1={58} x2={cx} y2={110} stroke={SC} strokeWidth={3} strokeLinecap="round" />
        <g style={{ animation: anim("pull-arm", "2s"), transformOrigin: `${cx - 10}px 65px` }}>
          <line x1={cx - 10} y1={21} x2={cx - 10} y2={82} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        </g>
        <g style={{ animation: anim("pull-arm", "2s"), transformOrigin: `${cx + 10}px 65px` }}>
          <line x1={cx + 10} y1={21} x2={cx + 10} y2={82} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        </g>
        <line x1={cx - 5} y1={110} x2={cx - 15} y2={148} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx + 5} y1={110} x2={cx + 15} y2={148} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    </g>
  );
}

function DeadliftAnim() {
  return (
    <g style={{ animation: anim("dead-bob"), transformOrigin: `${cx}px 100px` }}>
      <Stick />
      <line x1={cx} y1={32} x2={cx} y2={88} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <line x1={cx} y1={58} x2={cx - 32} y2={88} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx} y1={58} x2={cx + 32} y2={88} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 8} y1={88} x2={cx - 8} y2={138} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 8} y1={88} x2={cx + 8} y2={138} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 8} y1={138} x2={cx - 18} y2={162} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + 8} y1={138} x2={cx + 18} y2={162} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      <rect x={cx - 52} y={140} width={104} height={8} rx={4} fill={SC2} opacity={0.5} />
    </g>
  );
}

function CurlAnim() {
  return (
    <g>
      <Stick />
      <line x1={cx} y1={32} x2={cx} y2={92} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <line x1={cx} y1={54} x2={cx - 22} y2={74} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <g style={{ animation: anim("curl-lower"), transformOrigin: `${cx - 22}px 74px` }}>
        <line x1={cx - 22} y1={74} x2={cx - 22} y2={114} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx - 22} cy={120} r={7} fill={SC2} opacity={0.7} />
      </g>
      <line x1={cx} y1={54} x2={cx + 22} y2={74} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 22} y1={74} x2={cx + 22} y2={114} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 8} y1={92} x2={cx - 8} y2={142} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 8} y1={92} x2={cx + 8} y2={142} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 8} y1={142} x2={cx - 18} y2={166} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + 8} y1={142} x2={cx + 18} y2={166} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function OverheadAnim() {
  return (
    <g>
      <g style={{ animation: anim("over-up"), transformOrigin: `${cx}px 80px` }}>
        <Stick />
        <line x1={cx} y1={32} x2={cx} y2={90} stroke={SC} strokeWidth={3} strokeLinecap="round" />
        <line x1={cx} y1={52} x2={cx - 38} y2={40} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx} y1={52} x2={cx + 38} y2={40} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx - 46} cy={35} r={7} fill={SC2} opacity={0.7} />
        <circle cx={cx + 46} cy={35} r={7} fill={SC2} opacity={0.7} />
      </g>
      <line x1={cx - 8} y1={90} x2={cx - 8} y2={140} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 8} y1={90} x2={cx + 8} y2={140} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 8} y1={140} x2={cx - 18} y2={164} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + 8} y1={140} x2={cx + 18} y2={164} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function PlankAnim() {
  return (
    <g style={{ animation: anim("plank-pulse", "3s"), transformOrigin: `${cx}px 100px` }}>
      <circle cx={cx - 62} cy={92} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
      <line x1={cx - 62} y1={104} x2={cx + 44} y2={104} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <line x1={cx - 38} y1={104} x2={cx - 38} y2={134} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 38} y1={134} x2={cx - 46} y2={158} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 30} y1={104} x2={cx + 30} y2={134} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 30} y1={134} x2={cx + 38} y2={158} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function LateralAnim() {
  return (
    <g>
      <Stick />
      <line x1={cx} y1={32} x2={cx} y2={92} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <g style={{ animation: anim("lat-arm"), transformOrigin: `${cx - 5}px 58px` }}>
        <line x1={cx - 5} y1={58} x2={cx - 32} y2={78} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx - 38} cy={82} r={6} fill={SC2} opacity={0.7} />
      </g>
      <g style={{ animation: anim("lat-arm"), transformOrigin: `${cx + 5}px 58px` }}>
        <line x1={cx + 5} y1={58} x2={cx + 32} y2={78} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx + 38} cy={82} r={6} fill={SC2} opacity={0.7} />
      </g>
      <line x1={cx - 8} y1={92} x2={cx - 8} y2={140} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 8} y1={92} x2={cx + 8} y2={140} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 8} y1={140} x2={cx - 18} y2={164} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + 8} y1={140} x2={cx + 18} y2={164} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function GluteAnim() {
  return (
    <g>
      <g style={{ animation: anim("glute-hip"), transformOrigin: `${cx}px 112px` }}>
        <circle cx={cx - 58} cy={96} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
        <line x1={cx - 58} y1={108} x2={cx + 22} y2={112} stroke={SC} strokeWidth={3} strokeLinecap="round" />
        <line x1={cx - 24} y1={110} x2={cx - 24} y2={138} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx - 24} y1={138} x2={cx - 28} y2={164} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      </g>
      <line x1={cx + 12} y1={114} x2={cx + 12} y2={142} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 12} y1={142} x2={cx + 15} y2={164} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function RowAnim() {
  return (
    <g>
      <circle cx={cx - 42} cy={76} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
      <line x1={cx - 42} y1={88} x2={cx + 26} y2={94} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <g style={{ animation: anim("row-arm"), transformOrigin: `${cx - 18}px 90px` }}>
        <line x1={cx - 18} y1={90} x2={cx - 18} y2={120} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx - 18} cy={126} r={6} fill={SC2} opacity={0.7} />
      </g>
      <g style={{ animation: anim("row-arm"), transformOrigin: `${cx + 8}px 92px` }}>
        <line x1={cx + 8} y1={92} x2={cx + 8} y2={122} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx + 8} cy={128} r={6} fill={SC2} opacity={0.7} />
      </g>
      <line x1={cx + 18} y1={95} x2={cx + 10} y2={142} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 10} y1={142} x2={cx + 20} y2={164} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function CrunchAnim() {
  return (
    <g>
      <g style={{ animation: anim("crunch-up", "2s"), transformOrigin: `${cx}px 92px` }}>
        <circle cx={cx} cy={52} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
        <line x1={cx} y1={64} x2={cx} y2={92} stroke={SC} strokeWidth={3} strokeLinecap="round" />
        <line x1={cx} y1={72} x2={cx - 26} y2={90} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx} y1={72} x2={cx + 26} y2={90} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      <line x1={cx - 5} y1={112} x2={cx - 26} y2={148} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 5} y1={112} x2={cx + 26} y2={148} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 26} y1={148} x2={cx - 20} y2={168} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + 26} y1={148} x2={cx + 20} y2={168} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function DipAnim() {
  return (
    <g>
      <line x1={cx - 42} y1={52} x2={cx - 42} y2={132} stroke={SC2} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
      <line x1={cx + 42} y1={52} x2={cx + 42} y2={132} stroke={SC2} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
      <g style={{ animation: anim("dip-body"), transformOrigin: `${cx}px 82px` }}>
        <circle cx={cx} cy={60} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
        <line x1={cx} y1={72} x2={cx} y2={112} stroke={SC} strokeWidth={3} strokeLinecap="round" />
        <line x1={cx} y1={84} x2={cx - 42} y2={92} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx} y1={84} x2={cx + 42} y2={92} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx - 8} y1={112} x2={cx - 8} y2={148} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx + 8} y1={112} x2={cx + 8} y2={148} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    </g>
  );
}

function FlyAnim() {
  return (
    <g>
      <circle cx={cx - 42} cy={80} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
      <line x1={cx - 42} y1={92} x2={cx + 26} y2={97} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <g style={{ animation: anim("fly-arm"), transformOrigin: `${cx - 10}px 92px` }}>
        <line x1={cx - 10} y1={92} x2={cx - 52} y2={77} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx - 59} cy={74} r={6} fill={SC2} opacity={0.7} />
      </g>
      <g style={{ animation: anim("fly-arm"), transformOrigin: `${cx + 10}px 95px` }}>
        <line x1={cx + 10} y1={95} x2={cx + 46} y2={82} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx + 53} cy={79} r={6} fill={SC2} opacity={0.7} />
      </g>
    </g>
  );
}

function CalfRaiseAnim() {
  return (
    <g style={{ animation: anim("calf-body"), transformOrigin: `${cx}px 100px` }}>
      <Stick />
      <line x1={cx} y1={32} x2={cx} y2={90} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <line x1={cx} y1={54} x2={cx - 24} y2={72} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx} y1={54} x2={cx + 24} y2={72} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 8} y1={90} x2={cx - 8} y2={140} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 8} y1={90} x2={cx + 8} y2={140} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 8} y1={140} x2={cx - 8} y2={164} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + 8} y1={140} x2={cx + 8} y2={164} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      <line x1={cx - 20} y1={164} x2={cx - 5} y2={164} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 5} y1={164} x2={cx + 20} y2={164} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

function LungeAnim() {
  return (
    <g>
      <Stick />
      <line x1={cx} y1={32} x2={cx} y2={90} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <line x1={cx} y1={54} x2={cx - 22} y2={72} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx} y1={54} x2={cx + 22} y2={72} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <g style={{ animation: anim("lunge-split"), transformOrigin: `${cx - 8}px 90px` }}>
        <line x1={cx - 8} y1={90} x2={cx - 30} y2={132} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx - 30} y1={132} x2={cx - 20} y2={162} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      </g>
      <line x1={cx + 8} y1={90} x2={cx + 28} y2={132} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 28} y1={132} x2={cx + 44} y2={156} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function JumpSquatAnim() {
  return (
    <g style={{ animation: anim("jump-body", "1.4s"), transformOrigin: `${cx}px 100px` }}>
      <Stick />
      <line x1={cx} y1={32} x2={cx} y2={90} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <line x1={cx} y1={54} x2={cx - 30} y2={44} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx} y1={54} x2={cx + 30} y2={44} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 8} y1={90} x2={cx - 18} y2={130} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 8} y1={90} x2={cx + 18} y2={130} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 18} y1={130} x2={cx - 22} y2={158} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + 18} y1={130} x2={cx + 22} y2={158} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function MountainClimberAnim() {
  return (
    <g>
      <circle cx={cx - 58} cy={84} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
      <line x1={cx - 58} y1={96} x2={cx + 42} y2={96} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <line x1={cx - 32} y1={96} x2={cx - 32} y2={126} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 26} y1={96} x2={cx + 26} y2={126} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <g style={{ animation: anim("mtn-leg", "1.2s"), transformOrigin: `${cx - 5}px 96px` }}>
        <line x1={cx - 5} y1={96} x2={cx + 5} y2={134} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      <line x1={cx + 16} y1={96} x2={cx + 26} y2={132} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

function BurpeeAnim() {
  return (
    <g style={{ animation: anim("burp-down", "2.4s"), transformOrigin: `${cx}px 80px` }}>
      <circle cx={cx} cy={36} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
      <line x1={cx} y1={48} x2={cx} y2={90} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <line x1={cx} y1={62} x2={cx - 34} y2={52} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx} y1={62} x2={cx + 34} y2={52} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 8} y1={90} x2={cx - 18} y2={120} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 8} y1={90} x2={cx + 18} y2={120} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 18} y1={120} x2={cx - 25} y2={144} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + 18} y1={120} x2={cx + 25} y2={144} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function HighKneesAnim() {
  return (
    <g>
      <Stick />
      <line x1={cx} y1={32} x2={cx} y2={90} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <line x1={cx} y1={54} x2={cx - 22} y2={72} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx} y1={54} x2={cx + 22} y2={72} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
      <g style={{ animation: anim("run-leg-f", "0.8s"), transformOrigin: `${cx - 8}px 90px` }}>
        <line x1={cx - 8} y1={90} x2={cx - 8} y2={130} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx - 8} y1={130} x2={cx - 18} y2={158} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      </g>
      <g style={{ animation: anim("run-leg-b", "0.8s"), transformOrigin: `${cx + 8}px 90px` }}>
        <line x1={cx + 8} y1={90} x2={cx + 8} y2={130} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx + 8} y1={130} x2={cx + 18} y2={158} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      </g>
    </g>
  );
}

function LegRiseAnim() {
  return (
    <g>
      <circle cx={cx - 60} cy={72} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
      <line x1={cx - 60} y1={84} x2={cx + 42} y2={96} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <g style={{ animation: anim("leg-rise", "2s"), transformOrigin: `${cx + 20}px 96px` }}>
        <line x1={cx + 20} y1={96} x2={cx + 55} y2={130} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx + 55} y1={130} x2={cx + 60} y2={160} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      </g>
      <line x1={cx - 10} y1={96} x2={cx - 5} y2={140} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 5} y1={140} x2={cx - 2} y2={164} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function TwistAnim() {
  return (
    <g>
      <circle cx={cx} cy={74} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
      <g style={{ animation: anim("twist-body", "1.6s"), transformOrigin: `${cx}px 96px` }}>
        <line x1={cx} y1={86} x2={cx} y2={112} stroke={SC} strokeWidth={3} strokeLinecap="round" />
        <line x1={cx} y1={96} x2={cx - 36} y2={106} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx} y1={96} x2={cx + 36} y2={106} stroke={SC} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx - 43} cy={109} r={6} fill={SC2} opacity={0.7} />
        <circle cx={cx + 43} cy={109} r={6} fill={SC2} opacity={0.7} />
      </g>
      <line x1={cx - 5} y1={112} x2={cx - 25} y2={148} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + 5} y1={112} x2={cx + 25} y2={148} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - 25} y1={148} x2={cx - 18} y2={168} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + 25} y1={148} x2={cx + 18} y2={168} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function BicycleAnim() {
  return (
    <g>
      <circle cx={cx - 50} cy={72} r={HEAD_R} fill={SC} fillOpacity={0.25} stroke={SC} strokeWidth={1.5} />
      <line x1={cx - 50} y1={84} x2={cx + 30} y2={90} stroke={SC} strokeWidth={3} strokeLinecap="round" />
      <g style={{ animation: anim("bicy-left", "1.2s"), transformOrigin: `${cx - 10}px 90px` }}>
        <line x1={cx - 10} y1={90} x2={cx - 10} y2={130} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx - 10} y1={130} x2={cx} y2={158} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      </g>
      <g style={{ animation: anim("bicy-right", "1.2s"), transformOrigin: `${cx + 20}px 90px` }}>
        <line x1={cx + 20} y1={90} x2={cx + 20} y2={130} stroke={SC2} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx + 20} y1={130} x2={cx + 30} y2={158} stroke={SC2} strokeWidth={2} strokeLinecap="round" />
      </g>
    </g>
  );
}

const ANIM_COMPONENTS: Record<AnimType, () => JSX.Element> = {
  squat: SquatAnim, pushup: PushupAnim, pullup: PullupAnim, deadlift: DeadliftAnim,
  curl: CurlAnim, overhead: OverheadAnim, plank: PlankAnim, crunch: CrunchAnim,
  lunge: LungeAnim, row: RowAnim, dip: DipAnim, fly: FlyAnim, lateral: LateralAnim,
  calfraise: CalfRaiseAnim, glute: GluteAnim, jumpsquat: JumpSquatAnim,
  mountainclimber: MountainClimberAnim, burpee: BurpeeAnim, highknees: HighKneesAnim,
  twist: TwistAnim, legrise: LegRiseAnim, bicycle: BicycleAnim,
};

// ─── Body Muscle Diagram ──────────────────────────────────────────────────────
function MuscleBodyDiagram({ primary, secondary }: { primary: string[]; secondary: string[] }) {
  const showBack = primary.some(m =>
    ["back", "lats", "glutes", "hamstrings", "triceps"].some(k => m.toLowerCase().includes(k))
  );

  const pSet = new Set(primary.map(m => m.toLowerCase()));
  const sSet = new Set(secondary.map(m => m.toLowerCase()));

  function isActive(key: string) {
    return pSet.has(key.toLowerCase()) ||
      primary.some(p => p.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(p.toLowerCase()));
  }
  function isSecondary(key: string) {
    return !isActive(key) && (sSet.has(key.toLowerCase()) ||
      secondary.some(s => s.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(s.toLowerCase())));
  }

  const muscleColor = (key: string) => {
    if (isActive(key)) return "#22c55e";
    if (isSecondary(key)) return "#f59e0b";
    return "#374151";
  };
  const muscleOpacity = (key: string) => {
    if (isActive(key)) return 0.85;
    if (isSecondary(key)) return 0.5;
    return 0.18;
  };

  const frontMuscles = [
    { key: "Shoulders", rx: 16, ry: 8,  positions: [{ cx: 52, cy: 54 }, { cx: 148, cy: 54 }] },
    { key: "Chest",     rx: 28, ry: 14, positions: [{ cx: 83, cy: 70 }, { cx: 117, cy: 70 }] },
    { key: "Biceps",    rx: 9,  ry: 18, positions: [{ cx: 34, cy: 85 }, { cx: 166, cy: 85 }] },
    { key: "Forearms",  rx: 7,  ry: 14, positions: [{ cx: 28, cy: 114 }, { cx: 172, cy: 114 }] },
    { key: "Core",      rx: 16, ry: 22, positions: [{ cx: 100, cy: 103 }] },
    { key: "Abs",       rx: 16, ry: 22, positions: [{ cx: 100, cy: 103 }] },
    { key: "Quadriceps",rx: 18, ry: 28, positions: [{ cx: 82, cy: 165 }, { cx: 118, cy: 165 }] },
    { key: "Calves",    rx: 12, ry: 18, positions: [{ cx: 80, cy: 210 }, { cx: 120, cy: 210 }] },
  ];

  const backMuscles = [
    { key: "Shoulders", rx: 16, ry: 8,  positions: [{ cx: 52, cy: 54 }, { cx: 148, cy: 54 }] },
    { key: "Back",      rx: 34, ry: 18, positions: [{ cx: 100, cy: 75 }] },
    { key: "Lats",      rx: 22, ry: 22, positions: [{ cx: 68, cy: 90 }, { cx: 132, cy: 90 }] },
    { key: "Triceps",   rx: 9,  ry: 18, positions: [{ cx: 34, cy: 85 }, { cx: 166, cy: 85 }] },
    { key: "Glutes",    rx: 26, ry: 16, positions: [{ cx: 100, cy: 138 }] },
    { key: "Hamstrings",rx: 18, ry: 26, positions: [{ cx: 82, cy: 170 }, { cx: 118, cy: 170 }] },
    { key: "Calves",    rx: 12, ry: 18, positions: [{ cx: 80, cy: 212 }, { cx: 120, cy: 212 }] },
  ];

  const muscles = showBack ? backMuscles : frontMuscles;

  return (
    <div className="flex gap-4 items-start justify-center">
      {/* Body SVG */}
      <svg viewBox="0 0 200 250" className="w-28 h-36 flex-shrink-0">
        {/* Body outline */}
        <ellipse cx="100" cy="30" rx="16" ry="16" fill="none" stroke="#4b5563" strokeWidth="2" />
        {/* Neck */}
        <rect x="94" y="44" width="12" height="8" rx="4" fill="none" stroke="#4b5563" strokeWidth="1.5" />
        {/* Torso */}
        <rect x="64" y="50" width="72" height="80" rx="12" fill="none" stroke="#4b5563" strokeWidth="1.5" />
        {/* Arms */}
        <rect x="26" y="52" width="18" height="50" rx="9" fill="none" stroke="#374151" strokeWidth="1.5" />
        <rect x="156" y="52" width="18" height="50" rx="9" fill="none" stroke="#374151" strokeWidth="1.5" />
        {/* Forearms */}
        <rect x="20" y="104" width="16" height="38" rx="8" fill="none" stroke="#374151" strokeWidth="1.5" />
        <rect x="164" y="104" width="16" height="38" rx="8" fill="none" stroke="#374151" strokeWidth="1.5" />
        {/* Hip */}
        <rect x="68" y="126" width="64" height="24" rx="8" fill="none" stroke="#374151" strokeWidth="1.5" />
        {/* Thighs */}
        <rect x="68" y="148" width="28" height="56" rx="12" fill="none" stroke="#374151" strokeWidth="1.5" />
        <rect x="104" y="148" width="28" height="56" rx="12" fill="none" stroke="#374151" strokeWidth="1.5" />
        {/* Lower legs */}
        <rect x="70" y="198" width="24" height="44" rx="10" fill="none" stroke="#374151" strokeWidth="1.5" />
        <rect x="106" y="198" width="24" height="44" rx="10" fill="none" stroke="#374151" strokeWidth="1.5" />

        {/* Muscle highlights */}
        {muscles.map(({ key, rx, ry, positions }) =>
          positions.map((pos, i) => (
            <ellipse
              key={`${key}-${i}`}
              cx={pos.cx} cy={pos.cy} rx={rx} ry={ry}
              fill={muscleColor(key)}
              opacity={muscleOpacity(key)}
              style={isActive(key) ? { filter: `drop-shadow(0 0 4px ${muscleColor(key)})` } : undefined}
            />
          ))
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 text-xs pt-1">
        {primary.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">Primary</p>
            {primary.map(m => (
              <div key={m} className="flex items-center gap-1.5 text-green-300">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_4px_#22c55e]" />
                <span>{m}</span>
              </div>
            ))}
          </div>
        )}
        {secondary.length > 0 && (
          <div className="mt-1">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Secondary</p>
            {secondary.slice(0, 3).map(m => (
              <div key={m} className="flex items-center gap-1.5 text-amber-300/80">
                <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                <span>{m}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phase Labels ─────────────────────────────────────────────────────────────
const PHASES: { id: Phase; label: string; icon: string; duration: number }[] = [
  { id: "intro",   label: "Intro",   icon: "▶",  duration: 3500 },
  { id: "demo",    label: "Demo",    icon: "🎬", duration: 6000 },
  { id: "muscles", label: "Mușchi",  icon: "💪", duration: 5000 },
  { id: "tip",     label: "Sfat",    icon: "💡", duration: 0    },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export function ExerciseAnimationPlayer({
  exerciseId, category, exerciseName, primaryMuscles, secondaryMuscles = [], coachId,
}: Props) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const animType = ANIM_MAP[exerciseId] || CAT_DEFAULTS[category] || "squat";
  const AnimComp = ANIM_COMPONENTS[animType];
  const coach = CAT_COACH[category] || CAT_COACH["chest"];
  const tips = TECH_TIPS[animType] || TECH_TIPS["squat"];
  const muscleTip = MUSCLE_TIPS[animType] || `Mușchii activi: ${primaryMuscles.join(", ")}`;
  const phase = PHASES[phaseIdx];

  // Rotate technique tips every 2s during demo phase
  useEffect(() => {
    if (phase.id !== "demo") return;
    const t = setInterval(() => setTipIdx(i => (i + 1) % tips.length), 2200);
    return () => clearInterval(t);
  }, [phase.id, tips.length]);

  // Auto-advance phases
  useEffect(() => {
    if (phase.duration === 0) return;
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setPhaseIdx(i => Math.min(i + 1, PHASES.length - 1));
        setVisible(true);
      }, 200);
    }, phase.duration);
    return () => clearTimeout(timerRef.current);
  }, [phaseIdx]);

  const goToPhase = (idx: number) => {
    clearTimeout(timerRef.current);
    setVisible(false);
    setTimeout(() => { setPhaseIdx(idx); setVisible(true); }, 150);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 relative select-none">
      <style>{STYLES}</style>

      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#22c55e" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,197,94,0.12),transparent_70%)]" />
        {/* bottom vignette */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">LIVE · AI TRAINER</span>
        </div>
        <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-700 rounded-full px-2 py-0.5">
          <Eye className="w-2.5 h-2.5 text-zinc-400" />
          <span className="text-[10px] text-zinc-400 font-mono">
            {phase.id === "demo" ? "FRONT VIEW" : phase.id === "muscles" ? "MUSCLE MAP" : phase.id === "intro" ? "INTRO" : "COACH TIP"}
          </span>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className={cn(
        "relative z-10 flex gap-3 px-3 pb-1 transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}>
        {/* Coach avatar column */}
        <div className="flex flex-col items-center gap-1.5 pt-1 flex-shrink-0">
          <div className={cn(
            "w-14 h-14 rounded-xl overflow-hidden border-2 shadow-lg flex-shrink-0",
            "bg-gradient-to-br", coach.gradientVivid,
            "border-green-500/30 shadow-green-500/20"
          )}>
            <img
              src={`/coaches/${coach.id}.png`}
              alt={coach.name}
              className="w-full h-full object-cover object-top"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-white leading-tight">{coach.name}</p>
            <p className="text-[8px] text-zinc-500 leading-tight">{coach.title}</p>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Exercise title */}
          <h3 className="text-base font-black text-white leading-tight mb-1 truncate">{exerciseName}</h3>

          {/* Phase content */}
          {phase.id === "intro" && (
            <div className="py-2">
              <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                <span className="text-green-400 font-semibold">{coach.name}:</span> Azi îți arăt cum să execuți corect <span className="text-white font-semibold">{exerciseName}</span>. Urmărește tehnica și sfaturile mele.
              </p>
              <div className="flex flex-wrap gap-1">
                {primaryMuscles.slice(0, 3).map(m => (
                  <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {phase.id === "demo" && (
            <div className="flex items-end gap-2">
              <div className="flex-shrink-0">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-28 h-28">
                  {AnimComp && <AnimComp />}
                </svg>
              </div>
              <div className="flex-1 pb-1">
                <div className="bg-zinc-900/80 border border-green-500/30 rounded-lg px-2.5 py-2 min-h-[52px] flex flex-col justify-center">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Zap className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />
                    <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider">Tech Tip</span>
                  </div>
                  <p className="text-xs text-white font-semibold leading-tight">
                    {tips[tipIdx]}
                  </p>
                </div>
                <div className="mt-1.5 flex gap-1">
                  {tips.map((_, i) => (
                    <div key={i} className={cn(
                      "h-0.5 rounded-full flex-1 transition-all duration-500",
                      i === tipIdx ? "bg-green-400" : "bg-zinc-700"
                    )} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {phase.id === "muscles" && (
            <div className="py-1">
              <MuscleBodyDiagram primary={primaryMuscles} secondary={secondaryMuscles} />
            </div>
          )}

          {phase.id === "tip" && (
            <div className="py-2 pr-1">
              <div className="bg-gradient-to-r from-zinc-900 to-zinc-800/50 border border-zinc-700 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Sfat {coach.name}</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed">{muscleTip}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Phase navigation ── */}
      <div className="relative z-10 flex items-center gap-1.5 px-3 pb-3 pt-1">
        {PHASES.map((p, i) => (
          <button
            key={p.id}
            onClick={() => goToPhase(i)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-200",
              phaseIdx === i
                ? "bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                : "bg-zinc-900/60 border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
            )}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={() => goToPhase((phaseIdx + 1) % PHASES.length)}
            className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-green-500/50 hover:bg-green-500/10 transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
