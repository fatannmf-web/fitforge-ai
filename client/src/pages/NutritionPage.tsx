import { useLang } from "@/i18n/useLang";
import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNutritionLogs, useCreateNutritionLog, useAnalyzeNutrition, useDeleteNutritionLog } from "@/hooks/use-nutrition";
import { useProfile } from "@/hooks/use-profile";
import { apiRequest } from "@/lib/queryClient";
import { useProGate } from "@/hooks/use-pro-gate";
import { useIsPro } from "@/hooks/use-subscription";
import { EmptyNutrition } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Camera, Refrigerator, ChefHat, Plus, X, Sparkles, Flame, Zap,
  ChevronLeft, ArrowRight, Clock, Check, Trash2, Upload, RotateCcw,
  TrendingUp, Dumbbell, Target, Info, Loader2, ScanLine, Package, Mic, MicOff, Volume2
} from "lucide-react";

// ─── IMAGE UTILS ──────────────────────────────────────────────────────────────
async function fileToBase64(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const bytes = new Uint8Array(ab);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface FoodScanResult {
  isFood: boolean;
  foodName: string;
  items: { name: string; quantity: string; unit: string }[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: string;
  mealType: string;
  notes: string;
}

interface FridgeScanResult {
  ingredients: string[];
  recipes: { name: string; emoji: string; time: string; calories: number; protein: number; carbs: number; fat: number; description: string }[];
  tip: string;
}

interface RecipeResult {
  name: string;
  emoji: string;
  description: string;
  prepTime: string;
  difficulty: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
  ingredients: { item: string; amount: string }[];
  steps: string[];
  coachName: string;
  coachTip: string;
  tags: string[];
}

interface CoachAdvice {
  coaches: { name: string; role: string; id: string; advice: string }[];
}

// ─── MACRO BAR ────────────────────────────────────────────────────────────────
function MacroBar({ label, value, goal, color, unit = "g" }: {
  label: string; value: number; goal: number; color: string; unit?: string;
}) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}{unit} / {goal}{unit}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── CAMERA CAPTURE ───────────────────────────────────────────────────────────
function CameraCapture({
  title, subtitle, onCapture, onClose
}: {
  title: string; subtitle: string;
  onCapture: (file: File, previewUrl: string) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFile = (f: File) => {
    const url = URL.createObjectURL(f);
    setPreview(url);
    setFile(f);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors" data-testid="button-close-camera">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {!preview ? (
        <div className="space-y-3">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 to-purple-600/5 border-2 border-dashed border-primary/30 aspect-[4/3] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/60 transition-all group"
            onClick={() => inputRef.current?.click()}>
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-bold">Fotografiază sau încarcă</p>
              <p className="text-sm text-muted-foreground">AI analizează instant</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => inputRef.current?.click()}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              data-testid="button-open-camera">
              <Camera className="w-4 h-4" /> Cameră
            </button>
            <button onClick={() => inputRef.current?.click()}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-muted font-semibold hover:bg-muted/80 transition-colors"
              data-testid="button-upload-photo">
              <Upload className="w-4 h-4" /> Galerie
            </button>
          </div>

          <input ref={inputRef} type="file" accept="image/*" capture="environment"
            className="hidden" data-testid="input-camera-file"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-border">
            <img src={preview} alt="Captured" className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2">
              <button onClick={() => { setPreview(null); setFile(null); }}
                className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70"
                data-testid="button-retake-photo">
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <Button onClick={() => file && onCapture(file, preview)}
            className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 text-white font-bold gap-2"
            data-testid="button-analyze-photo">
            <Sparkles className="w-4 h-4" /> Analizează cu AI
          </Button>
          <input ref={inputRef} type="file" accept="image/*" capture="environment"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        </div>
      )}
    </div>
  );
}

// ─── COACH AVATAR ─────────────────────────────────────────────────────────────
function CoachChip({ id, name, role, advice }: { id: string; name: string; role: string; advice: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-2xl bg-muted/30 border border-border">
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shrink-0">
        <img src={`/coaches/${id}.png`} alt={name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).style.display = "none"; }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold">{name} <span className="text-muted-foreground font-normal">· {role}</span></p>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">"{advice}"</p>
      </div>
    </div>
  );
}

// ─── FOOD SCAN MODAL ──────────────────────────────────────────────────────────
function FoodScanModal({ onClose, onLogged, profile }: {
  onClose: () => void;
  onLogged: () => void;
  profile: any;
}) {
  const [step, setStep] = useState<"camera" | "analyzing" | "result">("camera");
  const [scanResult, setScanResult] = useState<FoodScanResult | null>(null);
  const [coachAdvice, setCoachAdvice] = useState<CoachAdvice | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const handleProError = useProGate();
  const createLog = useCreateNutritionLog();

  const scanMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const res = await apiRequest("POST", "/api/nutrition/scan-photo", { imageBase64 });
      return res.json();
    }
  });

  const coachMutation = useMutation({
    mutationFn: async (meal: any) => {
      const res = await apiRequest("POST", "/api/nutrition/coach-advice", {
        ...meal, goalType: profile?.goalType
      });
      return res.json();
    }
  });

  const handleCapture = async (file: File, prevUrl: string) => {
    setPreview(prevUrl);
    setStep("analyzing");
    try {
      const b64 = await fileToBase64(file);
      const result = await scanMutation.mutateAsync(b64);
      setScanResult(result);
      const advice = await coachMutation.mutateAsync(result);
      setCoachAdvice(advice);
      setStep("result");
    } catch (e) {
      if (handleProError(e)) { onClose(); return; }
      toast({ title: "Eroare", description: "Nu am putut analiza imaginea. Încearcă din nou.", variant: "destructive" });
      setStep("camera");
    }
  };

  const handleLog = () => {
    if (!scanResult) return;
    createLog.mutate({
      mealType: (scanResult.mealType as any) || "lunch",
      foodName: scanResult.foodName,
      calories: Math.round(scanResult.calories),
      protein: Number(scanResult.protein.toFixed(1)),
      carbs: Number(scanResult.carbs.toFixed(1)),
      fat: Number(scanResult.fat.toFixed(1)),
      quantity: 1,
      unit: "portion",
    }, {
      onSuccess: () => {
        toast({ title: "✅ Masă înregistrată!", description: `${scanResult.foodName} a fost adăugată în jurnalul tău.` });
        onLogged();
        onClose();
      }
    });
  };

  if (step === "camera") {
    return (
      <CameraCapture
        title="Scanează Mâncarea"
        subtitle="AI identifică alimentele și estimează macronutrienții"
        onCapture={handleCapture}
        onClose={onClose}
      />
    );
  }

  if (step === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6">
        {preview && (
          <div className="w-32 h-32 rounded-2xl overflow-hidden border border-border">
            <img src={preview} alt="Analyzing" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="text-center space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="font-bold">AI analizează imaginea...</span>
          </div>
          <p className="text-sm text-muted-foreground">GPT-4o Vision detectează alimentele și estimează macronutrienții</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center" data-testid="button-back-scan">
          <X className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-bold text-lg">Rezultat Scanare</h3>
          <p className="text-xs text-muted-foreground">Estimare AI · Valorile pot varia</p>
        </div>
      </div>

      {preview && (
        <div className="relative rounded-2xl overflow-hidden h-40 border border-border">
          <img src={preview} alt="Scanned food" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3">
            <p className="text-white font-bold text-lg">{scanResult?.foodName}</p>
            <Badge className="text-[10px] bg-primary/80">{scanResult?.confidence === "high" ? "✓ Confident" : "~ Estimare"}</Badge>
          </div>
        </div>
      )}

      {scanResult?.items && scanResult.items.length > 0 && (
        <div className="rounded-2xl bg-muted/30 border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Alimente detectate</p>
          <div className="flex flex-wrap gap-1.5">
            {scanResult.items.map((item, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                {item.name} {item.quantity}{item.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Calorii", val: Math.round(scanResult?.calories || 0), unit: "kcal", color: "#f97316" },
          { label: "Proteine", val: Math.round(scanResult?.protein || 0), unit: "g", color: "#ef4444" },
          { label: "Carbohidrați", val: Math.round(scanResult?.carbs || 0), unit: "g", color: "#3b82f6" },
          { label: "Grăsimi", val: Math.round(scanResult?.fat || 0), unit: "g", color: "#eab308" },
        ].map(m => (
          <div key={m.label} className="text-center bg-card rounded-2xl p-3 border border-border">
            <p className="text-xl font-black" style={{ color: m.color }}>{m.val}</p>
            <p className="text-[9px] text-muted-foreground font-semibold">{m.unit}</p>
            <p className="text-[9px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      {scanResult?.notes && (
        <div className="flex gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{scanResult.notes}</p>
        </div>
      )}

      {coachAdvice?.coaches && coachAdvice.coaches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sfatul antrenorilor</p>
          {coachAdvice.coaches.map((c, i) => (
            <CoachChip key={i} id={c.id} name={c.name} role={c.role} advice={c.advice} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
        <Info className="w-3 h-3 shrink-0" />
        <span>Valorile nutriționale sunt estimate de AI și pot varia față de valorile reale.</span>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={() => setStep("camera")} className="flex-1" data-testid="button-rescan">
          <RotateCcw className="w-4 h-4 mr-1" /> Rescaneaza
        </Button>
        <Button onClick={handleLog} isLoading={createLog.isPending}
          className="flex-1 bg-gradient-to-r from-primary to-purple-600 text-white font-bold"
          data-testid="button-log-scanned-meal">
          <Plus className="w-4 h-4 mr-1" /> Adaugă în Jurnal
        </Button>
      </div>
    </div>
  );
}

// ─── FRIDGE SCAN MODAL ────────────────────────────────────────────────────────
function FridgeScanModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"camera" | "analyzing" | "result">("camera");
  const [result, setResult] = useState<FridgeScanResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const handleProError = useProGate();

  const scanMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const res = await apiRequest("POST", "/api/nutrition/scan-fridge", { imageBase64 });
      return res.json();
    }
  });

  const handleCapture = async (file: File, prevUrl: string) => {
    setPreview(prevUrl);
    setStep("analyzing");
    try {
      const b64 = await fileToBase64(file);
      const data = await scanMutation.mutateAsync(b64);
      setResult(data);
      setStep("result");
    } catch (e) {
      if (handleProError(e)) { onClose(); return; }
      toast({ title: "Eroare", description: "Nu am putut analiza frigiderul.", variant: "destructive" });
      setStep("camera");
    }
  };

  if (step === "camera") {
    return (
      <CameraCapture
        title="Scanează Frigiderul"
        subtitle="AI detectează ingredientele și sugerează rețete"
        onCapture={handleCapture}
        onClose={onClose}
      />
    );
  }

  if (step === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6">
        {preview && (
          <div className="w-32 h-32 rounded-2xl overflow-hidden border border-border">
            <img src={preview} alt="Analyzing" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="text-center space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
            <span className="font-bold">Scanez frigiderul...</span>
          </div>
          <p className="text-sm text-muted-foreground">AI identifică ingredientele și generează rețete</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center" data-testid="button-close-fridge">
          <X className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-bold text-lg">Ingrediente detectate</h3>
          <p className="text-xs text-muted-foreground">AI a generat rețete pentru tine</p>
        </div>
      </div>

      {preview && (
        <div className="relative rounded-2xl overflow-hidden h-36 border border-border">
          <img src={preview} alt="Fridge scan" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-3">
            <p className="text-white text-xs font-semibold">{result?.ingredients?.length || 0} ingrediente găsite</p>
          </div>
        </div>
      )}

      {result?.ingredients && result.ingredients.length > 0 && (
        <div className="rounded-2xl bg-muted/30 border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">🧊 Ingrediente găsite</p>
          <div className="flex flex-wrap gap-1.5">
            {result.ingredients.map((ing, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-medium capitalize">
                {ing}
              </span>
            ))}
          </div>
        </div>
      )}

      {result?.tip && (
        <div className="flex gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-primary/90">{result.tip}</p>
        </div>
      )}

      {result?.recipes && result.recipes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">🍳 Rețete sugerate</p>
          {result.recipes.map((rec, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                {rec.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{rec.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{rec.description}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] text-orange-500 font-bold">{rec.calories} kcal</span>
                  <span className="text-[10px] text-red-400 font-bold">{rec.protein}g P</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {rec.time}</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" onClick={() => setStep("camera")} className="w-full" data-testid="button-rescan-fridge">
        <RotateCcw className="w-4 h-4 mr-2" /> Scanează din nou
      </Button>
    </div>
  );
}

// ─── SMART RECIPE MODAL ────────────────────────────────────────────────────────
function SmartRecipeModal({ onClose, profile }: { onClose: () => void; profile: any }) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [recipe, setRecipe] = useState<RecipeResult | null>(null);
  const { toast } = useToast();

  const recipeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/nutrition/recipe", {
        ingredients, goal: profile?.goalType || "general_fitness"
      });
      return res.json();
    }
  });

  const addIngredient = () => {
    const v = input.trim();
    if (v && !ingredients.includes(v)) {
      setIngredients(prev => [...prev, v]);
      setInput("");
    }
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) return;
    try {
      const r = await recipeMutation.mutateAsync();
      setRecipe(r);
    } catch {
      toast({ title: "Eroare", description: "Nu am putut genera rețeta.", variant: "destructive" });
    }
  };

  const goalLabels: Record<string, string> = {
    weight_loss: "Slăbire", muscle_gain: "Masă musculară",
    endurance: "Rezistență", general_fitness: "Fitness general"
  };

  const quickIngredients = ["Pui", "Ouă", "Orez", "Broccoli", "Somon", "Avocado", "Fasole", "Spanac", "Ton", "Cartofi dulci"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center" data-testid="button-close-recipes">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-bold text-lg">Smart Recipe Generator</h3>
          <p className="text-xs text-muted-foreground">AI generează rețeta perfectă pentru obiectivul tău</p>
        </div>
      </div>

      {!recipe ? (
        <>
          <div className="rounded-2xl bg-muted/20 border border-border p-3 text-xs flex items-center gap-2">
            <Target className="w-4 h-4 text-primary shrink-0" />
            <span>Obiectiv: <strong>{goalLabels[profile?.goalType] || "Fitness general"}</strong></span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Ce ingrediente ai?</label>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addIngredient()}
                placeholder="Ex: piept de pui, orez..."
                data-testid="input-ingredient"
                className="flex-1 h-11 px-4 rounded-xl bg-background border-2 border-border focus:border-primary focus:outline-none text-sm transition-colors"
              />
              <button onClick={addIngredient}
                className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                data-testid="button-add-ingredient">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {ingredients.map((ing, i) => (
                  <span key={i} onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))}
                    className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 cursor-pointer hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-colors flex items-center gap-1.5"
                    data-testid={`tag-ingredient-${i}`}>
                    {ing} <X className="w-3 h-3" />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sugestii rapide</p>
            <div className="flex flex-wrap gap-1.5">
              {quickIngredients.filter(q => !ingredients.includes(q)).map(q => (
                <button key={q} onClick={() => setIngredients(prev => [...prev, q])}
                  className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                  data-testid={`quick-ingredient-${q}`}>
                  + {q}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerate} isLoading={recipeMutation.isPending}
            disabled={ingredients.length === 0}
            className="w-full h-13 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold gap-2"
            data-testid="button-generate-recipe">
            <ChefHat className="w-5 h-5" /> Generează Rețeta AI
          </Button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-orange-500/10 to-red-500/5 p-5">
            <div className="text-4xl mb-3">{recipe.emoji}</div>
            <h2 className="text-xl font-black mb-1">{recipe.name}</h2>
            <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {recipe.tags?.map((t, i) => <Badge key={i} className="text-[10px]">{t}</Badge>)}
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.prepTime}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { l: "Calorii", v: recipe.calories, u: "kcal", c: "#f97316" },
                { l: "Proteine", v: recipe.protein, u: "g", c: "#ef4444" },
                { l: "Carbohidrați", v: recipe.carbs, u: "g", c: "#3b82f6" },
                { l: "Grăsimi", v: recipe.fat, u: "g", c: "#eab308" },
              ].map(m => (
                <div key={m.l} className="text-center bg-background/50 rounded-xl p-2">
                  <p className="text-lg font-black" style={{ color: m.c }}>{m.v}</p>
                  <p className="text-[9px] text-muted-foreground">{m.u}</p>
                  <p className="text-[9px] text-muted-foreground">{m.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-bold">📋 Ingrediente</p>
            {recipe.ingredients?.map((ing, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                <span>{ing.item}</span>
                <span className="text-muted-foreground font-semibold">{ing.amount}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-bold">👨‍🍳 Mod de preparare</p>
            {recipe.steps?.map((step, i) => (
              <div key={i} className="flex gap-3 text-sm py-1">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>

          {recipe.coachTip && (
            <div className="flex gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/20">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shrink-0">
                <img src={`/coaches/${recipe.coachName?.toLowerCase() || "atlas"}.png`} alt={recipe.coachName}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div>
                <p className="text-xs font-bold text-primary">{recipe.coachName}</p>
                <p className="text-sm text-muted-foreground">{recipe.coachTip}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRecipe(null)} className="flex-1" data-testid="button-new-recipe">
              <RotateCcw className="w-4 h-4 mr-1" /> Altă rețetă
            </Button>
            <Button onClick={onClose} className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white" data-testid="button-close-recipe">
              <Check className="w-4 h-4 mr-1" /> Perfect!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOG MEAL MODAL ────────────────────────────────────────────────────────────
function LogMealModal({ onClose }: { onClose: () => void }) {
  const [aiInput, setAiInput] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [macros, setMacros] = useState({ foodName: "", calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const analyzeMutation = useAnalyzeNutrition();
  const createLog = useCreateNutritionLog();
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!aiInput.trim()) return;
    try {
      const data = await analyzeMutation.mutateAsync(aiInput);
      setMacros({ foodName: data.foodName || aiInput, calories: data.calories || 0, protein: data.protein || 0, carbs: data.carbs || 0, fat: data.fat || 0 });
      setIsAnalyzed(true);
    } catch {
      toast({ title: "Eroare", description: "Nu am putut analiza.", variant: "destructive" });
    }
  };

  const handleLog = () => {
    createLog.mutate({
      mealType: mealType as any,
      foodName: macros.foodName,
      calories: Math.round(macros.calories),
      protein: Number(macros.protein.toFixed(1)),
      carbs: Number(macros.carbs.toFixed(1)),
      fat: Number(macros.fat.toFixed(1)),
      quantity: 1,
      unit: "portion",
    }, {
      onSuccess: () => {
        toast({ title: "✅ Masă înregistrată!" });
        onClose();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center" data-testid="button-close-logmeal">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-bold text-lg">Înregistrează Masa</h3>
          <p className="text-xs text-muted-foreground">Descrie ce ai mâncat → AI estimează macronutrienții</p>
        </div>
      </div>

      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-3">
        <label className="text-sm font-semibold text-primary flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Food Analyzer</label>
        <textarea value={aiInput} onChange={e => setAiInput(e.target.value)}
          placeholder="Ex: 200g piept de pui cu orez și broccoli, ulei de măsline..."
          rows={3} data-testid="input-ai-food-text"
          className="w-full px-4 py-3 rounded-xl bg-background border border-primary/20 focus:border-primary focus:outline-none text-sm resize-none" />
        <Button onClick={handleAnalyze} isLoading={analyzeMutation.isPending} disabled={!aiInput.trim()} className="w-full h-10" data-testid="button-ai-analyze">
          <Sparkles className="w-4 h-4 mr-2" /> Analizează
        </Button>
      </div>

      {isAnalyzed && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="grid grid-cols-4 gap-2">
            {[
              { l: "Calorii", v: macros.calories, u: "kcal", c: "#f97316" },
              { l: "Proteine", v: macros.protein, u: "g", c: "#ef4444" },
              { l: "Carbs", v: macros.carbs, u: "g", c: "#3b82f6" },
              { l: "Grăsimi", v: macros.fat, u: "g", c: "#eab308" },
            ].map(m => (
              <div key={m.l} className="text-center bg-card rounded-xl p-2.5 border border-border">
                <p className="text-lg font-black" style={{ color: m.c }}>{Math.round(m.v)}</p>
                <p className="text-[9px] text-muted-foreground">{m.u}</p>
                <p className="text-[9px] text-muted-foreground">{m.l}</p>
              </div>
            ))}
          </div>

          <div>
            <label className="text-sm font-semibold">Tip masă</label>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {["breakfast", "lunch", "dinner", "snack"].map(t => (
                <button key={t} onClick={() => setMealType(t)}
                  className={`h-10 rounded-xl text-sm font-semibold border transition-all ${mealType === t ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border hover:border-primary/40"}`}
                  data-testid={`button-mealtype-${t}`}>
                  {t === "breakfast" ? "🍳" : t === "lunch" ? "🥗" : t === "dinner" ? "🍽️" : "🍎"}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleLog} isLoading={createLog.isPending}
            className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 text-white font-bold"
            data-testid="button-save-meal-log">
            <Plus className="w-4 h-4 mr-2" /> Adaugă în Jurnal
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── MODAL WRAPPER ─────────────────────────────────────────────────────────────
function Modal({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-background rounded-3xl border border-border shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        {children}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
type ActiveModal = "scan" | "fridge" | "recipe" | "log" | "barcode" | "voice" | null;

// ─── VOICE LOG MODAL ──────────────────────────────────────────────────────────
function VoiceLogModal({ onClose, onLogged }: { onClose: () => void; onLogged: () => void }) {
  const [step, setStep] = useState<"idle" | "recording" | "processing" | "result" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [typedInput, setTypedInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const createLog = useCreateNutritionLog();
  const { toast } = useToast();

  const hasSpeechAPI = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "ro-RO";
    recognition.onstart = () => { setIsListening(true); setStep("recording"); };
    recognition.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      setTranscript(t);
    };
    recognition.onend = () => {
      setIsListening(false);
      if (transcript) analyzeText(transcript);
    };
    recognition.onerror = () => { setIsListening(false); setStep("idle"); };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const analyzeText = async (text: string) => {
    if (!text.trim()) return;
    setStep("processing");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: `Analizează această descriere de mâncare și returnează DOAR un JSON valid fără markdown:\n"${text}"\n\nJSON format:\n{"foodName":"...","calories":0,"protein":0,"carbs":0,"fat":0,"mealType":"breakfast|lunch|dinner|snack","quantity":100,"unit":"g","confidence":"high|medium|low"}\n\nEstimează valorile nutriționale per porție descrisă. Fii realist.`
          }]
        })
      });
      const data = await res.json();
      const content = data.content?.[0]?.text || "";
      const clean = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setStep("result");
    } catch {
      setStep("error");
    }
  };

  const handleLog = async () => {
    if (!result) return;
    await createLog.mutateAsync(result);
    toast({ title: "✅ Logat cu succes!", description: result.foodName });
    onLogged();
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" /> Voice Log
          </h3>
          <p className="text-xs text-muted-foreground">Spune sau scrie ce ai mâncat</p>
        </div>
      </div>

      {/* Buton înregistrare */}
      {step === "idle" && (
        <div className="space-y-4">
          {hasSpeechAPI && (
            <button
              onClick={startListening}
              className="w-full py-8 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center gap-3 hover:bg-primary/10 transition-colors"
              data-testid="button-start-voice"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-bold text-primary">Apasă și vorbește</p>
                <p className="text-xs text-muted-foreground mt-1">Ex: "Am mâncat o omletă cu 3 ouă și pâine"</p>
              </div>
            </button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">
                {hasSpeechAPI ? "sau scrie manual" : "descrie mâncarea"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              value={typedInput}
              onChange={e => setTypedInput(e.target.value)}
              placeholder="Ex: Am mâncat la prânz o porție de paste bolognese cu parmezan, un pahar de suc de portocale și o pară"
              className="w-full h-24 px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary/50 transition-colors resize-none"
              data-testid="input-voice-text"
            />
            <Button
              onClick={() => analyzeText(typedInput)}
              disabled={typedInput.trim().length < 5}
              className="w-full"
              data-testid="button-analyze-voice"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Analizează cu AI
            </Button>
          </div>
        </div>
      )}

      {step === "recording" && (
        <div className="flex flex-col items-center py-10 gap-4">
          <button
            onClick={stopListening}
            className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center animate-pulse"
          >
            <MicOff className="w-10 h-10 text-red-500" />
          </button>
          <p className="font-bold text-red-500">Înregistrez... apasă pentru a opri</p>
          {transcript && (
            <div className="w-full p-3 rounded-xl bg-muted/30 text-sm text-center italic">
              "{transcript}"
            </div>
          )}
        </div>
      )}

      {step === "processing" && (
        <div className="flex flex-col items-center py-12 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="font-semibold">AI analizează...</p>
          <p className="text-sm text-muted-foreground text-center italic">"{transcript || typedInput}"</p>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <p className="font-bold text-lg mb-1">{result.foodName}</p>
            <p className="text-xs text-muted-foreground mb-3">
              Tip masă: {result.mealType} · Porție: {result.quantity}{result.unit}
              {result.confidence === "low" && <span className="ml-2 text-yellow-500">⚠️ estimare aproximativă</span>}
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Calorii", val: result.calories, unit: "kcal", color: "#f97316" },
                { label: "Proteine", val: result.protein, unit: "g", color: "#22c55e" },
                { label: "Carbs", val: result.carbs, unit: "g", color: "#60a5fa" },
                { label: "Grăsimi", val: result.fat, unit: "g", color: "#c084fc" },
              ].map(m => (
                <div key={m.label} className="bg-muted/30 rounded-xl p-2">
                  <div className="font-bold text-lg" style={{ color: m.color }}>{m.val}</div>
                  <div className="text-[9px] text-muted-foreground">{m.unit}</div>
                  <div className="text-[9px] text-muted-foreground">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setStep("idle"); setTranscript(""); setTypedInput(""); }} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" /> Din nou
            </Button>
            <Button onClick={handleLog} isLoading={createLog.isPending} className="flex-1" data-testid="button-log-voice">
              <Check className="w-4 h-4 mr-2" /> Adaugă
            </Button>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="text-center py-8 space-y-4">
          <p className="text-2xl">😕</p>
          <p className="font-bold">Nu am putut analiza</p>
          <p className="text-sm text-muted-foreground">Încearcă să fii mai specific. Ex: "100g piept de pui la grătar"</p>
          <Button onClick={() => setStep("idle")} variant="outline">Încearcă din nou</Button>
        </div>
      )}
    </div>
  );
}

// ─── WATER TRACKER ────────────────────────────────────────────────────────────
function WaterTracker() {
  const GOAL = 8; // pahare de 250ml = 2L
  const storageKey = `fitforge_water_${new Date().toDateString()}`;
  const [glasses, setGlasses] = useState(() => {
    try { return parseInt(localStorage.getItem(storageKey) || "0"); } catch { return 0; }
  });

  const add = () => {
    const next = Math.min(glasses + 1, GOAL + 4);
    setGlasses(next);
    try { localStorage.setItem(storageKey, String(next)); } catch {}
  };
  const remove = () => {
    const next = Math.max(glasses - 1, 0);
    setGlasses(next);
    try { localStorage.setItem(storageKey, String(next)); } catch {}
  };

  const pct = Math.min((glasses / GOAL) * 100, 100);
  const ml = glasses * 250;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💧</span>
          <h2 className="font-bold">Hidratare</h2>
        </div>
        <span className="text-sm text-muted-foreground font-medium">{ml}ml / {GOAL * 250}ml</span>
      </div>

      {/* Pahare vizuale */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {Array.from({ length: GOAL }).map((_, i) => (
          <div
            key={i}
            className={`w-8 h-10 rounded-lg border-2 transition-all duration-200 flex items-end justify-center pb-1 cursor-pointer ${
              i < glasses
                ? "border-blue-400 bg-blue-500/20"
                : "border-border bg-muted/20"
            }`}
            onClick={i < glasses ? remove : add}
          >
            {i < glasses && <div className="w-4 h-5 rounded-sm bg-blue-400 opacity-80" />}
          </div>
        ))}
        {glasses > GOAL && (
          <div className="flex items-center text-xs text-blue-400 font-bold ml-1">
            +{glasses - GOAL} bonus! 🎉
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #60a5fa, #3b82f6)" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {glasses === 0 && "Bea primul pahar! 💧"}
          {glasses > 0 && glasses < GOAL && `Încă ${GOAL - glasses} pahare până la obiectiv`}
          {glasses >= GOAL && "🎉 Obiectiv atins! Excelent!"}
        </p>
        <div className="flex gap-2">
          <button
            onClick={remove}
            disabled={glasses === 0}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg font-bold disabled:opacity-30 hover:bg-muted/80 transition-colors"
          >−</button>
          <button
            onClick={add}
            className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 text-lg font-bold hover:bg-blue-500/30 transition-colors"
            data-testid="button-add-water"
          >+</button>
        </div>
      </div>
    </div>
  );
}

// ─── BARCODE SCAN MODAL ───────────────────────────────────────────────────────
interface BarcodeProduct {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  brand?: string;
  imageUrl?: string;
}

function BarcodeScanModal({ onClose, onLogged }: { onClose: () => void; onLogged: () => void }) {
  const [step, setStep] = useState<"input" | "scanning" | "result" | "notfound">("input");
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [quantity, setQuantity] = useState(100);
  const { toast } = useToast();
  const createLog = useCreateNutritionLog();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const searchBarcode = async (code: string) => {
    if (!code.trim()) return;
    setStep("scanning");
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code.trim()}.json`);
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        setStep("notfound");
        return;
      }
      const p = data.product;
      const nutriments = p.nutriments || {};
      setProduct({
        name: p.product_name || p.product_name_en || "Produs necunoscut",
        brand: p.brands || undefined,
        calories: Math.round(nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0),
        protein: Math.round((nutriments["proteins_100g"] || 0) * 10) / 10,
        carbs: Math.round((nutriments["carbohydrates_100g"] || 0) * 10) / 10,
        fat: Math.round((nutriments["fat_100g"] || 0) * 10) / 10,
        serving: p.serving_size || "100g",
        imageUrl: p.image_front_small_url || p.image_url || undefined,
      });
      setStep("result");
    } catch {
      setStep("notfound");
    }
  };

  const handleLog = async () => {
    if (!product) return;
    const factor = quantity / 100;
    await createLog.mutateAsync({
      foodName: `${product.name}${product.brand ? ` (${product.brand})` : ""}`,
      calories: Math.round(product.calories * factor),
      protein: Math.round(product.protein * factor * 10) / 10,
      carbs: Math.round(product.carbs * factor * 10) / 10,
      fat: Math.round(product.fat * factor * 10) / 10,
      mealType: "snack",
      quantity,
      unit: "g",
    });
    toast({ title: "✅ Produs adăugat!", description: `${product.name} a fost logat.` });
    onLogged();
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" /> Barcode Scanner
          </h3>
          <p className="text-xs text-muted-foreground">Scanează codul de bare al produsului</p>
        </div>
      </div>

      {step === "input" && (
        <div className="space-y-4">
          {/* Camera capture pentru barcode */}
          <div
            className="w-full h-40 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() => cameraRef.current?.click()}
          >
            <ScanLine className="w-10 h-10 text-primary" />
            <p className="text-sm font-semibold text-primary">Fotografiază codul de bare</p>
            <p className="text-xs text-muted-foreground">Sau introdu manual codul</p>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                // Pentru simplitate afișăm input manual după captura foto
                // O integrare completă ar folosi ZXing sau Quagga2
                toast({
                  title: "📸 Poză capturată",
                  description: "Introdu codul de bare din imagine în câmpul de mai jos.",
                });
              }}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">sau introdu manual</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ex: 5449000000996 (Coca-Cola)"
              value={barcode}
              onChange={e => setBarcode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => e.key === "Enter" && searchBarcode(barcode)}
              className="flex-1 h-12 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary/50 transition-colors"
              autoFocus
              data-testid="input-barcode"
            />
            <Button
              onClick={() => searchBarcode(barcode)}
              disabled={barcode.length < 8}
              className="h-12 px-5"
              data-testid="button-search-barcode"
            >
              Caută
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Baza de date: <span className="text-primary font-medium">Open Food Facts</span> — 3M+ produse globale 🌍
          </p>
        </div>
      )}

      {step === "scanning" && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="font-semibold">Caut produsul...</p>
          <p className="text-sm text-muted-foreground">Cod: {barcode}</p>
        </div>
      )}

      {step === "notfound" && (
        <div className="text-center py-10 space-y-4">
          <Package className="w-14 h-14 text-muted-foreground mx-auto opacity-40" />
          <p className="font-bold text-lg">Produs negăsit</p>
          <p className="text-sm text-muted-foreground">
            Codul <strong>{barcode}</strong> nu este în baza de date.<br />
            Încearcă alt cod sau adaugă manual.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setBarcode(""); setStep("input"); }}>
              <RotateCcw className="w-4 h-4 mr-2" /> Încearcă din nou
            </Button>
            <Button onClick={onClose}>Adaugă manual</Button>
          </div>
        </div>
      )}

      {step === "result" && product && (
        <div className="space-y-4">
          {/* Product card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-contain rounded-xl" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base truncate">{product.name}</p>
              {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
              <p className="text-xs text-muted-foreground mt-1">Per 100g</p>
            </div>
          </div>

          {/* Macros per 100g */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Calorii", val: product.calories, unit: "kcal", color: "#f97316" },
              { label: "Proteine", val: product.protein, unit: "g", color: "#22c55e" },
              { label: "Carbs", val: product.carbs, unit: "g", color: "#60a5fa" },
              { label: "Grăsimi", val: product.fat, unit: "g", color: "#c084fc" },
            ].map(m => (
              <div key={m.label} className="bg-muted/30 rounded-xl p-2">
                <div className="font-bold text-lg" style={{ color: m.color }}>{m.val}</div>
                <div className="text-[9px] text-muted-foreground">{m.unit}</div>
                <div className="text-[9px] text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Quantity selector */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Cantitate consumată</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(10, q - 10))}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg font-bold"
              >−</button>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center h-10 rounded-xl border border-border bg-background font-bold text-lg outline-none"
                />
                <span className="ml-2 text-muted-foreground text-sm">g</span>
              </div>
              <button
                onClick={() => setQuantity(q => q + 10)}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg font-bold"
              >+</button>
            </div>
            {/* Live macros pentru cantitatea selectată */}
            <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20 flex justify-between text-sm">
              <span className="text-muted-foreground">Total pentru {quantity}g:</span>
              <span className="font-bold text-primary">
                {Math.round(product.calories * quantity / 100)} kcal |{" "}
                {Math.round(product.protein * quantity / 100 * 10) / 10}g P |{" "}
                {Math.round(product.carbs * quantity / 100 * 10) / 10}g C
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setBarcode(""); setStep("input"); }} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" /> Alt produs
            </Button>
            <Button onClick={handleLog} isLoading={createLog.isPending} className="flex-1" data-testid="button-log-barcode">
              <Check className="w-4 h-4 mr-2" /> Adaugă în jurnal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NutritionPage() {
  const { data: logs, isLoading } = useNutritionLogs();
  const deleteLog = useDeleteNutritionLog();
  const { data: profile } = useProfile();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const { toast } = useToast();
  const isPro = useIsPro();
  const { tx } = useLang();

  const todayLogs = logs?.filter((l: any) =>
    new Date(l.createdAt || l.date).toDateString() === new Date().toDateString()
  ) || [];

  const totals = todayLogs.reduce((acc: any, log: any) => ({
    calories: acc.calories + (log.calories || 0),
    protein: acc.protein + (log.protein || 0),
    carbs: acc.carbs + (log.carbs || 0),
    fat: acc.fat + (log.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Detectează dacă azi e zi de antrenament (simplu: luni, miercuri, vineri, sâmbătă)
  const today = new Date().getDay(); // 0=dum, 1=lun, ...6=sâm
  const isTrainingDay = [1, 3, 5, 6].includes(today);

  const goals = {
    calories: profile?.customCaloriesTraining && isTrainingDay
      ? profile.customCaloriesTraining
      : profile?.customCaloriesRest && !isTrainingDay
      ? profile.customCaloriesRest
      : profile?.goalType === "weight_loss" ? 1600
      : profile?.goalType === "muscle_gain" ? 2800
      : 2200,
    protein: profile?.customProtein || (profile?.goalType === "muscle_gain" ? 180 : 150),
    carbs: profile?.goalType === "weight_loss" ? 150 : 250,
    fat: 70,
    isTrainingDay,
  };

  const actions = [
    {
      id: "voice" as ActiveModal,
      icon: Mic,
      label: "Voice Log",
      sublabel: "Spune ce ai mâncat",
      gradient: "from-rose-500 to-pink-600",
      glow: "rgba(244,63,94,0.3)",
      testId: "button-voice-log",
      requiresPro: false,
    },
    {
      id: "barcode" as ActiveModal,
      icon: ScanLine,
      label: "Barcode Scanner",
      sublabel: "Scanează codul produsului",
      gradient: "from-violet-500 to-purple-600",
      glow: "rgba(139,92,246,0.3)",
      testId: "button-scan-barcode",
      requiresPro: false,
    },
    {
      id: "scan" as ActiveModal,
      icon: Camera,
      label: "Scan Food",
      sublabel: "Fotografiază masa",
      gradient: "from-primary to-purple-600",
      glow: "rgba(99,102,241,0.3)",
      testId: "button-scan-food",
      requiresPro: true,
    },
    {
      id: "fridge" as ActiveModal,
      icon: Refrigerator,
      label: "Scan Fridge",
      sublabel: "Detectează ingrediente",
      gradient: "from-cyan-500 to-blue-600",
      glow: "rgba(6,182,212,0.3)",
      testId: "button-scan-fridge",
      requiresPro: true,
    },
    {
      id: "recipe" as ActiveModal,
      icon: ChefHat,
      label: "Smart Recipes",
      sublabel: "Generator AI rețete",
      gradient: "from-orange-500 to-red-500",
      glow: "rgba(249,115,22,0.3)",
      testId: "button-smart-recipes"
    },
    {
      id: "log" as ActiveModal,
      icon: Plus,
      label: "Log Meal",
      sublabel: "Adaugă manual",
      gradient: "from-emerald-500 to-green-600",
      glow: "rgba(16,185,129,0.3)",
      testId: "button-log-meal"
    },
  ];

  const mealIcons: Record<string, string> = { breakfast: "🍳", lunch: "🥗", dinner: "🍽️", snack: "🍎" };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black">AI Nutrition Lab</h1>
            <p className="text-sm text-muted-foreground">Scanează · Analizează · Optimizează</p>
          </div>
        </div>
      </div>

      {/* Action Tiles */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button key={action.id} onClick={() => setActiveModal(action.id)}
              data-testid={action.testId}
              className="relative overflow-hidden rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10"
              style={{ background: `linear-gradient(135deg, ${action.glow} 0%, rgba(0,0,0,0.2) 100%)`, boxShadow: `0 4px 20px ${action.glow}` }}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-bold text-sm">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{action.sublabel}</p>
            </button>
          );
        })}
      </div>

      {/* Daily Macro Tracker */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold">Macronutrienți azi</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                goals.isTrainingDay
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {goals.isTrainingDay ? "🏋️ Zi antrenament" : "😴 Zi odihnă"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-accent" data-testid="text-total-calories">{Math.round(totals.calories)}</div>
            <div className="text-xs text-muted-foreground">/ {goals.calories} kcal</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 py-2 border-y border-border">
          {[
            { label: tx.nutrition.protein, val: Math.round(totals.protein), goal: goals.protein, color: "#ef4444", unit: "g" },
            { label: tx.nutrition.carbs, val: Math.round(totals.carbs), goal: goals.carbs, color: "#3b82f6", unit: "g" },
            { label: tx.nutrition.fat, val: Math.round(totals.fat), goal: goals.fat, color: "#eab308", unit: "g" },
          ].map(m => (
            <div key={m.label} className="text-center">
              <div className="text-lg font-black" style={{ color: m.color }} data-testid={`text-total-${m.label.toLowerCase()}`}>{m.val}g</div>
              <div className="text-[10px] text-muted-foreground">/ {m.goal}g</div>
              <div className="text-[10px] text-muted-foreground">{m.label}</div>
              <div className="h-1.5 rounded-full bg-muted/40 mt-1 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((m.val / m.goal) * 100, 100)}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <MacroBar label={tx.nutrition.calories} value={Math.round(totals.calories)} goal={goals.calories} color="#f97316" unit=" kcal" />
          <MacroBar label={tx.nutrition.protein} value={Math.round(totals.protein)} goal={goals.protein} color="#ef4444" />
          <MacroBar label={tx.nutrition.carbs} value={Math.round(totals.carbs)} goal={goals.carbs} color="#3b82f6" />
          <MacroBar label={tx.nutrition.fat} value={Math.round(totals.fat)} goal={goals.fat} color="#eab308" />
        </div>
      </div>

      {/* Water Tracker */}
      <WaterTracker />

      {/* Today's Meals */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Mese azi</h2>
          <Badge variant="outline" className="text-xs">{todayLogs.length} mese</Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Se încarcă...
          </div>
        ) : todayLogs.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-3xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
              <ChefHat className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">{tx.nutrition.noMeals}</p>
            <p className="text-sm text-muted-foreground/70 mt-1">{tx.nutrition.addFirst}</p>
            <EmptyNutrition
              onScanClick={() => setActiveModal("scan")}
              onLogClick={() => setActiveModal("log")}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {todayLogs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-border hover:border-primary/20 transition-colors" data-testid={`meal-log-${log.id}`}>
                <div className="w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center text-xl shrink-0">
                  {mealIcons[log.mealType] || "🍽️"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{log.foodName}</p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-xs text-orange-500 font-bold">{log.calories} kcal</span>
                    <span className="text-xs text-muted-foreground">P: {log.protein}g · C: {log.carbs}g · G: {log.fat}g</span>
                  </div>
                </div>
                <button onClick={() => deleteLog.mutate(log.id, { onSuccess: () => toast({ title: "Masă ștearsă" }) })}
                  className="w-8 h-8 rounded-lg bg-muted hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-colors"
                  data-testid={`button-delete-log-${log.id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={activeModal === "voice"}>
        <VoiceLogModal onClose={() => setActiveModal(null)} onLogged={() => setActiveModal(null)} />
      </Modal>
      <Modal open={activeModal === "barcode"}>
        <BarcodeScanModal onClose={() => setActiveModal(null)} onLogged={() => { setActiveModal(null); }} />
      </Modal>
      <Modal open={activeModal === "scan"}>
        <FoodScanModal onClose={() => setActiveModal(null)} onLogged={() => {}} profile={profile} />
      </Modal>
      <Modal open={activeModal === "fridge"}>
        <FridgeScanModal onClose={() => setActiveModal(null)} />
      </Modal>
      <Modal open={activeModal === "recipe"}>
        <SmartRecipeModal onClose={() => setActiveModal(null)} profile={profile} />
      </Modal>
      <Modal open={activeModal === "log"}>
        <LogMealModal onClose={() => setActiveModal(null)} />
      </Modal>
    </div>
  );
}
