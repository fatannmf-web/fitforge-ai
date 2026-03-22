import { useState } from "react";
import { Dumbbell, Globe } from "lucide-react";
import { useLang, SUPPORTED_LANGUAGES, type LangCode } from "@/i18n/useLang";

export function LanguageSelectModal({ onSelect }: { onSelect: (code: string) => void }) {
  const { setLang } = useLang();
  const [selected, setSelected] = useState<LangCode | null>(null);

  const SUBTITLES: Record<LangCode, string> = {
    ro: "Selectează limba ta",
    en: "Choose your language",
    es: "Elige tu idioma",
    pt: "Escolha seu idioma",
    de: "Wähle deine Sprache",
  };

  const handleSelect = async (code: LangCode) => {
    setSelected(code);
    await setLang(code);
    setTimeout(() => onSelect(code), 250);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-2xl shadow-primary/30 mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-1">
            FitForge<span className="text-primary">.ai</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Globe className="w-4 h-4" />
            <p className="text-sm font-medium">
              {selected ? SUBTITLES[selected] : "Choose your language"}
            </p>
          </div>
        </div>

        {/* Language Grid — 5 limbi */}
        <div className="grid grid-cols-1 gap-2.5">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              data-testid={`button-lang-${lang.code}`}
              onClick={() => handleSelect(lang.code)}
              className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-150 ${
                selected === lang.code
                  ? "bg-primary/20 border-primary text-primary scale-[0.98]"
                  : "bg-card border-border hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01]"
              }`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div className="flex-1">
                <p className="font-bold text-base">{lang.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{SUBTITLES[lang.code]}</p>
              </div>
              {selected === lang.code && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-black text-xs font-black">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          {SUBTITLES[selected ?? "en"]} — poți schimba oricând din Profil
        </p>
      </div>
    </div>
  );
}
