import { useState } from "react";
import { Link } from "wouter";

const CONTENT = {
  ro: {
    title: "Politica de Confidențialitate",
    updated: "Ultima actualizare: Martie 2025 · GDPR Compliant",
    intro: "FitForge AI respectă confidențialitatea dumneavoastră. Această politică explică ce date colectăm, cum le folosim și drepturile dumneavoastră conform Regulamentului General privind Protecția Datelor (GDPR).",
    sections: [
      {
        title: "1. Operatorul de Date",
        content: `Operatorul de date este FitForge AI, operând platforma fitforge-ai.com.

Contact DPO: privacy@fitforge-ai.com
Răspundem la solicitări în maximum 30 de zile, conform GDPR.`,
      },
      {
        title: "2. Date pe care le Colectăm",
        content: `Date furnizate de dumneavoastră:
• Informații de cont: nume, adresă email, vârstă, gen
• Date fitness: greutate, înălțime, obiective, măsurători corporale
• Fotografii de progres (opțional, stocate securizat)
• Conversații cu AI Coach (anonimizate după 90 zile)
• Loguri de nutriție și antrenamente

Date colectate automat:
• Date de utilizare: pagini vizitate, funcționalități folosite
• Date tehnice: adresă IP, tip browser, sistem operare
• Cookie-uri esențiale pentru funcționarea platformei

Nu colectăm date sensibile (sănătate medicală, date financiare complete).`,
      },
      {
        title: "3. Scopul și Baza Legală",
        content: `Folosim datele dumneavoastră pentru:

• Furnizarea Serviciului (bază legală: executarea contractului)
• Personalizarea recomandărilor AI (bază legală: interesul legitim)
• Comunicări privind contul și abonamentul (bază legală: executarea contractului)
• Îmbunătățirea platformei prin analiză anonimizată (bază legală: interesul legitim)
• Marketing cu acordul dumneavoastră explicit (bază legală: consimțământ)

Nu vindem niciodată datele dumneavoastră terților.`,
      },
      {
        title: "4. Partajarea Datelor",
        content: `Partajăm date limitate cu:

• Stripe — procesator de plăți (date de facturare)
• OpenAI — procesare AI Coach (conversații anonimizate, fără date personale identificabile)
• Servicii de hosting (date tehnice pentru funcționarea platformei)

Toți partenerii sunt conformi GDPR și nu folosesc datele dumneavoastră în alte scopuri. Nu partajăm date cu terți în scopuri publicitare.`,
      },
      {
        title: "5. Retenția Datelor",
        content: `Păstrăm datele dumneavoastră atât timp cât contul este activ, plus:

• 90 de zile după ștergerea contului (backup de securitate)
• Date de facturare: 10 ani (obligație legală fiscală)
• Conversații AI: anonimizate după 90 de zile, șterse după 1 an

La cerere, putem șterge datele mai devreme, cu excepția celor necesare din motive legale.`,
      },
      {
        title: "6. Drepturile Dumneavoastră (GDPR)",
        content: `Conform GDPR, aveți dreptul la:

• Acces — să solicitați o copie a datelor dumneavoastră
• Rectificare — să corectați datele incorecte
• Ștergere — „dreptul de a fi uitat"
• Restricționare — să limitați procesarea datelor
• Portabilitate — să primiți datele într-un format structurat
• Opoziție — să vă opuneți procesării bazate pe interes legitim
• Retragerea consimțământului — în orice moment

Pentru a exercita aceste drepturi, contactați: privacy@fitforge-ai.com
Răspundem în 30 de zile. Aveți dreptul să depuneți plângere la ANSPDCP (autoritatea română de protecție a datelor).`,
      },
      {
        title: "7. Securitatea Datelor",
        content: `Protejăm datele dumneavoastră prin:

• Criptare în tranzit (HTTPS/TLS 1.3)
• Criptare la stocare pentru date sensibile
• Acces restricționat bazat pe roluri
• Audituri de securitate periodice
• Backup-uri zilnice securizate

În caz de breach de securitate care vă afectează datele, vă vom notifica în 72 de ore conform GDPR.`,
      },
      {
        title: "8. Cookie-uri",
        content: `Folosim cookie-uri esențiale pentru funcționarea platformei (autentificare, preferințe). Nu folosim cookie-uri de tracking publicitar.

Cookie-uri utilizate:
• session_id — autentificare (esențial)
• fitforge_theme — preferință temă dark/light (funcțional)
• fitforge_lang — preferință limbă (funcțional)

Puteți gestiona cookie-urile din setările browser-ului, dar dezactivarea celor esențiale poate afecta funcționarea platformei.`,
      },
      {
        title: "9. Transferuri Internaționale",
        content: `Datele dumneavoastră pot fi procesate în afara UE de către partenerii noștri (ex: OpenAI în SUA). Aceste transferuri sunt protejate prin Clauze Contractuale Standard aprobate de Comisia Europeană, garantând un nivel de protecție echivalent GDPR.`,
      },
      {
        title: "10. Modificări ale Politicii",
        content: `Putem actualiza această Politică periodic. Vă vom notifica prin email sau prin platformă cu minimum 30 de zile înainte de modificările semnificative.

Data ultimei modificări este indicată la începutul documentului.`,
      },
      {
        title: "11. Contact",
        content: `Pentru orice întrebări privind confidențialitatea:

Email: privacy@fitforge-ai.com
Website: fitforge-ai.com/privacy

Autoritatea de supraveghere din România: ANSPDCP (www.dataprotection.ro)`,
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: March 2025 · GDPR Compliant",
    intro: "FitForge AI respects your privacy. This policy explains what data we collect, how we use it, and your rights under the General Data Protection Regulation (GDPR).",
    sections: [
      {
        title: "1. Data Controller",
        content: `The data controller is FitForge AI, operating the fitforge-ai.com platform.

DPO Contact: privacy@fitforge-ai.com
We respond to requests within a maximum of 30 days, in accordance with GDPR.`,
      },
      {
        title: "2. Data We Collect",
        content: `Data you provide:
• Account information: name, email address, age, gender
• Fitness data: weight, height, goals, body measurements
• Progress photos (optional, securely stored)
• AI Coach conversations (anonymized after 90 days)
• Nutrition and workout logs

Automatically collected data:
• Usage data: pages visited, features used
• Technical data: IP address, browser type, operating system
• Essential cookies for platform functionality

We do not collect sensitive data (medical health data, complete financial data).`,
      },
      {
        title: "3. Purpose and Legal Basis",
        content: `We use your data to:

• Provide the Service (legal basis: contract performance)
• Personalize AI recommendations (legal basis: legitimate interest)
• Account and subscription communications (legal basis: contract performance)
• Platform improvement through anonymized analysis (legal basis: legitimate interest)
• Marketing with your explicit consent (legal basis: consent)

We never sell your data to third parties.`,
      },
      {
        title: "4. Data Sharing",
        content: `We share limited data with:

• Stripe — payment processor (billing data)
• OpenAI — AI Coach processing (anonymized conversations, no personally identifiable data)
• Hosting services (technical data for platform operation)

All partners are GDPR compliant and do not use your data for other purposes. We do not share data with third parties for advertising purposes.`,
      },
      {
        title: "5. Data Retention",
        content: `We retain your data as long as the account is active, plus:

• 90 days after account deletion (security backup)
• Billing data: 10 years (legal fiscal obligation)
• AI conversations: anonymized after 90 days, deleted after 1 year

Upon request, we can delete data sooner, except for legally required data.`,
      },
      {
        title: "6. Your Rights (GDPR)",
        content: `Under GDPR, you have the right to:

• Access — request a copy of your data
• Rectification — correct inaccurate data
• Erasure — "the right to be forgotten"
• Restriction — limit data processing
• Portability — receive data in a structured format
• Objection — object to processing based on legitimate interest
• Withdrawal of consent — at any time

To exercise these rights, contact: privacy@fitforge-ai.com
We respond within 30 days. You have the right to lodge a complaint with your national data protection authority.`,
      },
      {
        title: "7. Data Security",
        content: `We protect your data through:

• Encryption in transit (HTTPS/TLS 1.3)
• Encryption at rest for sensitive data
• Role-based restricted access
• Periodic security audits
• Daily secure backups

In case of a security breach affecting your data, we will notify you within 72 hours per GDPR.`,
      },
      {
        title: "8. Cookies",
        content: `We use essential cookies for platform functionality (authentication, preferences). We do not use advertising tracking cookies.

Cookies used:
• session_id — authentication (essential)
• fitforge_theme — dark/light theme preference (functional)
• fitforge_lang — language preference (functional)

You can manage cookies in your browser settings, but disabling essential ones may affect platform functionality.`,
      },
      {
        title: "9. International Transfers",
        content: `Your data may be processed outside the EU by our partners (e.g., OpenAI in the USA). These transfers are protected by Standard Contractual Clauses approved by the European Commission, guaranteeing a level of protection equivalent to GDPR.`,
      },
      {
        title: "10. Policy Changes",
        content: `We may update this Policy periodically. We will notify you by email or through the platform with at least 30 days notice before significant changes.

The date of the last modification is indicated at the beginning of the document.`,
      },
      {
        title: "11. Contact",
        content: `For any privacy questions:

Email: privacy@fitforge-ai.com
Website: fitforge-ai.com/privacy

EU supervisory authority: your national data protection authority (e.g., ICO for UK, CNIL for France, BfDI for Germany).`,
      },
    ],
  },
};

export default function PrivacyPage() {
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

        <div className="mb-12 pb-8 border-b border-border">
          <h1 className="text-4xl font-display font-black mb-3">{C.title}</h1>
          <p className="text-muted-foreground text-sm mb-4">{C.updated}</p>
          <p className="text-sm text-muted-foreground leading-relaxed bg-primary/5 border border-primary/20 rounded-xl p-4">{C.intro}</p>
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
          <Link href="/refund" className="hover:text-primary transition-colors">Politica de Rambursare</Link>
          <Link href="/" className="hover:text-primary transition-colors">FitForge AI</Link>
        </div>

      </div>
    </div>
  );
}
