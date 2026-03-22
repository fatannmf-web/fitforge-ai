/**
 * FitForge AI — Sistem complet de traduceri pentru 5 limbi
 * RO | EN | ES | PT | DE
 *
 * Structură: fiecare cheie are traducere în toate 5 limbile.
 * Folosit prin hook-ul useLang() din orice componentă.
 */

export type LangCode = "ro" | "en" | "es" | "pt" | "de";

export const SUPPORTED_LANGUAGES: { code: LangCode; name: string; flag: string; voiceLang: string }[] = [
  { code: "ro", name: "Română",    flag: "🇷🇴", voiceLang: "ro-RO" },
  { code: "en", name: "English",   flag: "🇬🇧", voiceLang: "en-US" },
  { code: "es", name: "Español",   flag: "🇪🇸", voiceLang: "es-ES" },
  { code: "pt", name: "Português", flag: "🇧🇷", voiceLang: "pt-BR" },
  { code: "de", name: "Deutsch",   flag: "🇩🇪", voiceLang: "de-DE" },
];

// Vocea OpenAI per limbă (gpt-4o-mini-tts)
export const VOICE_LANG_MAP: Record<LangCode, string> = {
  ro: "Speak naturally in Romanian.",
  en: "Speak naturally in English.",
  es: "Speak naturally in Spanish.",
  pt: "Speak naturally in Brazilian Portuguese.",
  de: "Speak naturally in German.",
};

// Codul limbii pentru TTS
export const TTS_LANG_CODE: Record<LangCode, string> = {
  ro: "ro", en: "en", es: "es", pt: "pt", de: "de",
};

type T = Record<LangCode, string>;

const t = (ro: string, en: string, es: string, pt: string, de: string): T => ({ ro, en, es, pt, de });

export const translations = {
  // ── NAV ──────────────────────────────────────────────────────────────────
  nav: {
    dashboard:    t("Acasă",          "Home",          "Inicio",         "Início",         "Startseite"),
    workouts:     t("Antrenamente",   "Workouts",      "Entrenamientos", "Treinos",        "Training"),
    nutrition:    t("Nutriție",       "Nutrition",     "Nutrición",      "Nutrição",       "Ernährung"),
    progress:     t("Progres",        "Progress",      "Progreso",       "Progresso",      "Fortschritt"),
    aiCoach:      t("AI Coach",       "AI Coach",      "Coach IA",       "Coach IA",       "KI-Coach"),
    community:    t("Comunitate",     "Community",     "Comunidad",      "Comunidade",     "Community"),
    achievements: t("Realizări",      "Achievements",  "Logros",         "Conquistas",     "Erfolge"),
    leaderboard:  t("Clasament",      "Leaderboard",   "Clasificación",  "Classificação",  "Rangliste"),
    profile:      t("Profil",         "Profile",       "Perfil",         "Perfil",         "Profil"),
    signOut:      t("Deconectare",    "Sign Out",      "Cerrar sesión",  "Sair",           "Abmelden"),
    exercises:    t("Exerciții",      "Exercises",     "Ejercicios",     "Exercícios",     "Übungen"),
    challenges:   t("Provocări",      "Challenges",    "Desafíos",       "Desafios",       "Herausforderungen"),
  },

  // ── COMMON ───────────────────────────────────────────────────────────────
  common: {
    save:       t("Salvează",     "Save",       "Guardar",    "Salvar",     "Speichern"),
    cancel:     t("Anulează",     "Cancel",     "Cancelar",   "Cancelar",   "Abbrechen"),
    delete:     t("Șterge",       "Delete",     "Eliminar",   "Excluir",    "Löschen"),
    edit:       t("Editează",     "Edit",       "Editar",     "Editar",     "Bearbeiten"),
    add:        t("Adaugă",       "Add",        "Añadir",     "Adicionar",  "Hinzufügen"),
    close:      t("Închide",      "Close",      "Cerrar",     "Fechar",     "Schließen"),
    loading:    t("Se încarcă…",  "Loading…",   "Cargando…",  "Carregando…","Wird geladen…"),
    search:     t("Caută",        "Search",     "Buscar",     "Buscar",     "Suchen"),
    back:       t("Înapoi",       "Back",       "Atrás",      "Voltar",     "Zurück"),
    next:       t("Următor",      "Next",       "Siguiente",  "Próximo",    "Weiter"),
    confirm:    t("Confirmă",     "Confirm",    "Confirmar",  "Confirmar",  "Bestätigen"),
    start:      t("Începe",       "Start",      "Comenzar",   "Começar",    "Starten"),
    finish:     t("Finalizează",  "Finish",     "Finalizar",  "Finalizar",  "Beenden"),
    skip:       t("Sari peste",   "Skip",       "Saltar",     "Pular",      "Überspringen"),
    share:      t("Distribuie",   "Share",      "Compartir",  "Compartilhar","Teilen"),
    download:   t("Descarcă",     "Download",   "Descargar",  "Baixar",     "Herunterladen"),
    points:     t("puncte",       "points",     "puntos",     "pontos",     "Punkte"),
    level:      t("Nivel",        "Level",      "Nivel",      "Nível",      "Level"),
    streak:     t("Streak",       "Streak",     "Racha",      "Sequência",  "Serie"),
    days:       t("zile",         "days",       "días",       "dias",       "Tage"),
    minutes:    t("minute",       "minutes",    "minutos",    "minutos",    "Minuten"),
    kg:         t("kg",           "kg",         "kg",         "kg",         "kg"),
    yes:        t("Da",           "Yes",        "Sí",         "Sim",        "Ja"),
    no:         t("Nu",           "No",         "No",         "Não",        "Nein"),
    pro:        t("Pro",          "Pro",        "Pro",        "Pro",        "Pro"),
    free:       t("Gratuit",      "Free",       "Gratis",     "Gratuito",   "Kostenlos"),
    optional:   t("opțional",     "optional",   "opcional",   "opcional",   "optional"),
    new:        t("Nou",          "New",        "Nuevo",      "Novo",       "Neu"),
    completed:  t("Finalizat",    "Completed",  "Completado", "Concluído",  "Abgeschlossen"),
    today:      t("Azi",          "Today",      "Hoy",        "Hoje",       "Heute"),
    week:       t("Săptămână",    "Week",       "Semana",     "Semana",     "Woche"),
    month:      t("Lună",         "Month",      "Mes",        "Mês",        "Monat"),
  },

  // ── GREETING ─────────────────────────────────────────────────────────────
  greeting: {
    morning: t("Bună dimineața", "Good morning",   "Buenos días",    "Bom dia",        "Guten Morgen"),
    afternoon:t("Bună ziua",     "Good afternoon", "Buenas tardes",  "Boa tarde",      "Guten Tag"),
    evening:  t("Bună seara",    "Good evening",   "Buenas noches",  "Boa noite",      "Guten Abend"),
  },

  // ── DASHBOARD ────────────────────────────────────────────────────────────
  dashboard: {
    title:          t("Acasă",                    "Home",                      "Inicio",                      "Início",                       "Startseite"),
    weeklyActivity: t("Activitate săptămânală",   "Weekly Activity",           "Actividad semanal",           "Atividade semanal",            "Wöchentliche Aktivität"),
    dailyChallenge: t("Challenge Zilnic",          "Daily Challenge",           "Desafío Diario",              "Desafio Diário",               "Tägliche Herausforderung"),
    streakMsg:      t("zile consecutive — nu rupe șirul!", "days in a row — keep it up!", "días consecutivos — ¡no lo rompas!", "dias consecutivos — não pare!", "Tage hintereinander — weiter so!"),
    noStreak:       t("Începe călătoria ta azi",  "Start your journey today",  "Empieza tu viaje hoy",        "Comece sua jornada hoje",      "Starte deine Reise heute"),
    continueChallenge: t("Continuă",              "Continue",                  "Continuar",                   "Continuar",                    "Weiter"),
    caloriesLabel:  t("Calorii azi",              "Calories today",            "Calorías hoy",                "Calorias hoje",                "Kalorien heute"),
    workoutsLabel:  t("Antrenamente",             "Workouts",                  "Entrenamientos",              "Treinos",                      "Trainings"),
  },

  // ── WORKOUTS ─────────────────────────────────────────────────────────────
  workouts: {
    title:          t("Antrenamente",             "Workouts",                  "Entrenamientos",              "Treinos",                      "Training"),
    newWorkout:     t("Antrenament Nou",           "New Workout",               "Nuevo Entrenamiento",         "Novo Treino",                  "Neues Training"),
    generateAI:     t("Generează cu AI",           "Generate with AI",          "Generar con IA",              "Gerar com IA",                 "Mit KI generieren"),
    quickStart:     t("Quick Start",               "Quick Start",               "Inicio Rápido",               "Início Rápido",                "Schnellstart"),
    noWorkouts:     t("Niciun antrenament încă",   "No workouts yet",           "Aún no hay entrenamientos",   "Nenhum treino ainda",          "Noch kein Training"),
    startFirst:     t("Creează primul tău antrenament", "Create your first workout", "Crea tu primer entrenamiento", "Crie seu primeiro treino", "Erstelle dein erstes Training"),
    exercises:      t("exerciții",                "exercises",                 "ejercicios",                  "exercícios",                   "Übungen"),
    duration:       t("min",                      "min",                       "min",                         "min",                          "Min"),
    calories:       t("kcal",                     "kcal",                      "kcal",                        "kcal",                         "kcal"),
    difficulty: {
      beginner:     t("Începător",                "Beginner",                  "Principiante",                "Iniciante",                    "Anfänger"),
      intermediate: t("Intermediar",              "Intermediate",              "Intermedio",                  "Intermediário",                "Mittel"),
      advanced:     t("Avansat",                  "Advanced",                  "Avanzado",                    "Avançado",                     "Fortgeschritten"),
    },
    startWorkout:   t("Pornește",                 "Start",                     "Comenzar",                    "Iniciar",                      "Starten"),
    completeWorkout:t("Finalizează",              "Complete",                  "Completar",                   "Concluir",                     "Abschließen"),
    deleteWorkout:  t("Șterge antrenamentul",     "Delete workout",            "Eliminar entrenamiento",      "Excluir treino",               "Training löschen"),
  },

  // ── NUTRITION ────────────────────────────────────────────────────────────
  nutrition: {
    title:        t("Nutriție",             "Nutrition",          "Nutrición",          "Nutrição",           "Ernährung"),
    logMeal:      t("Adaugă masă",          "Log Meal",           "Registrar comida",   "Registrar refeição", "Mahlzeit erfassen"),
    scanFood:     t("Scan Food",            "Scan Food",          "Escanear comida",    "Escanear comida",    "Essen scannen"),
    scanFridge:   t("Scan Frigider",        "Scan Fridge",        "Escanear nevera",    "Escanear geladeira", "Kühlschrank scannen"),
    calories:     t("Calorii",              "Calories",           "Calorías",           "Calorias",           "Kalorien"),
    protein:      t("Proteine",             "Protein",            "Proteína",           "Proteína",           "Protein"),
    carbs:        t("Carbohidrați",         "Carbs",              "Carbohidratos",      "Carboidratos",       "Kohlenhydrate"),
    fat:          t("Grăsimi",              "Fat",                "Grasas",             "Gorduras",           "Fett"),
    breakfast:    t("Mic dejun",            "Breakfast",          "Desayuno",           "Café da manhã",      "Frühstück"),
    lunch:        t("Prânz",               "Lunch",              "Almuerzo",           "Almoço",             "Mittagessen"),
    dinner:       t("Cină",               "Dinner",             "Cena",               "Jantar",             "Abendessen"),
    snack:        t("Gustare",             "Snack",              "Merienda",           "Lanche",             "Snack"),
    noMeals:      t("Nicio masă logată azi","No meals logged today","No hay comidas hoy","Nenhuma refeição hoje","Keine Mahlzeiten heute"),
    addFirst:     t("Adaugă prima masă",   "Add your first meal","Añade tu primera comida","Adicione sua primeira refeição","Füge deine erste Mahlzeit hinzu"),
    target:       t("din",                 "of",                 "de",                 "de",                 "von"),
    proFeature:   t("Funcție Pro",         "Pro Feature",        "Función Pro",        "Recurso Pro",        "Pro-Funktion"),
  },

  // ── PROGRESS ─────────────────────────────────────────────────────────────
  progress: {
    title:          t("Progres",              "Progress",           "Progreso",           "Progresso",          "Fortschritt"),
    addMeasurement: t("Adaugă măsurătoare",   "Add Measurement",    "Añadir medida",      "Adicionar medida",   "Messung hinzufügen"),
    weight:         t("Greutate",             "Weight",             "Peso",               "Peso",               "Gewicht"),
    bodyFat:        t("% Grăsime",            "Body Fat %",         "% Grasa corporal",   "% Gordura corporal", "Körperfett %"),
    chest:          t("Piept",                "Chest",              "Pecho",              "Peito",              "Brust"),
    waist:          t("Talie",                "Waist",              "Cintura",            "Cintura",            "Taille"),
    hips:           t("Șolduri",              "Hips",               "Caderas",            "Quadril",            "Hüfte"),
    arms:           t("Brațe",               "Arms",               "Brazos",             "Braços",             "Arme"),
    legs:           t("Coapse",              "Thighs",             "Muslos",             "Coxas",              "Oberschenkel"),
    noData:         t("Nicio măsurătoare",    "No measurements yet","Aún no hay medidas", "Nenhuma medida ainda","Noch keine Messungen"),
    startTracking:  t("Începe să-ți urmărești progresul", "Start tracking your progress", "Empieza a seguir tu progreso", "Comece a acompanhar seu progresso", "Beginne, deinen Fortschritt zu verfolgen"),
    currentWeight:  t("Greutate curentă",    "Current weight",     "Peso actual",        "Peso atual",         "Aktuelles Gewicht"),
    targetWeight:   t("Greutate țintă",      "Target weight",      "Peso objetivo",      "Peso alvo",          "Zielgewicht"),
    lostSoFar:      t("pierdut până acum",   "lost so far",        "perdido hasta ahora","perdido até agora",  "bisher verloren"),
  },

  // ── AI COACH ─────────────────────────────────────────────────────────────
  aiCoach: {
    title:        t("AI Coach",               "AI Coach",           "Coach IA",           "Coach IA",           "KI-Coach"),
    placeholder:  t("Scrie un mesaj…",        "Type a message…",    "Escribe un mensaje…","Digite uma mensagem…","Nachricht schreiben…"),
    send:         t("Trimite",               "Send",               "Enviar",             "Enviar",             "Senden"),
    chooseCoach:  t("Alege antrenorul",       "Choose your coach",  "Elige tu entrenador","Escolha seu coach",  "Trainer wählen"),
    proCoach:     t("Antrenor Pro",           "Pro Coach",          "Entrenador Pro",     "Coach Pro",          "Pro-Trainer"),
    generatePlan: t("Generează plan 4 săpt.", "Generate 4-week plan","Generar plan 4 sem.","Gerar plano 4 sem.", "4-Wochen-Plan erstellen"),
    voiceOn:      t("Voce activă",            "Voice on",           "Voz activada",       "Voz ativada",        "Stimme an"),
    voiceOff:     t("Voce oprită",            "Voice off",          "Voz desactivada",    "Voz desativada",     "Stimme aus"),
    listening:    t("Ascultând…",             "Listening…",         "Escuchando…",        "Ouvindo…",           "Höre zu…"),
    thinking:     t("Gândește…",              "Thinking…",          "Pensando…",          "Pensando…",          "Denkt nach…"),
    clearChat:    t("Șterge conversația",     "Clear chat",         "Borrar conversación","Limpar conversa",    "Chat löschen"),
  },

  // ── ACHIEVEMENTS ─────────────────────────────────────────────────────────
  achievements: {
    title:    t("Realizări",    "Achievements", "Logros",      "Conquistas",  "Erfolge"),
    unlocked: t("Deblocate",    "Unlocked",     "Desbloqueados","Desbloqueadas","Freigeschaltet"),
    locked:   t("Blocate",      "Locked",       "Bloqueados",  "Bloqueadas",  "Gesperrt"),
    earnedOn: t("Câștigat pe",  "Earned on",    "Ganado el",   "Ganho em",    "Verdient am"),
    progress: t("Progres",      "Progress",     "Progreso",    "Progresso",   "Fortschritt"),
  },

  // ── COMMUNITY ────────────────────────────────────────────────────────────
  community: {
    title:      t("Comunitate",         "Community",        "Comunidad",        "Comunidade",       "Community"),
    newPost:    t("Postare nouă",       "New Post",         "Nueva publicación", "Nova publicação",  "Neuer Beitrag"),
    placeholder:t("Distribuie un milestone sau o gândire…", "Share a milestone or thought…", "Comparte un logro o pensamiento…", "Compartilhe um marco ou pensamento…", "Teile einen Meilenstein oder Gedanken…"),
    like:       t("Apreciez",          "Like",             "Me gusta",         "Curtir",           "Gefällt mir"),
    comment:    t("Comentariu",        "Comment",          "Comentar",         "Comentar",         "Kommentieren"),
    share:      t("Distribuie",        "Share",            "Compartir",        "Compartilhar",     "Teilen"),
    noPost:     t("Nicio postare încă","No posts yet",     "Aún no hay publicaciones","Nenhuma publicação ainda","Noch keine Beiträge"),
    beFirst:    t("Fii primul care postează!", "Be the first to post!", "¡Sé el primero en publicar!", "Seja o primeiro a publicar!", "Sei der Erste, der postet!"),
  },

  // ── LEADERBOARD ──────────────────────────────────────────────────────────
  leaderboard: {
    title:    t("Clasament",  "Leaderboard",  "Clasificación", "Classificação", "Rangliste"),
    global:   t("Global",    "Global",       "Global",        "Global",        "Global"),
    friends:  t("Prieteni",  "Friends",      "Amigos",        "Amigos",        "Freunde"),
    city:     t("Oraș",      "City",         "Ciudad",        "Cidade",        "Stadt"),
    rank:     t("Loc",       "Rank",         "Posición",      "Posição",       "Rang"),
    name:     t("Nume",      "Name",         "Nombre",        "Nome",          "Name"),
    points:   t("Puncte",    "Points",       "Puntos",        "Pontos",        "Punkte"),
    follow:   t("Urmărește", "Follow",       "Seguir",        "Seguir",        "Folgen"),
    unfollow: t("Nu mai urmări","Unfollow",  "Dejar de seguir","Deixar de seguir","Entfolgen"),
    you:      t("Tu",        "You",          "Tú",            "Você",          "Du"),
  },

  // ── PROFILE ──────────────────────────────────────────────────────────────
  profile: {
    title:          t("Profil",              "Profile",            "Perfil",             "Perfil",             "Profil"),
    editProfile:    t("Editează profilul",   "Edit Profile",       "Editar perfil",      "Editar perfil",      "Profil bearbeiten"),
    language:       t("Limbă",              "Language",           "Idioma",             "Idioma",             "Sprache"),
    goal:           t("Obiectiv",           "Goal",               "Objetivo",           "Objetivo",           "Ziel"),
    currentWeight:  t("Greutate curentă",   "Current Weight",     "Peso actual",        "Peso atual",         "Aktuelles Gewicht"),
    targetWeight:   t("Greutate țintă",     "Target Weight",      "Peso objetivo",      "Peso alvo",          "Zielgewicht"),
    height:         t("Înălțime",           "Height",             "Altura",             "Altura",             "Größe"),
    age:            t("Vârstă",             "Age",                "Edad",               "Idade",              "Alter"),
    plan:           t("Plan",               "Plan",               "Plan",               "Plano",              "Plan"),
    upgradePro:     t("Upgrade la Pro",     "Upgrade to Pro",     "Mejorar a Pro",      "Atualizar para Pro", "Auf Pro upgraden"),
    goals: {
      weight_loss:    t("Slăbit",           "Weight Loss",        "Pérdida de peso",    "Emagrecimento",      "Gewichtsverlust"),
      muscle_gain:    t("Masă Musculară",   "Muscle Gain",        "Ganancia muscular",  "Ganho muscular",     "Muskelaufbau"),
      endurance:      t("Rezistență",       "Endurance",          "Resistencia",        "Resistência",        "Ausdauer"),
      general_fitness:t("Fitness General",  "General Fitness",    "Fitness general",    "Fitness geral",      "Allgemeine Fitness"),
      flexibility:    t("Flexibilitate",    "Flexibility",        "Flexibilidad",       "Flexibilidade",      "Flexibilität"),
    },
  },

  // ── ONBOARDING ───────────────────────────────────────────────────────────
  onboarding: {
    step1Title:   t("Cum te cheamă?",         "What's your name?",      "¿Cómo te llamas?",       "Qual é seu nome?",        "Wie heißt du?"),
    step1Sub:     t("AI-ul tău personal va folosi asta.", "Your personal AI will use this.", "Tu IA personal usará esto.", "Sua IA pessoal usará isso.", "Deine persönliche KI wird dies verwenden."),
    step2Title:   t("Care-i obiectivul?",      "What's your goal?",      "¿Cuál es tu objetivo?",  "Qual é seu objetivo?",    "Was ist dein Ziel?"),
    step3Title:   t("Ce nivel ești?",          "What's your level?",     "¿Cuál es tu nivel?",     "Qual é seu nível?",       "Was ist dein Level?"),
    step4Title:   t("Ce echipament ai?",       "What equipment do you have?","¿Qué equipo tienes?", "Que equipamento você tem?","Welche Ausrüstung hast du?"),
    step5Title:   t("Programul tău",           "Your Schedule",          "Tu horario",             "Sua programação",         "Dein Zeitplan"),
    step6Title:   t("Limitări fizice?",        "Physical limitations?",  "¿Limitaciones físicas?", "Limitações físicas?",     "Körperliche Einschränkungen?"),
    step7Title:   t("ești setat!",             "you're all set!",        "¡estás listo!",          "você está pronto!",       "du bist bereit!"),
    continueNoName:t("Continuă fără nume",     "Continue without name",  "Continuar sin nombre",   "Continuar sem nome",      "Ohne Namen fortfahren"),
    continue:     t("Continuă",               "Continue",               "Continuar",              "Continuar",               "Weiter"),
    profileReady: t("Profilul tău AI",        "Your AI Profile",        "Tu perfil IA",           "Seu perfil IA",           "Dein KI-Profil"),
    startScan:    t("Pornește AI Body Scan",   "Start AI Body Scan",     "Iniciar escaneo corporal","Iniciar scan corporal",  "KI-Körperscan starten"),
    skipScan:     t("Sari peste → Dashboard", "Skip → Dashboard",       "Saltar → Panel",         "Pular → Painel",          "Überspringen → Dashboard"),
  },

  // ── PRICING ──────────────────────────────────────────────────────────────
  pricing: {
    title:        t("Alege planul tău",       "Choose your plan",       "Elige tu plan",          "Escolha seu plano",       "Wähle deinen Plan"),
    free:         t("Gratuit",               "Free",                   "Gratis",                 "Gratuito",                "Kostenlos"),
    pro:          t("Pro",                   "Pro",                    "Pro",                    "Pro",                     "Pro"),
    monthly:      t("lună",                  "month",                  "mes",                    "mês",                     "Monat"),
    yearly:       t("an",                    "year",                   "año",                    "ano",                     "Jahr"),
    upgrade:      t("Upgradeazi la Pro",      "Upgrade to Pro",         "Mejorar a Pro",          "Atualizar para Pro",      "Auf Pro upgraden"),
    currentPro:   t("Ești abonat Pro! 🎉",   "You're a Pro subscriber! 🎉","¡Eres suscriptor Pro! 🎉","Você é assinante Pro! 🎉","Du bist Pro-Abonnent! 🎉"),
    save:         t("Economisești",          "Save",                   "Ahorras",                "Economize",               "Spare"),
  },

  // ── BODY SCAN ────────────────────────────────────────────────────────────
  bodyScan: {
    title:        t("AI Body Scan",           "AI Body Scan",           "Escaneo Corporal IA",    "Scan Corporal IA",        "KI-Körperscan"),
    subtitle:     t("Analizează-ți corpul cu AI în 60 de secunde", "Analyze your body with AI in 60 seconds", "Analiza tu cuerpo con IA en 60 segundos", "Analise seu corpo com IA em 60 segundos", "Analysiere deinen Körper mit KI in 60 Sekunden"),
    takePhoto:    t("Fă o poză",             "Take a photo",           "Tomar una foto",         "Tirar uma foto",          "Foto machen"),
    uploadPhoto:  t("Încarcă poză",          "Upload photo",           "Subir foto",             "Carregar foto",           "Foto hochladen"),
    analyzing:    t("Analizez…",             "Analyzing…",             "Analizando…",            "Analisando…",             "Analysiere…"),
    proRequired:  t("Necesită Pro",          "Requires Pro",           "Requiere Pro",           "Requer Pro",              "Erfordert Pro"),
  },

  // ── ERRORS ───────────────────────────────────────────────────────────────
  errors: {
    generic:      t("Ceva a mers greșit. Încearcă din nou.", "Something went wrong. Please try again.", "Algo salió mal. Inténtalo de nuevo.", "Algo deu errado. Tente novamente.", "Etwas ist schiefgelaufen. Bitte versuche es erneut."),
    network:      t("Eroare de rețea.",      "Network error.",         "Error de red.",          "Erro de rede.",           "Netzwerkfehler."),
    proRequired:  t("Această funcție necesită abonament Pro.", "This feature requires a Pro subscription.", "Esta función requiere suscripción Pro.", "Este recurso requer assinatura Pro.", "Diese Funktion erfordert ein Pro-Abonnement."),
    notFound:     t("Nu a fost găsit.",      "Not found.",             "No encontrado.",         "Não encontrado.",         "Nicht gefunden."),
  },

  // ── SUCCESS MESSAGES ─────────────────────────────────────────────────────
  success: {
    workoutComplete: t("Antrenament finalizat! 💪", "Workout complete! 💪", "¡Entrenamiento completado! 💪", "Treino concluído! 💪", "Training abgeschlossen! 💪"),
    mealLogged:      t("Masă înregistrată!",       "Meal logged!",          "¡Comida registrada!",           "Refeição registrada!",          "Mahlzeit erfasst!"),
    profileSaved:    t("Profil salvat!",            "Profile saved!",        "¡Perfil guardado!",             "Perfil salvo!",                 "Profil gespeichert!"),
    measurementSaved:t("Măsurătoare salvată!",      "Measurement saved!",    "¡Medida guardada!",             "Medida salva!",                 "Messung gespeichert!"),
    welcome:         t("Bun venit la FitForge AI!", "Welcome to FitForge AI!", "¡Bienvenido a FitForge AI!",  "Bem-vindo ao FitForge AI!",     "Willkommen bei FitForge AI!"),
  },

  // ── LANGUAGE SELECT ───────────────────────────────────────────────────────
  languageSelect: {
    subtitle:     t("Selectează limba ta",   "Choose your language",   "Elige tu idioma",        "Escolha seu idioma",      "Wähle deine Sprache"),
    changeAnytime:t("Poți schimba oricând din Profil", "You can change anytime from Profile", "Puedes cambiar en cualquier momento desde Perfil", "Você pode alterar a qualquer momento em Perfil", "Du kannst jederzeit im Profil ändern"),
  },
};

export type Translations = typeof translations;
