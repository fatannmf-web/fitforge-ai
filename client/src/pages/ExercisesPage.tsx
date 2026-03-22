import { useLang } from "@/i18n/useLang";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Play, X, Dumbbell, Flame, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
  equipment?: string;
  difficulty?: string;
  exerciseType?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface LibraryResponse {
  count: number;
  exercises: Exercise[];
}

interface MuscleGroup {
  id: string;
  label: string;
  emoji: string;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "bg-green-500/15 text-green-400 border-green-500/20",
  intermediate: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  advanced: "bg-red-500/15 text-red-400 border-red-500/20",
};

function VideoModal({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4" onClick={e => e.stopPropagation()}>
        <div>
          <h2 className="text-lg font-black text-white">{exercise.name}</h2>
          {exercise.muscleGroup && (
            <p className="text-sm text-primary capitalize">{exercise.muscleGroup.replace(/_/g, " ")}</p>
          )}
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4" onClick={e => e.stopPropagation()}>
        {exercise.videoUrl ? (
          <video
            src={exercise.videoUrl}
            autoPlay
            loop
            muted={false}
            controls
            className="w-full max-h-[60vh] rounded-2xl object-contain bg-black"
          />
        ) : exercise.thumbnailUrl ? (
          <img src={exercise.thumbnailUrl} alt={exercise.name} className="w-full rounded-2xl object-contain max-h-[60vh]" />
        ) : (
          <div className="w-full h-64 bg-card rounded-2xl flex items-center justify-center">
            <Dumbbell className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex gap-2 flex-wrap">
          {exercise.muscleGroup && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/20 capitalize">
              {exercise.muscleGroup.replace(/_/g, " ")}
            </span>
          )}
          {exercise.equipment && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary text-muted-foreground capitalize">
              {exercise.equipment}
            </span>
          )}
          {exercise.difficulty && (
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border capitalize", DIFFICULTY_COLOR[exercise.difficulty] ?? "bg-secondary text-muted-foreground border-border")}>
              {exercise.difficulty}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ExerciseCard({ exercise, onPlay }: { exercise: Exercise; onPlay: (ex: Exercise) => void }) {
  return (
    <motion.div
      layout
      className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/30 hover:bg-card/80 transition-all duration-200"
      onClick={() => onPlay(exercise)}
      data-testid={`card-exercise-${exercise.id}`}
    >
      <div className="relative aspect-video bg-secondary overflow-hidden">
        {exercise.thumbnailUrl ? (
          <img src={exercise.thumbnailUrl} alt={exercise.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        {exercise.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
        {exercise.difficulty && (
          <span className={cn(
            "absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize",
            DIFFICULTY_COLOR[exercise.difficulty] ?? "bg-secondary text-muted-foreground border-border"
          )}>
            {exercise.difficulty}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground leading-tight mb-1 line-clamp-2">{exercise.name}</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {exercise.muscleGroup && (
            <span className="text-[10px] text-primary font-medium capitalize">{exercise.muscleGroup.replace(/_/g, " ")}</span>
          )}
          {exercise.equipment && exercise.equipment !== "none" && (
            <span className="text-[10px] text-muted-foreground capitalize">· {exercise.equipment}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ExercisesPage() {
  const { tx } = useLang();
  const [selectedMuscle, setSelectedMuscle] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [playingExercise, setPlayingExercise] = useState<Exercise | null>(null);

  const { data: muscleGroups = [] } = useQuery<MuscleGroup[]>({
    queryKey: ["/api/exercises/muscle-groups/library"],
    staleTime: Infinity,
  });

  const { data: libraryData, isLoading } = useQuery<LibraryResponse>({
    queryKey: ["/api/exercises/library", selectedMuscle, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.length >= 2) params.set("search", search);
      else if (selectedMuscle !== "all") params.set("muscle", selectedMuscle);
      return fetch(`/api/exercises/library?${params}`, { credentials: "include" }).then(r => r.json());
    },
    staleTime: 1000 * 60 * 10,
  });

  const exercises = libraryData?.exercises ?? [];
  const totalCount = libraryData?.count ?? 0;

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (val.length >= 2) setSearch(val);
    else if (!val) setSearch("");
  };

  return (
    <div className="space-y-5 pb-4 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Dumbbell className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-black text-foreground">Exercise Library</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {totalCount > 0 ? `${totalCount} exercises with video` : "Loading library..."}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchInput}
          onChange={e => handleSearch(e.target.value)}
          data-testid="input-exercise-search"
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
        />
        {searchInput && (
          <button onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Muscle Group Tabs */}
      {!search && muscleGroups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {muscleGroups.map(mg => (
            <button
              key={mg.id}
              data-testid={`tab-muscle-${mg.id}`}
              onClick={() => setSelectedMuscle(mg.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all",
                selectedMuscle === mg.id
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-border/80"
              )}
            >
              <span>{mg.emoji}</span>
              <span>{mg.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Video Modal */}
      <AnimatePresence>
        {playingExercise && (
          <VideoModal exercise={playingExercise} onClose={() => setPlayingExercise(null)} />
        )}
      </AnimatePresence>

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden animate-pulse">
              <div className="aspect-video bg-secondary" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-secondary rounded" />
                <div className="h-2 w-2/3 bg-secondary rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16">
          <Flame className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground">No exercises found</p>
          <p className="text-sm text-muted-foreground">
            {search ? "Try a different search term" : "Try a different muscle group"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {exercises.map(ex => (
              <ExerciseCard key={ex.id} exercise={ex} onPlay={setPlayingExercise} />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground pb-2">
            {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : selectedMuscle !== "all" ? ` for ${selectedMuscle}` : " in library"}
          </p>
        </>
      )}
    </div>
  );
}
