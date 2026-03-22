import { useLang } from "@/i18n/useLang";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Zap } from "lucide-react";

const TOTAL_STEPS = 7;

const GOALS = [
  { value: "weight_loss",     emoji: "🔥", label: "Slăbit",          desc: "Arzi grăsime, arăți mai bine" },
  { value: "muscle_gain",     emoji: "💪", label: "Masă Musculară",  desc: "Construiești forță și volum" },
  { value: "endurance",       emoji: "🏃", label: "Rezistență",      desc: "Cardio, maraton, viteză" },
  { value: "general_fitness", emoji: "⚡", label: "Fitness General", desc: "Sănătate și energie zilnică" },
  { value: "flexibility",     emoji: "🧘", label: "Flexibilitate",   desc: "Mobilitate, yoga, recuperare" },
];

const LEVELS = [
  { value: "beginner",     emoji: "🌱", label: "Începător",   desc: "Sub 6 luni de antrenament" },
  { value: "intermediate", emoji: "⚡", label: "Intermediar", desc: "1-3 ani de antrenament" },
  { value: "advanced",     emoji: "🏆", label: "Avansat",     desc: "3+ ani, tehnici complexe" },
];

const EQUIPMENT_OPTIONS = [
  { value: "gym",        emoji: "🏋️", label: "Sală completă"   },
  { value: "dumbbells",  emoji: "💪", label: "Gantere acasă"   },
  { value: "barbell",    emoji: "🔩", label: "Bara + discuri"  },
  { value: "bands",      emoji: "🔴", label: "Benzi elastice"  },
  { value: "pullup_bar", emoji: "🏗️", label: "Bară tracțiuni" },
  { value: "none",       emoji: "🤸", label: "Fără echipament" },
];

const LIMITATION_OPTIONS = [
  { value: "none",     emoji: "✅", label: "Nicio limitare"       },
  { value: "back",     emoji: "🦴", label: "Probleme spate"       },
  { value: "knee",     emoji: "🦵", label: "Probleme genunchi"    },
  { value: "shoulder", emoji: "💆", label: "Probleme umăr"        },
  { value: "wrist",    emoji: "✋", label: "Probleme încheietură" },
  { value: "heart",    emoji: "❤️", label: "Probleme cardiace"   },
];

const TIMES = [
  { value: "morning",   emoji: "🌅", label: "Dimineața",   desc: "06:00 – 10:00" },
  { value: "noon",      emoji: "☀️", label: "Prânz",       desc: "11:00 – 14:00" },
  { value: "afternoon", emoji: "🌤️", label: "După-amiază", desc: "15:00 – 18:00" },
  { value: "evening",   emoji: "🌙", label: "Seara",        desc: "18:00 – 22:00" },
];

const DURATIONS = [
  { value: "30", label: "30 min",  desc: "Rapid" },
  { value: "45", label: "45 min",  desc: "Echilibrat" },
  { value: "60", label: "60 min",  desc: "Complet" },
  { value: "90", label: "90+ min", desc: "Dedicat" },
];

function ProgressBar({ step }: { step: number }) {
  const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: "linear-gradient(90deg,#22c55e,#4ade80)" }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </div>
  );
}

function OptionCard({ selected, onClick, emoji, label, desc, small = false }: {
  selected: boolean; onClick: () => void; emoji: string; label: string; desc?: string; small?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 transition-all ${small ? "p-3 flex items-center gap-3" : "p-4 flex items-center gap-4"} ${selected ? "border-green-500 bg-green-500/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}
    >
      <span className={small ? "text-xl" : "text-2xl"}>{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-bold ${small ? "text-sm" : "text-base"} text-white`}>{label}</p>
        {desc && <p className="text-xs text-white/50 mt-0.5">{desc}</p>}
      </div>
      {selected && (
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <Check className="w-3 h-3 text-black" strokeWidth={3} />
        </div>
      )}
    </motion.button>
  );
}

function MultiCard({ selected, onClick, emoji, label }: {
  selected: boolean; onClick: () => void; emoji: string; label: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-3 rounded-xl border-2 text-center flex flex-col items-center gap-1.5 transition-all ${selected ? "border-green-500 bg-green-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
    >
      <span className="text-2xl">{emoji}</span>
      <p className={`text-xs font-semibold leading-tight ${selected ? "text-green-400" : "text-white/80"}`}>{label}</p>
    </motion.button>
  );
}

export default function OnboardingPage() {
  const { tx } = useLang();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [summary, setSummary] = useState<string[]>([]);
  const [data, setData] = useState({
    displayName: (user as any)?.name || "",
    age: "", height: "", currentWeight: "", targetWeight: "",
    goalType: "", fitnessLevel: "",
    equipment: [] as string[],
    daysPerWeek: 4,
    workoutDuration: "45",
    limitations: [] as string[],
    preferredTime: "",
  });

  useEffect(() => {
    if (step === TOTAL_STEPS) {
      const lines: string[] = [];
      const goal = GOALS.find(g => g.value === data.goalType);
      const level = LEVELS.find(l => l.value === data.fitnessLevel);
      if (goal) lines.push(`${goal.emoji} Obiectiv: ${goal.label}`);
      if (level) lines.push(`Nivel: ${level.label}`);
      lines.push(`${data.daysPerWeek} zile/săptămână × ${data.workoutDuration} min`);
      if (data.equipment.length) {
        const eq = data.equipment.map(e => EQUIPMENT_OPTIONS.find(o => o.value === e)?.label).filter(Boolean);
        lines.push(`Echipament: ${eq.join(", ")}`);
      }
      const noLimits = data.limitations.includes("none") || data.limitations.length === 0;
      if (!noLimits) {
        const lims = data.limitations.map(l => LIMITATION_OPTIONS.find(o => o.value === l)?.label).filter(Boolean);
        lines.push(`⚠️ Atenție la: ${lims.join(", ")}`);
      }
      setSummary(lines);
    }
  }, [step]);

  const completeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/onboarding/complete", {
      goalType: data.goalType || "general_fitness",
      displayName: data.displayName || undefined,
      age: data.age ? parseInt(data.age) : undefined,
      currentWeight: data.currentWeight ? parseFloat(data.currentWeight) : undefined,
      targetWeight: data.targetWeight ? parseFloat(data.targetWeight) : undefined,
      height: data.height ? parseFloat(data.height) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  function goNext() { setDir(1); setStep(s => Math.min(s + 1, TOTAL_STEPS)); }
  function goBack() { setDir(-1); setStep(s => Math.max(s - 1, 1)); }

  function toggleMulti(field: "equipment" | "limitations", value: string) {
    if (value === "none") { setData(d => ({ ...d, [field]: ["none"] })); return; }
    setData(d => {
      const arr = d[field].filter(v => v !== "none");
      return { ...d, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  }

  async function handleFinish(withScan: boolean) {
    try {
      await completeMutation.mutateAsync();
      toast({ title: "🎉 Bun venit la FitForge AI!", description: "Profilul tău complet a fost creat!" });
      navigate(withScan ? "/body-scan" : "/today");
    } catch {
      toast({ title: "Eroare", description: "Nu am putut salva profilul.", variant: "destructive" });
    }
  }

  const canProceed = () => {
    if (step === 2) return !!data.goalType;
    if (step === 3) return !!data.fitnessLevel;
    if (step === 4) return data.equipment.length > 0;
    if (step === 6) return data.limitations.length > 0;
    return true;
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit:  (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a", fontFamily: "'Outfit','Inter',sans-serif" }}>
      {/* Top bar */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        {step > 1 && (
          <button onClick={goBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </button>
        )}
        <div className="flex-1"><ProgressBar step={step} /></div>
        <span className="text-xs text-white/30 tabular-nums">{step}/{TOTAL_STEPS}</span>
      </div>

      {/* Logo */}
      <div className="px-5 mb-5 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-500">
          <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold text-white/90">FitForge AI</span>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: "easeInOut" }}>

            {step === 1 && (
              <div>
                <p className="text-green-400 text-sm font-semibold mb-2 uppercase tracking-widest">Pasul 1</p>
                <h2 className="text-3xl font-black text-white mb-1">Cum te cheamă?</h2>
                <p className="text-white/40 text-sm mb-8">AI-ul tău personal va folosi asta.</p>
                <input type="text" placeholder="Prenumele tău..." value={data.displayName}
                  onChange={e => setData(d => ({ ...d, displayName: e.target.value }))}
                  data-testid="input-display-name"
                  className="w-full text-xl font-bold text-white bg-transparent border-0 border-b-2 pb-3 outline-none placeholder:text-white/20"
                  style={{ borderBottomColor: data.displayName ? "#22c55e" : "rgba(255,255,255,0.15)" }}
                  autoFocus
                />
                {data.displayName && (
                  <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-white/40 text-sm mt-4">
                    Salut, <span className="text-white font-bold">{data.displayName}</span>! Hai să construim profilul tău. 💪
                  </motion.p>
                )}
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {[
                    { key: "age", label: "Vârstă", placeholder: "25", type: "number" },
                    { key: "height", label: "Înălțime (cm)", placeholder: "175", type: "number" },
                    { key: "currentWeight", label: "Greutate (kg)", placeholder: "75", type: "number" },
                    { key: "targetWeight", label: "Greutate țintă (kg)", placeholder: "68", type: "number" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder}
                        value={(data as any)[f.key]}
                        onChange={e => setData(d => ({ ...d, [f.key]: e.target.value }))}
                        data-testid={`input-${f.key}`}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-base outline-none focus:border-green-500/50 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="text-green-400 text-sm font-semibold mb-2 uppercase tracking-widest">Pasul 2</p>
                <h2 className="text-3xl font-black text-white mb-1">Care-i obiectivul?</h2>
                <p className="text-white/40 text-sm mb-6">AI-ul construiește un plan diferit pentru fiecare.</p>
                <div className="space-y-2.5">
                  {GOALS.map(g => (
                    <OptionCard key={g.value} selected={data.goalType === g.value}
                      onClick={() => setData(d => ({ ...d, goalType: g.value }))}
                      emoji={g.emoji} label={g.label} desc={g.desc} />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-green-400 text-sm font-semibold mb-2 uppercase tracking-widest">Pasul 3</p>
                <h2 className="text-3xl font-black text-white mb-1">Ce nivel ești?</h2>
                <p className="text-white/40 text-sm mb-6">Fii sincer — planul e mai bun dacă știe de unde pornești.</p>
                <div className="space-y-3">
                  {LEVELS.map(l => (
                    <OptionCard key={l.value} selected={data.fitnessLevel === l.value}
                      onClick={() => setData(d => ({ ...d, fitnessLevel: l.value }))}
                      emoji={l.emoji} label={l.label} desc={l.desc} />
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <p className="text-green-400 text-sm font-semibold mb-2 uppercase tracking-widest">Pasul 4</p>
                <h2 className="text-3xl font-black text-white mb-1">Ce echipament ai?</h2>
                <p className="text-white/40 text-sm mb-6">Selectează tot ce ai acces.</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {EQUIPMENT_OPTIONS.map(e => (
                    <MultiCard key={e.value} selected={data.equipment.includes(e.value)}
                      onClick={() => toggleMulti("equipment", e.value)}
                      emoji={e.emoji} label={e.label} />
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <p className="text-green-400 text-sm font-semibold mb-2 uppercase tracking-widest">Pasul 5</p>
                <h2 className="text-3xl font-black text-white mb-1">Programul tău</h2>
                <p className="text-white/40 text-sm mb-7">Câte zile pe săptămână și cât timp?</p>
                <div className="mb-8">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-4">Zile pe săptămână</p>
                  <div className="flex gap-2 justify-between">
                    {[2,3,4,5,6,7].map(d => (
                      <motion.button key={d} whileTap={{ scale: 0.9 }} onClick={() => setData(dd => ({ ...dd, daysPerWeek: d }))}
                        className={`flex-1 h-11 rounded-xl text-sm font-bold border-2 transition-all ${data.daysPerWeek === d ? "border-green-500 bg-green-500 text-black" : "border-white/15 bg-white/5 text-white/70"}`}>
                        {d}
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-center text-white/30 text-xs mt-3">{data.daysPerWeek} zile — {data.daysPerWeek < 4 ? "Ușor" : data.daysPerWeek < 6 ? "Echilibrat" : "Intens"}</p>
                </div>
                <div className="mb-8">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-4">Durata antrenamentului</p>
                  <div className="grid grid-cols-4 gap-2">
                    {DURATIONS.map(d => (
                      <motion.button key={d.value} whileTap={{ scale: 0.93 }} onClick={() => setData(dd => ({ ...dd, workoutDuration: d.value }))}
                        className={`py-3 rounded-xl text-center border-2 transition-all ${data.workoutDuration === d.value ? "border-green-500 bg-green-500/10" : "border-white/10 bg-white/5"}`}>
                        <p className={`text-sm font-bold ${data.workoutDuration === d.value ? "text-green-400" : "text-white"}`}>{d.label}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{d.desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-4">Ora preferată (opțional)</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {TIMES.map(t => (
                      <OptionCard key={t.value} small selected={data.preferredTime === t.value}
                        onClick={() => setData(d => ({ ...d, preferredTime: t.value }))}
                        emoji={t.emoji} label={t.label} desc={t.desc} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <p className="text-green-400 text-sm font-semibold mb-2 uppercase tracking-widest">Pasul 6</p>
                <h2 className="text-3xl font-black text-white mb-1">Limitări fizice?</h2>
                <p className="text-white/40 text-sm mb-6">AI-ul evită exercițiile dăunătoare pentru tine.</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {LIMITATION_OPTIONS.map(l => (
                    <MultiCard key={l.value} selected={data.limitations.includes(l.value)}
                      onClick={() => toggleMulti("limitations", l.value)}
                      emoji={l.emoji} label={l.label} />
                  ))}
                </div>
                {data.limitations.length > 0 && !data.limitations.includes("none") && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl flex items-start gap-2.5"
                    style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
                    <span>⚠️</span>
                    <p className="text-xs text-orange-300/80 leading-relaxed">AI-ul va evita exercițiile cu risc și va sugera alternative sigure.</p>
                  </motion.div>
                )}
              </div>
            )}

            {step === 7 && (
              <div>
                <p className="text-green-400 text-sm font-semibold mb-2 uppercase tracking-widest">Gata!</p>
                <h2 className="text-3xl font-black text-white mb-1">{data.displayName ? `${data.displayName}, ești setat!` : "Profilul tău e gata!"}</h2>
                <p className="text-white/40 text-sm mb-6">AI-ul a construit planul tău personalizat.</p>
                <div className="rounded-2xl p-4 mb-5 space-y-2" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">Profilul tău AI</p>
                  {summary.map((line, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <p className="text-white/80 text-sm">{line}</p>
                    </motion.div>
                  ))}
                </div>
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  onClick={() => handleFinish(true)} disabled={completeMutation.isPending}
                  data-testid="button-do-body-scan"
                  className="w-full py-4 rounded-2xl font-black text-base text-black mb-3 flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#22c55e,#4ade80)" }}>
                  {completeMutation.isPending
                    ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    : <>📸 Pornește AI Body Scan <ArrowRight className="w-4 h-4" /></>}
                </motion.button>
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                  onClick={() => handleFinish(false)} disabled={completeMutation.isPending}
                  data-testid="button-skip-body-scan"
                  className="w-full py-3 rounded-2xl text-white/40 text-sm hover:text-white/60 transition-colors">
                  Sari peste → Mergi direct la dashboard
                </motion.button>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                  className="flex items-center justify-center gap-2 mt-5">
                  <div className="flex -space-x-1.5">
                    {["#22c55e","#f97316","#60a5fa","#c084fc","#f472b6"].map((c,i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0a0a0a]" style={{ background: c }} />
                    ))}
                  </div>
                  <p className="text-xs text-white/30">+12,400 utilizatori activi</p>
                </motion.div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      {step < TOTAL_STEPS && (
        <div className="px-5 pb-8 pt-4">
          <motion.button whileTap={{ scale: 0.97 }} onClick={goNext} disabled={!canProceed()}
            className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all disabled:opacity-30"
            style={{ background: canProceed() ? "linear-gradient(135deg,#22c55e,#4ade80)" : "rgba(255,255,255,0.08)", color: canProceed() ? "#000" : "rgba(255,255,255,0.3)" }}>
            {step === 1 && !data.displayName ? "Continuă fără nume" : "Continuă"}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      )}
    </div>
  );
}
