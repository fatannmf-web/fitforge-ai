import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAiCoachStream } from "@/hooks/use-ai-coach";
import { useIsPro, useCheckout } from "@/hooks/use-subscription";
import { Button } from "@/components/ui";
import { Send, User, ArrowLeft, Zap, ChevronRight, Lock, Crown, Sparkles, Mic, MicOff, Volume2, VolumeX, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Coach Definitions ────────────────────────────────────────────────────────
const COACHES = [
  {
    id: "atlas",
    name: "Atlas",
    title: "AI Strength Coach",
    gender: "male" as const,
    emoji: "🏛️",
    avatar: "/coaches/atlas.png",
    specialty: "Forță & Hipertrofie",
    description: "Antrenor digital de elită. Expert în forță, masă musculară și tehnică perfectă. Serios, precis, rezultate garantate.",
    gradient: "from-slate-600 to-zinc-900",
    gradientVivid: "from-amber-400 via-orange-500 to-red-600",
    glow: "shadow-amber-500/40",
    border: "border-amber-500/50",
    bg: "bg-amber-500/10",
    badge: "DIGITAL HUMAN",
    badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    isPro: true,
    prompts: [
      "Ce antrenament de forță fac azi?",
      "Corectează-mi tehnica la squat",
      "Creează-mi un program de 12 săptămâni",
      "Am ridicat mai greu săptămâna asta!",
    ],
    greeting: "Atlas here. Let's get to work.\n\nSunt analizând profilul tău. Spune-mi ce vrei să construim — forță, masă sau ambele. Fără ezitări.",
    avatarBg: "from-slate-800 to-zinc-900",
    accentColor: "amber",
  },
  {
    id: "nova",
    name: "Nova",
    title: "AI Performance Coach",
    gender: "female" as const,
    emoji: "⭐",
    avatar: "/coaches/nova.png",
    specialty: "Performance & Wellness",
    description: "Expertă în fitness total, slăbit și recuperare. Caldă, directă, motivantă. Rezultate durabile prin consistență.",
    gradient: "from-violet-600 to-indigo-900",
    gradientVivid: "from-violet-400 via-purple-500 to-indigo-600",
    glow: "shadow-violet-500/40",
    border: "border-violet-500/50",
    bg: "bg-violet-500/10",
    badge: "DIGITAL HUMAN",
    badgeColor: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
    isPro: true,
    prompts: [
      "Ce antrenament îmi recomandă azi?",
      "Creează-mi un plan de slăbit",
      "Cum îmi optimizez recuperarea?",
      "Analizează-mi progresul recent",
    ],
    greeting: "Bună! Sunt Nova ⭐\n\nMă bucur că ești aici. Îți analizez profilul și datele reale — spune-mi cu ce poți ajuta azi: antrenament, nutriție, sau recuperare?",
    avatarBg: "from-violet-800 to-indigo-900",
    accentColor: "violet",
  },
  {
    id: "beginner",
    name: "Alex",
    title: "Beginner Coach",
    gender: null,
    emoji: "🌱",
    avatar: "/coaches/alex.png",
    specialty: "Fundamente & Formă",
    description: "Perfect pentru început. Explică simplu, pas cu pas, fără jargon.",
    gradient: "from-emerald-400 to-green-600",
    gradientVivid: "from-emerald-400 to-green-600",
    glow: "shadow-emerald-500/30",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    badge: "STARTER",
    badgeColor: "bg-emerald-500/20 text-emerald-300",
    isPro: false,
    prompts: [
      "Cum să încep dacă sunt complet începător?",
      "Explică-mi cum să fac o genuflexiune corect",
      "Ce antrenamente fac în prima săptămână?",
      "Cum să evit accidentările la sală?",
    ],
    greeting: "Salut! Sunt Alex, antrenorul tău pentru fundamente 🌱 Sunt aici să-ți explic totul simplu și clar. Cu ce te pot ajuta azi?",
    avatarBg: "from-emerald-600 to-green-800",
    accentColor: "emerald",
  },
  {
    id: "strength",
    name: "Max",
    title: "Strength Coach",
    gender: null,
    emoji: "💪",
    avatar: "/coaches/max.png",
    specialty: "Forță & Putere",
    description: "Specializat în forță. Squat, deadlift, bench — progres real.",
    gradient: "from-red-500 to-orange-600",
    gradientVivid: "from-red-500 to-orange-600",
    glow: "shadow-red-500/30",
    border: "border-red-500/40",
    bg: "bg-red-500/10",
    badge: "POWER",
    badgeColor: "bg-red-500/20 text-red-300",
    isPro: false,
    prompts: [
      "Cum să cresc la deadlift?",
      "Plan de forță pe 3 zile pe săptămână",
      "Ce este progressive overload și cum aplic?",
      "Cum să-mi calculez 1RM?",
    ],
    greeting: "Max aici. Facem forță — nu glume, nu scuze 💪 Ce vrei să ridici mai mult?",
    avatarBg: "from-red-700 to-orange-800",
    accentColor: "red",
  },
  {
    id: "fatloss",
    name: "Vera",
    title: "Fat Loss Coach",
    gender: null,
    emoji: "🔥",
    avatar: "/coaches/vera.png",
    specialty: "Slăbit & HIIT",
    description: "Intensitate maximă, deficit caloric, rezultate rapide.",
    gradient: "from-orange-400 to-red-500",
    gradientVivid: "from-orange-400 to-red-500",
    glow: "shadow-orange-500/30",
    border: "border-orange-500/40",
    bg: "bg-orange-500/10",
    badge: "BURN",
    badgeColor: "bg-orange-500/20 text-orange-300",
    isPro: false,
    prompts: [
      "Câte calorii să mănânc ca să slăbesc?",
      "Cel mai bun cardio pentru arderea grăsimilor",
      "HIIT sau cardio clasic — care e mai bun?",
      "De ce nu slăbesc deși mă antrenez?",
    ],
    greeting: "Salut! Sunt Vera 🔥 Fără scuze, fără mofturi — vorbim cifre reale. Câte kg vrei să dai jos?",
    avatarBg: "from-orange-600 to-red-800",
    accentColor: "orange",
  },
  {
    id: "muscle",
    name: "Bruno",
    title: "Muscle Coach",
    gender: null,
    emoji: "🏋️",
    avatar: "/coaches/bruno.png",
    specialty: "Masă Musculară",
    description: "Hipertrofie, proteină, volum. Știința din spatele mușchilor.",
    gradient: "from-blue-500 to-violet-600",
    gradientVivid: "from-blue-500 to-violet-600",
    glow: "shadow-blue-500/30",
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
    badge: "BULK",
    badgeColor: "bg-blue-500/20 text-blue-300",
    isPro: false,
    prompts: [
      "Câtă proteină îmi trebuie pe zi?",
      "Cel mai bun split pentru masă musculară",
      "Push/Pull/Legs sau Full Body?",
      "Cum să mănânc pentru hipertrofie?",
    ],
    greeting: "Bruno here! 🏋️ Vorbim de mușchi serioși. Câte luni ai pentru construcție?",
    avatarBg: "from-blue-700 to-violet-900",
    accentColor: "blue",
  },
  {
    id: "home",
    name: "Sam",
    title: "Home Coach",
    gender: null,
    emoji: "🏠",
    avatar: "/coaches/sam.png",
    specialty: "Antrenamente Acasă",
    description: "Fără sală, fără echipament. Rezultate reale cu ce ai acasă.",
    gradient: "from-teal-400 to-cyan-600",
    gradientVivid: "from-teal-400 to-cyan-600",
    glow: "shadow-teal-500/30",
    border: "border-teal-500/40",
    bg: "bg-teal-500/10",
    badge: "HOME",
    badgeColor: "bg-teal-500/20 text-teal-300",
    isPro: false,
    prompts: [
      "Antrenament complet fără echipament",
      "Push-up variations pentru toată viața",
      "Cum să progresez fără greutăți?",
      "Circuit de 20 minute acasă pentru tot corpul",
    ],
    greeting: "Salut! Sunt Sam 🏠 Nu ai nevoie de sală pentru rezultate — am să-ți dovedesc eu! Ce spațiu ai acasă?",
    avatarBg: "from-teal-600 to-cyan-800",
    accentColor: "teal",
  },
  {
    id: "athlete",
    name: "Rio",
    title: "Athlete Coach",
    gender: null,
    emoji: "⚡",
    avatar: "/coaches/rio.png",
    specialty: "Performanță & Sport",
    description: "Nivel avansat. Putere explozivă, viteză, rezistență sport.",
    gradient: "from-yellow-400 to-orange-500",
    gradientVivid: "from-yellow-400 to-orange-500",
    glow: "shadow-yellow-500/30",
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/10",
    badge: "ELITE",
    badgeColor: "bg-yellow-500/20 text-yellow-300",
    isPro: false,
    prompts: [
      "Cum să-mi cresc puterea explozivă?",
      "Plan de plyometrics pentru 4 săptămâni",
      "Cum să combin forța cu rezistența?",
      "Ce antrenamente fac în off-season?",
    ],
    greeting: "Rio. Level: campion ⚡ Nu e pentru toată lumea ce facem noi. Ești gata să dai totul?",
    avatarBg: "from-yellow-600 to-orange-800",
    accentColor: "yellow",
  },
  {
    id: "mobility",
    name: "Luna",
    title: "Mobility Coach",
    gender: null,
    emoji: "🧘",
    avatar: "/coaches/luna.png",
    specialty: "Mobilitate & Recuperare",
    description: "Flexibilitate, yoga, prevenirea accidentărilor pe termen lung.",
    gradient: "from-purple-400 to-pink-500",
    gradientVivid: "from-purple-400 to-pink-500",
    glow: "shadow-purple-500/30",
    border: "border-purple-500/40",
    bg: "bg-purple-500/10",
    badge: "FLOW",
    badgeColor: "bg-purple-500/20 text-purple-300",
    isPro: false,
    prompts: [
      "Rutină de mobilitate de dimineață 10 min",
      "Cum să-mi vindec durerea de spate?",
      "Stretching înainte sau după antrenament?",
      "Exerciții pentru mobilitatea șoldului",
    ],
    greeting: "Bună 🧘 Sunt Luna. Mișcarea înseamnă longevitate. Ce zone ale corpului îți cauzează disconfort?",
    avatarBg: "from-purple-600 to-pink-800",
    accentColor: "purple",
  },
  {
    id: "motivation",
    name: "Kai",
    title: "Motivation Coach",
    gender: null,
    emoji: "🧠",
    avatar: "/coaches/kai.png",
    specialty: "Mentalitate & Motivație",
    description: "Mindset de campion. Consistență, identitate, depășirea limitelor.",
    gradient: "from-violet-500 to-purple-700",
    gradientVivid: "from-violet-500 to-purple-700",
    glow: "shadow-violet-500/30",
    border: "border-violet-500/40",
    bg: "bg-violet-500/10",
    badge: "MIND",
    badgeColor: "bg-violet-500/20 text-violet-300",
    isPro: false,
    prompts: [
      "M-am plafonat și nu mai am chef",
      "Cum să rămân consistent luni de zile?",
      "De ce renunț mereu după 2 săptămâni?",
      "Ajută-mă să-mi setez obiective reale",
    ],
    greeting: "Kai here 🧠 Corpul tău e construit de mintea ta — nu de mușchi. Spune-mi ce te oprește.",
    avatarBg: "from-violet-700 to-purple-900",
    accentColor: "violet",
  },
] as const;

type Coach = typeof COACHES[number];

// ─── Coach Avatar with photo fallback ────────────────────────────────────────
function CoachAvatar({ coach, size = "md", locked = false }: {
  coach: Coach; size?: "xs" | "sm" | "md" | "lg" | "xl"; locked?: boolean;
}) {
  const sizeClass = { xs: "w-5 h-5", sm: "w-8 h-8", md: "w-10 h-10", lg: "w-14 h-14", xl: "w-24 h-24" }[size];
  const textSize = { xs: "text-xs", sm: "text-sm", md: "text-xl", lg: "text-3xl", xl: "text-5xl" }[size];
  return (
    <div className={`relative ${sizeClass} rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br ${coach.gradientVivid} flex items-center justify-center shadow-md`}>
      <img
        src={(coach as any).avatar}
        alt={coach.name}
        className="absolute inset-0 w-full h-full object-cover object-top"
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <span className={`${textSize} relative z-0`}>{coach.emoji}</span>
      {locked && (
        <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center z-10">
          <Lock className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

// ─── Pro Upgrade Modal ────────────────────────────────────────────────────────
function ProUpgradeModal({ coach, onClose }: { coach: Coach; onClose: () => void }) {
  const checkout = useCheckout();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        className="relative z-10 w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Hero */}
        <div className={`relative h-40 bg-gradient-to-br ${coach.gradientVivid} flex items-center justify-center overflow-hidden`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl mb-2 border-2 border-white/20">
              <img src={(coach as any).avatar} alt={coach.name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <div className="text-white font-display font-black text-xl tracking-tight">{coach.name}</div>
            <div className="text-white/80 text-xs mt-0.5">{coach.title}</div>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
            <Crown className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">PRO EXCLUSIV</span>
          </div>
        </div>

        <div className="p-5">
          <h2 className="font-display font-black text-lg text-foreground mb-1">
            Deblochează {coach.name}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Antrenorii Digital Human sunt disponibili exclusiv pentru membrii Pro — AI mai avansat, personalitate mai profundă, context complet.
          </p>

          <div className="space-y-2 mb-5">
            {[
              "Conversație cu memorie completă",
              "Analiză avansată a datelor tale",
              "Planuri personalizate nelimitate",
              `Acces la Atlas + Nova (ambii)`
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={() => checkout.mutate("price_monthly")}
            disabled={checkout.isPending}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl py-3 shadow-lg shadow-amber-500/30 mb-2"
            data-testid="button-upgrade-pro"
          >
            {checkout.isPending ? "Se procesează..." : "Upgrade la Pro — €9.99/lună"}
          </Button>
          <button onClick={onClose} className="w-full text-center text-sm text-muted-foreground py-1 hover:text-foreground transition-colors">
            Mai târziu
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isUser, coach }: {
  msg: { content: string; role: string };
  isUser: boolean;
  coach: Coach;
}) {
  const content = msg.content || "";
  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^#{1,3}\s(.+)$/gm, '<span class="font-bold text-primary block mt-3 mb-1 text-sm">$1</span>')
    .replace(/^(\d+)\.\s(.+)$/gm, '<span class="block pl-3 text-sm"><span class="text-primary font-bold mr-1">$1.</span>$2</span>')
    .replace(/^[-•]\s(.+)$/gm, '<span class="block pl-3 text-sm before:content-[\'•\'] before:text-primary before:mr-2 before:font-bold">$1</span>');

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2.5", isUser ? "ml-auto flex-row-reverse max-w-[82%]" : "max-w-[90%]")}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold overflow-hidden",
        isUser
          ? "bg-secondary border border-border"
          : `bg-gradient-to-br ${coach.gradientVivid} shadow-md`
      )}>
        {isUser ? <User className="w-3.5 h-3.5 text-foreground" /> : (
          <img src={(coach as any).avatar} alt={coach.name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
      </div>
      <div className={cn(
        "px-4 py-3 rounded-2xl text-sm leading-relaxed",
        isUser
          ? "bg-secondary border border-border text-foreground rounded-tr-sm"
          : `bg-card border ${coach.border} text-foreground rounded-tl-sm`
      )}>
        {isUser
          ? <p className="whitespace-pre-wrap">{content}</p>
          : <div className="space-y-1" dangerouslySetInnerHTML={{ __html: formatted.replace(/\n/g, "<br>") }} />
        }
      </div>
    </motion.div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ coach }: { coach: Coach }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${coach.gradientVivid} flex items-center justify-center text-sm shrink-0 overflow-hidden`}>
        <img src={(coach as any).avatar} alt={coach.name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </div>
      <div className={`px-4 py-3 rounded-2xl rounded-tl-sm bg-card border ${coach.border}`}>
        <div className="flex gap-1.5 items-center h-4">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Voice Hook ──────────────────────────────────────────────────────────────
function useVoiceFeatures(coachId: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return localStorage.getItem("fitforge_voice") !== "off"; } catch { return true; }
  });
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      const next = !prev;
      localStorage.setItem("fitforge_voice", next ? "on" : "off");
      if (!next) stopSpeaking();
      return next;
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled || !text.trim()) return;
    stopSpeaking();
    try {
      setIsSpeaking(true);
      const language = localStorage.getItem("fitforge_lang") || "ro";
      const res = await fetch("/api/ai-coach/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: text.slice(0, 800), coachId, language }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); audioRef.current = null; };
      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  }, [voiceEnabled, coachId, stopSpeaking]);

  const startRecording = useCallback((onResult: (text: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = localStorage.getItem("fitforge_lang") === "ro" ? "ro-RO"
      : localStorage.getItem("fitforge_lang") === "de" ? "de-DE"
      : localStorage.getItem("fitforge_lang") === "es" ? "es-ES"
      : localStorage.getItem("fitforge_lang") === "fr" ? "fr-FR"
      : localStorage.getItem("fitforge_lang") === "it" ? "it-IT"
      : localStorage.getItem("fitforge_lang") === "pt" ? "pt-PT"
      : localStorage.getItem("fitforge_lang") === "ru" ? "ru-RU"
      : localStorage.getItem("fitforge_lang") === "zh" ? "zh-CN"
      : localStorage.getItem("fitforge_lang") === "ja" ? "ja-JP"
      : "en-US";
    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      if (e.results[e.results.length - 1].isFinal) {
        onResult(transcript);
        setIsRecording(false);
      }
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  useEffect(() => () => { stopSpeaking(); stopRecording(); }, []);

  return { isRecording, isSpeaking, voiceEnabled, toggleVoice, speak, startRecording, stopRecording, stopSpeaking };
}

function CoachChat({ coach, onBack, scanGreeting }: { coach: Coach; onBack: () => void; scanGreeting?: string | null }) {
  const { sendMessage, isStreaming, streamingContent, stopStream } = useAiCoachStream();
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<{ role: string; content: string; id: string }[]>([
    { role: "assistant", content: scanGreeting || coach.greeting, id: "greeting" },
  ]);
  const [lastContent, setLastContent] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevStreamingRef = useRef("");
  const hasSpeechSupport = typeof window !== "undefined" && !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  const { isRecording, isSpeaking, voiceEnabled, toggleVoice, speak, startRecording, stopRecording, stopSpeaking } = useVoiceFeatures(coach.id);

  // Auto-speak scan greeting on first mount
  const hasAutoSpoken = useRef(false);
  useEffect(() => {
    if (scanGreeting && !hasAutoSpoken.current) {
      hasAutoSpoken.current = true;
      const t = setTimeout(() => speak(scanGreeting), 900);
      return () => clearTimeout(t);
    }
  }, []);

  const displayMessages = [...localMessages];
  if (isStreaming && streamingContent) {
    displayMessages.push({ id: "streaming", role: "assistant", content: streamingContent });
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages.length, streamingContent]);

  useEffect(() => {
    if (streamingContent) setLastContent(streamingContent);
  }, [streamingContent]);

  // Auto-speak when AI finishes responding
  useEffect(() => {
    if (!isStreaming && prevStreamingRef.current && voiceEnabled) {
      speak(prevStreamingRef.current);
      prevStreamingRef.current = "";
    }
    if (isStreaming && streamingContent) {
      prevStreamingRef.current = streamingContent;
    }
  }, [isStreaming, streamingContent, voiceEnabled]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isStreaming) return;
    stopSpeaking();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLocalMessages(prev => [...prev, { role: "user", content: msg, id: Date.now().toString() }]);
    await sendMessage(msg, coach.id, () => {
      setTimeout(() => {
        setLocalMessages(prev => {
          const hasStreaming = prev.some(m => m.id === "streaming");
          if (hasStreaming) return prev;
          const content = lastContent || streamingContent;
          if (!content) return prev;
          return [...prev, { role: "assistant", content, id: Date.now().toString() }];
        });
      }, 50);
    });
  };

  const handleMicToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording((transcript) => {
        setInput(transcript);
        // Auto-send after voice input
        setTimeout(() => {
          handleSend(transcript);
        }, 300);
      });
    }
  };

  const showQuickPrompts = localMessages.length <= 1;
  const isPro = coach.isPro;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0",
        isPro ? `bg-gradient-to-r ${coach.gradient} bg-opacity-20` : "bg-card/80 backdrop-blur-sm"
      )}>
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" data-testid="button-back-coaches">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Avatar with speaking rings */}
        <div className="relative flex-shrink-0">
          {isSpeaking && (
            <>
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${coach.gradientVivid} opacity-30 animate-ping`} style={{ animationDuration: "1.2s" }} />
              <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${coach.gradientVivid} opacity-20 animate-ping`} style={{ animationDuration: "1.8s", animationDelay: "0.3s" }} />
            </>
          )}
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${coach.gradientVivid} flex items-center justify-center shadow-md overflow-hidden relative z-10`}>
            <img src={(coach as any).avatar} alt={coach.name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-foreground text-sm flex items-center gap-2 flex-wrap">
            {coach.name}
            {isPro && <Crown className="w-3.5 h-3.5 text-amber-400" />}
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", coach.badgeColor)}>
              {coach.badge}
            </span>
          </div>
          <div className="text-xs truncate flex items-center gap-1.5">
            {isSpeaking ? (
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5 items-end h-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-0.5 bg-emerald-400 rounded-full animate-bounce"
                      style={{ height: `${4 + (i % 3) * 3}px`, animationDelay: `${i * 70}ms`, animationDuration: "0.6s" }} />
                  ))}
                </div>
                <span className="text-emerald-400 font-medium">Vorbește...</span>
                <button
                  onClick={stopSpeaking}
                  className="ml-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/30 transition-colors"
                  data-testid="button-stop-speaking"
                >
                  Stop
                </button>
              </div>
            ) : (
              <span className="text-muted-foreground">{coach.specialty}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleVoice}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              voiceEnabled ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" : "text-muted-foreground hover:bg-muted/50"
            )}
            title={voiceEnabled ? "Voice ON — click to disable" : "Voice OFF — click to enable"}
            data-testid="button-toggle-voice"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <span className={cn("w-2 h-2 rounded-full", isSpeaking ? "bg-emerald-400 animate-pulse" : "bg-emerald-400")} />
          <span className="text-xs text-muted-foreground hidden sm:inline">{isSpeaking ? "Speaking" : "Online"}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        <AnimatePresence initial={false}>
          {displayMessages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isUser={msg.role === "user"} coach={coach} />
          ))}
          {isStreaming && !streamingContent && <TypingIndicator key="typing" coach={coach} />}
          {isSpeaking && !isStreaming && (
            <motion.div key="speaking-bar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-2.5 max-w-[90%]">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${coach.gradientVivid} flex items-center justify-center text-sm shrink-0 overflow-hidden`}>
                <img src={(coach as any).avatar} alt={coach.name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className={`px-4 py-3 rounded-2xl rounded-tl-sm bg-card border ${coach.border} flex items-center gap-2`}>
                <div className="flex gap-0.5 items-end h-4">
                  {[3, 6, 10, 8, 5, 9, 4, 7, 6, 3].map((h, i) => (
                    <div key={i} className={`w-0.5 rounded-full animate-bounce`}
                      style={{
                        height: `${h}px`,
                        animationDelay: `${i * 55}ms`,
                        animationDuration: "0.7s",
                        background: `rgb(var(--color-emerald, 52 211 153))`,
                        backgroundColor: "#34d399"
                      }} />
                  ))}
                </div>
                <span className="text-xs text-emerald-400 font-medium">Redă vocea...</span>
                <button onClick={stopSpeaking} className="ml-1 text-[10px] text-muted-foreground hover:text-red-400 transition-colors">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Quick Prompts */}
      {showQuickPrompts && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {coach.prompts.map((prompt, i) => (
              <button key={i} onClick={() => handleSend(prompt)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-all flex-shrink-0 hover:opacity-90 active:scale-95",
                  coach.bg, coach.border, "text-foreground"
                )}
                data-testid={`quick-prompt-${i}`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="mx-4 mb-2 flex-shrink-0">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="relative flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-50" />
            </div>
            <span className="text-xs text-red-400 font-semibold">Ascultând... vorbește acum</span>
            <div className="flex gap-0.5 ml-auto items-end h-4">
              {[8, 14, 10, 18, 12, 16, 9, 13].map((h, i) => (
                <div key={i} className="w-0.5 bg-red-400 rounded-full animate-bounce"
                  style={{ height: `${h}px`, animationDelay: `${i * 65}ms`, animationDuration: "0.65s" }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-border bg-card flex-shrink-0">
        {/* Mic button */}
        {hasSpeechSupport && (
          <button
            onClick={handleMicToggle}
            disabled={isStreaming}
            className={cn(
              "h-[42px] w-[42px] flex-shrink-0 rounded-xl flex items-center justify-center transition-all border",
              isRecording
                ? "bg-red-500 border-red-400 text-white animate-pulse shadow-lg shadow-red-500/30"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            )}
            title={isRecording ? "Stop recording" : "Start voice input"}
            data-testid="button-mic"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isRecording ? "Ascultând..." : `Întreabă-l pe ${coach.name}...`}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none min-h-[42px] max-h-[120px] overflow-y-auto"
            rows={1}
            disabled={isStreaming || isRecording}
            data-testid="input-message"
          />
        </div>
        <Button
          onClick={isStreaming ? stopStream : () => handleSend()}
          disabled={!input.trim() && !isStreaming}
          size="sm"
          className={cn("h-[42px] w-[42px] p-0 flex-shrink-0 rounded-xl", isStreaming && "bg-red-500 hover:bg-red-600")}
          data-testid="button-send"
        >
          {isStreaming
            ? <div className="w-3.5 h-3.5 bg-white rounded-sm" />
            : <Send className="w-4 h-4" />
          }
        </Button>
      </div>
    </div>
  );
}

// ─── Digital Human Card (Pro) ─────────────────────────────────────────────────
function DigitalHumanCard({
  coach,
  isPro,
  onSelect,
  onUpgrade,
}: {
  coach: Coach;
  isPro: boolean;
  onSelect: () => void;
  onUpgrade: () => void;
}) {
  const locked = !isPro;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={locked ? onUpgrade : onSelect}
      className={cn(
        "relative w-full rounded-2xl overflow-hidden border text-left transition-all",
        coach.border,
        locked ? "opacity-90" : "hover:shadow-xl hover:" + coach.glow
      )}
      data-testid={`coach-card-${coach.id}`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${coach.gradient} opacity-40`} />
      <div className="absolute inset-0 bg-background/60" />

      {/* Content */}
      <div className="relative z-10 p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${coach.gradientVivid} flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden`}>
            <img src={(coach as any).avatar} alt={coach.name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            {locked && (
              <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-display font-black text-foreground">{coach.name}</span>
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border", coach.badgeColor)}>
                {coach.badge}
              </span>
            </div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">{coach.title}</div>
            <p className="text-xs text-muted-foreground leading-relaxed">{coach.description}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {locked ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
              <Crown className="w-3 h-3" />
              <span>Disponibil cu Pro</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Digital Human AI · Desblocat</span>
            </div>
          )}
          <ChevronRight className={cn("w-3.5 h-3.5 ml-auto", locked ? "text-amber-400" : "text-muted-foreground")} />
        </div>
      </div>
    </motion.button>
  );
}

// ─── Regular Coach Card ───────────────────────────────────────────────────────
function CoachCard({ coach, onSelect }: { coach: Coach; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "text-left w-full rounded-2xl border p-4 transition-all duration-200 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98]",
        coach.bg, coach.border, "hover:shadow-lg"
      )}
      data-testid={`coach-card-${coach.id}`}
    >
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${coach.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity pointer-events-none`} />
      <div className="flex items-start gap-3 relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${coach.gradientVivid} flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden`}>
          <img src={(coach as any).avatar} alt={coach.name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-display font-bold text-foreground text-sm">{coach.title}</span>
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", coach.badgeColor)}>{coach.badge}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{coach.description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-1" />
      </div>
      <div className="mt-2.5 flex items-center gap-2 relative z-10">
        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${coach.gradientVivid} flex items-center justify-center text-xs flex-shrink-0 overflow-hidden`}>
          <img src={(coach as any).avatar} alt={coach.name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{coach.name} · {coach.specialty}</span>
      </div>
    </button>
  );
}

// ─── Coach Selection Screen ───────────────────────────────────────────────────
function CoachSelection({
  onSelect,
  onUpgrade,
}: {
  onSelect: (coach: Coach) => void;
  onUpgrade: (coach: Coach) => void;
}) {
  const isPro = useIsPro();
  const proCoaches = COACHES.filter(c => c.isPro);
  const freeCoaches = COACHES.filter(c => !c.isPro);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden px-4 pt-10 pb-6 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-4">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">10 AI Coaches · 2 Digital Human</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="text-3xl font-display font-black text-foreground tracking-tight mb-2">
          Alege-ți <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Antrenorul AI</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-muted-foreground text-sm max-w-xs mx-auto">
          Fiecare antrenor are personalitate unică. Poți schimba oricând.
        </motion.p>
      </div>

      <div className="px-4 max-w-2xl mx-auto space-y-6">
        {/* Digital Human Coaches */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Digital Human Trainers · Pro</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {proCoaches.map((coach, i) => (
              <motion.div key={coach.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <DigitalHumanCard
                  coach={coach}
                  isPro={isPro}
                  onSelect={() => onSelect(coach)}
                  onUpgrade={() => onUpgrade(coach)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Free Coaches */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Antrenori Specializați · Gratuit</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {freeCoaches.map((coach, i) => (
              <motion.div key={coach.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}>
                <CoachCard coach={coach} onSelect={() => onSelect(coach)} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6 px-4">
        Antrenorii AI au acces la profilul tău, antrenamentele și progresul real 🔒
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const GOAL_TO_COACH: Record<string, string> = {
  weight_loss: "fatloss",
  muscle_gain: "muscle",
  endurance: "athlete",
  flexibility: "mobility",
  general_fitness: "beginner",
};

function buildScanGreeting(scanCtx: any, coach: Coach): string {
  const bf = scanCtx.bodyFatPercent != null ? `${scanCtx.bodyFatPercent}%` : null;
  const level = scanCtx.fitnessLevel || null;
  const weak = Array.isArray(scanCtx.weakMuscleGroups) && scanCtx.weakMuscleGroups.length > 0
    ? scanCtx.weakMuscleGroups.slice(0, 2).join(" și ")
    : null;
  const bf30 = scanCtx.predictedBodyFat30Days != null ? `${scanCtx.predictedBodyFat30Days}%` : null;

  let greeting = `Salut! Am văzut body scan-ul tău`;
  if (bf) greeting += ` — ${bf} grăsime corporală`;
  if (level) greeting += `, nivel ${level}`;
  greeting += ".";
  if (weak) greeting += ` Vom lucra în special la ${weak}.`;
  if (bf30) greeting += ` În 30 de zile putem ajunge la ~${bf30}.`;
  greeting += " Cu cât timp ai la dispoziție azi pentru antrenament?";
  return greeting;
}

export default function AiCoachPage() {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [upgradeCoach, setUpgradeCoach] = useState<Coach | null>(null);
  const [scanGreeting, setScanGreeting] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("fitforge_scan_context");
      if (!raw) return;
      const scanCtx = JSON.parse(raw);
      sessionStorage.removeItem("fitforge_scan_context");

      const goalType = scanCtx.goalType || "general_fitness";
      const coachId = GOAL_TO_COACH[goalType] || "beginner";
      const coach = COACHES.find(c => c.id === coachId) || COACHES.find(c => c.id === "beginner")!;

      const greeting = buildScanGreeting(scanCtx, coach);
      setScanGreeting(greeting);
      setSelectedCoach(coach);
    } catch {}
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {!selectedCoach ? (
          <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
            <CoachSelection
              onSelect={(c) => { setScanGreeting(null); setSelectedCoach(c); }}
              onUpgrade={setUpgradeCoach}
            />
          </motion.div>
        ) : (
          <motion.div key={selectedCoach.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <CoachChat
              coach={selectedCoach}
              onBack={() => { setSelectedCoach(null); setScanGreeting(null); }}
              scanGreeting={scanGreeting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {upgradeCoach && (
          <ProUpgradeModal
            coach={upgradeCoach}
            onClose={() => setUpgradeCoach(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
