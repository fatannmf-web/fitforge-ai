import { useLang } from "@/i18n/useLang";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Trophy, Plus, Users, Calendar, Target, Flame, Crown,
  ChevronRight, CheckCircle, Swords, Clock, Globe, Medal,
  Share2, Star, Zap, ArrowLeft, MapPin, Flag
} from "lucide-react";
import { differenceInDays } from "date-fns";

const CHALLENGE_TYPES = [
  { value: "workouts", label: "Antrenamente", icon: "🏋️" },
  { value: "streak", label: "Zile consecutive", icon: "🔥" },
  { value: "nutrition", label: "Mese sănătoase", icon: "🥗" },
  { value: "steps", label: "Pași zilnici", icon: "👟" },
  { value: "custom", label: "Provocare liberă", icon: "⚡" },
];

const EMOJIS = ["🏆", "🔥", "💪", "⚡", "🎯", "🦁", "🚀", "🥇", "🌟", "🏃"];

type GlobalChallenge = {
  slug: string;
  emoji: string;
  title: string;
  description: string;
  participants: number;
  durationDays: number;
  level: string;
  startDate: string;
  category: string;
  gradient: string;
  badges: string[];
  dayNumber: number;
  daysLeft: number;
  country: { name: string; flag: string; rank: number; total: number };
};

type DailyMission = {
  dayNumber: number;
  mission: { title: string; exercises: string[]; duration: string; points: number };
  slug: string;
};

type LeaderboardData = {
  global: Array<{ rank: number; name: string; country: string; points: number; avatar: string }>;
  userRank: number;
  country: { name: string; flag: string; rank: number; total: number };
};

type CommunityChallenge = {
  id: number;
  title: string;
  description?: string;
  emoji: string;
  challengeType: string;
  targetValue: number;
  durationDays: number;
  participantsCount: number;
  status: string;
  endsAt: string;
  createdAt: string;
  isJoined?: boolean;
  userProfile?: { displayName?: string } | null;
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return String(n);
}

const GRADIENT_MAP: Record<string, string> = {
  "from-orange-500 to-red-600": "from-orange-500 to-red-600",
  "from-blue-500 to-purple-600": "from-blue-500 to-purple-600",
  "from-green-500 to-teal-600": "from-green-500 to-teal-600",
};

function GlobalChallengeCard({ challenge, onClick }: { challenge: GlobalChallenge; onClick: () => void }) {
  const progress = Math.round((challenge.dayNumber / challenge.durationDays) * 100);
  const gradient = GRADIENT_MAP[challenge.gradient] || "from-orange-500 to-red-600";

  return (
    <button
      data-testid={`card-global-challenge-${challenge.slug}`}
      onClick={onClick}
      className="w-full text-left group"
    >
      <div className={cn(
        "relative rounded-2xl overflow-hidden border border-white/10 transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/30"
      )}>
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", gradient)} />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl drop-shadow">{challenge.emoji}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    <Globe className="w-3 h-3 mr-1" /> GLOBAL
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    Day {challenge.dayNumber}/{challenge.durationDays}
                  </Badge>
                </div>
                <h3 className="font-bold text-white text-lg leading-tight">{challenge.title}</h3>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform mt-1" />
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-white/90">
              <Users className="w-4 h-4" />
              <span className="font-bold text-lg">{formatCount(challenge.participants)}</span>
              <span className="text-sm text-white/70">participanți</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{challenge.daysLeft} zile rămase</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <Star className="w-4 h-4" />
              <span className="text-sm">{challenge.level}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/70">
              <span>Progres global</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/70 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function GlobalChallengeDetail({
  challenge,
  onBack,
}: {
  challenge: GlobalChallenge;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [missionCompleted, setMissionCompleted] = useState(false);
  const gradient = GRADIENT_MAP[challenge.gradient] || "from-orange-500 to-red-600";

  const { data: missionData, isLoading: missionLoading } = useQuery<DailyMission>({
    queryKey: ["/api/challenges/global", challenge.slug, "mission"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/challenges/global/${challenge.slug}/mission`);
      return res.json();
    },
  });

  const { data: leaderboard, isLoading: lbLoading } = useQuery<LeaderboardData>({
    queryKey: ["/api/challenges/global", challenge.slug, "leaderboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/challenges/global/${challenge.slug}/leaderboard`);
      return res.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/challenges/global/${challenge.slug}/complete-mission`),
    onSuccess: () => {
      setMissionCompleted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "✅ Mission Completed!",
        description: `+${missionData?.mission?.points || 150} puncte adăugate în contul tău! 🔥`,
      });
    },
  });

  const handleShare = () => {
    const text = `Am completat ziua ${challenge.dayNumber} din ${challenge.title}! 💪\n\nAlătură-te mie pe FitForge AI: fitforge-ai.replit.app`;
    if (navigator.share) {
      navigator.share({ title: "FitForge AI Challenge", text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      toast({ title: "📋 Copiat în clipboard!", description: "Lipește textul unde vrei să îl partajezi." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          data-testid="button-back-to-challenges"
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Înapoi la provocări
        </button>

        <div className={cn("relative rounded-2xl overflow-hidden border border-white/10 p-6")}>
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", gradient)} />
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative">
            <div className="flex items-start gap-4 mb-4">
              <span className="text-5xl drop-shadow">{challenge.emoji}</span>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge className="bg-white/20 text-white border-white/30">
                    <Globe className="w-3 h-3 mr-1" /> GLOBAL AI CHALLENGE
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">{challenge.level}</Badge>
                </div>
                <h2 className="text-2xl font-bold text-white">{challenge.title}</h2>
                <p className="text-white/80 text-sm mt-1">{challenge.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Participanți", value: formatCount(challenge.participants), icon: Users },
                { label: "Durată", value: `${challenge.durationDays} zile`, icon: Calendar },
                { label: "Zile rămase", value: String(challenge.daysLeft), icon: Clock },
              ].map(stat => (
                <div key={stat.label} className="bg-white/15 rounded-xl p-3 text-center">
                  <stat.icon className="w-4 h-4 text-white/70 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Mission */}
      <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">Daily Mission</h3>
              <p className="text-xs text-muted-foreground">Day {challenge.dayNumber} of {challenge.durationDays}</p>
            </div>
          </div>
          {missionData && (
            <Badge className="bg-primary/20 text-primary border-primary/30">
              +{missionData.mission?.points} pts
            </Badge>
          )}
        </div>

        {missionLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-8 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : missionData?.mission ? (
          <>
            <div>
              <p className="font-semibold text-base mb-1">{missionData.mission.title}</p>
              <p className="text-xs text-muted-foreground mb-3">⏱ {missionData.mission.duration}</p>
              <div className="space-y-2">
                {missionData.mission.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <span className="text-sm font-medium">{ex}</span>
                  </div>
                ))}
              </div>
            </div>

            {missionCompleted ? (
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-green-400">Mission Completed! +{missionData.mission.points} pts</span>
              </div>
            ) : (
              <Button
                data-testid="button-complete-mission"
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {completeMutation.isPending ? "Se procesează..." : "✅ Mission Completed! Marchează ca finalizată"}
              </Button>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-4">Misiunea nu a putut fi încărcată.</p>
        )}
      </div>

      {/* Global Leaderboard */}
      <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h3 className="font-bold">Global Leaderboard</h3>
        </div>

        {lbLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : leaderboard ? (
          <>
            <div className="space-y-2">
              {leaderboard.global.map((entry, i) => (
                <div key={entry.rank} className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border",
                  i === 0 ? "bg-yellow-500/10 border-yellow-500/30" :
                  i === 1 ? "bg-gray-400/10 border-gray-400/30" :
                  i === 2 ? "bg-orange-600/10 border-orange-600/30" :
                  "bg-muted/30 border-border"
                )}>
                  <span className="text-xl w-8 text-center font-bold">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${entry.rank}`}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{entry.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.country}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-sm">{entry.points.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Your rank */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Poziția ta</span>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                #{leaderboard.userRank.toLocaleString()}
              </Badge>
            </div>
          </>
        ) : null}
      </div>

      {/* Country Leaderboard */}
      {leaderboard && (
        <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold">Country Leaderboard</h3>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{leaderboard.country.flag}</span>
              <div>
                <p className="font-bold">{leaderboard.country.name}</p>
                <p className="text-xs text-muted-foreground">din {leaderboard.country.total} țări participante</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-400">#{leaderboard.country.rank}</p>
              <p className="text-xs text-muted-foreground">Clasament</p>
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2">
          <Medal className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold">Badge-uri de câștigat</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {challenge.badges.map((badge, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
              <span className="text-xl">{badge.split(" ")[0]}</span>
              <span className="text-sm font-medium">{badge.substring(badge.indexOf(" ") + 1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share */}
      <Button
        data-testid="button-share-challenge"
        onClick={handleShare}
        variant="outline"
        className="w-full border-primary/30 text-primary hover:bg-primary/10"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share — I'm on Day {challenge.dayNumber} of {challenge.title}!
      </Button>
    </div>
  );
}

function CommunitySection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [leaderboardId, setLeaderboardId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    emoji: "🏆",
    challengeType: "workouts",
    targetValue: 7,
    durationDays: 7,
    isPublic: true,
  });

  const { data: challenges = [], isLoading } = useQuery<CommunityChallenge[]>({
    queryKey: ["/api/challenges"],
  });

  const joinMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/challenges/${id}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({ title: "✅ Ai intrat în provocare!", description: "Mult succes!" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/challenges/${id}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({ title: "Ai ieșit din provocare." });
    },
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/challenges", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setShowCreate(false);
      setForm({ title: "", description: "", emoji: "🏆", challengeType: "workouts", targetValue: 7, durationDays: 7, isPublic: true });
      toast({ title: "🎯 Provocare creată!", description: "Invită-ți prietenii să participe!" });
    },
  });

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery<Array<{ id: number; progress: number; isCompleted: boolean; userProfile?: { displayName?: string; avatarUrl?: string } | null }>>({
    queryKey: ["/api/challenges", leaderboardId, "leaderboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/challenges/${leaderboardId}/leaderboard`);
      return res.json();
    },
    enabled: !!leaderboardId,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Provocări Comunitate</h3>
          <p className="text-sm text-muted-foreground">Creează și alătură-te provocărilor locale</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-challenge" size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-1" /> Creează
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>🎯 Creează o Provocare</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Emoji</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => setForm(f => ({ ...f, emoji: e }))}
                      className={cn("text-2xl p-2 rounded-lg transition-all", form.emoji === e ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted")}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                data-testid="input-challenge-title"
                placeholder="Titlu provocare"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <Textarea
                data-testid="input-challenge-description"
                placeholder="Descriere (opțional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium mb-1">Tip</p>
                  <Select value={form.challengeType} onValueChange={v => setForm(f => ({ ...f, challengeType: v }))}>
                    <SelectTrigger data-testid="select-challenge-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHALLENGE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Durată (zile)</p>
                  <Select value={String(form.durationDays)} onValueChange={v => setForm(f => ({ ...f, durationDays: parseInt(v) }))}>
                    <SelectTrigger data-testid="select-duration"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 7, 14, 21, 30].map(d => <SelectItem key={d} value={String(d)}>{d} zile</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input
                data-testid="input-target-value"
                type="number"
                min={1}
                placeholder="Țintă (număr)"
                value={form.targetValue}
                onChange={e => setForm(f => ({ ...f, targetValue: parseInt(e.target.value) || 1 }))}
              />
              <Button
                data-testid="button-submit-challenge"
                onClick={() => createMutation.mutate()}
                disabled={!form.title || createMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {createMutation.isPending ? "Se creează..." : "🚀 Lansează Provocarea!"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-36 rounded-2xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="text-5xl">🎯</div>
          <p className="font-bold text-lg">Nu există provocări active</p>
          <p className="text-muted-foreground text-sm">Fii primul care creează o provocare!</p>
          <Button onClick={() => setShowCreate(true)} className="bg-primary">Creează prima provocare</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map(challenge => {
            const daysLeft = differenceInDays(new Date(challenge.endsAt), new Date());
            const typeInfo = CHALLENGE_TYPES.find(t => t.value === challenge.challengeType);
            return (
              <div key={challenge.id} className={cn(
                "p-4 rounded-2xl border transition-all hover:border-primary/40",
                challenge.isJoined ? "bg-primary/5 border-primary/30" : "bg-card border-border"
              )}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{challenge.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold">{challenge.title}</h4>
                      {challenge.isJoined && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">✓ Participant</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">de {challenge.userProfile?.displayName || "Anonim"}</p>
                    {challenge.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{challenge.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">{typeInfo?.icon} {typeInfo?.label}</Badge>
                  <Badge variant="outline" className={cn("text-xs", daysLeft <= 2 ? "border-red-500/50 text-red-400" : "")}>
                    <Clock className="w-3 h-3 mr-1" />{daysLeft > 0 ? `${daysLeft}z rămase` : "Expirat"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />{challenge.participantsCount}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    data-testid={`button-leaderboard-${challenge.id}`}
                    variant="outline" size="sm" className="flex-1"
                    onClick={() => setLeaderboardId(challenge.id)}
                  >
                    <Trophy className="w-4 h-4 mr-1" /> Clasament
                  </Button>
                  {challenge.isJoined ? (
                    <Button
                      data-testid={`button-leave-${challenge.id}`}
                      variant="outline" size="sm" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => leaveMutation.mutate(challenge.id)}
                    >
                      Ieși
                    </Button>
                  ) : (
                    <Button
                      data-testid={`button-join-${challenge.id}`}
                      size="sm" className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => joinMutation.mutate(challenge.id)}
                      disabled={daysLeft <= 0}
                    >
                      <Swords className="w-4 h-4 mr-1" /> Participă
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini leaderboard modal */}
      <Dialog open={!!leaderboardId} onOpenChange={() => setLeaderboardId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Clasament Provocare</DialogTitle>
          </DialogHeader>
          {lbLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : leaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nimeni nu a participat încă.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {leaderboard.map((p, i) => (
                <div key={p.id} className={cn(
                  "flex items-center gap-3 p-3 rounded-xl",
                  i === 0 ? "bg-yellow-500/10 border border-yellow-500/30" :
                  i === 1 ? "bg-gray-400/10 border border-gray-400/30" :
                  i === 2 ? "bg-orange-700/10 border border-orange-700/30" : "bg-card border border-border"
                )}>
                  <span className="text-xl font-bold w-8 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <img
                    src={p.userProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${p.userProfile?.displayName || "U"}&background=random`}
                    alt="avatar"
                    className="w-9 h-9 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{p.userProfile?.displayName || "Anonim"}</p>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, p.progress * 10)}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{p.progress}</p>
                    <p className="text-xs text-muted-foreground">{p.isCompleted ? "✅" : "în prog."}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ChallengesPage() {
  const { tx } = useLang();
  const [activeTab, setActiveTab] = useState<"global" | "community">("global");
  const [selectedChallenge, setSelectedChallenge] = useState<GlobalChallenge | null>(null);

  const { data: globalChallenges = [], isLoading: globalLoading } = useQuery<GlobalChallenge[]>({
    queryKey: ["/api/challenges/global"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/challenges/global");
      return res.json();
    },
  });

  const totalParticipants = globalChallenges.reduce((s, c) => s + c.participants, 0);

  if (selectedChallenge) {
    return (
      <div>
        <GlobalChallengeDetail
          challenge={selectedChallenge}
          onBack={() => setSelectedChallenge(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
          <Globe className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Global AI Challenges</h1>
          <p className="text-muted-foreground">Competiții globale • Misiuni zilnice AI • Clasament mondial</p>
        </div>
      </div>

      {/* Global Stats Banner */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Participanți globali", value: formatCount(totalParticipants || 426731), icon: Users, color: "text-blue-400" },
          { label: "Provocări active", value: "3", icon: Flame, color: "text-orange-400" },
          { label: "Țări participante", value: "95", icon: Globe, color: "text-green-400" },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-2xl bg-card border border-border text-center">
            <stat.icon className={cn("w-5 h-5 mx-auto mb-1.5", stat.color)} />
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-1">
        {([
          ["global", "🌍 Global AI Challenges"],
          ["community", "👥 Comunitate"],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            data-testid={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-t-xl text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-primary/20 text-primary border border-primary/30 border-b-0"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "global" ? (
        <div className="space-y-4">
          {globalLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-44 rounded-2xl bg-card border border-border animate-pulse" />)}
            </div>
          ) : (
            globalChallenges.map(challenge => (
              <GlobalChallengeCard
                key={challenge.slug}
                challenge={challenge}
                onClick={() => setSelectedChallenge(challenge)}
              />
            ))
          )}

          {/* Info footer */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border text-center space-y-1">
            <p className="text-sm font-medium">🤖 AI generează misiunile zilnic</p>
            <p className="text-xs text-muted-foreground">Dificultatea se adaptează progresului tău. Noi provocări globale în curând.</p>
          </div>
        </div>
      ) : (
        <CommunitySection />
      )}
    </div>
  );
}
