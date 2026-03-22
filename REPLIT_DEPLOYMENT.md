# 🚀 FITFORGE AI — GHID COMPLET DEPLOYMENT REPLIT
# Urmează EXACT acești pași în ordinea dată. Nu sări peste niciun pas.

===========================================================
PASUL 1 — ÎNCARCĂ ARHIVA ÎN REPLIT
===========================================================

1. Deschide proiectul tău în Replit
2. În panoul din stânga, click pe cele 3 puncte "..." lângă orice fișier
3. Click "Upload file"
4. Selectează fișierul: fitforge-ai-final.tar.gz
5. Așteaptă să se încarce complet

Acum deschide Shell-ul (tab-ul "Shell" din jos) și scrie EXACT:

  tar -xzf fitforge-ai-final.tar.gz

Apasă Enter. Vei vedea multe linii cu fișiere extrase. Normal.

===========================================================
PASUL 2 — ADAUGĂ SECRETELE (CHEI API)
===========================================================

În Replit, click pe iconița LACĂT din stânga (se numește "Secrets")

Adaugă EXACT aceste chei (Name = valoarea din stânga, Value = cheia ta):

  Name: OPENAI_API_KEY
  Value: sk-... (cheia ta de la platform.openai.com)

  Name: DATABASE_URL
  Value: postgresql://... (deja există în Replit, nu o schimba)

  Name: SESSION_SECRET
  Value: orice string lung random, ex: fitforge2025secretkey123456789

  Name: REPL_ID
  Value: (deja există automat în Replit, nu trebuie adăugat)

OPȚIONAL — când primești răspuns de la yMove:
  Name: YMOVE_API_KEY
  Value: cheia primită de la yMove

NOTĂ: DATABASE_URL și REPL_ID există deja în Replit automat.
Nu trebuie să le adaugi dacă există deja.

===========================================================
PASUL 3 — INSTALEAZĂ DEPENDENȚELE
===========================================================

În Shell, scrie EXACT:

  npm install

Apasă Enter. Durează 2-3 minute. Vei vedea "added X packages". Normal.

===========================================================
PASUL 4 — SINCRONIZEAZĂ BAZA DE DATE
===========================================================

În Shell, scrie EXACT:

  npm run db:push

Apasă Enter. Vei vedea mesaje despre tabele create/actualizate.
Dacă vezi erori roșii, trimite-mi un screenshot.

===========================================================
PASUL 5 — PORNEȘTE APLICAȚIA
===========================================================

Click butonul verde "Run" din sus SAU scrie în Shell:

  npm run dev

Vei vedea în consolă:
  ✅ "serving on port 5000"
  ✅ "Bibliotecă exerciții: X exerciții în DB"

===========================================================
PASUL 6 — TESTEAZĂ APLICAȚIA
===========================================================

Click pe linkul din dreapta sus al Replit (URL-ul aplicației).

Verifică în ordine:
  □ Landing page se deschide
  □ Butonul "Începe Gratuit" funcționează
  □ Login merge
  □ Onboarding 7 pași funcționează
  □ Dashboard/Today Plan se încarcă
  □ AI Coach răspunde (necesită OPENAI_API_KEY)
  □ Workouts se generează
  □ Nutriție — Log Meal funcționează

===========================================================
PASUL 7 — DACĂ AI ERORI
===========================================================

Dacă aplicația nu pornește sau ai erori roșii în consolă:

1. Fă screenshot la eroarea roșie din consolă
2. Trimite-mi screenshot-ul
3. Eu îți spun exact ce să faci

CELE MAI COMUNE ERORI:

Eroare: "Cannot find module..."
  → Rulează din nou: npm install

Eroare: "Database connection failed"  
  → Verifică că DATABASE_URL e setat în Secrets

Eroare: "Invalid API key"
  → Verifică OPENAI_API_KEY în Secrets

Eroare: "Port already in use"
  → Click Stop, așteaptă 10 secunde, click Run din nou

===========================================================
PASUL 8 — ACTIVEAZĂ DEPLOYMENT PERMANENT (OPȚIONAL)
===========================================================

Ca aplicația să meargă 24/7 și nu doar când ai Replit deschis:

1. Click "Deploy" (butonul din dreapta sus)
2. Alege "Autoscale" 
3. Click "Deploy"
4. Costul se vede înainte să confirmi

Fără Deploy, aplicația se oprește când închizi Replit.

===========================================================
PASUL 9 — CONECTEAZĂ DOMENIUL fitforge-ai.com
===========================================================

DUPĂ ce ai făcut Deploy:

1. În Replit → Deploy → Settings → "Custom Domain"
2. Adaugă: fitforge-ai.com
3. Adaugă: www.fitforge-ai.com
4. Replit îți dă un CNAME value (ceva de genul: xyz.replit.app)

În Namecheap (namecheap.com):
1. Login → Domain List → fitforge-ai.com → Manage
2. Tab "Advanced DNS"
3. Șterge recordurile A și CNAME existente
4. Adaugă:
   Type: CNAME | Host: @ | Value: [valoarea de la Replit] | TTL: Auto
   Type: CNAME | Host: www | Value: [valoarea de la Replit] | TTL: Auto
5. Save

Așteaptă 15-60 minute. Domeniul va funcționa automat cu HTTPS.

===========================================================
REZUMAT COMENZI SHELL
===========================================================

Copiază și rulează în ordine:

  tar -xzf fitforge-ai-final.tar.gz
  npm install
  npm run db:push
  npm run dev

===========================================================
DACĂ CEVA NU MERGE — CONTACTEAZĂ-MĂ
===========================================================

Trimite-mi:
1. Screenshot cu eroarea din consolă (zona roșie)
2. Ce pas ai făcut când a apărut eroarea

Rezolv în maxim 10 minute.

===========================================================
