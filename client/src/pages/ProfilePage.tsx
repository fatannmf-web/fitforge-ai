import { useLang, SUPPORTED_LANGUAGES } from "@/i18n/useLang";
import { useState } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, Button, Input, Label } from "@/components/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { User, Save, Target, Gift, Copy, Share2, CheckCircle, Users, Star, Zap, Globe, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name required"),
  bio: z.string().optional(),
  goalType: z.string(),
  currentWeight: z.coerce.number().optional(),
  targetWeight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  customCaloriesTraining: z.coerce.number().optional(),
  customCaloriesRest: z.coerce.number().optional(),
  customProtein: z.coerce.number().optional(),
});

function InviteSection() {
  const { toast } = useToast();
  const { share, canShare } = useMobile();
  const [copied, setCopied] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [appliedSuccess, setAppliedSuccess] = useState("");

  const { data: invite } = useQuery<{ code: string; url: string }>({
    queryKey: ["/api/invite/code"],
  });

  const { data: profile } = useProfile();

  const applyMutation = useMutation({
    mutationFn: (code: string) => apiRequest("POST", "/api/invite/apply", { code }),
    onSuccess: (data: any) => {
      setAppliedSuccess(data.inviterName || "Un utilizator FitForge");
      setInviteInput("");
      toast({ title: "🎉 Cod aplicat!", description: `+100 puncte bonus! ${data.inviterName || ""} primește +200 puncte.` });
    },
    onError: (err: any) => {
      toast({ title: "Eroare", description: err.message || "Cod invalid sau deja folosit.", variant: "destructive" });
    },
  });

  const copyCode = () => {
    if (invite?.url) {
      navigator.clipboard.writeText(invite.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "✅ Copiat!", description: "Linkul de invitație a fost copiat." });
    }
  };

  const shareInvite = () => {
    if (invite) {
      share({
        title: "Hai pe FitForge AI! 💪",
        text: `Te invit să te antrenezi cu mine pe FitForge AI — fitness tracker cu AI Coach, Body Scan și mai mult! Folosește linkul meu și primești 100 puncte bonus:`,
        url: invite.url,
      });
    }
  };

  return (
    <Card className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
        <Gift className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Invită prieteni</h2>
          <p className="text-xs text-muted-foreground">Tu +200 pts • Prietenul tău +100 pts</p>
        </div>
      </div>

      {profile?.invitedBy && appliedSuccess === "" && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-600 bg-green-500/10 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Ai fost invitat. Bucură-te de bonusul tău!
        </div>
      )}

      {appliedSuccess && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-600 bg-green-500/10 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Codul aplicat! {appliedSuccess} primește 200 puncte.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Codul tău de invitație</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted/50 rounded-xl px-4 py-3 font-mono text-lg font-bold text-center tracking-widest border border-border select-all">
              {invite?.code || "—"}
            </div>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={copyCode} data-testid="button-copy-invite">
              {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            {canShare && (
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={shareInvite} data-testid="button-share-invite">
                <Share2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          {invite?.url && (
            <p className="text-xs text-muted-foreground mt-2 truncate">{invite.url}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-black">{profile?.inviteCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Invitați</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-xl font-black">{(profile?.inviteCount ?? 0) * 200}</p>
            <p className="text-xs text-muted-foreground">Pts câștigate</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-xl font-black">{Math.max(0, 3 - (profile?.inviteCount ?? 0))}</p>
            <p className="text-xs text-muted-foreground">Pt. Pro</p>
          </div>
        </div>

        {(profile?.inviteCount ?? 0) < 3 && (
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-4 border border-primary/20">
            <p className="text-sm font-semibold mb-1">
              🏆 Invită {3 - (profile?.inviteCount ?? 0)} prieteni mai mult
            </p>
            <p className="text-xs text-muted-foreground">
              și deblochezi 7 zile FitForge Pro gratuit!
            </p>
            <div className="mt-2">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((profile?.inviteCount ?? 0) / 3) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{profile?.inviteCount ?? 0}/3 invitați</p>
            </div>
          </div>
        )}

        {!profile?.invitedBy && !appliedSuccess && (
          <div>
            <p className="text-sm font-medium mb-2">Ai un cod de la un prieten?</p>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: ABC123"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                className="h-11 rounded-xl font-mono tracking-widest"
                maxLength={6}
                data-testid="input-invite-code"
              />
              <Button
                onClick={() => inviteInput.length >= 4 && applyMutation.mutate(inviteInput)}
                disabled={inviteInput.length < 4 || applyMutation.isPending}
                className="h-11 px-5"
                data-testid="button-apply-invite"
              >
                Aplică
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ProfilePage() {
  const { tx, lang, setLang } = useLang();
  const { theme, toggleTheme, isDark } = useTheme();
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      displayName: profile?.displayName || "",
      bio: profile?.bio || "",
      goalType: profile?.goalType || "general_fitness",
      currentWeight: profile?.currentWeight || "",
      targetWeight: profile?.targetWeight || "",
      height: profile?.height || "",
      customCaloriesTraining: profile?.customCaloriesTraining || "",
      customCaloriesRest: profile?.customCaloriesRest || "",
      customProtein: profile?.customProtein || "",
    }
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
    toast({ title: "✅ Profil actualizat!" });
  };

  if (isLoading) return <div>Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-display font-bold">{tx.profile.title}</h1>
        <p className="text-muted-foreground mt-1">Gestionează identitatea și obiectivele tale.</p>
      </header>

      <InviteSection />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <User className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold font-display">Informații personale</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Nume afișat</Label>
              <Input
                {...register("displayName")}
                error={errors.displayName?.message as string}
                data-testid="input-profile-name"
              />
            </div>
            <div>
              <Label>Bio / Motto</Label>
              <Input {...register("bio")} placeholder="Never give up..." data-testid="input-profile-bio" />
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <Target className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold font-display">Obiective Fitness</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label>Obiectiv principal</Label>
              <select {...register("goalType")} className="w-full h-12 px-4 rounded-xl bg-background border-2 border-border focus:border-accent mt-1.5" data-testid="select-goal-type">
                <option value="weight_loss">Slăbire</option>
                <option value="muscle_gain">Masă musculară</option>
                <option value="endurance">Rezistență</option>
                <option value="flexibility">Flexibilitate</option>
                <option value="general_fitness">Fitness general</option>
              </select>
            </div>
            <div>
              <Label>Greutate actuală (kg)</Label>
              <Input type="number" step="0.1" {...register("currentWeight")} data-testid="input-current-weight" />
            </div>
            <div>
              <Label>Greutate țintă (kg)</Label>
              <Input type="number" step="0.1" {...register("targetWeight")} data-testid="input-target-weight" />
            </div>
            <div>
              <Label>Înălțime (cm)</Label>
              <Input type="number" {...register("height")} data-testid="input-height" />
            </div>
          </div>
        </Card>

        {/* Custom Nutrition Goals */}
        <Card className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <Target className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold font-display">Obiective nutriționale custom</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Setează calorii diferite pentru zi de antrenament vs odihnă</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="flex items-center gap-2">
                🏋️ Calorii zi antrenament
              </Label>
              <Input
                type="number"
                {...register("customCaloriesTraining")}
                placeholder="Ex: 2500"
                data-testid="input-calories-training"
              />
              <p className="text-xs text-muted-foreground mt-1">Luni, Miercuri, Vineri, Sâmbătă</p>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                😴 Calorii zi odihnă
              </Label>
              <Input
                type="number"
                {...register("customCaloriesRest")}
                placeholder="Ex: 1800"
                data-testid="input-calories-rest"
              />
              <p className="text-xs text-muted-foreground mt-1">Marți, Joi, Duminică</p>
            </div>
            <div>
              <Label>Proteină zilnică (g)</Label>
              <Input
                type="number"
                {...register("customProtein")}
                placeholder="Ex: 160"
                data-testid="input-protein-goal"
              />
              <p className="text-xs text-muted-foreground mt-1">Recomandat: 1.6-2.2g per kg corp</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground">
              💡 Dacă lași gol, aplicația calculează automat bazat pe obiectivul tău principal.
            </p>
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" size="lg" className="px-10 gap-2" isLoading={updateMutation.isPending} data-testid="button-save-profile">
            <Save className="w-5 h-5" /> Salvează
          </Button>
        </div>
        {/* Theme Toggle */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="w-6 h-6 text-primary" /> : <Sun className="w-6 h-6 text-primary" />}
              <div>
                <h2 className="text-xl font-bold font-display">
                  {isDark ? "Mod Întunecat" : "Mod Luminos"}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isDark ? "Ideal pentru sală și seară" : "Ideal pentru zi și exterior"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              data-testid="button-theme-toggle-profile"
              className={cn(
                "relative w-14 h-7 rounded-full transition-colors duration-300",
                isDark ? "bg-muted" : "bg-primary"
              )}
            >
              <div className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center",
                isDark ? "left-1" : "left-8"
              )}>
                {isDark
                  ? <Moon className="w-3 h-3 text-muted-foreground" />
                  : <Sun className="w-3 h-3 text-primary" />
                }
              </div>
            </button>
          </div>
        </div>

        {/* Language Selector */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
            <Globe className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold font-display">{tx.profile.language}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUPPORTED_LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code as any)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  lang === l.code
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                <span className="text-2xl">{l.flag}</span>
                <div>
                  <p className="font-semibold text-sm">{l.name}</p>
                </div>
                {lang === l.code && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-black text-xs font-black">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

      </form>
    </div>
  );
}
