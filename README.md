# 🏋️ FitForge AI — Platformă Fitness de Generație Nouă

> Aplicație web fitness completă cu AI Coach, tracking antrenamente, nutriție AI, gamificare, comunitate socială și marketplace de antrenori. Construită cu React + Express + PostgreSQL + OpenAI GPT-4o.

**Live Demo:** https://fitforge-ai.replit.app

---

## 📋 Cuprins

1. [Descriere](#descriere)
2. [Funcționalități](#funcționalități)
3. [Stack Tehnic](#stack-tehnic)
4. [Structura Proiectului](#structura-proiectului)
5. [Schema Bazei de Date](#schema-bazei-de-date)
6. [API Routes](#api-routes)
7. [Instalare & Rulare](#instalare--rulare)
8. [Variabile de Mediu](#variabile-de-mediu)
9. [Deployment](#deployment)
10. [Gamificare](#gamificare)
11. [AI Features](#ai-features)

---

## Descriere

FitForge AI este o aplicație PWA (Progressive Web App) fitness completă, cu suport pentru 10 limbi, 10 antrenori AI specializați, tracking detaliat al antrenamentelor, analiză nutrițională prin viziune AI, gamificare avansată și funcții sociale virale.

---

## Funcționalități

### Core
| Pagina | Descriere |
|--------|-----------|
| `/dashboard` | Overview stats zilnic, streak, puncte, mesaj AI personalizat, grafic activitate săptămânală |
| `/workouts` | Creare antrenamente, adăugare exerciții cu seturi/reps/greutate, marcare completare |
| `/nutrition` | Log mese, AI Scanner (foto + text), generator rețete, urmărire macronutrienți zilnici |
| `/progress` | Măsurători corp, poze Before/After cu slider, share card viral |
| `/ai-coach` | Chat cu streaming SSE, 10 antrenori specializați, generare plan 4 săptămâni |
| `/achievements` | 20+ badge-uri gamificare, progres vizual |
| `/community` | Feed postări, like/comentarii, activity feed live |
| `/leaderboard` | Clasament Global / Prieteni / Oraș, follow/unfollow |
| `/profile` | Editare profil, obiective, preferințe |
| `/pricing` | Planuri Free vs Pro (Stripe) |

### AI Features
| Feature | Descriere |
|---------|-----------|
| AI Coach Chat | Streaming SSE cu GPT-4o, context complet (antrenamente, nutriție, stare) |
| Daily Message | Mesaj motivațional personalizat la fiecare login |
| AI Nutrition Scanner | Scanare foto alimente → calorii + macronutrienți instant |
| AI Fridge Scanner | Detectare ingrediente din poză → sugestii rețete |
| Recipe Generator | Ingrediente text → rețetă completă cu pași |
| Body Scan AI | Analiză poză corp → body fat %, scor muschi, postură |
| Health Risk Monitor | 5 module: risc cardiac, metabolic, osos, imun, recuperare |
| Predictions AI | Prognoze transformare corporală 30/90/180 zile |
| Form Check | Detectare formă exerciții în timp real (MediaPipe Pose) |
| Digital Twin | Avatar 3D corp bazat pe statistici reale |

### Social & Viral
- **Transformation Reveal** — dezvăluire spectaculoasă animată Before/After cu countdown
- **Share Card** — generare card 1080×1350px via Canvas API → TikTok/Instagram/Snapchat
- **Commitment Contracts** — angajamente publice cu miză socială
- **Fitness Challenges** — provocări cu participanți și clasament
- **Trainer Marketplace** — programe de la antrenori reali, cumpărare cu puncte

### PWA & Mobile
- Service Worker `fitforge-v6` cu cache strategic
- Push Notifications (antrenament, streak, realizări)
- Instalabil pe telefon (Android/iOS)
- Design responsive mobile-first

---

## Stack Tehnic

```
Frontend:
  - React 18 + TypeScript
  - Vite (bundler)
  - TailwindCSS + shadcn/ui
  - TanStack Query v5 (data fetching)
  - Wouter (routing)
  - Framer Motion (animații)

Backend:
  - Express.js + TypeScript
  - Drizzle ORM
  - PostgreSQL
  - OpenAI GPT-4o (via Replit AI Integrations)

Auth:
  - Replit Auth (OAuth2)

Payments:
  - Stripe (Pro €9.99/lună, €79.99/an)

AI Models:
  - gpt-5.2 (chat, analiză, predicții)
  - gpt-4o (viziune: scanare foto, body scan)

PWA:
  - Service Worker (cache strategic)
  - Web Push API
  - Web Share API
```

---

## Structura Proiectului

```
fitforge-ai/
├── client/
│   ├── src/
│   │   ├── pages/              # Toate paginile aplicației
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── WorkoutsPage.tsx
│   │   │   ├── NutritionPage.tsx
│   │   │   ├── AiCoachPage.tsx
│   │   │   ├── ProgressPage.tsx
│   │   │   ├── CommunityPage.tsx
│   │   │   ├── LeaderboardPage.tsx
│   │   │   ├── AchievementsPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── PricingPage.tsx
│   │   │   ├── BodyScanPage.tsx
│   │   │   ├── HealthRiskPage.tsx
│   │   │   ├── PredictionsPage.tsx
│   │   │   ├── FormCheckPage.tsx
│   │   │   ├── ChallengesPage.tsx
│   │   │   ├── MarketplacePage.tsx
│   │   │   ├── TransformationRevealPage.tsx
│   │   │   ├── DigitalTwinPage.tsx
│   │   │   ├── FoodSimulatorPage.tsx
│   │   │   └── VideoPlayerDemoPage.tsx
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   ├── Layout.tsx      # App layout cu sidebar
│   │   │   ├── CoachVideoPlayer.tsx  # Player video premium cu PiP
│   │   │   ├── ExerciseAnimationPlayer.tsx
│   │   │   ├── LanguageSelectModal.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   ├── use-toast.ts
│   │   │   └── ...
│   │   └── lib/
│   │       ├── queryClient.ts
│   │       └── utils.ts
│   └── public/
│       ├── coaches/            # Poze antrenori AI (atlas.png, nova.png etc.)
│       ├── videos/             # Videoclipuri exerciții (19 fișiere mp4)
│       ├── trainers/           # Poze antrenori marketplace
│       ├── sw.js               # Service Worker PWA
│       └── manifest.json
├── server/
│   ├── index.ts                # Entry point Express
│   ├── routes.ts               # Toate endpoint-urile API (700+ linii)
│   ├── storage.ts              # Interface IStorage + DatabaseStorage
│   ├── db.ts                   # Conexiune PostgreSQL via Drizzle
│   └── replitAuth.ts           # Autentificare Replit OAuth
├── shared/
│   ├── schema.ts               # Schema Drizzle ORM (toate tabelele + tipuri)
│   └── models/
│       ├── auth.ts
│       └── chat.ts
├── drizzle.config.ts
├── vite.config.ts
└── package.json
```

---

## Schema Bazei de Date

### Diagrama Entitate-Relație

```
users (Replit Auth)
  └── user_profiles (1:1)
        ├── workouts (1:N)
        │     └── exercises (1:N)
        ├── nutrition_logs (1:N)
        ├── progress_measurements (1:N)
        ├── progress_photos (1:N)
        ├── daily_checkins (1:N)
        ├── body_scans (1:N)
        ├── ai_coach_messages (1:N)
        ├── user_achievements (N:M) ── achievements
        ├── community_posts (1:N)
        │     ├── post_likes (1:N)
        │     └── post_comments (1:N)
        ├── commitment_contracts (1:N)
        ├── fitness_challenges (1:N)
        │     └── challenge_participants (1:N)
        ├── user_program_enrollments (N:M) ── trainer_programs
        │     └── program_reviews (1:N)
        ├── activity_feed (1:N)
        ├── user_follows (N:M)
        ├── push_subscriptions (1:N)
        └── transformation_reveals (1:N)
```

### Tabele

#### `user_profiles`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR UNIQUE NOT NULL       -- ID Replit Auth
display_name    VARCHAR
bio             TEXT
avatar_url      VARCHAR
city            VARCHAR
goal_type       ENUM(weight_loss, muscle_gain, endurance, flexibility, general_fitness)
current_weight  REAL
target_weight   REAL
height          REAL
age             INTEGER
points          INTEGER DEFAULT 0
level           INTEGER DEFAULT 1
streak          INTEGER DEFAULT 0
last_workout_date TIMESTAMP
language        VARCHAR DEFAULT 'ro'
selected_trainer_id VARCHAR
onboarding_completed BOOLEAN DEFAULT FALSE
invite_code     VARCHAR
invited_by      VARCHAR
invite_count    INTEGER DEFAULT 0
stripe_customer_id VARCHAR
stripe_subscription_id VARCHAR
plan            VARCHAR DEFAULT 'free'        -- 'free' | 'pro'
plan_expires_at TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `workouts`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR NOT NULL
name            VARCHAR NOT NULL
notes           TEXT
duration        INTEGER                       -- minute
calories_burned INTEGER
difficulty      ENUM(beginner, intermediate, advanced)
is_completed    BOOLEAN DEFAULT FALSE
completed_at    TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()
```

#### `exercises`
```sql
id              SERIAL PRIMARY KEY
workout_id      INTEGER → workouts.id CASCADE
name            VARCHAR NOT NULL
muscle_group    ENUM(chest, back, shoulders, arms, core, legs, glutes, cardio, full_body)
sets            INTEGER DEFAULT 3
reps            INTEGER DEFAULT 10
weight          REAL                          -- kg
duration        INTEGER                       -- secunde
notes           TEXT
order_index     INTEGER DEFAULT 0
created_at      TIMESTAMP DEFAULT NOW()
```

#### `nutrition_logs`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR NOT NULL
date            TIMESTAMP DEFAULT NOW()
meal_type       VARCHAR DEFAULT 'lunch'       -- breakfast/lunch/dinner/snack
food_name       VARCHAR NOT NULL
calories        INTEGER DEFAULT 0
protein         REAL DEFAULT 0                -- grame
carbs           REAL DEFAULT 0
fat             REAL DEFAULT 0
quantity        REAL DEFAULT 1
unit            VARCHAR DEFAULT 'g'
created_at      TIMESTAMP DEFAULT NOW()
```

#### `progress_measurements`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR NOT NULL
weight          REAL                          -- kg
body_fat        REAL                          -- %
chest           REAL                          -- cm
waist           REAL
hips            REAL
arms            REAL
legs            REAL
notes           TEXT
photo_url       VARCHAR
measured_at     TIMESTAMP DEFAULT NOW()
created_at      TIMESTAMP DEFAULT NOW()
```

#### `progress_photos`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR NOT NULL
photo_data      TEXT NOT NULL                 -- base64 compressed
day_label       VARCHAR(50) NOT NULL          -- "Day 1", "Day 30", etc.
note            TEXT
taken_at        TIMESTAMP DEFAULT NOW()
created_at      TIMESTAMP DEFAULT NOW()
```

#### `daily_checkins`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR NOT NULL
date            VARCHAR NOT NULL              -- YYYY-MM-DD
energy_level    INTEGER NOT NULL              -- 1-10
sleep_hours     REAL NOT NULL
stress_level    INTEGER NOT NULL              -- 1-10
mood            VARCHAR NOT NULL              -- great/good/neutral/tired/stressed
notes           TEXT
ai_recommendation TEXT
should_train    BOOLEAN DEFAULT TRUE
created_at      TIMESTAMP DEFAULT NOW()
```

#### `body_scans`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR NOT NULL
body_fat_percent INTEGER
muscle_score    INTEGER
posture_score   INTEGER
fitness_score   INTEGER
bmi             REAL
analysis        TEXT
strengths       TEXT[]
improvements    TEXT[]
recommended_plan TEXT
goal_type       VARCHAR
body_type       VARCHAR
posture_details TEXT
muscle_distribution TEXT
focus_areas     TEXT[]
created_at      TIMESTAMP DEFAULT NOW()
```

#### `ai_coach_messages`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR NOT NULL
role            VARCHAR NOT NULL              -- 'user' | 'assistant'
content         TEXT NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
```

#### `achievements`
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR NOT NULL
description     TEXT
icon            VARCHAR NOT NULL
points_reward   INTEGER DEFAULT 100
condition       VARCHAR NOT NULL
condition_value INTEGER DEFAULT 1
```

#### `user_achievements`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR NOT NULL
achievement_id  INTEGER → achievements.id
earned_at       TIMESTAMP DEFAULT NOW()
```

#### `community_posts`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR NOT NULL
content         TEXT NOT NULL
image_url       VARCHAR
post_type       ENUM(achievement, progress, workout, nutrition, general)
likes_count     INTEGER DEFAULT 0
comments_count  INTEGER DEFAULT 0
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `post_likes` / `post_comments`
```sql
-- post_likes
id, user_id, post_id → community_posts.id CASCADE, created_at

-- post_comments
id, user_id, post_id → community_posts.id CASCADE, content, created_at
```

#### `commitment_contracts`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR NOT NULL
title           VARCHAR NOT NULL
description     TEXT
target_date     TIMESTAMP NOT NULL
stake           TEXT NOT NULL                 -- miza socială
status          VARCHAR DEFAULT 'active'      -- active/completed/failed
is_public       BOOLEAN DEFAULT TRUE
progress_percent INTEGER DEFAULT 0
completed_at    TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()
```

#### `fitness_challenges`
```sql
id              SERIAL PRIMARY KEY
creator_id      VARCHAR NOT NULL
title           VARCHAR NOT NULL
description     TEXT
emoji           VARCHAR DEFAULT '🏆'
challenge_type  VARCHAR DEFAULT 'workouts'    -- workouts/steps/streak/custom
target_value    INTEGER NOT NULL DEFAULT 7
duration_days   INTEGER NOT NULL DEFAULT 7
is_public       BOOLEAN DEFAULT TRUE
participants_count INTEGER DEFAULT 1
status          VARCHAR DEFAULT 'active'      -- active/ended
ends_at         TIMESTAMP NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
```

#### `trainer_programs`
```sql
id              SERIAL PRIMARY KEY
trainer_id      VARCHAR NOT NULL
trainer_name    VARCHAR NOT NULL
trainer_photo   VARCHAR
title           VARCHAR NOT NULL
description     TEXT
category        VARCHAR DEFAULT 'strength'
duration_weeks  INTEGER DEFAULT 4
sessions_per_week INTEGER DEFAULT 3
difficulty      VARCHAR DEFAULT 'intermediate'
points_cost     INTEGER DEFAULT 500
price_eur       REAL
sales_count     INTEGER DEFAULT 0
rating          REAL DEFAULT 4.8
reviews_count   INTEGER DEFAULT 0
emoji           VARCHAR DEFAULT '💪'
is_active       BOOLEAN DEFAULT TRUE
created_at      TIMESTAMP DEFAULT NOW()
```

#### `transformation_reveals`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR NOT NULL
display_name    VARCHAR(100)
start_weight    REAL
end_weight      REAL
start_body_fat  REAL
end_body_fat    REAL
workouts_completed INTEGER DEFAULT 0
days_count      INTEGER DEFAULT 90
before_photo_data TEXT
after_photo_data TEXT
is_public       BOOLEAN DEFAULT FALSE
likes_count     INTEGER DEFAULT 0
created_at      TIMESTAMP DEFAULT NOW()
```

#### `user_follows`
```sql
id, follower_id, followee_id, created_at
```

#### `activity_feed`
```sql
id              SERIAL PRIMARY KEY
user_id         VARCHAR NOT NULL
type            ENUM(workout_completed, streak_milestone, weight_logged,
                     photo_uploaded, achievement_earned, challenge_joined,
                     challenge_completed, plan_started)
description     TEXT NOT NULL
reference_id    INTEGER
emoji           VARCHAR(10) DEFAULT '💪'
created_at      TIMESTAMP DEFAULT NOW()
```

#### `push_subscriptions`
```sql
id, user_id, endpoint, p256dh, auth,
notify_workout, notify_streak, notify_achievement, notify_motivation,
created_at
```

---

## API Routes

### Auth
```
GET  /api/auth/user          -- Utilizator curent
GET  /api/login              -- Redirect OAuth Replit
GET  /api/logout             -- Logout
POST /api/dev-login          -- Login dev (non-production)
```

### Profile
```
GET  /api/profile            -- Profil utilizator
PATCH /api/profile           -- Actualizare profil
```

### Workouts
```
GET  /api/workouts           -- Lista antrenamente
POST /api/workouts           -- Creare antrenament
GET  /api/workouts/:id       -- Detalii antrenament
PATCH /api/workouts/:id      -- Actualizare
DELETE /api/workouts/:id     -- Ștergere
POST /api/workouts/:id/complete  -- Marcare completat (+50 pct)
GET  /api/workouts/:id/exercises -- Exercițiile antrenamentului
POST /api/workouts/:id/exercises -- Adaugă exercițiu
DELETE /api/exercises/:id    -- Șterge exercițiu
```

### Nutrition
```
GET  /api/nutrition          -- Log-uri nutriție (azi)
POST /api/nutrition          -- Adaugă masă
DELETE /api/nutrition/:id    -- Șterge masă (+10 pct)
POST /api/nutrition/analyze  -- AI: text → macronutrienți
POST /api/nutrition/scan-photo   -- AI Vision: foto → calorii
POST /api/nutrition/scan-fridge  -- AI Vision: foto frigider → rețete
POST /api/nutrition/recipe   -- AI: ingrediente → rețetă completă
POST /api/nutrition/coach-advice -- AI: sfat nutrițional de la coach
```

### Progress
```
GET  /api/progress           -- Măsurători corp
POST /api/progress           -- Adaugă măsurătoare (+25 pct)
GET  /api/progress/photos    -- Poze progres
POST /api/progress/photos    -- Upload poză
DELETE /api/progress/photos/:id -- Șterge poză
```

### AI Coach
```
GET  /api/ai-coach/messages  -- Istoric chat
POST /api/ai-coach/message   -- Trimite mesaj (streaming SSE)
POST /api/ai-coach/speak     -- Text-to-Speech
GET  /api/ai-coach/daily-message -- Mesaj zilnic personalizat
DELETE /api/ai-coach/messages -- Șterge istoric chat
```

### Gamificare
```
GET  /api/achievements        -- Toate realizările + deblocate
GET  /api/checkin             -- Istoric check-in
POST /api/checkin             -- Check-in zilnic (AI + recomandare)
```

### Social
```
GET  /api/community          -- Feed postări
POST /api/community          -- Postare nouă (+15 pct)
POST /api/community/:id/like -- Like/unlike
POST /api/community/:id/comments -- Comentariu
GET  /api/stats/leaderboard  -- Clasament global/prieteni/oraș
POST /api/follows            -- Follow utilizator
DELETE /api/follows/:id      -- Unfollow
GET  /api/follows            -- Lista urmăritori
GET  /api/activity-feed      -- Feed activitate live
```

### AI Features
```
POST /api/body-scan          -- AI: analiză poză corp
GET  /api/health-risk        -- AI: monitor 5 riscuri sănătate
GET  /api/predictions        -- AI: predicții transformare 30/90/180 zile
POST /api/digital-twin/generate -- AI: avatar 3D corp
POST /api/ai-coach/plan      -- AI: plan antrenament 4 săptămâni
```

### Marketplace
```
GET  /api/marketplace/programs   -- Programe antrenori
GET  /api/marketplace/enrolled   -- Programele mele
POST /api/marketplace/enroll     -- Înscrie-te (puncte)
GET  /api/marketplace/programs/:id/reviews -- Recenzii
POST /api/marketplace/programs/:id/reviews -- Adaugă recenzie
```

### Transformation
```
GET  /api/transformation/reveal     -- Transformarea mea
POST /api/transformation/reveal     -- Salvează transformare
GET  /api/transformation/leaderboard -- Top transformări publice
POST /api/transformation/leaderboard/:id/like -- Like transformare
```

### Stripe
```
GET  /api/stripe/subscription    -- Status abonament
POST /api/stripe/create-checkout -- Creare sesiune plată
POST /api/stripe/webhook         -- Webhook Stripe
POST /api/stripe/dev-upgrade     -- Upgrade instant (dev)
```

---

## Instalare & Rulare

```bash
# 1. Clonează proiectul
git clone https://replit.com/@username/fitforge-ai

# 2. Instalează dependențele
npm install

# 3. Setează variabilele de mediu (vezi secțiunea de mai jos)

# 4. Sincronizează schema bazei de date
npm run db:push

# 5. Pornește aplicația în development
npm run dev

# 6. Build producție
npm run build
```

---

## Variabile de Mediu

```env
DATABASE_URL=postgresql://...         # PostgreSQL connection string
SESSION_SECRET=your-secret-here       # Secret pentru sesiuni Express
AI_INTEGRATIONS_OPENAI_API_KEY=...   # OpenAI API key (Replit managed)
AI_INTEGRATIONS_OPENAI_BASE_URL=...  # OpenAI base URL (Replit managed)
STRIPE_SECRET_KEY=sk_...              # Stripe secret key
VITE_STRIPE_PUBLIC_KEY=pk_...        # Stripe publishable key
```

---

## Deployment

Aplicația este configurată pentru **Replit Autoscale**:

```
Build command:  npm run build
Run command:    node artifacts/api-server/dist/index.cjs
```

**URL producție:** https://fitforge-ai.replit.app

---

## Gamificare

| Acțiune | Puncte |
|---------|--------|
| Antrenament completat | +50 |
| Masă logată | +10 |
| Măsurătoare corp | +25 |
| Postare comunitate | +15 |
| Badge deblocat | +100–500 |
| Commitment completat | +200 |

### Ranguri
| Puncte | Rang | Emoji |
|--------|------|-------|
| 0–499 | Rookie | 🥉 |
| 500–1499 | Warrior | ⚔️ |
| 1500–2999 | Champion | 🏆 |
| 3000–4999 | Legend | 👑 |
| 5000+ | FitForger Elite | ⭐ |

---

## AI Features

### Antrenori AI (10 specializări)
| ID | Nume | Specialitate |
|----|------|-------------|
| atlas | Atlas | Forță & Powerlifting |
| nova | Nova | Transformare corporală |
| vera | Vera | Cardio & HIIT |
| max | Max | Masă musculară |
| bruno | Bruno | Calisthenics |
| kai | Kai | Yoga & Mindfulness |
| alex | Alex | Athletic Performance |
| sam | Sam | Running & Endurance |
| rio | Rio | Mobilitate & Recuperare |
| luna | Luna | Nutriție & Wellness |

### Videoclipuri exerciții (19 fișiere)
Stocate în `client/public/videos/`: squats, pushups, pullups, deadlift, lunges, plank, yoga, HIIT și demo-uri antrenori AI.

---

## Licență

Proiect privat © 2026 FitForge AI. Toate drepturile rezervate.
