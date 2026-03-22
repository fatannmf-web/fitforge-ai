import { useLang } from "@/i18n/useLang";
import { useState } from "react";
import { useProfile } from "@/hooks/use-profile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Check, ChevronRight, Lock, Zap } from "lucide-react";
import { useIsPro } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";

// Antrenorii AI — sincronizați cu server/routes.ts PERSONA_INTRO
const COACHES = [
  {
    id: "atlas",
    name: "Atlas",
    emoji: "🏛️",
    title: "Elite Strength Coach",
    specialty: "Forță & Hipertrofie",
    description: "Antrenor digital de elită. Expert în forță, masă musculară și tehnică perfectă. Serios, precis, rezultate garantate.",
    gradient: "from-amber-400 via-orange-500 to-red-600",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-400",
    badgeBorder: "border-amber-500/30",
    badge: "PRO",
    isPro: true,
    tags: ["Squat", "Deadlift", "Bench Press", "Progressive Overload"],
  },
  {
    id: "nova",
    name: "Nova",
    emoji: "⭐",
    title: "Performance & Wellness",
    specialty: "Slăbit & Fitness Total",
    description: "Expertă în fitness total și recuperare. Caldă dar directă — îți spune adevărul cu empatie. Consistența bate intensitatea.",
    gradient: "from-violet-400 via-purple-500 to-indigo-600",
    badgeBg: "bg-violet-500/15",
    badgeText: "text-violet-400",
    badgeBorder: "border-violet-500/30",
    badge: "PRO",
    isPro: true,
    tags: ["HIIT", "Cardio", "Nutriție", "Recuperare"],
  },
  {
    id: "beginner",
    name: "Alex",
    emoji: "🌱",
    title: "Coach Începători",
    specialty: "Fundamente & Formă",
    description: "Răbdător, simplu, extrem de încurajator. Explică totul pas cu pas fără jargon. Perfectul prim antrenor.",
    gradient: "from-emerald-400 to-green-600",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-400",
    badgeBorder: "border-emerald-500/30",
    badge: "GRATUIT",
    isPro: false,
    tags: ["Exerciții de bază", "Formă corectă", "Constanță", "Progres lent"],
  },
  {
    id: "strength",
    name: "Max",
    emoji: "💪",
    title: "Strength Specialist",
    specialty: "Forță Maximă",
    description: "Direct, tehnic, concentrat pe progres măsurabil. Vorbește în kg, seturi, repetări. Nu pierde timpul cu vorbe.",
    gradient: "from-red-500 to-orange-600",
    badgeBg: "bg-red-500/15",
    badgeText: "text-red-400",
    badgeBorder: "border-red-500/30",
    badge: "GRATUIT",
    isPro: false,
    tags: ["1RM", "Powerlifting", "Periodizare", "PR-uri"],
  },
  {
    id: "fatloss",
    name: "Vera",
    emoji: "🔥",
    title: "Fat Loss Expert",
    specialty: "Slăbit & HIIT",
    description: "Energică, directă, fără răbdare pentru scuze. Realistă despre deficit caloric. Te motivează cu adevărul, nu cu minciuni.",
    gradient: "from-orange-400 to-red-500",
    badgeBg: "bg-orange-500/15",
    badgeText: "text-orange-400",
    badgeBorder: "border-orange-500/30",
    badge: "GRATUIT",
    isPro: false,
    tags: ["Deficit Caloric", "HIIT", "Cardio", "Macros"],
  },
  {
    id: "muscle",
    name: "Bruno",
    emoji: "🏋️",
    title: "Hypertrophy Coach",
    specialty: "Masă Musculară",
    description: "Pasionat de hipertrofie, cunoaște știința musculaturii. Entuziast când vorbește de volum și nutriție pentru masă.",
    gradient: "from-blue-500 to-violet-600",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/30",
    badge: "GRATUIT",
    isPro: false,
    tags: ["Volum", "Proteină", "Hipertrofie", "Recuperare"],
  },
  {
    id: "home",
    name: "Sam",
    emoji: "🏠",
    title: "Home Workout Coach",
    specialty: "Antrenamente Acasă",
    description: "Creativ, improvizează cu ce ai la îndemână. Dovada că nu ai nevoie de sală pentru rezultate reale.",
    gradient: "from-teal-400 to-cyan-600",
    badgeBg: "bg-teal-500/15",
    badgeText: "text-teal-400",
    badgeBorder: "border-teal-500/30",
    badge: "GRATUIT",
    isPro: false,
    tags: ["Bodyweight", "AMRAP", "Fără echipament", "30 min"],
  },
  {
    id: "athlete",
    name: "Titan",
    emoji: "⚡",
    title: "Athletic Performance",
    specialty: "Sport & Performanță",
    description: "Specializat în performanță atletică. Putere explozivă, viteză, agilitate, rezistență sport de înaltă performanță.",
    gradient: "from-yellow-400 to-orange-500",
    badgeBg: "bg-yellow-500/15",
    badgeText: "text-yellow-400",
    badgeBorder: "border-yellow-500/30",
    badge: "GRATUIT",
    isPro: false,
    tags: ["Pliometrie", "Sprint", "Agilitate", "Sport"],
  },
  {
    id: "mobility",
    name: "Luna",
    emoji: "🧘",
    title: "Mobility & Recovery",
    specialty: "Mobilitate & Yoga",
    description: "Expertă în mobilitate, yoga și recuperare activă. Calm, meditativ, conectat la corp — longevitate și bunăstare.",
    gradient: "from-purple-400 to-pink-500",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-400",
    badgeBorder: "border-purple-500/30",
    badge: "GRATUIT",
    isPro: false,
    tags: ["Yoga", "Stretching", "Foam Rolling", "Recuperare"],
  },
  {
    id: "motivation",
    name: "Kai",
    emoji: "🧠",
    title: "Mindset Coach",
    specialty: "Mentalitate & Motivație",
    description: "Coach motivațional pur. Transformă eșecurile în lecții, te conectează emoțional. Energia lui e contagioasă.",
    gradient: "from-violet-500 to-purple-700",
    badgeBg: "bg-violet-500/15",
    badgeText: "text-violet-400",
    badgeBorder: "border-violet-500/30",
    badge: "GRATUIT",
    isPro: false,
    tags: ["Mindset", "Consistență", "Obiceiuri", "Motivație"],
  },
] as const;

type CoachId = typeof COACHES[number]["id"];

export default function TrainersPage() {
  const { tx } = useLang();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const isPro = useIsPro();
  const [selecting, setSelecting] = useState<string | null>(null);

  const currentCoachId = profile?.selectedTrainerId as CoachId | undefined;

  const selectMutation = useMutation({
    mutationFn: (coachId: string) =>
      apiRequest("PUT", "/api/profile", { selectedTrainerId: coachId }),
    onSuccess: (_, coachId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      const coach = COACHES.find(c => c.id === coachId);
      toast({
        title: `✅ ${coach?.name} este acum antrenorul tău!`,
        description: "Mergi la AI Coach să începi.",
      });
      setSelecting(null);
    },
    onError: () => {
      toast({ title: "Eroare", description: "Nu am putut selecta antrenorul.", variant: "destructive" });
      setSelecting(null);
    },
  });

  const handleSelect = (coachId: string, coachIsPro: boolean) => {
    if (coachIsPro && !isPro) {
      navigate("/pricing");
      return;
    }
    setSelecting(coachId);
    selectMutation.mutate(coachId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-black">Alege-ți Antrenorul AI</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fiecare antrenor are personalitate, stil și focus diferit. Poți schimba oricând.
        </p>
      </div>

      {/* Antrenor curent */}
      {currentCoachId && (() => {
        const current = COACHES.find(c => c.id === currentCoachId);
        if (!current) return null;
        return (
          <div className={`rounded-2xl p-4 border flex items-center gap-4 ${current.badgeBg} ${current.badgeBorder}`}>
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${current.gradient} flex items-center justify-center text-3xl flex-shrink-0`}>
              {current.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Antrenorul tău curent</p>
              <p className="font-black text-lg">{current.name}</p>
              <p className={`text-xs font-semibold ${current.badgeText}`}>{current.specialty}</p>
            </div>
            <button
              onClick={() => navigate("/ai-coach")}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-br ${current.gradient} text-white`}
            >
              Chat <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        );
      })()}

      {/* Grid antrenori */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {COACHES.map(coach => {
          const isSelected = currentCoachId === coach.id;
          const isLocked = coach.isPro && !isPro;
          const isSelecting = selecting === coach.id;

          return (
            <div
              key={coach.id}
              className={cn(
                "relative rounded-2xl border transition-all duration-200 overflow-hidden",
                isSelected
                  ? `border-2 ${coach.badgeBorder} ${coach.badgeBg}`
                  : "border-border bg-card hover:border-primary/30 hover:-translate-y-0.5"
              )}
            >
              {/* Badge Pro / Gratuit */}
              <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full border ${coach.badgeBg} ${coach.badgeText} ${coach.badgeBorder}`}>
                {isLocked ? <><Lock className="w-2.5 h-2.5 inline mr-0.5" />{coach.badge}</> : coach.badge}
              </div>

              {/* Selected check */}
              {isSelected && (
                <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-black" />
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar emoji */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${coach.gradient} flex items-center justify-center text-4xl flex-shrink-0 shadow-lg`}>
                    {coach.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-black text-xl">{coach.name}</h3>
                    <p className={`text-xs font-semibold ${coach.badgeText} mb-0.5`}>{coach.specialty}</p>
                    <p className="text-xs text-muted-foreground">{coach.title}</p>
                  </div>
                </div>

                {/* Descriere */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {coach.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {coach.tags.map(tag => (
                    <span
                      key={tag}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${coach.badgeBg} ${coach.badgeText}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Buton */}
                {isSelected ? (
                  <button
                    onClick={() => navigate("/ai-coach")}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r ${coach.gradient} text-white flex items-center justify-center gap-2`}
                  >
                    <Zap className="w-4 h-4" /> Mergi la AI Coach
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelect(coach.id, coach.isPro)}
                    disabled={isSelecting}
                    className={cn(
                      "w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95",
                      isLocked
                        ? "border border-border text-muted-foreground hover:bg-secondary/50"
                        : `bg-gradient-to-r ${coach.gradient} text-white`
                    )}
                    data-testid={`button-select-coach-${coach.id}`}
                  >
                    {isSelecting ? "Se selectează..." : isLocked ? "🔒 Upgrade Pro" : "Selectează"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pro banner */}
      {!isPro && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center gap-4">
          <div className="text-3xl">🏛️</div>
          <div className="flex-1">
            <p className="font-bold">Atlas & Nova sunt disponibili Pro</p>
            <p className="text-sm text-muted-foreground">Antrenorii de elită cu personalitate avansată și răspunsuri premium.</p>
          </div>
          <button
            onClick={() => navigate("/pricing")}
            className="px-4 py-2 rounded-xl bg-primary text-black font-bold text-sm flex-shrink-0"
          >
            Pro →
          </button>
        </div>
      )}

    </div>
  );
}
