import { useLang } from "@/i18n/useLang";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useProfile } from "@/hooks/use-profile";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShoppingBag, Star, Clock, Users, Zap, CheckCircle, Filter, Trophy, Lock, BookOpen } from "lucide-react";

type Program = {
  id: number;
  trainerId: string;
  trainerName: string;
  trainerPhoto?: string;
  title: string;
  description?: string;
  category: string;
  durationWeeks: number;
  sessionsPerWeek: number;
  difficulty: string;
  pointsCost: number;
  rating: number;
  reviewsCount: number;
  emoji: string;
  isEnrolled?: boolean;
};

const CATEGORIES = [
  { value: "all", label: "Toate", emoji: "🏋️" },
  { value: "strength", label: "Forță", emoji: "💪" },
  { value: "cardio", label: "Cardio", emoji: "🔥" },
  { value: "yoga", label: "Yoga", emoji: "🌿" },
  { value: "powerlifting", label: "Powerlifting", emoji: "🏋️" },
  { value: "wellness", label: "Wellness", emoji: "🌸" },
  { value: "athletic", label: "Athletic", emoji: "🏃" },
  { value: "transformation", label: "Transformare", emoji: "🎯" },
];

const DIFFICULTY_CONFIG = {
  beginner: { label: "Începător", color: "text-green-400 border-green-500/30 bg-green-500/10" },
  intermediate: { label: "Intermediar", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  advanced: { label: "Avansat", color: "text-red-400 border-red-500/30 bg-red-500/10" },
};

function ProgramCard({ program, userPoints, onEnroll, isEnrolling }: {
  program: Program;
  userPoints: number;
  onEnroll: (id: number) => void;
  isEnrolling: boolean;
}) {
  const canAfford = userPoints >= program.pointsCost;
  const diffConfig = DIFFICULTY_CONFIG[program.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.intermediate;

  return (
    <div className={cn(
      "p-5 rounded-2xl border transition-all hover:shadow-lg",
      program.isEnrolled ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:border-primary/20"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{program.emoji}</span>
          <div>
            <h3 className="font-bold text-base leading-tight">{program.title}</h3>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={cn("w-3 h-3", i < Math.floor(program.rating) ? "text-yellow-400 fill-yellow-400" : "text-muted")} />
              ))}
              <span className="text-xs text-muted-foreground ml-1">{program.rating} ({program.reviewsCount})</span>
            </div>
          </div>
        </div>
        {program.isEnrolled && (
          <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
            <CheckCircle className="w-3 h-3 mr-1" /> Activ
          </Badge>
        )}
      </div>

      {/* Description */}
      {program.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{program.description}</p>
      )}

      {/* Trainer */}
      <div className="flex items-center gap-2 mb-4 p-2 rounded-xl bg-muted/50">
        <img
          src={program.trainerPhoto || `https://ui-avatars.com/api/?name=${program.trainerName}&background=random`}
          alt={program.trainerName}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div>
          <p className="text-xs font-semibold">{program.trainerName}</p>
          <p className="text-xs text-muted-foreground">Antrenor AI certificat</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline" className={cn("text-xs border", diffConfig.color)}>{diffConfig.label}</Badge>
        <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />{program.durationWeeks} săpt.</Badge>
        <Badge variant="outline" className="text-xs"><Zap className="w-3 h-3 mr-1" />{program.sessionsPerWeek}x/săpt.</Badge>
      </div>

      {/* CTA */}
      {program.isEnrolled ? (
        <Button data-testid={`button-view-program-${program.id}`} className="w-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30" variant="outline">
          <BookOpen className="w-4 h-4 mr-2" /> Continuă programul
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-lg text-yellow-400">{program.pointsCost.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">puncte</span>
            </div>
            {!canAfford && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Îți mai lipsesc {(program.pointsCost - userPoints).toLocaleString()} pct.
              </span>
            )}
          </div>
          <Button
            data-testid={`button-enroll-${program.id}`}
            onClick={() => onEnroll(program.id)}
            disabled={!canAfford || isEnrolling}
            className={cn("w-full", canAfford ? "bg-primary hover:bg-primary/90" : "opacity-50")}
          >
            {isEnrolling ? "Se procesează..." : canAfford ? "🚀 Înscrie-te acum" : "Puncte insuficiente"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  const { tx } = useLang();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const [activeCategory, setActiveCategory] = useState("all");
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"browse" | "enrolled">("browse");

  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["/api/marketplace/programs"],
  });

  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ["/api/marketplace/enrolled"],
  });

  const enrollMutation = useMutation({
    mutationFn: async (programId: number) => {
      const res = await apiRequest("POST", `/api/marketplace/enroll/${programId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/programs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/enrolled"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "🎉 Înscris cu succes!", description: "Programul a fost activat. Mult succes!" });
    },
    onError: (err: Error) => {
      toast({ title: "Eroare", description: err.message, variant: "destructive" });
    },
    onSettled: () => setEnrollingId(null),
  });

  const handleEnroll = (id: number) => {
    setEnrollingId(id);
    enrollMutation.mutate(id);
  };

  const filteredPrograms = activeCategory === "all"
    ? programs
    : programs.filter(p => p.category === activeCategory);

  const userPoints = profile?.points || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Marketplace Antrenori</h1>
            <p className="text-muted-foreground">Programe elite create de antrenorii FitForge AI</p>
          </div>
        </div>
        <div className="text-right p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs text-muted-foreground">Punctele tale</p>
          <p className="text-2xl font-bold text-yellow-400">{userPoints.toLocaleString()}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Programe disponibile", value: programs.length, icon: ShoppingBag, color: "text-orange-400" },
          { label: "Înscrise de mine", value: programs.filter(p => p.isEnrolled).length, icon: CheckCircle, color: "text-green-400" },
          { label: "Antrenori parteneri", value: 8, icon: Users, color: "text-blue-400" },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-2xl bg-card border border-border text-center">
            <stat.icon className={cn("w-5 h-5 mx-auto mb-1", stat.color)} />
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["browse", "Explorează programe"], ["enrolled", "Programele mele"]] as const).map(([tab, label]) => (
          <button
            key={tab}
            data-testid={`tab-marketplace-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === tab ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
            {tab === "enrolled" && programs.filter(p => p.isEnrolled).length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary text-white text-xs">{programs.filter(p => p.isEnrolled).length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "browse" && (
        <>
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                data-testid={`filter-${cat.value}`}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-sm font-medium transition-all border",
                  activeCategory === cat.value
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Programs Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-72 rounded-2xl bg-card border border-border animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrograms.map(program => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  userPoints={userPoints}
                  onEnroll={handleEnroll}
                  isEnrolling={enrollingId === program.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "enrolled" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.filter(p => p.isEnrolled).length === 0 ? (
            <div className="col-span-3 text-center py-16">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Nu ești înscris la niciun program</h3>
              <p className="text-muted-foreground mb-4">Explorează programele disponibile și înscrie-te cu punctele câștigate!</p>
              <Button onClick={() => setActiveTab("browse")} className="bg-primary">Explorează programele</Button>
            </div>
          ) : programs.filter(p => p.isEnrolled).map(program => (
            <ProgramCard
              key={program.id}
              program={program}
              userPoints={userPoints}
              onEnroll={handleEnroll}
              isEnrolling={enrollingId === program.id}
            />
          ))}
        </div>
      )}

      {/* Points explanation */}
      <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
        <p className="text-sm font-semibold text-yellow-400 mb-2">💡 Cum câștigi puncte pentru programe?</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[["🏋️ Antrenament complet", "+50 pct"], ["🥗 Log nutriție", "+10 pct"], ["📊 Măsurătoare", "+25 pct"], ["🤝 Post comunitate", "+15 pct"]].map(([act, pts]) => (
            <div key={act} className="text-center p-2 rounded-xl bg-yellow-500/10">
              <p className="text-xs text-muted-foreground">{act}</p>
              <p className="font-bold text-yellow-400 text-sm">{pts}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
