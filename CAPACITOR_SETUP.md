# 🚀 FitForge AI — App Store & Google Play Setup

## Ce este Capacitor?

Capacitor împachetează aplicația web React existentă într-o aplicație nativă iOS/Android.
**Nu rescrii codul** — totul rămâne la fel, se adaugă doar un strat nativ.

---

## Pasul 1 — Instalare Capacitor (o singură dată)

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npm install @capacitor/push-notifications @capacitor/status-bar
npm install @capacitor/splash-screen @capacitor/keyboard
npm install @capacitor/local-notifications @capacitor/app
npx cap init
```

---

## Pasul 2 — Build aplicație web

```bash
npm run build
```

Aceasta generează `dist/client/` — fișierele pe care Capacitor le împachetează.

---

## Pasul 3 — Adaugă platformele

```bash
# iOS (necesită macOS + Xcode)
npx cap add ios

# Android (necesită Android Studio)
npx cap add android
```

---

## Pasul 4 — Sync după fiecare build

```bash
npm run build && npx cap sync
```

---

## Pasul 5 — Deschide în IDE nativ

```bash
# Deschide Xcode pentru iOS
npx cap open ios

# Deschide Android Studio pentru Android
npx cap open android
```

---

## iOS — App Store Upload

### Cerințe:
- **macOS** (obligatoriu — nu poți face build iOS pe Windows/Linux)
- **Xcode** instalat (gratuit din App Store)
- **Apple Developer Account** — $99/an → https://developer.apple.com

### Pași în Xcode:
1. `npx cap open ios`
2. Selectează team-ul (contul tău Apple Developer)
3. Schimbă Bundle ID: `com.fitforgeai.app`
4. Product → Archive
5. Distribute App → App Store Connect
6. Mergi pe https://appstoreconnect.apple.com și completează listing-ul

### Informații necesare pentru App Store:
- **Nume app**: FitForge AI
- **Bundle ID**: com.fitforgeai.app
- **Categorie**: Health & Fitness
- **Vârstă**: 4+
- **Descriere**: (vezi mai jos)
- **Screenshots**: 6.7" iPhone, 12.9" iPad (opțional)
- **Privacy Policy URL**: https://fitforge-ai.com/privacy
- **Support URL**: https://fitforge-ai.com

---

## Android — Google Play Upload

### Cerințe:
- **Android Studio** (gratuit) — https://developer.android.com/studio
- **Google Play Developer Account** — $25 o singură dată → https://play.google.com/console

### Pași:
1. `npx cap open android`
2. Build → Generate Signed Bundle/APK
3. Creează un keystore nou (PĂSTREAZĂ-L în siguranță!)
4. Generează AAB (Android App Bundle)
5. Upload pe Google Play Console

### Informații necesare pentru Google Play:
- **Package name**: com.fitforgeai.app
- **Categorie**: Health & Fitness
- **Content rating**: Everyone
- **Descriere**: (vezi mai jos)

---

## Descriere App Store / Google Play

**Scurtă (80 chars):**
AI Coach personal, tracking fitness, nutriție și gamificare 💪

**Lungă:**
FitForge AI este platforma ta completă de fitness cu inteligență artificială.

🤖 AI COACH PERSONAL
Vorbește cu antrenorul tău AI în limba ta. Atlas pentru forță, Nova pentru slăbit, Alex pentru începători. Streaming în timp real, răspunsuri vocale autentice.

📊 TRACKING COMPLET
• Antrenamente cu auto-fill din sesiunea anterioară
• Nutriție cu barcode scanner (3M+ produse)
• Progres cu grafice și poze de transformare
• Water tracker zilnic

🔥 GAMIFICARE
• Streak-uri zilnice
• Puncte și levels
• 20+ achievements de deblocat
• Clasament global, prieteni și oraș

🌍 5 LIMBI
Română, English, Español, Português, Deutsch

📱 DISPONIBIL PE
iPhone, Android și web (fitforge-ai.com)

---

## Script rapid deploy (după fiecare update)

```bash
#!/bin/bash
# deploy-mobile.sh

echo "🔨 Building..."
npm run build

echo "📱 Syncing Capacitor..."
npx cap sync

echo "✅ Gata! Deschide Xcode sau Android Studio pentru upload."
echo "   iOS:     npx cap open ios"
echo "   Android: npx cap open android"
```

---

## Iconițe necesare

### iOS (generează cu https://appicon.co):
- 1024x1024 PNG (fără transparență)
- Tool-ul generează automat toate dimensiunile

### Android:
- 512x512 PNG
- Adaptive icon: foreground 108x108dp, background color #0a0a0a

---

## Costuri totale

| Platformă | Cost |
|-----------|------|
| Apple Developer Program | $99/an |
| Google Play Developer | $25 o singură dată |
| Capacitor (open source) | Gratuit |
| **Total primul an** | **~$124** |
| **Din al doilea an** | **~$99/an** |

Cu un singur user Pro ($9.99/lună) recuperezi costul în 13 zile. 🎯

