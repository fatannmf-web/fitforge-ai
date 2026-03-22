import { useLang } from "@/i18n/useLang";
import { useState } from "react";
import { Dumbbell, Bot, Camera, TrendingUp, ArrowRight, Zap } from "lucide-react";

const L10N = {
  ro: {
    badge: "AI Fitness Personal",
    h1: "Antrenorul tău AI,\nmereu cu tine",
    sub: "Vorbești cu el, îți scanează mâncarea și îți planifică antrenamentele. Gratuit.",
    cta: "Începe Gratuit",
    demo: "Demo",
    f1t: "AI Coach Personal",
    f1d: "Vorbești în română, el răspunde instant. Ca un antrenor real — 24/7.",
    f2t: "Scanează Mâncarea",
    f2d: "Fotografiezi sau scanezi barcodul. Caloriile apar instant, fără calcule.",
    f3t: "Vezi Progresul",
    f3d: "Grafice, streak-uri și achievements care te fac să revii zilnic.",
    footer: "Fără card bancar • Instalezi pe telefon",
  },
  en: {
    badge: "Personal AI Fitness",
    h1: "Your AI trainer,\nalways with you",
    sub: "Talk to it, scan your food and plan your workouts. Free.",
    cta: "Start Free",
    demo: "Demo",
    f1t: "Personal AI Coach",
    f1d: "Talk naturally, get instant answers. Like a real trainer — 24/7.",
    f2t: "Scan Your Food",
    f2d: "Photograph or scan a barcode. Calories appear instantly, no math.",
    f3t: "See Your Progress",
    f3d: "Charts, streaks and achievements that bring you back every day.",
    footer: "No credit card • Install on your phone",
  },
  es: {
    badge: "Fitness IA Personal",
    h1: "Tu entrenador IA,\nsiempre contigo",
    sub: "Habla con él, escanea tu comida y planifica tus entrenamientos. Gratis.",
    cta: "Empieza Gratis",
    demo: "Demo",
    f1t: "Coach IA Personal",
    f1d: "Habla naturalmente, obtén respuestas al instante. Como un entrenador real — 24/7.",
    f2t: "Escanea Tu Comida",
    f2d: "Fotografía o escanea el código. Las calorías aparecen al instante.",
    f3t: "Ve Tu Progreso",
    f3d: "Gráficos, rachas y logros que te hacen volver cada día.",
    footer: "Sin tarjeta • Instala en tu teléfono",
  },
  pt: {
    badge: "Fitness IA Pessoal",
    h1: "Seu treinador IA,\nsempre com você",
    sub: "Fale com ele, escaneie sua comida e planeje seus treinos. Grátis.",
    cta: "Começar Grátis",
    demo: "Demo",
    f1t: "Coach IA Pessoal",
    f1d: "Fale naturalmente, obtenha respostas instantâneas. Como um treinador real — 24/7.",
    f2t: "Escaneie Sua Comida",
    f2d: "Fotografe ou escaneie o código. As calorias aparecem instantaneamente.",
    f3t: "Veja Seu Progresso",
    f3d: "Gráficos, sequências e conquistas que te fazem voltar todo dia.",
    footer: "Sem cartão • Instale no seu celular",
  },
  de: {
    badge: "Persönliches KI-Fitness",
    h1: "Dein KI-Trainer,\nimmer bei dir",
    sub: "Sprich mit ihm, scann dein Essen und plane deine Trainings. Kostenlos.",
    cta: "Kostenlos starten",
    demo: "Demo",
    f1t: "Persönlicher KI-Coach",
    f1d: "Sprich natürlich, erhalte sofortige Antworten. Wie ein echte Trainer — 24/7.",
    f2t: "Essen scannen",
    f2d: "Fotografiere oder scanne den Barcode. Kalorien erscheinen sofort.",
    f3t: "Fortschritt sehen",
    f3d: "Charts, Serien und Erfolge die dich täglich zurückbringen.",
    footer: "Keine Kreditkarte • Auf dem Handy installieren",
  },
};

export default function LandingPage() {
  const { lang } = useLang();
  const [devLoading, setDevLoading] = useState(false);
  const t = L10N[lang as keyof typeof L10N] || L10N.en;

  const handleLogin = () => {
    const inIframe = window !== window.top;
    if (inIframe) window.open("/api/login", "_blank");
    else window.location.href = "/api/login";
  };

  const handleDevLogin = async () => {
    setDevLoading(true);
    try {
      const res = await fetch("/api/dev-login", { method: "POST", credentials: "include" });
      if (res.ok) window.location.href = "/today";
    } catch { setDevLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-black" />
          </div>
          <span className="font-display font-black text-lg">
            FitForge<span className="text-primary">.ai</span>
          </span>
        </div>
        <button
          onClick={handleLogin}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Log in
        </button>
      </nav>

      {/* HERO */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-8">
          <Zap className="w-3 h-3" /> {t.badge}
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black leading-[1.08] tracking-tight mb-6 whitespace-pre-line">
          {t.h1}
        </h1>

        <p className="text-lg text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
          {t.sub}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={handleLogin}
            className="bg-primary text-black font-black text-base px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2 group"
          >
            {t.cta}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={handleDevLogin}
            disabled={devLoading}
            data-testid="button-demo-access"
            className="border border-border font-semibold text-sm px-6 py-3.5 rounded-xl hover:bg-secondary/50 transition-all text-muted-foreground"
          >
            {devLoading ? "..." : t.demo}
          </button>
        </div>

        <p className="text-xs text-muted-foreground/60">{t.footer}</p>
      </main>

      {/* 3 FEATURES */}
      <section className="border-t border-border bg-secondary/20">
        <div className="max-w-3xl mx-auto px-6 py-16 grid sm:grid-cols-3 gap-8">
          {[
            { icon: Bot,        title: t.f1t, desc: t.f1d, color: "#22c55e" },
            { icon: Camera,     title: t.f2t, desc: t.f2d, color: "#3b82f6" },
            { icon: TrendingUp, title: t.f3t, desc: t.f3d, color: "#a855f7" },
          ].map((f, i) => (
            <div key={i} className="text-center">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: `${f.color}15` }}
              >
                <f.icon className="w-6 h-6" style={{ color: f.color }} />
              </div>
              <h3 className="font-display font-bold text-base mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer legal */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2025 FitForge AI. Toate drepturile rezervate.</p>
          <div className="flex gap-6">
            <a href="/terms" className="hover:text-foreground transition-colors">Termeni</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">Confidențialitate</a>
            <a href="/refund" className="hover:text-foreground transition-colors">Rambursări</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
