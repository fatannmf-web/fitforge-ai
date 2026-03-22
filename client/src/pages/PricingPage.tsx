import { useLang } from "@/i18n/useLang";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Zap, Crown, Star, ArrowRight, Sparkles, Lock } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { useSubscription, useCheckout, usePortal } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface Plans {
  free: { name: string; price: number; features: string[] };
  pro: {
    name: string; monthlyPrice: number; yearlyPrice: number;
    currency: string; features: string[];
    monthlyPriceId: string | null; yearlyPriceId: string | null;
  };
}

const FREE_FEATURES = [
  { text: "3 planuri AI / lună", included: true },
  { text: "Urmărire progres de bază", included: true },
  { text: "Body Scan AI (1/lună)", included: true },
  { text: "Check-in zilnic + streak", included: true },
  { text: "Comunitate", included: true },
  { text: "AI Coach nelimitat", included: false },
  { text: "Planuri de antrenament nelimitate", included: false },
  { text: "Body Scan AI avansat", included: false },
  { text: "Nutriție AI avansată", included: false },
];

const PRO_FEATURES = [
  { text: "Tot ce include Free", included: true, highlight: false },
  { text: "Planuri de antrenament nelimitate", included: true, highlight: true },
  { text: "AI Coach 24/7 nelimitat", included: true, highlight: true },
  { text: "Body Scan AI avansat (analize detaliate)", included: true, highlight: true },
  { text: "Analize nutriție avansate", included: true, highlight: true },
  { text: "Export rapoarte PDF", included: true, highlight: false },
  { text: "Suport prioritar", included: true, highlight: false },
];

export default function PricingPage() {
  const { tx } = useLang();
  const [interval, setInterval] = useState<"month" | "year">("month");
  const { toast } = useToast();
  const { data: sub } = useSubscription();
  const checkout = useCheckout();
  const portal = usePortal();

  const { data: plans, isLoading } = useQuery<Plans>({
    queryKey: ["/api/stripe/plans"],
  });

  const isPro = sub?.plan === "pro";
  const priceId = interval === "month" ? plans?.pro.monthlyPriceId : plans?.pro.yearlyPriceId;
  const price = interval === "month" ? plans?.pro.monthlyPrice ?? 9.99 : plans?.pro.yearlyPrice ?? 79.99;
  const savings = Math.round(100 - ((plans?.pro.yearlyPrice ?? 79.99) / ((plans?.pro.monthlyPrice ?? 9.99) * 12)) * 100);

  const handleUpgrade = () => {
    if (!priceId) {
      toast({ title: "Se configurează Stripe...", description: "Încearcă din nou în câteva secunde." });
      return;
    }
    checkout.mutate(priceId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold">
            <Sparkles className="w-4 h-4" /> {tx.pricing.title}
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            Transformarea ta,<br />
            <span className="text-primary">fără limite</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Începe gratuit. Upgradeazi oricând pentru a debloca tot potențialul AI-ului tău personal de fitness.
          </p>
        </div>

        {/* Current plan badge */}
        {isPro && (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-primary" />
              <div>
                <p className="font-bold text-sm"{tx.pricing.currentPro}/p>
                <p className="text-xs text-muted-foreground">Ai acces la toate funcțiile premium.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => portal.mutate()} isLoading={portal.isPending} data-testid="button-manage-subscription">
              Gestionează abonamentul
            </Button>
          </div>
        )}

        {/* Interval toggle */}
        {!isPro && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setInterval("month")}
              data-testid="button-monthly"
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold transition-colors",
                interval === "month" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Lunar
            </button>
            <button
              onClick={() => setInterval("year")}
              data-testid="button-yearly"
              className={cn(
                "relative px-5 py-2.5 rounded-xl text-sm font-bold transition-colors",
                interval === "year" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Anual
              <span className="absolute -top-2.5 -right-2 bg-accent text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                -{savings}%
              </span>
            </button>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* FREE */}
          <Card className={cn("p-6 relative border-2", !isPro && sub?.plan !== "pro" ? "border-border" : "border-border/50 opacity-75")}>
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Free</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-bold">0€</span>
                <span className="text-muted-foreground text-sm">/lună</span>
              </div>
              <p className="text-muted-foreground text-sm mt-1">Perfect pentru a începe călătoria ta</p>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  {f.included ? (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={f.included ? "" : "text-muted-foreground/50"}>{f.text}</span>
                </li>
              ))}
            </ul>

            <Link href="/dashboard">
              <button
                className="w-full py-3 rounded-xl border-2 border-border text-sm font-bold hover:bg-muted/50 transition-colors"
                data-testid="button-continue-free"
              >
                Continuă cu Free
              </button>
            </Link>
          </Card>

          {/* PRO */}
          <Card className="p-6 relative border-2 border-primary bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
            {/* Popular badge */}
            <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-b-xl">
              ⭐ CEL MAI POPULAR
            </div>

            <div className="mb-6 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-primary uppercase tracking-wider">Pro</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-bold">{price.toFixed(2)}€</span>
                <span className="text-muted-foreground text-sm">/{interval === "month" ? "lună" : "an"}</span>
              </div>
              {interval === "year" && (
                <p className="text-primary text-xs font-bold mt-1">
                  = {(price / 12).toFixed(2)}€/lună · Economisești {(plans?.pro.monthlyPrice ?? 9.99) * 12 - price}€/an
                </p>
              )}
              <p className="text-muted-foreground text-sm mt-1">Accees complet la toată puterea AI</p>
            </div>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Check className={cn("w-4 h-4 shrink-0", f.highlight ? "text-primary" : "text-primary/60")} />
                  <span className={f.highlight ? "font-medium" : ""}>{f.text}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <div className="w-full py-3 rounded-xl bg-primary/10 text-primary text-sm font-bold text-center flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Planul tău activ
              </div>
            ) : (
              <Button
                className="w-full gap-2"
                onClick={handleUpgrade}
                isLoading={checkout.isPending || isLoading}
                data-testid="button-upgrade-pro"
              >
                <Zap className="w-4 h-4" />
                Upgradeazi la Pro
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center mt-3">
              Anulare oricând · Fără obligații
            </p>
          </Card>
        </div>

        {/* FAQ / Testimonials */}
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-display font-bold text-center">Întrebări frecvente</h2>
          {[
            { q: "Pot anula oricând?", a: "Da, poți anula abonamentul Pro în orice moment din setările contului tău. Accesul Pro rămâne activ până la sfârșitul perioadei de facturare." },
            { q: "Ce se întâmplă cu datele mele dacă revin la Free?", a: "Datele tale (antrenamente, măsurători, poze progres) sunt păstrate. Vei putea accesa în continuare istoricul, dar funcțiile Pro vor fi restricționate." },
            { q: "Cum funcționează plata?", a: "Plata se procesează securizat prin Stripe. Acceptăm carduri Visa, Mastercard și American Express." },
            { q: "Există perioadă de probă?", a: "Planul Free îți oferă acces la funcțiile de bază fără limită de timp. Poți testa aplicația înainte de a face upgrade." },
          ].map((item, i) => (
            <Card key={i} className="p-5">
              <p className="font-bold text-sm mb-2">{item.q}</p>
              <p className="text-sm text-muted-foreground">{item.a}</p>
            </Card>
          ))}
        </div>

        {/* Social proof */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-1">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-accent text-accent" />)}
          </div>
          <p className="text-lg font-display font-bold">"FitForge Pro m-a ajutat să slăbesc 12kg în 3 luni!"</p>
          <p className="text-muted-foreground text-sm">— Andreea M., utilizator Pro din Bucuresti</p>
        </div>

        {/* Legal footer */}
        <div className="pt-8 border-t border-border text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Plăți securizate prin Stripe · Anulezi oricând · Garanție 7 zile
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <a href="/terms" className="hover:text-foreground transition-colors">Termeni și Condiții</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-foreground transition-colors">Confidențialitate</a>
            <span>·</span>
            <a href="/refund" className="hover:text-foreground transition-colors">Politica de Rambursare</a>
          </div>
        </div>

      </div>
    </div>
  );
}
