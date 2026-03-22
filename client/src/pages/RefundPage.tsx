import { useState } from "react";
import { Link } from "wouter";

const CONTENT = {
  ro: {
    title: "Politica de Rambursare",
    updated: "Ultima actualizare: Martie 2025",
    sections: [
      {
        title: "Garanție 7 Zile",
        content: `Oferim o garanție de rambursare completă de 7 zile de la prima achiziție a planului Pro. Dacă din orice motiv nu ești mulțumit, îți returnăm integral suma plătită — fără întrebări.

Aceasta este angajamentul nostru față de calitatea Serviciului.`,
      },
      {
        title: "Condiții de Eligibilitate",
        content: `Rambursarea se acordă dacă:
• Solicitarea este făcută în primele 7 zile de la prima achiziție Pro
• Este prima achiziție a planului Pro (nu se aplică la reînnoiri)
• Contactați support@fitforge-ai.com cu subiectul "Rambursare"

Rambursarea NU se acordă pentru:
• Solicitări după expirarea perioadei de 7 zile
• Abonamente reînnoite automat (acestea pot fi anulate înainte de reînnoire)
• Achiziții repetate ale planului Pro
• Abonamente anuale după utilizarea a mai mult de 30 de zile`,
      },
      {
        title: "Cum Solicitați Rambursarea",
        content: `1. Trimiteți un email la support@fitforge-ai.com
2. Subiect: "Rambursare - [adresa email contului]"
3. Menționați motivul (opțional, pentru a ne ajuta să îmbunătățim Serviciul)

Vom procesa cererea în maximum 2 zile lucrătoare și veți primi confirmarea.`,
      },
      {
        title: "Procesarea Rambursării",
        content: `Rambursările sunt procesate prin Stripe, platforma noastră de plăți. Suma va apărea în contul dumneavoastră în 5-10 zile lucrătoare, în funcție de banca emitentă a cardului.

Rambursarea se efectuează pe același card/metodă de plată folosită la achiziție.`,
      },
      {
        title: "Anularea Abonamentului",
        content: `Puteți anula abonamentul oricând din:
• Profil → Setări → Plan & Facturare → Anulează Abonament

La anulare, accesul Pro rămâne activ până la sfârșitul perioadei plătite. Nu se acordă rambursări pro-rata pentru perioada rămasă.

Abonamentul se poate reactiva oricând.`,
      },
      {
        title: "Contact Suport",
        content: `Pentru orice întrebări legate de facturare sau rambursări:

Email: support@fitforge-ai.com
Răspundem în maximum 24 de ore în zilele lucrătoare.`,
      },
    ],
  },
  en: {
    title: "Refund Policy",
    updated: "Last updated: March 2025",
    sections: [
      {
        title: "7-Day Guarantee",
        content: `We offer a full 7-day money-back guarantee from your first Pro plan purchase. If for any reason you're not satisfied, we'll fully refund your payment — no questions asked.

This is our commitment to the quality of our Service.`,
      },
      {
        title: "Eligibility Conditions",
        content: `A refund is granted if:
• The request is made within 7 days of the first Pro purchase
• It is the first purchase of the Pro plan (does not apply to renewals)
• You contact support@fitforge-ai.com with subject "Refund"

Refunds are NOT granted for:
• Requests after the 7-day period expires
• Automatically renewed subscriptions (these can be cancelled before renewal)
• Repeat purchases of the Pro plan
• Annual subscriptions after using more than 30 days`,
      },
      {
        title: "How to Request a Refund",
        content: `1. Send an email to support@fitforge-ai.com
2. Subject: "Refund - [account email address]"
3. Mention the reason (optional, to help us improve the Service)

We will process the request within a maximum of 2 business days and you will receive confirmation.`,
      },
      {
        title: "Refund Processing",
        content: `Refunds are processed through Stripe, our payments platform. The amount will appear in your account within 5-10 business days, depending on your card's issuing bank.

The refund is made to the same card/payment method used for the purchase.`,
      },
      {
        title: "Cancelling Your Subscription",
        content: `You can cancel your subscription at any time from:
• Profile → Settings → Plan & Billing → Cancel Subscription

Upon cancellation, Pro access remains active until the end of the paid period. No pro-rata refunds are provided for the remaining period.

The subscription can be reactivated at any time.`,
      },
      {
        title: "Support Contact",
        content: `For any questions about billing or refunds:

Email: support@fitforge-ai.com
We respond within a maximum of 24 hours on business days.`,
      },
    ],
  },
};

export default function RefundPage() {
  const [lang, setLang] = useState<"ro" | "en">("ro");
  const C = CONTENT[lang];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="text-sm text-primary hover:underline">← FitForge AI</Link>
          <div className="flex gap-2">
            <button onClick={() => setLang("ro")} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${lang === "ro" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"}`}>🇷🇴 RO</button>
            <button onClick={() => setLang("en")} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${lang === "en" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"}`}>🇬🇧 EN</button>
          </div>
        </div>

        {/* Garanție banner */}
        <div className="mb-10 p-5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-4">
          <div className="text-4xl">✅</div>
          <div>
            <p className="font-display font-black text-xl text-foreground">{lang === "ro" ? "Garanție 7 Zile" : "7-Day Guarantee"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === "ro"
                ? "Rambursare completă, fără întrebări, în primele 7 zile."
                : "Full refund, no questions asked, within the first 7 days."}
            </p>
          </div>
        </div>

        <div className="mb-12 pb-8 border-b border-border">
          <h1 className="text-4xl font-display font-black mb-3">{C.title}</h1>
          <p className="text-muted-foreground text-sm">{C.updated}</p>
        </div>

        <div className="space-y-10">
          {C.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg font-display font-bold mb-3 text-foreground">{s.title}</h2>
              {s.content.split("\n\n").map((para, j) => (
                <p key={j} className="text-muted-foreground leading-relaxed mb-3 text-sm whitespace-pre-line">{para}</p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-primary transition-colors">Termeni și Condiții</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-primary transition-colors">FitForge AI</Link>
        </div>

      </div>
    </div>
  );
}
