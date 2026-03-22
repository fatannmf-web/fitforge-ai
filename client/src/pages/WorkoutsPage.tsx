import { useLang } from "@/i18n/useLang";
import { EmptyWorkouts } from "@/components/EmptyState";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useWorkouts, useCompleteWorkout } from "@/hooks/use-workouts";
import { useQuery } from "@tanstack/react-query";
import { Card, Button, Badge } from "@/components/ui";
import {
  Plus, Dumbbell, Play, CheckCircle2, Clock, Flame, ChevronRight,
  Home, Building2, PersonStanding, Leaf, Trophy, Target, LayoutGrid,
  Info, Search, X, Video, ChevronDown
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ExerciseDetailSheet } from "@/components/ExerciseDetailSheet";
import { findExercise } from "@/data/exerciseLibrary";
import { apiRequest } from "@/lib/queryClient";

// ─── PROGRAM DEFINITIONS ────────────────────────────────────────────────────

type Category = "acasa" | "sala" | "alergat" | "yoga";

interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number; // seconds
  notes?: string;
}

interface WorkoutProgram {
  id: string;
  category: Category;
  name: string;
  description: string;
  duration: number; // minutes
  calories: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  exercises: Exercise[];
  tags: string[];
  color: string;
  emoji: string;
}

const PROGRAMS: WorkoutProgram[] = [
  // ── ACASĂ ──────────────────────────────────────────────────────────────────
  {
    id: "home-fullbody",
    category: "acasa",
    name: "Full Body Express",
    description: "Antrenament complet fără echipament. Perfectă pentru dimineți rapide.",
    duration: 20,
    calories: 180,
    difficulty: "beginner",
    emoji: "💪",
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    tags: ["fără echipament", "dimineață", "total body"],
    exercises: [
      { name: "Jumping Jacks", sets: 3, reps: 30 },
      { name: "Genuflexiuni (Squats)", sets: 3, reps: 20 },
      { name: "Flotări (Push-ups)", sets: 3, reps: 10 },
      { name: "Plank", sets: 3, duration: 30, notes: "30 secunde" },
      { name: "Fandări (Lunges)", sets: 3, reps: 12 },
      { name: "Glute Bridge", sets: 3, reps: 15 },
    ],
  },
  {
    id: "home-hiit",
    category: "acasa",
    name: "HIIT Ardere Maximă",
    description: "Intervale intense pentru ardere maximă de calorii în timp minim.",
    duration: 25,
    calories: 280,
    difficulty: "intermediate",
    emoji: "🔥",
    color: "from-orange-500/20 to-red-500/10 border-orange-500/30",
    tags: ["cardio", "ardere", "intensiv"],
    exercises: [
      { name: "Burpees", sets: 4, reps: 10 },
      { name: "Mountain Climbers", sets: 4, duration: 30, notes: "30 sec rapid" },
      { name: "Jump Squats", sets: 4, reps: 15 },
      { name: "High Knees", sets: 4, duration: 30, notes: "30 sec" },
      { name: "Triceps Dips (scaun)", sets: 3, reps: 12 },
      { name: "Spider-Man Push-ups", sets: 3, reps: 8 },
    ],
  },
  {
    id: "home-core",
    category: "acasa",
    name: "Core & Abdomen",
    description: "Focus complet pe zona abdominală și stabilizatorii coloanei.",
    duration: 20,
    calories: 120,
    difficulty: "beginner",
    emoji: "⚡",
    color: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30",
    tags: ["abdomen", "core", "flexibilitate"],
    exercises: [
      { name: "Crunch clasic", sets: 3, reps: 20 },
      { name: "Leg Raises", sets: 3, reps: 15 },
      { name: "Russian Twist", sets: 3, reps: 20, notes: "cu sau fără greutate" },
      { name: "Plank lateral (stânga)", sets: 2, duration: 30 },
      { name: "Plank lateral (dreapta)", sets: 2, duration: 30 },
      { name: "Bicycle Crunches", sets: 3, reps: 20 },
      { name: "Dead Bug", sets: 3, reps: 10 },
    ],
  },
  {
    id: "home-strength",
    category: "acasa",
    name: "Forță fără Greutăți",
    description: "Antrenament de forță cu greutatea corpului pentru toți mușchii majori.",
    duration: 35,
    calories: 220,
    difficulty: "advanced",
    emoji: "🦾",
    color: "from-purple-500/20 to-violet-500/10 border-purple-500/30",
    tags: ["forță", "calisthenic", "avansat"],
    exercises: [
      { name: "Pike Push-ups", sets: 4, reps: 10 },
      { name: "Bulgarian Split Squat", sets: 3, reps: 10, notes: "per picior" },
      { name: "Archer Push-ups", sets: 3, reps: 8 },
      { name: "Single Leg Glute Bridge", sets: 3, reps: 12, notes: "per picior" },
      { name: "Plank cu ridicare braț", sets: 3, reps: 10 },
      { name: "Superman Hold", sets: 3, duration: 20 },
    ],
  },

  // ── SALĂ ───────────────────────────────────────────────────────────────────
  {
    id: "gym-push",
    category: "sala",
    name: "Push Day — Piept & Umeri",
    description: "Ziua de împins: piept, umeri și triceps. Clasicul antrenament Push.",
    duration: 50,
    calories: 320,
    difficulty: "intermediate",
    emoji: "🏋️",
    color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
    tags: ["piept", "umeri", "triceps", "push"],
    exercises: [
      { name: "Bench Press cu bara", sets: 4, reps: 8, notes: "Principalul exercițiu" },
      { name: "Overhead Press", sets: 3, reps: 10 },
      { name: "Incline Dumbbell Fly", sets: 3, reps: 12 },
      { name: "Triceps Pushdown (cablu)", sets: 3, reps: 12 },
      { name: "Lateral Raise", sets: 3, reps: 15 },
      { name: "Cable Crossover", sets: 3, reps: 15 },
    ],
  },
  {
    id: "gym-pull",
    category: "sala",
    name: "Pull Day — Spate & Biceps",
    description: "Ziua de tras: spate lat, romboid, biceps. Postură perfectă.",
    duration: 50,
    calories: 300,
    difficulty: "intermediate",
    emoji: "💪",
    color: "from-indigo-500/20 to-blue-500/10 border-indigo-500/30",
    tags: ["spate", "biceps", "pull", "postură"],
    exercises: [
      { name: "Deadlift", sets: 4, reps: 6, notes: "Greutate mare, formă perfectă" },
      { name: "Pull-ups / Lat Pulldown", sets: 3, reps: 8 },
      { name: "Seated Cable Row", sets: 3, reps: 12 },
      { name: "Bicep Curl cu bara EZ", sets: 3, reps: 12 },
      { name: "Face Pull", sets: 3, reps: 15, notes: "Sănătatea umerilor" },
      { name: "Hammer Curl", sets: 2, reps: 12 },
    ],
  },
  {
    id: "gym-legs",
    category: "sala",
    name: "Leg Day — Putere Picioare",
    description: "Ziua picioarelor: cvadricepși, ischiogambieri, fesieri, gambe.",
    duration: 55,
    calories: 400,
    difficulty: "intermediate",
    emoji: "🦵",
    color: "from-rose-500/20 to-pink-500/10 border-rose-500/30",
    tags: ["picioare", "fesieri", "gambe", "forță"],
    exercises: [
      { name: "Squat cu bara", sets: 4, reps: 8, notes: "Regele exercițiilor" },
      { name: "Romanian Deadlift", sets: 3, reps: 10 },
      { name: "Leg Press", sets: 3, reps: 12 },
      { name: "Leg Curl la aparat", sets: 3, reps: 12 },
      { name: "Leg Extension", sets: 3, reps: 15 },
      { name: "Standing Calf Raise", sets: 4, reps: 20 },
    ],
  },
  {
    id: "gym-fullbody",
    category: "sala",
    name: "Full Body Power",
    description: "O singură ședință completă: toate grupele musculare majore.",
    duration: 60,
    calories: 450,
    difficulty: "advanced",
    emoji: "⚔️",
    color: "from-amber-500/20 to-yellow-500/10 border-amber-500/30",
    tags: ["total body", "forță", "eficiență"],
    exercises: [
      { name: "Squat cu bara", sets: 4, reps: 6 },
      { name: "Bench Press", sets: 4, reps: 6 },
      { name: "Deadlift", sets: 3, reps: 5 },
      { name: "Overhead Press", sets: 3, reps: 8 },
      { name: "Pull-ups", sets: 3, reps: 8 },
      { name: "Dips", sets: 3, reps: 10 },
    ],
  },

  // ── ALERGAT ────────────────────────────────────────────────────────────────
  {
    id: "run-5k",
    category: "alergat",
    name: "5K pentru Începători",
    description: "Program de rulare pentru primii tăi 5 kilometri. Ritm confortabil.",
    duration: 30,
    calories: 300,
    difficulty: "beginner",
    emoji: "🏃",
    color: "from-green-500/20 to-emerald-500/10 border-green-500/30",
    tags: ["5K", "cardio", "rezistență"],
    exercises: [
      { name: "Mers rapid (încălzire)", duration: 300, notes: "5 minute" },
      { name: "Alergare ușoară", duration: 1200, notes: "20 min la ritm confortabil" },
      { name: "Mers relaxat (răcire)", duration: 300, notes: "5 minute" },
      { name: "Stretching picioare", duration: 300, notes: "5 minute" },
    ],
  },
  {
    id: "run-interval",
    category: "alergat",
    name: "Interval Sprint",
    description: "Sprinturi explosive alternante cu recuperare. Arde masiv.",
    duration: 35,
    calories: 420,
    difficulty: "advanced",
    emoji: "⚡",
    color: "from-red-500/20 to-orange-500/10 border-red-500/30",
    tags: ["sprinturi", "HIIT", "viteză"],
    exercises: [
      { name: "Alergare ușoară (încălzire)", duration: 300, notes: "5 min" },
      { name: "Sprint maxim", sets: 8, duration: 30, notes: "30 sec fiecare" },
      { name: "Mers / Jogging lent (recuperare)", sets: 8, duration: 90, notes: "90 sec între sprinturi" },
      { name: "Alergare ușoară (răcire)", duration: 300, notes: "5 min" },
    ],
  },
  {
    id: "run-long",
    category: "alergat",
    name: "Long Run Easy",
    description: "Alergare lungă la ritm ușor pentru construirea rezistenței aerobice.",
    duration: 60,
    calories: 550,
    difficulty: "beginner",
    emoji: "🌅",
    color: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
    tags: ["rezistență", "aerobic", "distanță"],
    exercises: [
      { name: "Mers rapid (încălzire)", duration: 300, notes: "5 min" },
      { name: "Alergare ușoară continuă", duration: 2700, notes: "45 min la ritm de conversație" },
      { name: "Mers relaxat (răcire)", duration: 600, notes: "10 min" },
    ],
  },

  // ── YOGA ───────────────────────────────────────────────────────────────────
  {
    id: "yoga-morning",
    category: "yoga",
    name: "Morning Flow",
    description: "Trezește corpul dimineața cu un flow energizant. Perfectă înainte de cafea.",
    duration: 20,
    calories: 80,
    difficulty: "beginner",
    emoji: "☀️",
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
    tags: ["dimineață", "energizant", "flux"],
    exercises: [
      { name: "Salutare la Soare A (Surya A)", sets: 3, notes: "3 serii lente" },
      { name: "Warrior I (Virabhadrasana I)", sets: 1, duration: 60, notes: "30s per parte" },
      { name: "Warrior II (Virabhadrasana II)", sets: 1, duration: 60, notes: "30s per parte" },
      { name: "Downward Facing Dog", sets: 1, duration: 60 },
      { name: "Child's Pose (Balasana)", sets: 1, duration: 60, notes: "Relaxare profundă" },
      { name: "Savasana", sets: 1, duration: 120, notes: "Relaxare finală 2 min" },
    ],
  },
  {
    id: "yoga-power",
    category: "yoga",
    name: "Power Vinyasa",
    description: "Yoga dinamică: putere, echilibru și flexibilitate. Transpiri garantat.",
    duration: 45,
    calories: 200,
    difficulty: "intermediate",
    emoji: "🔥",
    color: "from-violet-500/20 to-purple-500/10 border-violet-500/30",
    tags: ["vinyasa", "putere", "echilibru"],
    exercises: [
      { name: "Sun Salutation A & B", sets: 5, notes: "5 runde complete" },
      { name: "Warrior III Balance", sets: 1, duration: 60, notes: "30s per parte" },
      { name: "Crow Pose (Kakasana)", sets: 3, duration: 15, notes: "Ținere 15 sec" },
      { name: "Pigeon Pose (Eka Pada)", sets: 1, duration: 90, notes: "45s per șold" },
      { name: "Boat Pose (Navasana)", sets: 3, duration: 30 },
      { name: "Savasana", sets: 1, duration: 300 },
    ],
  },
  {
    id: "yoga-recovery",
    category: "yoga",
    name: "Relaxare & Recuperare",
    description: "Yoga restaurativă după antrenament. Reduce durerea musculară și stresul.",
    duration: 30,
    calories: 60,
    difficulty: "beginner",
    emoji: "🧘",
    color: "from-teal-500/20 to-cyan-500/10 border-teal-500/30",
    tags: ["recuperare", "relaxare", "stretching"],
    exercises: [
      { name: "Butterfly (Baddha Konasana)", sets: 1, duration: 120, notes: "Deschidere șolduri" },
      { name: "Seated Forward Fold", sets: 1, duration: 90 },
      { name: "Supine Twist", sets: 1, duration: 60, notes: "30s per parte" },
      { name: "Happy Baby (Ananda Balasana)", sets: 1, duration: 90 },
      { name: "Legs Up the Wall", sets: 1, duration: 180, notes: "Recuperare activă" },
      { name: "Yoga Nidra / Savasana", sets: 1, duration: 300, notes: "5 min meditație" },
    ],
  },
];

// ─── CATEGORY CONFIG ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all" as const, label: "Toate", icon: LayoutGrid, color: "text-foreground" },
  { id: "acasa" as const, label: "Acasă", icon: Home, color: "text-emerald-400" },
  { id: "sala" as const, label: "Sală", icon: Building2, color: "text-blue-400" },
  { id: "alergat" as const, label: "Alergat", icon: PersonStanding, color: "text-orange-400" },
  { id: "yoga" as const, label: "Yoga", icon: Leaf, color: "text-purple-400" },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  advanced: "bg-red-500/20 text-red-400 border-red-500/30",
};


// ─── MUSCLE GROUP DEFINITIONS ─────────────────────────────────────────────────

interface LibraryExercise {
  id: string;
  name: string;
  muscleGroup: string;
  difficulty: string;
  equipment: string;
  videoUrl: string;
  thumbnailUrl: string;
  exerciseType: string;
}

const MUSCLE_GROUPS = [
  { id: "all",        label: "Toate",       emoji: "⚡" },
  { id: "chest",      label: "Piept",       emoji: "💪" },
  { id: "back",       label: "Spate",       emoji: "🔙" },
  { id: "quads",      label: "Quads",       emoji: "🦵" },
  { id: "hamstrings", label: "Ischio",      emoji: "🦵" },
  { id: "glutes",     label: "Fese",        emoji: "🍑" },
  { id: "core",       label: "Core",        emoji: "🎯" },
  { id: "shoulders",  label: "Umeri",       emoji: "🏋️" },
  { id: "biceps",     label: "Biceps",      emoji: "💪" },
  { id: "triceps",    label: "Triceps",     emoji: "🔱" },
  { id: "calves",     label: "Gambe",       emoji: "🦶" },
  { id: "full_body",  label: "Total Body",  emoji: "🌟" },
] as const;

const DIFF_COLOR: Record<string, string> = {
  beginner: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  intermediate: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  advanced: "text-red-400 border-red-500/30 bg-red-500/10",
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  const [, navigate] = useLocation();
  const { data: workouts, isLoading } = useWorkouts();
  const completeMutation = useCompleteWorkout();
  const { toast } = useToast();
  const { tx } = useLang();

  const diffLabel = (d: string) => ({
    beginner: tx.workouts.difficulty.beginner,
    intermediate: tx.workouts.difficulty.intermediate,
    advanced: tx.workouts.difficulty.advanced,
  }[d] ?? d);

  const [tab, setTab] = useState<"programe" | "exercitii" | "ale-mele">("programe");
  const [activeCategory, setActiveCategory] = useState<"all" | Category>("all");
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  // Exercise Library tab state
  const [muscleFilter, setMuscleFilter] = useState<string>("all");
  const [activeVideo, setActiveVideo] = useState<LibraryExercise | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [libPage, setLibPage] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { data: libraryExercises, isLoading: libLoading } = useQuery<LibraryExercise[]>({
    queryKey: ["/api/exercise-library", muscleFilter, libPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        muscle: muscleFilter,
        limit: "60",
        offset: String(libPage * 60),
      });
      const res = await fetch(`/api/exercise-library?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: tab === "exercitii",
    staleTime: 5 * 60 * 1000,
  });

  const filteredLibrary = libraryExercises?.filter((ex) =>
    !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  // Exercise detail sheet
  const [detailExercise, setDetailExercise] = useState<string | null>(null);

  // Loading state for play buttons (stores program.id while creating)
  const [playLoading, setPlayLoading] = useState<string | null>(null);

  const filtered = activeCategory === "all"
    ? PROGRAMS
    : PROGRAMS.filter((p) => p.category === activeCategory);

  // Map program category/id to muscleGroup enum value
  const getProgramMuscleGroup = (program: WorkoutProgram): string => {
    if (program.category === "alergat") return "cardio";
    if (program.id.includes("push")) return "chest";
    if (program.id.includes("pull")) return "back";
    if (program.id.includes("legs")) return "legs";
    if (program.id.includes("core")) return "core";
    if (program.category === "yoga") return "full_body";
    return "full_body";
  };

  // Build exercises payload for API
  const buildExercisesPayload = (program: WorkoutProgram) => {
    const mg = getProgramMuscleGroup(program);
    return program.exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets ?? 3,
      reps: ex.reps ?? 10,
      duration: ex.duration ?? null,
      notes: ex.notes ?? null,
      muscleGroup: mg,
    }));
  };

  // Save program to "Ale Mele" (with exercises so player can load them)
  const handleStartProgram = async (program: WorkoutProgram) => {
    try {
      const res = await apiRequest("POST", "/api/workouts/create-from-program", {
        name: `${program.emoji} ${program.name}`,
        difficulty: program.difficulty,
        duration: program.duration,
        caloriesBurned: program.calories,
        notes: program.description,
        exercises: buildExercisesPayload(program),
      });
      if (!res.ok) throw new Error("Failed");
      toast({
        title: "Antrenament salvat! 💪",
        description: `${program.name} a fost adăugat în lista ta.`,
      });
      setTab("ale-mele");
    } catch {
      toast({ title: "Eroare", description: "Nu am putut salva antrenamentul.", variant: "destructive" });
    }
  };

  // Play Now — create workout with exercises then open WorkoutPlayerPage
  const handlePlayNow = async (program: WorkoutProgram) => {
    if (playLoading) return;
    setPlayLoading(program.id);
    try {
      const res = await apiRequest("POST", "/api/workouts/create-from-program", {
        name: `${program.emoji} ${program.name}`,
        difficulty: program.difficulty,
        duration: program.duration,
        caloriesBurned: program.calories,
        notes: program.description,
        exercises: buildExercisesPayload(program),
      });
      if (!res.ok) throw new Error("Failed");
      const { workoutId } = await res.json();
      navigate(`/workout/play?id=${workoutId}`);
    } catch {
      toast({ title: "Eroare", description: "Nu am putut porni antrenamentul.", variant: "destructive" });
    } finally {
      setPlayLoading(null);
    }
  };

  return (
    <>
      {/* Exercise detail sheet */}
      <ExerciseDetailSheet
        exerciseName={detailExercise || ""}
        open={!!detailExercise}
        onClose={() => setDetailExercise(null)}
      />

    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">{tx.workouts.title}</h1>
          <p className="text-muted-foreground mt-1">{tx.workouts.noWorkouts}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit border border-border">
        <button
          onClick={() => setTab("programe")}
          data-testid="tab-programe"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "programe"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Programe
          </span>
        </button>
        <button
          onClick={() => { setTab("exercitii"); setLibPage(0); }}
          data-testid="tab-exercitii"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "exercitii"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Video className="w-4 h-4" /> Exerciții
          </span>
        </button>
        <button
          onClick={() => setTab("ale-mele")}
          data-testid="tab-ale-mele"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "ale-mele"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4" /> Ale Mele
            {workouts && workouts.length > 0 && (
              <span className="bg-primary/20 text-primary text-xs px-1.5 rounded-full">{workouts.length}</span>
            )}
          </span>
        </button>
      </div>

      {/* ── PROGRAME TAB ────────────────────────────────────────────────────── */}
      {tab === "programe" && (
        <div className="space-y-6">
          {/* Category filters */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  data-testid={`filter-${cat.id}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "" : cat.color}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Program count */}
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> programe disponibile
          </p>

          {/* Programs grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((program) => {
              const isExpanded = expandedProgram === program.id;
              return (
                <div
                  key={program.id}
                  data-testid={`program-card-${program.id}`}
                  className={`bg-gradient-to-br ${program.color} border rounded-2xl overflow-hidden transition-all duration-300`}
                >
                  {/* Program header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{program.emoji}</span>
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{program.name}</h3>
                          <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">
                            {program.description}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-xs px-2 py-1 rounded-lg border font-medium ${DIFFICULTY_COLOR[program.difficulty]}`}
                      >
                        {diffLabel(program.difficulty)}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> {program.duration} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-400" /> ~{program.calories} kcal
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Target className="w-4 h-4" /> {program.exercises.length} exerciții
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {program.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-background/40 px-2 py-0.5 rounded-full border border-border/50">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Action row */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePlayNow(program)}
                        disabled={playLoading === program.id}
                        data-testid={`btn-play-${program.id}`}
                        className="flex-1 gap-2 bg-gradient-to-r from-primary to-purple-600"
                      >
                        {playLoading === program.id
                          ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          : <Play className="w-4 h-4 fill-white" />
                        }
                        {playLoading === program.id ? "Se încarcă..." : "Antrenează Acum"}
                      </Button>
                      <Button
                        onClick={() => handleStartProgram(program)}
                        data-testid={`btn-start-${program.id}`}
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        title="Salvează în lista mea"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <button
                        onClick={() => setExpandedProgram(isExpanded ? null : program.id)}
                        data-testid={`btn-expand-${program.id}`}
                        className="px-3 py-2 rounded-xl bg-background/30 border border-border/50 hover:bg-background/60 transition-colors"
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded exercises list */}
                  {isExpanded && (
                    <div className="border-t border-border/40 bg-background/20 px-5 py-4 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Exerciții incluse — <span className="text-primary normal-case">apasă pentru detalii</span>
                      </p>
                      {program.exercises.map((ex, i) => {
                        const hasDetail = !!findExercise(ex.name);
                        return (
                          <button
                            key={i}
                            onClick={() => setDetailExercise(ex.name)}
                            data-testid={`btn-exercise-detail-${i}`}
                            className="w-full flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-background/40 transition-colors border border-transparent hover:border-border/30 group"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">
                                {i + 1}
                              </span>
                              <div className="text-left">
                                <p className="text-sm font-medium">{ex.name}</p>
                                {ex.notes && (
                                  <p className="text-xs text-muted-foreground">{ex.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground shrink-0">
                                {ex.sets && ex.reps
                                  ? `${ex.sets}×${ex.reps}`
                                  : ex.sets && ex.duration
                                  ? `${ex.sets}×${ex.duration}s`
                                  : ex.duration
                                  ? `${Math.round(ex.duration / 60)} min`
                                  : ex.sets
                                  ? `${ex.sets} serii`
                                  : ""}
                              </span>
                              {hasDetail && (
                                <Info className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── EXERCIȚII TAB ───────────────────────────────────────────────────── */}
      {tab === "exercitii" && (
        <div className="space-y-5">
          {/* Video modal overlay */}
          {activeVideo && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
              onClick={() => setActiveVideo(null)}
            >
              <div
                className="relative w-full max-w-2xl bg-[#0B0F1A] rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div>
                    <h3 className="font-bold text-lg">{activeVideo.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${DIFF_COLOR[activeVideo.difficulty] || DIFF_COLOR.intermediate}`}>
                        {diffLabel(activeVideo.difficulty)}
                      </span>
                      {activeVideo.equipment && (
                        <span className="text-xs text-muted-foreground">{activeVideo.equipment}</span>
                      )}
                      <span className="text-xs text-[#4DA6FF] bg-[#4DA6FF]/10 px-2 py-0.5 rounded-lg capitalize">
                        {activeVideo.muscleGroup.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveVideo(null)}
                    className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                    data-testid="btn-close-video"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Video player */}
                <div className="relative aspect-video bg-black">
                  <video
                    ref={videoRef}
                    key={activeVideo.id}
                    src={activeVideo.videoUrl}
                    autoPlay
                    loop
                    muted={false}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    poster={activeVideo.thumbnailUrl || undefined}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Caută exercițiu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-exercise"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Muscle group filter chips */}
          <div className="flex gap-2 flex-wrap">
            {MUSCLE_GROUPS.map((mg) => {
              const isActive = muscleFilter === mg.id;
              return (
                <button
                  key={mg.id}
                  onClick={() => { setMuscleFilter(mg.id); setLibPage(0); }}
                  data-testid={`filter-muscle-${mg.id}`}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  <span>{mg.emoji}</span> {mg.label}
                </button>
              );
            })}
          </div>

          {/* Stats bar */}
          {!libLoading && !searchQuery && (
            <p className="text-xs text-muted-foreground">
              {filteredLibrary.length} exerciții cu video
              {muscleFilter !== "all" && ` · ${MUSCLE_GROUPS.find(m => m.id === muscleFilter)?.label}`}
            </p>
          )}

          {/* Exercise grid */}
          {libLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-video rounded-xl bg-secondary/30 animate-pulse" />
              ))}
            </div>
          ) : filteredLibrary.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-bold mb-2">Niciun exercițiu găsit</h3>
              <p className="text-sm text-muted-foreground">Încearcă altă categorie sau modifică căutarea.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredLibrary.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setActiveVideo(ex)}
                  data-testid={`exercise-card-${ex.id}`}
                  className="group relative rounded-xl overflow-hidden border border-border/50 bg-secondary/20 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 text-left"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video relative overflow-hidden bg-secondary/40">
                    {ex.thumbnailUrl ? (
                      <img
                        src={ex.thumbnailUrl}
                        alt={ex.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-[#4DA6FF]/10">
                        <Dumbbell className="w-8 h-8 text-primary/40" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg scale-75 group-hover:scale-100 transform duration-200">
                        <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                      </div>
                    </div>
                    {/* Difficulty badge */}
                    {ex.difficulty && (
                      <span className={`absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ${DIFF_COLOR[ex.difficulty] || DIFF_COLOR.intermediate}`}>
                        {diffLabel(ex.difficulty)}
                      </span>
                    )}
                  </div>
                  {/* Exercise name */}
                  <div className="px-2.5 py-2">
                    <p className="text-xs font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {ex.name}
                    </p>
                    {ex.equipment && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{ex.equipment}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Load more */}
          {!libLoading && !searchQuery && filteredLibrary.length === 60 && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setLibPage((p) => p + 1)}
                data-testid="btn-load-more-exercises"
                className="gap-2"
              >
                <ChevronDown className="w-4 h-4" /> Mai multe exerciții
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── ALE MELE TAB ────────────────────────────────────────────────────── */}
      {tab === "ale-mele" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-secondary/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : workouts?.length === 0 ? (
            <EmptyWorkouts
              onCreateClick={() => navigate("/workouts?ai=1")}
              onExploreClick={() => setTab("programe")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workouts?.map((workout: any) => (
                <div
                  key={workout.id}
                  data-testid={`workout-card-${workout.id}`}
                  className="bg-card border border-border rounded-2xl overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-lg border font-medium ${DIFFICULTY_COLOR[workout.difficulty] || DIFFICULTY_COLOR.intermediate}`}
                      >
                        {diffLabel(workout.difficulty)}
                      </span>
                      {workout.isCompleted && (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Finalizat
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold font-display mb-2">{workout.name}</h3>

                    {workout.notes && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{workout.notes}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> {workout.duration || 45} min
                      </span>
                      {workout.caloriesBurned && (
                        <span className="flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-orange-400" /> {workout.caloriesBurned} kcal
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                      Creat: {formatDate(workout.createdAt)}
                    </p>
                  </div>

                  <div className="px-5 pb-4 flex flex-col gap-2">
                    {!workout.isCompleted ? (
                      <>
                        <Button
                          className="w-full gap-2"
                          onClick={() => navigate(`/workout/play?id=${workout.id}`)}
                          data-testid={`btn-play-workout-${workout.id}`}
                        >
                          <Play className="w-4 h-4" /> Start Workout
                        </Button>
                        <button
                          className="w-full text-xs text-muted-foreground hover:text-white py-1 transition-colors"
                          onClick={() => completeMutation.mutate(workout.id)}
                          disabled={completeMutation.isPending}
                          data-testid={`btn-complete-${workout.id}`}
                        >
                          Marchează direct finalizat →
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" /> Antrenament finalizat!
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
