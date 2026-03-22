import { useState } from "react";
import { usePWA } from "@/hooks/use-pwa";
import { X, Smartphone, Share, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PWAInstallBanner() {
  const { canInstall, install, showIOSInstructions, isAndroid, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("pwa_banner_dismissed") === "1";
  });
  const [iosExpanded, setIosExpanded] = useState(false);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa_banner_dismissed", "1");
  };

  const handleInstall = async () => {
    const ok = await install();
    if (ok) dismiss();
  };

  if (isInstalled || dismissed) return null;
  if (!canInstall && !showIOSInstructions) return null;

  return (
    <div className="mx-4 mb-3">
      {canInstall && (
        <div className={cn(
          "relative flex items-center gap-3 p-4 rounded-2xl border",
          "bg-gradient-to-r from-primary/20 to-primary/5 border-primary/30"
        )}>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-primary">Instalează FitForge AI</p>
            <p className="text-xs text-muted-foreground">
              {isAndroid ? "Adaugă pe ecranul principal Android" : "Instalează ca aplicație nativă"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-testid="button-pwa-install"
              size="sm"
              onClick={handleInstall}
              className="bg-primary text-black font-semibold text-xs h-8 px-3 hover:bg-primary/90"
            >
              <ArrowDown className="w-3 h-3 mr-1" /> Instalează
            </Button>
            <button
              data-testid="button-pwa-dismiss"
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showIOSInstructions && !canInstall && (
        <div className={cn(
          "relative flex flex-col gap-2 p-4 rounded-2xl border",
          "bg-gradient-to-r from-blue-500/20 to-blue-500/5 border-blue-500/30"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl"> </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-blue-400">Instalează pe iPhone/iPad</p>
              <p className="text-xs text-muted-foreground">Adaugă FitForge AI pe ecranul principal</p>
            </div>
            <div className="flex gap-2">
              <button
                data-testid="button-ios-expand"
                onClick={() => setIosExpanded(p => !p)}
                className="text-blue-400 text-xs font-medium underline"
              >
                {iosExpanded ? "Ascunde" : "Cum?"}
              </button>
              <button onClick={dismiss} className="text-muted-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {iosExpanded && (
            <div className="space-y-2 mt-1 pl-1">
              {[
                { step: "1", text: "Apasă butonul", icon: <Share className="w-4 h-4 text-blue-400 inline mx-1" />, suffix: "din bara Safari" },
                { step: "2", text: 'Derulează și apasă "Adaugă la ecranul principal"', icon: null, suffix: "" },
                { step: "3", text: 'Apasă "Adaugă" — gata! 🎉', icon: null, suffix: "" },
              ].map(({ step, text, icon, suffix }) => (
                <div key={step} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{step}</span>
                  <span>{text}{icon}{suffix}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
