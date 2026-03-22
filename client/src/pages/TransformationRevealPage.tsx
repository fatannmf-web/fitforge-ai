import { useLang } from "@/i18n/useLang";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { generateTikTokVideo, downloadVideo, shareToTikTok, type TikTokExportData } from "@/hooks/use-tiktok-export";
import {
  Flame, Trophy, Share2, Download, Heart, ChevronRight,
  Camera, Star, Zap, Medal, Users, ArrowRight, Lock, Globe,
  TrendingDown, Dumbbell, Calendar, BarChart3, Sparkles, Crown, Video, Loader2
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface RevealData {
  reveal: {
    id: number; displayName: string; startWeight: number; endWeight: number;
    startBodyFat: number; endBodyFat: number; workoutsCompleted: number;
    daysCount: number; beforePhotoData: string | null; afterPhotoData: string | null;
    isPublic: boolean; likesCount: number; createdAt: string;
  } | null;
  autoData: {
    currentWeight: number | null; targetWeight: number | null;
    completedWorkouts: number; beforePhotoData: string | null;
    afterPhotoData: string | null; displayName: string;
  };
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimCounter({ from, to, duration = 1500, suffix = "", prefix = "" }: {
  from: number; to: number; duration?: number; suffix?: string; prefix?: string;
}) {
  const [val, setVal] = useState(from);
  useEffect(() => {
    const start = Date.now();
    const diff = to - from;
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(from + diff * ease);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [from, to, duration]);
  return <>{prefix}{val.toFixed(1)}{suffix}</>;
}

// ─── Before/After Card ───────────────────────────────────────────────────────
function RevealCard({ data, revealed }: {
  data: RevealData["reveal"] & { autoData: RevealData["autoData"] };
  revealed: boolean;
}) {
  const sw = data.startWeight || 80;
  const ew = data.endWeight || data.autoData?.currentWeight || 72;
  const sbf = data.startBodyFat || 25;
  const ebf = data.endBodyFat || 18;
  const days = data.daysCount || 90;
  const workouts = data.workoutsCompleted || data.autoData?.completedWorkouts || 0;
  const weightLost = sw - ew;
  const bfLost = sbf - ebf;
  const beforePhoto = data.beforePhotoData || data.autoData?.beforePhotoData;
  const afterPhoto = data.afterPhotoData || data.autoData?.afterPhotoData;

  const PhotoOrAvatar = ({ type }: { type: "before" | "after" }) => {
    const photo = type === "before" ? beforePhoto : afterPhoto;
    const bf = type === "before" ? sbf : ebf;
    const weight = type === "before" ? sw : ew;
    const fatW = Math.min(Math.max(bf / 40, 0.3), 0.85);
    return photo ? (
      <div className="w-full h-full rounded-xl overflow-hidden">
        <img src={photo} alt={type} className="w-full h-full object-cover" />
      </div>
    ) : (
      <div className={`w-full h-full flex flex-col items-center justify-center rounded-xl relative overflow-hidden
        ${type === "before" ? "bg-gradient-to-b from-slate-800 to-slate-900" : "bg-gradient-to-b from-emerald-900/60 to-slate-900"}`}>
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute border-t border-white/10" style={{ top: `${i * 14}%`, left: 0, right: 0 }} />
          ))}
        </div>
        <svg viewBox="0 0 80 160" className="w-24 h-auto relative z-10" fill="none">
          <ellipse cx="40" cy="20" rx="14" ry="14" fill={type === "before" ? "#64748b" : "#34d399"} opacity="0.9" />
          <rect x={40 - 14 - fatW * 6} y="38" width={28 + fatW * 12} height={60} rx="10"
            fill={type === "before" ? "#475569" : "#10b981"} opacity="0.85" />
          <rect x={40 - 8 - fatW * 4} y="100" width={16 + fatW * 6} height={45} rx="8"
            fill={type === "before" ? "#334155" : "#059669"} opacity="0.8" />
          <rect x={40 + 6} y="100" width={16 + fatW * 6} height={45} rx="8"
            fill={type === "before" ? "#334155" : "#059669"} opacity="0.8" />
        </svg>
        <div className="text-center mt-2 relative z-10">
          <div className="text-white font-bold text-lg">{weight}kg</div>
          <div className={`text-sm ${type === "before" ? "text-slate-400" : "text-emerald-400"}`}>{bf}% grăsime</div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" data-testid="transformation-card">
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-primary to-emerald-500 rounded-2xl blur opacity-40 animate-pulse" />
      <div className="relative bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-emerald-500/20 px-6 py-4 text-center border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-primary" />
            <span className="font-display font-black text-xl tracking-wider uppercase text-foreground">FitForge Transformation</span>
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">{data.displayName || data.autoData?.displayName || "FitForger"} • {days} zile</p>
        </div>

        {/* Before/After Split */}
        <div className="grid grid-cols-2 gap-0 relative">
          {/* BEFORE */}
          <div className="p-4 border-r border-border">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center mb-2">BEFORE</div>
            <div className="aspect-[3/4] mb-3"><PhotoOrAvatar type="before" /></div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-black text-foreground">{sw}kg</div>
              <div className="text-sm text-muted-foreground">{sbf}% Body Fat</div>
              <div className="text-xs text-muted-foreground">Ziua 1</div>
            </div>
          </div>

          {/* Divider with arrow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="bg-primary rounded-full p-2 shadow-lg shadow-primary/40">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* AFTER */}
          <div className="p-4">
            <div className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-2">AFTER</div>
            <div className="aspect-[3/4] mb-3"><PhotoOrAvatar type="after" /></div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-black text-primary">{ew}kg</div>
              <div className="text-sm text-emerald-400">{ebf}% Body Fat</div>
              <div className="text-xs text-muted-foreground">Ziua {days}</div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="border-t border-border px-4 py-5 bg-muted/30">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-emerald-400">
                {revealed ? <AnimCounter from={0} to={weightLost} suffix="kg" prefix="-" /> : `-${weightLost}kg`}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                <TrendingDown className="w-3 h-3" /> Greutate
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-primary">
                {revealed ? <AnimCounter from={0} to={bfLost} suffix="%" prefix="-" /> : `-${bfLost}%`}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                <BarChart3 className="w-3 h-3" /> Body Fat
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-yellow-400">
                {revealed ? <AnimCounter from={0} to={workouts} suffix="" duration={1200} /> : workouts}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                <Dumbbell className="w-3 h-3" /> Antrenamente
              </div>
            </div>
          </div>
        </div>

        {/* Footer watermark */}
        <div className="border-t border-border px-4 py-3 flex items-center justify-center gap-2 bg-muted/20">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-muted-foreground">Created with <span className="text-primary font-bold">FitForge AI</span></span>
          <Zap className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}

// ─── Setup Form ───────────────────────────────────────────────────────────────
function SetupForm({ autoData, onSave }: {
  autoData: RevealData["autoData"];
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    startWeight: "", endWeight: autoData.currentWeight?.toString() || "",
    startBodyFat: "", endBodyFat: "", daysCount: "90",
    workoutsCompleted: autoData.completedWorkouts?.toString() || "0",
    displayName: autoData.displayName || "", isPublic: false,
    beforePhotoData: autoData.beforePhotoData || null as string | null,
    afterPhotoData: autoData.afterPhotoData || null as string | null,
  });

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      const maxSize = 400;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      setForm(f => ({ ...f, [type === "before" ? "beforePhotoData" : "afterPhotoData"]: dataUrl }));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      startWeight: parseFloat(form.startWeight) || null,
      endWeight: parseFloat(form.endWeight) || null,
      startBodyFat: parseFloat(form.startBodyFat) || null,
      endBodyFat: parseFloat(form.endBodyFat) || null,
      daysCount: parseInt(form.daysCount) || 90,
      workoutsCompleted: parseInt(form.workoutsCompleted) || 0,
      displayName: form.displayName,
      isPublic: form.isPublic,
      beforePhotoData: form.beforePhotoData,
      afterPhotoData: form.afterPhotoData,
    });
  };

  const inp = "w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Datele Transformării
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Greutate Start (kg)</label>
            <input className={inp} type="number" step="0.1" placeholder="ex: 84" value={form.startWeight}
              onChange={e => setForm(f => ({ ...f, startWeight: e.target.value }))} data-testid="input-start-weight" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Greutate Acum (kg)</label>
            <input className={inp} type="number" step="0.1" placeholder="ex: 72" value={form.endWeight}
              onChange={e => setForm(f => ({ ...f, endWeight: e.target.value }))} data-testid="input-end-weight" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Body Fat Start (%)</label>
            <input className={inp} type="number" step="0.1" placeholder="ex: 25" value={form.startBodyFat}
              onChange={e => setForm(f => ({ ...f, startBodyFat: e.target.value }))} data-testid="input-start-bf" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Body Fat Acum (%)</label>
            <input className={inp} type="number" step="0.1" placeholder="ex: 16" value={form.endBodyFat}
              onChange={e => setForm(f => ({ ...f, endBodyFat: e.target.value }))} data-testid="input-end-bf" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Zile de Journey</label>
            <input className={inp} type="number" placeholder="90" value={form.daysCount}
              onChange={e => setForm(f => ({ ...f, daysCount: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Antrenamente</label>
            <input className={inp} type="number" placeholder="45" value={form.workoutsCompleted}
              onChange={e => setForm(f => ({ ...f, workoutsCompleted: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Numele tău (pentru leaderboard)</label>
          <input className={inp} type="text" placeholder="ex: Alex R." value={form.displayName}
            onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} data-testid="input-display-name" />
        </div>
      </div>

      {/* Photo Upload */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" /> Poze (Opțional)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {(["before", "after"] as const).map(type => (
            <label key={type} className="block cursor-pointer" htmlFor={`photo-${type}`}>
              <div className="text-xs text-muted-foreground mb-1 capitalize font-medium text-center">{type === "before" ? "BEFORE" : "AFTER"}</div>
              <div className={`aspect-[3/4] rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center
                ${form[type === "before" ? "beforePhotoData" : "afterPhotoData"] ? "border-primary" : "border-border hover:border-primary/50"} transition-colors`}>
                {form[type === "before" ? "beforePhotoData" : "afterPhotoData"] ? (
                  <img src={form[type === "before" ? "beforePhotoData" : "afterPhotoData"]!} alt={type} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <span className="text-xs text-muted-foreground">Adaugă poză</span>
                  </div>
                )}
              </div>
              <input id={`photo-${type}`} type="file" accept="image/*" className="hidden"
                onChange={e => handlePhoto(e, type)} data-testid={`input-photo-${type}`} />
            </label>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {form.isPublic ? <Globe className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
          <div>
            <div className="font-semibold text-sm text-foreground">{form.isPublic ? "Public — pe Leaderboard" : "Privat — doar tu"}</div>
            <div className="text-xs text-muted-foreground">Apare în Top Transformări</div>
          </div>
        </div>
        <button type="button" onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))}
          className={`w-12 h-6 rounded-full transition-colors relative ${form.isPublic ? "bg-primary" : "bg-muted"}`}
          data-testid="toggle-public">
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isPublic ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
        </button>
      </div>

      <Button type="submit" size="lg" className="w-full gap-2" data-testid="button-save-transformation">
        <Sparkles className="w-5 h-5" /> Generează Transformarea
      </Button>
    </form>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function Leaderboard() {
  const { data: leaderboard = [] } = useQuery<any[]>({
    queryKey: ["/api/transformation/leaderboard"],
  });
  const qc = useQueryClient();
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const like = async (id: number) => {
    if (liked.has(id)) return;
    await apiRequest("POST", `/api/transformation/leaderboard/${id}/like`);
    setLiked(s => new Set(Array.from(s).concat(id)));
    qc.invalidateQueries({ queryKey: ["/api/transformation/leaderboard"] });
  };

  const rankIcons = [
    <Crown className="w-5 h-5 text-yellow-400" />,
    <Medal className="w-5 h-5 text-slate-300" />,
    <Medal className="w-5 h-5 text-amber-700" />,
  ];

  if (!leaderboard.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-semibold">Nicio transformare publică încă</p>
        <p className="text-sm mt-1">Fii primul! Activează &quot;Public&quot; pentru a apărea</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leaderboard.map((item: any, i: number) => {
        const wLost = ((item.startWeight || 0) - (item.endWeight || 0)).toFixed(1);
        const bfLost = ((item.startBodyFat || 0) - (item.endBodyFat || 0)).toFixed(1);
        return (
          <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
            data-testid={`row-leaderboard-${item.id}`}>
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {i < 3 ? rankIcons[i] : <span className="font-bold text-muted-foreground">{i + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground truncate">{item.displayName || "FitForger"}</div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                <span className="text-emerald-400 font-medium">-{wLost}kg</span>
                <span>·</span>
                <span className="text-primary font-medium">-{bfLost}% BF</span>
                <span>·</span>
                <span>{item.daysCount} zile</span>
              </div>
            </div>
            <button onClick={() => like(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all
                ${liked.has(item.id) ? "bg-red-500/10 border-red-500/30 text-red-400" : "border-border text-muted-foreground hover:border-red-400/30 hover:text-red-400"}`}
              data-testid={`button-like-${item.id}`}>
              <Heart className={`w-3.5 h-3.5 ${liked.has(item.id) ? "fill-red-400" : ""}`} />
              <span className="text-xs font-medium">{item.likesCount || 0}</span>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type RevealPhase = "idle" | "scanning" | "countdown" | "revealed";

export default function TransformationRevealPage() {
  const [phase, setPhase] = useState<RevealPhase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [tab, setTab] = useState<"reveal" | "setup" | "leaderboard">("reveal");
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<RevealData>({ queryKey: ["/api/transformation/reveal"] });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => apiRequest("POST", "/api/transformation/reveal", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/transformation/reveal"] });
      qc.invalidateQueries({ queryKey: ["/api/transformation/leaderboard"] });
      setTab("reveal");
      toast({ title: "✅ Transformare salvată!", description: "Acum poți dezvălui progresul tău!" });
    },
  });

  // Countdown logic
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown === 0) {
      setTimeout(() => {
        setPhase("revealed");
        spawnParticles();
      }, 300);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 900);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const spawnParticles = () => {
    const colors = ["#22c55e", "#10b981", "#f59e0b", "#3b82f6", "#a855f7", "#ef4444"];
    const ps = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 60 + 20,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(ps);
    setTimeout(() => setParticles([]), 3000);
  };

  const startReveal = () => {
    setPhase("scanning");
    setTimeout(() => {
      setPhase("countdown");
      setCountdown(3);
    }, 2000);
  };

  const handleShare = useCallback(async () => {
    const card = cardRef.current;
    if (!card) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My FitForge AI Transformation",
          text: `Check out my transformation! Made with FitForge AI 💪`,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(`My FitForge AI Transformation 💪 ${window.location.origin}`);
        toast({ title: "📋 Copiat!", description: "Link-ul a fost copiat în clipboard" });
      }
    } catch {}
  }, [toast]);

  const handleVideoExport = useCallback(async (action: "download" | "share") => {
    if (!revealData) return;
    try {
      setVideoProgress(0);
      toast({ title: "🎬 Se generează videoclipul...", description: "Durează ~10 secunde. Nu închide pagina!" });
      const exportData: TikTokExportData = {
        displayName: revealData.displayName || "FitForge User",
        startWeight: revealData.startWeight || 80,
        endWeight: revealData.endWeight || 72,
        startBodyFat: revealData.startBodyFat || 25,
        endBodyFat: revealData.endBodyFat || 18,
        workoutsCompleted: revealData.workoutsCompleted || 0,
        daysCount: revealData.daysCount || 90,
        beforePhotoUrl: revealData.beforePhotoData || revealData.autoData?.beforePhotoData || null,
        afterPhotoUrl: revealData.afterPhotoData || revealData.autoData?.afterPhotoData || null,
      };
      const blob = await generateTikTokVideo(exportData, setVideoProgress);
      setVideoProgress(null);
      if (action === "share") {
        await shareToTikTok(blob, exportData);
      } else {
        downloadVideo(blob);
        toast({ title: "✅ Video descărcat!", description: "Gata de upload pe TikTok / Instagram Reels! 🔥" });
      }
    } catch (e) {
      setVideoProgress(null);
      toast({ title: "Eroare", description: "Nu s-a putut genera videoclipul.", variant: "destructive" });
    }
  }, [revealData, toast]);

  const hasData = !!(data?.reveal || (data?.autoData?.currentWeight));

  const revealData = data?.reveal
    ? { ...data.reveal, autoData: data.autoData }
    : data?.autoData?.currentWeight
    ? {
        id: 0, displayName: data.autoData.displayName,
        startWeight: data.autoData.targetWeight ? data.autoData.currentWeight + 10 : 80,
        endWeight: data.autoData.currentWeight,
        startBodyFat: 25, endBodyFat: 18,
        workoutsCompleted: data.autoData.completedWorkouts,
        daysCount: 90,
        beforePhotoData: null, afterPhotoData: null,
        isPublic: false, likesCount: 0,
        createdAt: new Date().toISOString(),
        autoData: data.autoData,
      }
    : null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Particles */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div key={p.id}
            initial={{ opacity: 1, scale: 1, x: `${p.x}vw`, y: `${p.y}vh` }}
            animate={{ opacity: 0, scale: 0, y: `${p.y - 30}vh` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="fixed pointer-events-none z-50 w-3 h-3 rounded-full"
            style={{ background: p.color, top: 0, left: 0 }}
          />
        ))}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center px-6 pt-12 pb-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-4">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary uppercase tracking-widest">Viral Feature</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-display font-black tracking-tight text-foreground mb-3">
            Transformation{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Reveal</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-md mx-auto text-base">
            Dezvăluie-ți transformarea spectaculos. Partajează pe TikTok, Instagram, YouTube Shorts.
          </motion.p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 px-6 mb-8">
        {([
          { id: "reveal", label: "🎬 Reveal", icon: Flame },
          { id: "setup", label: "⚙️ Setup", icon: BarChart3 },
          { id: "leaderboard", label: "🏆 Leaderboard", icon: Trophy },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-${t.id}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">

          {/* REVEAL TAB */}
          {tab === "reveal" && (
            <motion.div key="reveal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !hasData && phase === "idle" ? (
                <div className="text-center py-16 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Încă nu ai date</h2>
                    <p className="text-muted-foreground text-sm">Mergi la Setup pentru a-ți introduce datele de transformare</p>
                  </div>
                  <Button onClick={() => setTab("setup")} size="lg" className="gap-2">
                    <ChevronRight className="w-5 h-5" /> Configurează acum
                  </Button>
                </div>
              ) : phase === "idle" && revealData ? (
                <div className="space-y-8">
                  {/* Teaser card (blurred) */}
                  <div className="relative">
                    <div className="blur-sm opacity-60 pointer-events-none" ref={cardRef}>
                      <RevealCard data={revealData} revealed={false} />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                      <div className="text-center">
                        <div className="text-5xl mb-3">🔒</div>
                        <p className="text-foreground font-bold text-xl">Ești pregătit?</p>
                        <p className="text-muted-foreground text-sm mt-1">Transformarea ta te așteaptă</p>
                      </div>
                      <motion.button onClick={startReveal}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="relative group px-8 py-5 rounded-2xl text-white font-black text-xl shadow-2xl overflow-hidden"
                        style={{ background: "linear-gradient(135deg, #22c55e, #10b981)" }}
                        data-testid="button-reveal">
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-3">
                          <Flame className="w-7 h-7" />
                          Reveal My Transformation
                          <Flame className="w-7 h-7" />
                        </span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Quick stats preview */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Greutate pierdută", val: `${((revealData.startWeight || 80) - (revealData.endWeight || 72)).toFixed(1)}kg`, icon: TrendingDown, color: "text-emerald-400" },
                      { label: "Body Fat scăzut", val: `${((revealData.startBodyFat || 25) - (revealData.endBodyFat || 18)).toFixed(1)}%`, icon: BarChart3, color: "text-primary" },
                      { label: "Antrenamente", val: String(revealData.workoutsCompleted || data?.autoData?.completedWorkouts || 0), icon: Dumbbell, color: "text-yellow-400" },
                    ].map(({ label, val, icon: Icon, color }) => (
                      <div key={label} className="bg-card border border-border rounded-xl p-3 text-center blur-sm">
                        <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                        <div className={`text-lg font-black ${color}`}>{val}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : phase === "scanning" ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-6">
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-4 border-primary/50 animate-ping" style={{ animationDelay: "0.2s" }} />
                    <div className="absolute inset-4 rounded-full border-4 border-primary animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-12 h-12 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-xl font-bold text-foreground animate-pulse">Scanare transformare...</div>
                    <div className="text-sm text-muted-foreground">Analizăm progresul tău</div>
                  </div>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              ) : phase === "countdown" ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                  <AnimatePresence mode="wait">
                    <motion.div key={countdown}
                      initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.3 }}
                      className="text-[10rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-primary to-emerald-400">
                      {countdown === 0 ? "🔥" : countdown}
                    </motion.div>
                  </AnimatePresence>
                  <p className="text-muted-foreground text-lg font-semibold">Pregătește-te...</p>
                </div>
              ) : phase === "revealed" && revealData ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", bounce: 0.3 }} className="space-y-6">
                  <div ref={cardRef}>
                    <RevealCard data={revealData} revealed={true} />
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleShare} variant="outline" className="gap-2 h-12" data-testid="button-share">
                      <Share2 className="w-4 h-4" /> Share Link
                    </Button>
                    <Button onClick={() => setPhase("idle")} variant="outline" className="gap-2 h-12" data-testid="button-replay">
                      <Flame className="w-4 h-4" /> Replay
                    </Button>
                  </div>

                  {/* VIDEO EXPORT — TikTok/Reels */}
                  <div className="bg-gradient-to-br from-pink-950/40 to-red-950/40 border border-pink-500/30 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="w-5 h-5 text-pink-400" />
                      <h3 className="font-bold text-white text-base">Export Video TikTok / Reels</h3>
                    </div>
                    <p className="text-xs text-pink-300/70 mb-4">
                      Generează un video cinematic 9:16 cu animație, countdown și watermark. Gata de upload direct pe TikTok.
                    </p>

                    {videoProgress !== null ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
                          <span className="text-sm text-pink-300 font-medium">Se generează... {videoProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-300"
                            style={{ width: `${videoProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleVideoExport("share")}
                          className="bg-gradient-to-br from-pink-500 to-red-500 text-white rounded-xl py-3 flex flex-col items-center gap-1 hover:opacity-90 transition-opacity font-semibold"
                          data-testid="button-share-tiktok"
                        >
                          <span className="text-xl">🎵</span>
                          <span className="text-xs">Share TikTok</span>
                        </button>
                        <button
                          onClick={() => handleVideoExport("share")}
                          className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl py-3 flex flex-col items-center gap-1 hover:opacity-90 transition-opacity font-semibold"
                          data-testid="button-share-instagram"
                        >
                          <span className="text-xl">📸</span>
                          <span className="text-xs">Instagram Reels</span>
                        </button>
                        <button
                          onClick={() => handleVideoExport("download")}
                          className="col-span-2 bg-white/10 border border-white/20 text-white rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-white/15 transition-colors"
                          data-testid="button-download-video"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm font-semibold">Descarcă video (9 sec)</span>
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-pink-400/60 text-center mt-3">
                      ⚡ Include watermark „Made with FitForge AI" automat
                    </p>
                  </div>

                  {/* Make public CTA */}
                  {!revealData.isPublic && (
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center space-y-3">
                      <p className="text-sm font-semibold text-foreground">
                        🏆 Vrei să apari pe <span className="text-primary">Top Transformări</span>?
                      </p>
                      <Button onClick={() => {
                        saveMutation.mutate({ ...revealData, isPublic: true });
                      }} size="sm" className="gap-2" data-testid="button-make-public">
                        <Globe className="w-4 h-4" /> Fă public pe Leaderboard
                      </Button>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </motion.div>
          )}

          {/* SETUP TAB */}
          {tab === "setup" && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <SetupForm
                  autoData={data?.autoData || { currentWeight: null, targetWeight: null, completedWorkouts: 0, beforePhotoData: null, afterPhotoData: null, displayName: "FitForger" }}
                  onSave={(d) => saveMutation.mutate(d)}
                />
              )}
            </motion.div>
          )}

          {/* LEADERBOARD TAB */}
          {tab === "leaderboard" && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-6 text-center">
                <h2 className="font-display font-black text-2xl text-foreground mb-1">Top Transformări</h2>
                <p className="text-muted-foreground text-sm">Utilizatorii cu cele mai spectaculoase transformări</p>
              </div>
              <Leaderboard />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
