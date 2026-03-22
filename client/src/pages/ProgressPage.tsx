import { useLang } from "@/i18n/useLang";
import { EmptyProgress } from "@/components/EmptyState";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Input, Label, Dialog } from "@/components/ui";
import {
  TrendingUp, Plus, Weight, Ruler, Activity, Camera, Trash2,
  ArrowLeftRight, Upload, X, ChevronLeft, ChevronRight, ImageIcon, ZoomIn,
  Share2, Download, Loader2
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { formatDate } from "@/lib/utils";
import { useCheckinHistory } from "@/hooks/use-checkin";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

function useMeasurements() {
  return useQuery({
    queryKey: ["/api/progress"],
    queryFn: async () => {
      const res = await fetch("/api/progress", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function useAddMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Eroare");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/progress"] });
      qc.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      qc.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });
}

function useProgressPhotos() {
  return useQuery<any[]>({
    queryKey: ["/api/progress/photos"],
    queryFn: async () => {
      const res = await fetch("/api/progress/photos", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

async function compressImage(file: File, maxWidth = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
}

const DAY_PRESETS = ["Day 1", "Day 7", "Day 14", "Day 30", "Day 60", "Day 90", "Day 180", "Custom"];

// ─── Before/After Slider ──────────────────────────────────────────────────────
function BeforeAfterSlider({ before, after }: { before: any; after: any }) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  const onMouseDown = () => { dragging.current = true; };
  const onMouseMove = (e: React.MouseEvent) => { if (dragging.current) move(e.clientX); };
  const onMouseUp = () => { dragging.current = false; };
  const onTouchMove = (e: React.TouchEvent) => { move(e.touches[0].clientX); };

  useEffect(() => {
    const up = () => { dragging.current = false; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden cursor-ew-resize select-none border border-border"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchMove={onTouchMove}
      data-testid="before-after-slider"
    >
      {/* After (right side — full) */}
      <img src={after.photoData} className="absolute inset-0 w-full h-full object-cover" alt="After" />

      {/* Before (left side — clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before.photoData} className="absolute inset-0 w-full h-full object-cover" alt="Before" style={{ width: `${100 / (pos / 100)}%` }} />
      </div>

      {/* Divider line */}
      <div className="absolute inset-y-0 flex items-center" style={{ left: `calc(${pos}% - 1px)` }}>
        <div className="w-0.5 h-full bg-white/80 shadow-lg" />
        <div className="absolute w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center -translate-x-1/2 border-2 border-primary">
          <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
        {before.dayLabel}
      </div>
      <div className="absolute top-3 right-3 bg-primary/80 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
        {after.dayLabel}
      </div>
    </div>
  );
}

// ─── Share Transformation Card ───────────────────────────────────────────────
function ShareTransformationModal({ before, after, onClose }: { before: any; after: any; onClose: () => void }) {
  const [generating, setGenerating] = useState(false);
  const { data: profile } = useProfile();

  const generateCard = useCallback(async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    const W = 1080, H = 1350;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background gradient
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "rgba(34,197,94,0.08)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const loadImg = (src: string): Promise<HTMLImageElement> => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });

    const [beforeImg, afterImg] = await Promise.all([loadImg(before.photoData), loadImg(after.photoData)]);

    const PHOTO_TOP = 160;
    const PHOTO_H = 900;
    const PHOTO_W = 510;
    const GAP = 20;
    const LEFT_X = 30;
    const RIGHT_X = LEFT_X + PHOTO_W + GAP;

    // Rounded photo helper
    const drawRoundedImage = (img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.clip();

      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
      ctx.restore();
    };

    drawRoundedImage(beforeImg, LEFT_X, PHOTO_TOP, PHOTO_W, PHOTO_H, 24);
    drawRoundedImage(afterImg, RIGHT_X, PHOTO_TOP, PHOTO_W, PHOTO_H, 24);

    // Photo labels
    const drawLabel = (text: string, x: number, y: number, isAccent = false) => {
      ctx.save();
      ctx.fillStyle = isAccent ? "#22c55e" : "rgba(0,0,0,0.7)";
      ctx.beginPath();
      ctx.roundRect(x, y, 120, 44, 22);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 22px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text, x + 60, y + 29);
      ctx.restore();
    };
    drawLabel(before.dayLabel || "BEFORE", LEFT_X + 14, PHOTO_TOP + 14, false);
    drawLabel(after.dayLabel || "AFTER", RIGHT_X + 14, PHOTO_TOP + 14, true);

    // Header — FitForge AI branding
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 52px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FitForge.AI", W / 2, 85);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "28px -apple-system, sans-serif";
    ctx.fillText("Transformarea mea", W / 2, 128);

    // Bottom — name + CTA
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 38px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(profile?.displayName ? `— ${profile.displayName}` : "Alătură-te mie pe FitForge AI", W / 2, 1120);
    ctx.fillStyle = "rgba(34,197,94,0.7)";
    ctx.font = "26px -apple-system, sans-serif";
    ctx.fillText("fitforge-ai.replit.app/dashboard", W / 2, 1165);

    // Subtle vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    return canvas;
  }, [before, after, profile]);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const canvas = await generateCard();
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fitforge-transformation-${Date.now()}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/jpeg", 0.92);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    setGenerating(true);
    try {
      const canvas = await generateCard();
      canvas.toBlob(async blob => {
        if (!blob) return;
        const file = new File([blob], "fitforge-transformation.jpg", { type: "image/jpeg" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "FitForge AI — Transformarea mea",
            text: "Urmărește transformarea mea pe FitForge AI! 💪🔥",
            files: [file],
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "fitforge-transformation.jpg";
          a.click();
          URL.revokeObjectURL(url);
        }
        setGenerating(false);
      }, "image/jpeg", 0.92);
    } catch (e) {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" /> Share Transformare
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Preview card */}
        <div className="relative rounded-2xl overflow-hidden border border-border bg-[#0a0a0f]">
          <div className="grid grid-cols-2 gap-1 p-1">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
              <img src={before.photoData} className="w-full h-full object-cover" alt="Before" />
              <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{before.dayLabel}</span>
            </div>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
              <img src={after.photoData} className="w-full h-full object-cover" alt="After" />
              <span className="absolute top-2 left-2 bg-primary/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{after.dayLabel}</span>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] text-primary font-bold">FitForge.AI</span>
            <span className="text-[10px] text-muted-foreground">Transformarea mea</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Generăm un card 1080×1350px perfect pentru Instagram, TikTok și Snapchat.
        </p>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleShare}
            disabled={generating}
            className="flex items-center gap-2"
            data-testid="share-native-btn"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Share
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-2"
            data-testid="share-download-btn"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4 pt-1">
          <span className="text-xs text-muted-foreground">Partajează pe:</span>
          <span className="text-sm font-bold text-pink-400">📸 Instagram</span>
          <span className="text-sm font-bold text-black dark:text-white">🎵 TikTok</span>
          <span className="text-sm font-bold text-yellow-400">👻 Snapchat</span>
        </div>
      </div>
    </div>
  );
}

// ─── Photo Card ───────────────────────────────────────────────────────────────
function PhotoCard({ photo, onDelete, onSelect, isSelected }: { photo: any; onDelete: (id: number) => void; onSelect: (p: any) => void; isSelected: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all group aspect-[3/4]",
        isSelected ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]" : "border-border hover:border-primary/50"
      )}
      onClick={() => onSelect(photo)}
      data-testid={`photo-card-${photo.id}`}
    >
      <img src={photo.photoData} className="w-full h-full object-cover" alt={photo.dayLabel} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-sm font-bold">{photo.dayLabel}</p>
        {photo.note && <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{photo.note}</p>}
        <p className="text-white/50 text-xs mt-0.5">{formatDate(photo.takenAt || photo.createdAt)}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(photo.id); }}
        data-testid={`button-delete-photo-${photo.id}`}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80 hover:text-white"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      {isSelected && (
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <ZoomIn className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
}

// ─── Upload Dialog ────────────────────────────────────────────────────────────
function UploadPhotoDialog({ isOpen, onClose, onSave, isSaving }: { isOpen: boolean; onClose: () => void; onSave: (data: { photoData: string; dayLabel: string; note: string }) => void; isSaving: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dayLabel, setDayLabel] = useState("Day 1");
  const [customDay, setCustomDay] = useState("");
  const [note, setNote] = useState("");
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast({ title: "Fișier invalid", description: "Alege o imagine.", variant: "destructive" }); return; }
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut procesa imaginea.", variant: "destructive" });
    }
    setCompressing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = () => {
    if (!preview) { toast({ title: "Selectează o poză", variant: "destructive" }); return; }
    const label = dayLabel === "Custom" ? customDay || "Custom" : dayLabel;
    onSave({ photoData: preview, dayLabel: label, note });
  };

  const reset = () => { setPreview(null); setDayLabel("Day 1"); setCustomDay(""); setNote(""); };

  return (
    <Dialog isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="📸 Adaugă Poză Progres">
      <div className="space-y-5">
        {/* Upload zone */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-2xl transition-colors",
            preview ? "border-primary/40" : "border-border hover:border-primary/60 cursor-pointer"
          )}
          onClick={() => !preview && fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          data-testid="photo-drop-zone"
        >
          {preview ? (
            <div className="relative">
              <img src={preview} className="w-full max-h-64 object-contain rounded-2xl" alt="Preview" />
              <button
                onClick={e => { e.stopPropagation(); setPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-destructive/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              {compressing ? (
                <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">Trage poza aici sau apasă</p>
                    <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, HEIC • max 10MB</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} data-testid="input-photo-file" />

        {/* Day label */}
        <div>
          <Label>Etichetă zi</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {DAY_PRESETS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDayLabel(d)}
                data-testid={`preset-${d.replace(" ", "-")}`}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors",
                  dayLabel === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {d}
              </button>
            ))}
          </div>
          {dayLabel === "Custom" && (
            <Input
              className="mt-2"
              placeholder="Ex: Săptămâna 6, Lună 2..."
              value={customDay}
              onChange={e => setCustomDay(e.target.value)}
              data-testid="input-custom-day"
            />
          )}
        </div>

        {/* Note */}
        <div>
          <Label>Notiță opțională</Label>
          <Input
            placeholder="Ex: -3kg față de luna trecută!"
            value={note}
            onChange={e => setNote(e.target.value)}
            data-testid="input-photo-note"
          />
        </div>

        <Button className="w-full" onClick={handleSubmit} isLoading={isSaving || compressing} data-testid="button-save-photo">
          <Camera className="w-4 h-4 mr-2" /> Salvează Poza
        </Button>
      </div>
    </Dialog>
  );
}

// ─── Progress Photos Section ──────────────────────────────────────────────────
function ProgressPhotosSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: photos = [], isLoading } = useProgressPhotos();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [lightbox, setLightbox] = useState<any | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/progress/photos", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/progress/photos"] });
      toast({ title: "📸 Poză salvată!", description: "Continuă să faci poze pentru a vedea transformarea." });
      setUploadOpen(false);
    },
    onError: () => toast({ title: "Eroare la salvare", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/progress/photos/${id}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/progress/photos"] });
      toast({ title: "Poză ștearsă" });
    },
  });

  const handleSelect = (photo: any) => {
    if (!compareMode) { setLightbox(photo); return; }
    setSelected(prev => {
      if (prev.includes(photo.id)) return prev.filter(id => id !== photo.id);
      if (prev.length >= 2) return [prev[1], photo.id];
      return [...prev, photo.id];
    });
  };

  const selectedPhotos = selected.map(id => photos.find((p: any) => p.id === id)).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" /> Poze Progres
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Documentează-ți transformarea vizuală</p>
        </div>
        <div className="flex items-center gap-2">
          {photos.length >= 2 && (
            <Button
              variant={compareMode ? "primary" : "outline"}
              size="sm"
              onClick={() => { setCompareMode(!compareMode); setSelected([]); }}
              data-testid="button-compare-mode"
            >
              <ArrowLeftRight className="w-4 h-4 mr-1.5" />
              {compareMode ? "Ieșire Comparare" : "Compară Before/After"}
            </Button>
          )}
          <Button size="sm" onClick={() => setUploadOpen(true)} data-testid="button-add-photo">
            <Plus className="w-4 h-4 mr-1.5" /> Adaugă Poză
          </Button>
        </div>
      </div>

      {/* Compare hint */}
      {compareMode && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
          <ArrowLeftRight className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold">Modul Comparare activat</p>
            <p className="text-xs text-muted-foreground">
              {selected.length === 0 && "Selectează 2 poze pentru a le compara"}
              {selected.length === 1 && "Acum selectează a doua poză"}
              {selected.length === 2 && "Folosește slider-ul de mai jos pentru a compara"}
            </p>
          </div>
        </div>
      )}

      {/* Before/After slider */}
      {compareMode && selectedPhotos.length === 2 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-primary" /> Comparator Before / After
            </h3>
            <Button
              size="sm"
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 text-xs"
              data-testid="share-transformation-btn"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Transformare
            </Button>
          </div>
          <BeforeAfterSlider before={selectedPhotos[0]} after={selectedPhotos[1]} />
          <p className="text-xs text-muted-foreground text-center mt-2">Trage slider-ul pentru a compara • Apasă Share pentru a distribui</p>
        </Card>
      )}

      {/* Share Transformation Modal */}
      {shareOpen && selectedPhotos.length === 2 && (
        <ShareTransformationModal
          before={selectedPhotos[0]}
          after={selectedPhotos[1]}
          onClose={() => setShareOpen(false)}
        />
      )}

      {/* Empty state */}
      {photos.length === 0 && !isLoading && (
        <EmptyProgress onAddClick={() => setUploadOpen(true)} />
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo: any) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onDelete={id => deleteMutation.mutate(id)}
              onSelect={handleSelect}
              isSelected={selected.includes(photo.id)}
            />
          ))}
        </div>
      )}

      {/* Timeline badge summary */}
      {photos.length >= 2 && !compareMode && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(photos as any[]).slice().reverse().map((p: any, i: number) => (
            <button
              key={p.id}
              onClick={() => setLightbox(p)}
              data-testid={`timeline-badge-${p.id}`}
              className="shrink-0 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors border border-primary/20"
            >
              {p.dayLabel}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          data-testid="lightbox-overlay"
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.photoData} className="w-full rounded-2xl" alt={lightbox.dayLabel} />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
              <p className="text-white font-bold">{lightbox.dayLabel}</p>
              {lightbox.note && <p className="text-white/70 text-sm">{lightbox.note}</p>}
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <UploadPhotoDialog
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={data => addMutation.mutate(data)}
        isSaving={addMutation.isPending}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProgressPage() {
  const { tx } = useLang();
  const { data: measurements = [], isLoading } = useMeasurements();
  const { data: checkins = [] } = useCheckinHistory();
  const addMutation = useAddMeasurement();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ weight: "", bodyFat: "", waist: "", chest: "", arms: "", legs: "", notes: "" });

  const weightData = [...measurements]
    .reverse()
    .filter((m: any) => m.weight)
    .map((m: any) => ({ date: formatDate(m.measuredAt), weight: m.weight }));

  const energyData = [...checkins]
    .reverse()
    .slice(-14)
    .map((c: any) => ({ date: c.date, energy: c.energyLevel, sleep: c.sleepHours, stress: c.stressLevel }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {};
    if (form.weight) payload.weight = parseFloat(form.weight);
    if (form.bodyFat) payload.bodyFat = parseFloat(form.bodyFat);
    if (form.waist) payload.waist = parseFloat(form.waist);
    if (form.chest) payload.chest = parseFloat(form.chest);
    if (form.arms) payload.arms = parseFloat(form.arms);
    if (form.legs) payload.legs = parseFloat(form.legs);
    if (form.notes) payload.notes = form.notes;

    addMutation.mutate(payload, {
      onSuccess: () => {
        setIsOpen(false);
        setForm({ weight: "", bodyFat: "", waist: "", chest: "", arms: "", legs: "", notes: "" });
      },
    });
  };

  const latest = measurements[0] as any;
  const previous = measurements[1] as any;
  const weightChange = latest?.weight && previous?.weight ? (latest.weight - previous.weight).toFixed(1) : null;

  if (isLoading) return <div className="animate-pulse p-8 text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">{tx.progress.title}</h1>
          <p className="text-muted-foreground mt-1">Monitorizează evoluția corpului tău în timp.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="gap-2" data-testid="button-add-measurement">
          <Plus className="w-5 h-5" /> Adaugă Măsurătoare
        </Button>
      </div>

      {/* Quick Stats */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Greutate", value: latest.weight ? `${latest.weight} kg` : "—", icon: Weight, change: weightChange ? `${weightChange > "0" ? "+" : ""}${weightChange} kg` : null },
            { label: tx.progress.bodyFat, value: latest.bodyFat ? `${latest.bodyFat}%` : "—", icon: Activity },
            { label: "Talie", value: latest.waist ? `${latest.waist} cm` : "—", icon: Ruler },
            { label: "Brațe", value: latest.arms ? `${latest.arms} cm` : "—", icon: TrendingUp },
          ].map((stat, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-display font-bold">{stat.value}</p>
              {stat.change && (
                <p className={`text-xs mt-1 font-medium ${parseFloat(stat.change) > 0 ? "text-accent" : "text-primary"}`}>
                  {stat.change} față de ultima
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── Progress Photos ── */}
      <Card className="p-6">
        <ProgressPhotosSection />
      </Card>

      {/* Weight Chart */}
      {weightData.length > 1 && (
        <Card className="p-6">
          <h2 className="text-lg font-display font-bold mb-4">Evoluție Greutate</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weightData}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(215 20% 65%)", fontSize: 11 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "hsl(215 20% 65%)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(217 33% 17%)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="weight" stroke="hsl(142 71% 45%)" fill="url(#weightGrad)" strokeWidth={2} dot={{ fill: "hsl(142 71% 45%)", r: 4 }} name=tx.progress.weight />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Energy / Biometric Chart */}
      {energyData.length > 1 && (
        <Card className="p-6">
          <h2 className="text-lg font-display font-bold mb-1">Biometrice Zilnice</h2>
          <p className="text-sm text-muted-foreground mb-4">Energie, somn și stres din check-in-urile zilnice</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(215 20% 65%)", fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fill: "hsl(215 20% 65%)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(217 33% 17%)", borderRadius: 12 }} />
              <Line type="monotone" dataKey="energy" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} name="Energie" />
              <Line type="monotone" dataKey="sleep" stroke="hsl(199 89% 48%)" strokeWidth={2} dot={false} name="Somn (h)" />
              <Line type="monotone" dataKey="stress" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} name="Stres" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Measurements History */}
      {measurements.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-display font-bold mb-4">Istoric Măsurători</h2>
          <div className="space-y-3">
            {measurements.slice(0, 8).map((m: any) => (
              <div key={m.id} className="flex items-start justify-between p-4 rounded-xl bg-background/60 border border-border/40">
                <div>
                  <p className="text-sm font-semibold">{formatDate(m.measuredAt)}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {m.weight && <span className="text-xs text-muted-foreground">⚖️ {m.weight}kg</span>}
                    {m.bodyFat && <span className="text-xs text-muted-foreground">💪 {m.bodyFat}% BF</span>}
                    {m.waist && <span className="text-xs text-muted-foreground">📏 Talie {m.waist}cm</span>}
                    {m.chest && <span className="text-xs text-muted-foreground">Piept {m.chest}cm</span>}
                  </div>
                  {m.notes && <p className="text-xs text-muted-foreground mt-1 italic">{m.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {measurements.length === 0 && (
        <Card className="p-12 text-center">
          <Weight className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-display font-bold text-lg">{tx.progress.noData} încă</p>
          <p className="text-muted-foreground text-sm mt-1 mb-4">Adaugă prima măsurătoare pentru a urmări progresul</p>
          <Button onClick={() => setIsOpen(true)}>Adaugă Prima Măsurătoare (+25 pct)</Button>
        </Card>
      )}

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Adaugă Măsurătoare">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "weight", label: tx.progress.weight, placeholder: "75.5" },
              { key: "bodyFat", label: tx.progress.bodyFat, placeholder: "18.5" },
              { key: "waist", label: tx.progress.waist, placeholder: "82" },
              { key: "chest", label: tx.progress.chest, placeholder: "98" },
              { key: "arms", label: tx.progress.arms, placeholder: "35" },
              { key: "legs", label: tx.progress.legs, placeholder: "56" },
            ].map(field => (
              <div key={field.key}>
                <Label>{field.label}</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={field.placeholder}
                  value={(form as any)[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  data-testid={`input-${field.key}`}
                />
              </div>
            ))}
          </div>
          <div>
            <Label>Notițe</Label>
            <Input
              placeholder="Notițe opționale..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <Button type="submit" className="w-full" isLoading={addMutation.isPending} data-testid="button-submit-measurement">
            Salvează (+25 puncte)
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
