# FitForge AI - Platformă Fitness Completă

## Descriere
Aplicație web fitness completă în limba română cu AI Coach, tracking antrenamente, nutriție, gamificare, comunitate, marketplace de antrenori, predicții AI, monitor sănătate AI, detectare formă (pose detection), provocări fitness și Voice Coach.

## Arhitectură

### Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Baza de date**: PostgreSQL via Drizzle ORM
- **Auth**: Replit Auth (OAuth)
- **AI**: Replit AI Integrations (OpenAI GPT - fără cheie API utilizator)

### Structura directoarelor
```
client/src/
  pages/          # Paginile aplicației
  components/     # Componente reutilizabile (ui.tsx, Layout.tsx, Dialog.tsx)
  hooks/          # Custom hooks (use-auth, use-workouts, use-nutrition, etc.)
  lib/            # Utilitare (utils.ts, queryClient.ts)
shared/
  schema.ts       # Schema Drizzle (toate tabelele)
  routes.ts       # Contract API + tipuri partajate
server/
  index.ts        # Entry point Express
  routes.ts       # Toate endpoint-urile API
  storage.ts      # Interface stocare + DatabaseStorage
  db.ts           # Conexiune PostgreSQL
  replitAuth.ts   # Autentificare Replit
```

## Pagini implementate
- **/** - Landing page (utilizatori neautentificați)
- **/today** - Home zilnică: WorkoutCard cu AI workout + daily challenge + battle (DEFAULT)
- **/workout/play?id=N** - WorkoutPlayerPage full-screen (Hevy-style): video loop (230px object-contain), Progressive Overload bar (lastSession + trend arrow + +2.5kg quick button), 1RM Calculator (Epley badge), inline RestBanner cu 90s countdown + +30s + Skip + nextEx preview, SetTimer overlay pe video, session set log (completed sets), exercise queue jos, PR flash + Completion screen cu XP
- **/dashboard** - Overview stats, streak, puncte, grafice
- **/workouts** - Gestionare antrenamente, buton "Start Workout" → player
- **/exercises** - Biblioteca locală 637 exerciții yMove (fără API live)
- **/nutrition** - Log alimente, AI analyzer, totale zilnice (+10 pct)
- **/progress** - Măsurători corp + Poze progres (Before/After slider + Share card viral)
- **/ai-coach** - Chat AI cu streaming SSE
- **/achievements** - Badge-uri gamificare
- **/community** - Feed postări, like/comentarii + Activity Feed (antrenamente live)
- **/leaderboard** - Clasament Global / Prieteni / Oraș + Follow/Unfollow
- **/profile** - Editare profil și obiective
- **/pricing** - Planuri Free vs Pro (Stripe)

## Tabel DB adăugat recent
- `progress_photos` - Poze progres utilizatori (base64 comprimat)
- `push_subscriptions` - Abonamente push notifications
- `user_follows` - Follow/unfollow între utilizatori
- `activity_feed` - Activitate live: antrenamente completate, greutate logată, streak milestone
- `user_profiles.city` - Câmp oraș pentru City Leaderboard

## Transformation Reveal (feature viral)
- **Pagina**: `/transformation` — dezvăluire spectaculoasă animată: scanare → countdown 3...2...1 → reveal before/after split cu stats counting up
- **DB Table**: `transformation_reveals` — startWeight, endWeight, startBodyFat, endBodyFat, photos, isPublic, likesCount
- **API**: GET/POST `/api/transformation/reveal`, GET `/api/transformation/leaderboard`, POST `/api/transformation/leaderboard/:id/like`
- **Leaderboard public**: top transformări cu like system
- **Share**: Web Share API → TikTok, Instagram, YouTube Shorts cu watermark "Made with FitForge AI"
- **Avatare SVG**: dacă nu are poze, avatar SVG holografic dinamic bazat pe %body fat

## Funcții sociale noi
- **Share Transformation** (viral): generare card 1080×1350px cu Canvas API → Web Share API (TikTok/Instagram/Snapchat/download)
- **Leaderboard tabs**: Global / Prieteni (follow) / Oraș (city field în profil)
- **Follow/Unfollow**: buton pe fiecare utilizator din leaderboard
- **Activity Feed**: eventos auto-generate la completare antrenament, logare greutate, streak milestone

## Gamificare
- Points: 50 workout, 10 nutriție, 25 măsurătoare, 15 postare
- Level = floor(puncte/500) + 1
- Streak: zile consecutive antrenament
- Achievements seeded automat la pornire

## Deployment
- **Target**: Replit Autoscale (`deploymentTarget = "autoscale"`)
- **Build**: `npm run build` → compilează frontend (Vite) + backend (esbuild) → output în `artifacts/api-server/dist/`
- **Run**: `node artifacts/api-server/dist/index.cjs`
- **FĂRĂ publicDir** — Express servește singur fișierele statice din `dist/client/` via `express.static`
- **CDN static eliminat** — `publicDir = "deploy/cdn"` a fost eliminat din config (cauza erorii "no previewable artifacts")

## Bug-uri rezolvate (istorice)
- **Ecran negru după OAuth pe PC**: Service worker `fitforge-v4` cac`heja vechiul `index.html` cu hash JS vechi → JS nu se mai încărca. Fix: SW `fitforge-v6` nu mai cac`hează navigări (mereu `fetch` fresh de pe server)
- **"no previewable artifacts"**: `publicDir` din config crea conflict între artefactul static CDN și cel runnable Express
- **AppLayout înainte de auth**: `AppLayout` (sidebar negru) se randa înainte de confirmare auth → aspect ecran negru. Fix: `AppLayout` se randează doar după confirmare autentificare

## Service Worker (PWA)
- Versiunea curentă: `fitforge-v6`
- Navigări: mereu din rețea (nu cac`hează HTML)
- Cache: doar imagini statice (trainers, icons, favicon, manifest)
- La actualizare SW: șterge cache-urile vechi automat

## Comenzi importante
- `npm run dev` - Pornire aplicație (Express + Vite)
- `npm run build` - Build producție complet
- `npm run db:push` - Sincronizare schema DB

## Variabile de mediu
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `SESSION_SECRET` - Secret pentru sesiuni
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Cheie AI (Replit managed)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Base URL AI (Replit managed)

## Design
- Temă dark premium fitness: background #0a0a0a, accent verde neon (#22c55e), portocaliu (#f97316)
- Font: Outfit (display) + Inter (body)
- Sidebar navigație cu iconite Lucide
