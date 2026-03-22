import { useState } from "react";
import { Link } from "wouter";

const CONTENT = {
  ro: {
    title: "Termeni și Condiții",
    updated: "Ultima actualizare: Martie 2025",
    sections: [
      {
        title: "1. Acceptarea Termenilor",
        content: `Prin accesarea sau utilizarea platformei FitForge AI, disponibilă la fitforge-ai.com și prin aplicațiile mobile asociate („Serviciul"), confirmați că ați citit, înțeles și acceptat în totalitate acești Termeni și Condiții.

Dacă nu sunteți de acord cu oricare dintre prevederile de mai jos, vă rugăm să nu utilizați Serviciul. Utilizarea continuă a Serviciului după modificarea Termenilor echivalează cu acceptarea modificărilor.`,
      },
      {
        title: "2. Descrierea Serviciului",
        content: `FitForge AI este o platformă digitală de fitness care oferă coaching AI personalizat, tracking antrenamente și nutriție, analiză corporală prin inteligență artificială (Body Scan AI), generator de planuri de antrenament și funcționalități comunitare.

IMPORTANT: FitForge AI este un instrument de suport pentru fitness și nu înlocuiește sfatul medical profesionist, diagnosticul sau tratamentul medical. Consultați întotdeauna un medic sau specialist înainte de a începe orice program de exerciții fizice sau dietă, în special dacă aveți afecțiuni medicale preexistente.`,
      },
      {
        title: "3. Eligibilitate și Conturi",
        content: `Serviciul este destinat persoanelor cu vârsta de minimum 16 ani. Prin crearea unui cont, declarați că îndepliniți această cerință de vârstă.

Sunteți responsabil pentru menținerea confidențialității credențialelor de autentificare și pentru toate activitățile care au loc în contul dumneavoastră. Ne rezervăm dreptul de a suspenda sau închide conturi care încalcă acești Termeni.`,
      },
      {
        title: "4. Abonamente și Plăți",
        content: `FitForge AI oferă un plan gratuit cu funcționalități de bază și un plan Pro cu funcționalități avansate, disponibil prin abonament lunar sau anual.

Plățile sunt procesate securizat prin Stripe. Abonamentele se reînnoiesc automat la finalul perioadei plătite, dacă nu sunt anulate înainte. Prețurile pot fi modificate cu notificare de minimum 30 de zile. TVA-ul se aplică conform legislației din țara dumneavoastră.`,
      },
      {
        title: "5. Politica de Rambursare",
        content: `Oferim o garanție de rambursare de 7 zile de la prima achiziție a planului Pro. Pentru a solicita o rambursare, contactați support@fitforge-ai.com în această perioadă.

Rambursările nu se aplică pentru perioadele de abonament deja utilizate, după expirarea celor 7 zile sau pentru achiziții repetate. Rambursările sunt procesate în 5-10 zile lucrătoare.`,
      },
      {
        title: "6. Conținut și Proprietate Intelectuală",
        content: `Toate materialele disponibile pe FitForge AI — inclusiv texte, grafice, logo-uri, software și conținut generat de AI — sunt proprietatea FitForge AI sau a licențiatorilor săi și sunt protejate de legile drepturilor de autor.

Vă acordăm o licență limitată, neexclusivă, netransferabilă pentru utilizarea personală a Serviciului. Nu aveți dreptul să copiați, distribuiți, modificați sau să vindeți conținutul platformei fără acordul nostru scris.`,
      },
      {
        title: "7. Conținut Generat de Utilizatori",
        content: `Prin publicarea de conținut pe FitForge AI (postări, comentarii, fotografii de progres), ne acordați o licență neexclusivă, gratuită, pentru utilizarea acestui conținut în scopul operării și promovării Serviciului.

Sunteți singurul responsabil pentru conținutul publicat. Este interzis să publicați conținut ilegal, ofensator, înșelător sau care încalcă drepturile terților.`,
      },
      {
        title: "8. Limitarea Răspunderii",
        content: `FitForge AI este furnizat „ca atare", fără garanții de nicio natură. Nu garantăm rezultate specifice de fitness sau pierdere în greutate.

În măsura permisă de lege, FitForge AI nu este responsabil pentru daune indirecte, incidentale sau consecvente rezultate din utilizarea sau imposibilitatea de a utiliza Serviciul. Răspunderea noastră totală nu va depăși suma plătită de dumneavoastră în ultimele 12 luni.`,
      },
      {
        title: "9. Modificări și Reziliere",
        content: `Ne rezervăm dreptul de a modifica, suspenda sau întrerupe Serviciul în orice moment, cu notificare rezonabilă. Puteți rezilia contul oricând din setările profilului sau contactând support@fitforge-ai.com.

La reziliere, dreptul dumneavoastră de a utiliza Serviciul încetează imediat. Datele dumneavoastră vor fi șterse conform Politicii de Confidențialitate.`,
      },
      {
        title: "10. Legea Aplicabilă",
        content: `Acești Termeni sunt guvernați de legislația română și a Uniunii Europene. Orice dispute vor fi soluționate de instanțele competente din România, cu excepția cazului în care legea aplicabilă din țara dumneavoastră prevede altfel.

Pentru utilizatorii din UE, beneficiați de protecțiile oferite de GDPR și de legislația consumatorilor europeni.`,
      },
      {
        title: "11. Contact",
        content: `Pentru întrebări legate de acești Termeni, ne puteți contacta la:

Email: legal@fitforge-ai.com
Website: fitforge-ai.com
Răspundem în maximum 5 zile lucrătoare.`,
      },
    ],
  },
  en: {
    title: "Terms and Conditions",
    updated: "Last updated: March 2025",
    sections: [
      {
        title: "1. Acceptance of Terms",
        content: `By accessing or using the FitForge AI platform, available at fitforge-ai.com and through associated mobile applications ("the Service"), you confirm that you have read, understood, and fully accepted these Terms and Conditions.

If you do not agree with any of the provisions below, please do not use the Service. Continued use of the Service after modification of the Terms constitutes acceptance of the changes.`,
      },
      {
        title: "2. Description of Service",
        content: `FitForge AI is a digital fitness platform that provides personalized AI coaching, workout and nutrition tracking, AI body analysis (Body Scan AI), workout plan generation, and community features.

IMPORTANT: FitForge AI is a fitness support tool and does not replace professional medical advice, diagnosis, or medical treatment. Always consult a doctor or specialist before starting any exercise or diet program, especially if you have pre-existing medical conditions.`,
      },
      {
        title: "3. Eligibility and Accounts",
        content: `The Service is intended for persons aged 16 or older. By creating an account, you declare that you meet this age requirement.

You are responsible for maintaining the confidentiality of your authentication credentials and for all activities that occur in your account. We reserve the right to suspend or close accounts that violate these Terms.`,
      },
      {
        title: "4. Subscriptions and Payments",
        content: `FitForge AI offers a free plan with basic features and a Pro plan with advanced features, available through monthly or annual subscription.

Payments are securely processed through Stripe. Subscriptions automatically renew at the end of the paid period unless cancelled beforehand. Prices may be modified with a minimum of 30 days notice. VAT applies according to the legislation in your country.`,
      },
      {
        title: "5. Refund Policy",
        content: `We offer a 7-day money-back guarantee from the first purchase of the Pro plan. To request a refund, contact support@fitforge-ai.com within this period.

Refunds do not apply to already used subscription periods, after the 7-day period expires, or for repeat purchases. Refunds are processed within 5-10 business days.`,
      },
      {
        title: "6. Content and Intellectual Property",
        content: `All materials available on FitForge AI — including texts, graphics, logos, software, and AI-generated content — are the property of FitForge AI or its licensors and are protected by copyright laws.

We grant you a limited, non-exclusive, non-transferable license for personal use of the Service. You may not copy, distribute, modify, or sell platform content without our written consent.`,
      },
      {
        title: "7. User-Generated Content",
        content: `By publishing content on FitForge AI (posts, comments, progress photos), you grant us a non-exclusive, free license to use this content for operating and promoting the Service.

You are solely responsible for published content. It is prohibited to publish illegal, offensive, misleading content or content that infringes third-party rights.`,
      },
      {
        title: "8. Limitation of Liability",
        content: `FitForge AI is provided "as is", without warranties of any kind. We do not guarantee specific fitness results or weight loss.

To the extent permitted by law, FitForge AI is not liable for indirect, incidental, or consequential damages resulting from use or inability to use the Service. Our total liability will not exceed the amount paid by you in the last 12 months.`,
      },
      {
        title: "9. Modifications and Termination",
        content: `We reserve the right to modify, suspend, or discontinue the Service at any time with reasonable notice. You may terminate your account at any time from profile settings or by contacting support@fitforge-ai.com.

Upon termination, your right to use the Service ceases immediately. Your data will be deleted according to the Privacy Policy.`,
      },
      {
        title: "10. Governing Law",
        content: `These Terms are governed by Romanian law and European Union legislation. Any disputes will be resolved by competent courts in Romania, unless the applicable law in your country provides otherwise.

For EU users, you benefit from the protections offered by GDPR and European consumer legislation.`,
      },
      {
        title: "11. Contact",
        content: `For questions related to these Terms, you can contact us at:

Email: legal@fitforge-ai.com
Website: fitforge-ai.com
We respond within a maximum of 5 business days.`,
      },
    ],
  },
};

export default function TermsPage() {
  const [lang, setLang] = useState<"ro" | "en">("ro");
  const C = CONTENT[lang];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Nav */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="text-sm text-primary hover:underline">← FitForge AI</Link>
          <div className="flex gap-2">
            <button
              onClick={() => setLang("ro")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${lang === "ro" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"}`}
            >
              🇷🇴 RO
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${lang === "en" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"}`}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-12 pb-8 border-b border-border">
          <h1 className="text-4xl font-display font-black mb-3">{C.title}</h1>
          <p className="text-muted-foreground text-sm">{C.updated}</p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {C.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg font-display font-bold mb-3 text-foreground">{s.title}</h2>
              {s.content.split("\n\n").map((para, j) => (
                <p key={j} className="text-muted-foreground leading-relaxed mb-3 text-sm whitespace-pre-line">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-border flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/refund" className="hover:text-primary transition-colors">Refund Policy</Link>
          <Link href="/" className="hover:text-primary transition-colors">FitForge AI</Link>
        </div>

      </div>
    </div>
  );
}
