import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Send, Settings, Volume2, VolumeX, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };
type VoiceType = "female" | "male" | "neutral" | "deep" | "warm";
type LangCode = "en" | "ro" | "es" | "fr" | "de" | "it" | "pt" | "zh" | "ja" | "ru";

interface CoachContext {
  streak: number;
  workoutCompleted: boolean;
  challengeProgress: number;
  battleStatus: string;
}

const VOICE_OPTIONS: { value: VoiceType; label: string; emoji: string }[] = [
  { value: "female", label: "Female", emoji: "👩" },
  { value: "male", label: "Male", emoji: "👨" },
  { value: "neutral", label: "Neutral", emoji: "🧑" },
  { value: "warm", label: "Warm", emoji: "☀️" },
  { value: "deep", label: "Deep", emoji: "🎙️" },
];

const LANG_OPTIONS: { value: LangCode; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "ro", label: "Română", flag: "🇷🇴" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "pt", label: "Português", flag: "🇵🇹" },
  { value: "zh", label: "中文", flag: "🇨🇳" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
  { value: "ru", label: "Русский", flag: "🇷🇺" },
];

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const SPEECH_LANG_MAP: Record<LangCode, string> = {
  en: "en-US", ro: "ro-RO", es: "es-ES", fr: "fr-FR",
  de: "de-DE", it: "it-IT", pt: "pt-PT", zh: "zh-CN", ja: "ja-JP", ru: "ru-RU",
};

async function loadContext(): Promise<CoachContext> {
  try {
    const res = await fetch("/api/today-plan", { credentials: "include" });
    if (!res.ok) return { streak: 0, workoutCompleted: false, challengeProgress: 0, battleStatus: "none" };
    const d = await res.json();
    const pct = d.challenge?.target > 0 ? Math.round((d.challenge.progress / d.challenge.target) * 100) : 0;
    let battleStatus = "none";
    if (d.battle) {
      const lead = d.battle.user - d.battle.opponent;
      battleStatus = lead > 0 ? `winning by ${lead} reps vs ${d.battle.opponentName}`
        : lead < 0 ? `losing by ${Math.abs(lead)} reps vs ${d.battle.opponentName}`
        : `tied with ${d.battle.opponentName}`;
    }
    return { streak: d.streak ?? 0, workoutCompleted: false, challengeProgress: pct, battleStatus };
  } catch {
    return { streak: 0, workoutCompleted: false, challengeProgress: 0, battleStatus: "none" };
  }
}

function getWelcome(ctx: CoachContext | null, lang: LangCode): string {
  const msgs: Record<LangCode, (ctx: CoachContext) => string> = {
    en: (c) => c.streak > 0 ? `${c.streak}-day streak! 🔥 I'm Alex. What do you need today?` : "Hey! I'm Alex, your AI coach 💪 Ask me anything or tap the mic 🎤",
    ro: (c) => c.streak > 0 ? `${c.streak} zile consecutiv! 🔥 Sunt Alex. Cu ce te ajut azi?` : "Salut! Sunt Alex, antrenorul tău AI 💪 Întreabă-mă orice sau apasă microfon 🎤",
    es: (_c) => "¡Hola! Soy Alex, tu entrenador AI 💪 ¿En qué te puedo ayudar?",
    fr: (_c) => "Salut! Je suis Alex, ton coach AI 💪 Dis-moi ce dont tu as besoin!",
    de: (_c) => "Hey! Ich bin Alex, dein KI-Coach 💪 Frag mich alles!",
    it: (_c) => "Ciao! Sono Alex, il tuo coach AI 💪 Come posso aiutarti?",
    pt: (_c) => "Olá! Sou Alex, seu coach AI 💪 Como posso ajudá-lo?",
    zh: (_c) => "你好！我是Alex，你的AI教练 💪 有什么需要帮忙的吗？",
    ja: (_c) => "こんにちは！AIコーチのAlexです 💪 何でも聞いてください！",
    ru: (_c) => "Привет! Я Алекс, твой ИИ-тренер 💪 Чем могу помочь?",
  };
  return ctx ? (msgs[lang]?.(ctx) ?? msgs.en(ctx)) : "Hey! I'm Alex, your AI coach 💪";
}

export function FloatingAIButton() {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [voice, setVoice] = useState<VoiceType>(() => (localStorage.getItem("coach_voice") as VoiceType) || "female");
  const [lang, setLang] = useState<LangCode>(() => (localStorage.getItem("coach_lang") as LangCode) || "en");
  const [context, setContext] = useState<CoachContext | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextFetched = useRef(false);

  useEffect(() => {
    if (open && !contextFetched.current) {
      contextFetched.current = true;
      loadContext().then(ctx => {
        setContext(ctx);
        setMessages([{ role: "assistant", content: getWelcome(ctx, lang) }]);
      });
    }
  }, [open, lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const speakWithOpenAI = useCallback(async (text: string) => {
    if (!voiceEnabled || !text.trim()) return;
    stopAudio();
    try {
      setSpeaking(true);
      const res = await fetch("/api/tts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 400), voice, language: lang }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; };
      audio.onerror = () => { setSpeaking(false); audioRef.current = null; };
      await audio.play();
    } catch {
      setSpeaking(false);
    }
  }, [voiceEnabled, voice, lang, stopAudio]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: "user", content: text.trim() }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          language: lang,
          context: context ?? { streak: 0, workoutCompleted: false, challengeProgress: 0, battleStatus: "none" },
        }),
      });
      const data = await res.json();
      const reply = data.reply || "Let's get to work!";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      speakWithOpenAI(reply);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue. Try again!" }]);
    } finally {
      setLoading(false);
    }
  }, [loading, context, lang, speakWithOpenAI]);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) return;
    recognitionRef.current?.stop();
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = SPEECH_LANG_MAP[lang] ?? "en-US";
    recognitionRef.current = recognition;
    setListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      setListening(false);
      if (transcript.trim()) sendMessage(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  }, [lang, sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setShowSettings(false);
    stopListening();
    stopAudio();
  }, [stopListening, stopAudio]);

  const setVoicePersist = (v: VoiceType) => {
    setVoice(v);
    localStorage.setItem("coach_voice", v);
  };
  const setLangPersist = (l: LangCode) => {
    setLang(l);
    localStorage.setItem("coach_lang", l);
  };

  const currentLang = LANG_OPTIONS.find(l => l.value === lang);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        data-testid="button-floating-ai-coach"
        whileTap={{ scale: 0.92 }}
        onClick={() => open ? handleClose() : setOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50",
          "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200",
          open ? "bg-zinc-700 shadow-zinc-900/50" : "bg-green-500 hover:bg-green-400 shadow-green-500/40"
        )}
        aria-label="AI Coach"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6 text-white" />
            </motion.span>
          ) : (
            <motion.span key="mic" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Mic className="w-6 h-6 text-black" />
            </motion.span>
          )}
        </AnimatePresence>
        {speaking && !open && (
          <span className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-60" />
        )}
      </motion.button>

      {/* Chat Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-36 right-4 md:bottom-24 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm"
          >
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: showSettings ? "600px" : "460px", transition: "max-height 0.2s ease" }}>

              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 text-sm">🤖</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white leading-none">Alex — AI Coach</p>
                  <p className={cn("text-[10px] font-medium mt-0.5",
                    listening ? "text-red-400" : speaking ? "text-green-400" : loading ? "text-yellow-400" : "text-zinc-500"
                  )}>
                    {listening ? "🔴 Listening..." : speaking ? "🔊 Speaking..." : loading ? "Thinking..." : `Online · ${currentLang?.flag} ${currentLang?.label}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setVoiceEnabled(v => !v)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all"
                    title={voiceEnabled ? "Mute voice" : "Enable voice"}
                  >
                    {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setShowSettings(s => !s)}
                    className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                      showSettings ? "bg-green-500/20 text-green-400" : "text-zinc-500 hover:text-white hover:bg-zinc-700"
                    )}
                    title="Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-b border-zinc-800"
                  >
                    <div className="px-4 py-3 space-y-3 bg-zinc-800/40 overflow-y-auto" style={{ maxHeight: "260px" }}>
                      {/* Voice selector */}
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Voice</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {VOICE_OPTIONS.map(v => (
                            <button
                              key={v.value}
                              onClick={() => setVoicePersist(v.value)}
                              className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all",
                                voice === v.value
                                  ? "bg-green-500 text-black"
                                  : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-white"
                              )}
                            >
                              <span>{v.emoji}</span> {v.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Language selector */}
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Limbă / Language
                        </p>
                        <div className="grid grid-cols-5 gap-1">
                          {LANG_OPTIONS.map(l => (
                            <button
                              key={l.value}
                              onClick={() => setLangPersist(l.value)}
                              title={l.label}
                              className={cn(
                                "flex flex-col items-center py-1.5 px-1 rounded-lg text-[10px] font-medium transition-all border",
                                lang === l.value
                                  ? "bg-green-500/20 border-green-500 text-green-400"
                                  : "bg-zinc-700 border-transparent text-zinc-400 hover:bg-zinc-600 hover:text-white"
                              )}
                            >
                              <span className="text-lg leading-none">{l.flag}</span>
                              <span className="mt-0.5 text-[9px] truncate w-full text-center leading-tight">{l.label.slice(0, 4)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Context bar */}
              {context && (context.challengeProgress > 0 || context.battleStatus !== "none" || context.streak > 0) && (
                <div className="px-4 py-1.5 bg-zinc-800/50 border-b border-zinc-800 flex items-center gap-3 text-[10px] text-zinc-500 font-medium">
                  {context.streak > 0 && <span>🔥 <span className="text-orange-400 font-bold">{context.streak}d</span></span>}
                  {context.challengeProgress > 0 && <span>⚡ <span className="text-yellow-400 font-bold">{context.challengeProgress}%</span></span>}
                  {context.battleStatus !== "none" && (
                    <span>🥊 <span className={cn("font-bold", context.battleStatus.startsWith("winning") ? "text-green-400" : "text-red-400")}>
                      {context.battleStatus.startsWith("winning") ? "Winning" : context.battleStatus.startsWith("losing") ? "Losing" : "Tied"}
                    </span></span>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: "180px" }}>
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">🤖</div>
                    )}
                    <div className={cn(
                      "px-3 py-2 rounded-2xl text-sm leading-relaxed max-w-[80%]",
                      msg.role === "user"
                        ? "bg-zinc-700 text-white rounded-tr-sm"
                        : "bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-tl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs flex-shrink-0">🤖</div>
                    <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-zinc-800 border border-zinc-700">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-zinc-800 flex gap-2 items-center">
                <button
                  data-testid="button-voice-mic"
                  onClick={listening ? stopListening : startListening}
                  disabled={loading || speaking}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                    listening ? "bg-red-500 text-white animate-pulse" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 disabled:opacity-40"
                  )}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  data-testid="input-coach-message"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                  placeholder={listening ? "Listening..." : speaking ? "Speaking..." : "Ask your coach..."}
                  disabled={listening || loading}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-500/50 disabled:opacity-50 transition-colors"
                />

                <button
                  data-testid="button-send-coach-message"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading || listening}
                  className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                >
                  <Send className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>

            {/* Listening pill */}
            <AnimatePresence>
              {listening && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Listening... tap mic to stop
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
