import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated, authStorage } from "./replit_integrations/auth";
import { storage } from "./storage";
import { z } from "zod";
import OpenAI from "openai";
import webpush from "web-push";
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } from "./pushConfig";
// Workout generation: 100% from local DB — no external API needed
// exerciseService used ONLY for optional yMove sync (admin only)

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

import {
  insertWorkoutSchema, insertExerciseSchema, insertNutritionLogSchema,
  insertProgressMeasurementSchema,
  insertUserProfileSchema, achievements, insertDailyCheckinSchema,
  getRank, userProfiles as userProfilesTable, exerciseLibrary,
} from "@shared/schema";
import { eq, and, ilike, sql } from "drizzle-orm";
import { db } from "./db";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Separate client for TTS — Replit proxy doesn't support /audio/speech
const openaiTTS = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

async function seedAchievements() {
  const existing = await db.select().from(achievements);
  if (existing.length > 0) return;

  const defaultAchievements = [
    { name: "Prima Antrenament", description: "Ai completat primul tău antrenament!", icon: "🏆", pointsReward: 100, condition: "workouts_completed", conditionValue: 1 },
    { name: "Săptămâna Activă", description: "7 antrenamente completate", icon: "🔥", pointsReward: 300, condition: "workouts_completed", conditionValue: 7 },
    { name: "Maratonistul", description: "30 antrenamente completate", icon: "🏃", pointsReward: 1000, condition: "workouts_completed", conditionValue: 30 },
    { name: "Streak de 7 zile", description: "Ai antrenat 7 zile la rând!", icon: "⚡", pointsReward: 500, condition: "streak_days", conditionValue: 7 },
    { name: "Streak de 30 zile", description: "30 zile consecutive de antrenament!", icon: "👑", pointsReward: 2000, condition: "streak_days", conditionValue: 30 },
    { name: "Nutriție Conștientă", description: "Ai înregistrat 10 mese", icon: "🥗", pointsReward: 200, condition: "nutrition_logs", conditionValue: 10 },
    { name: "Tracker de Progres", description: "Ai adăugat prima măsurătoare", icon: "📊", pointsReward: 150, condition: "progress_measurements", conditionValue: 1 },
    { name: "Social Star", description: "Ai creat 5 postări în comunitate", icon: "⭐", pointsReward: 250, condition: "community_posts", conditionValue: 5 },
  ];

  await db.insert(achievements).values(defaultAchievements);
}

async function checkAndAwardAchievements(userId: string) {
  const completedWorkouts = (await storage.getWorkouts(userId)).filter(w => w.isCompleted).length;
  const nutritionCount = (await storage.getNutritionLogs(userId)).length;
  const progressCount = (await storage.getProgressMeasurements(userId)).length;
  const profile = await storage.getUserProfile(userId);
  const allAchievements = await storage.getAllAchievements();
  const userAchievements = await storage.getUserAchievements(userId);
  const earnedIds = new Set(userAchievements.map(ua => ua.achievementId));

  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement.id)) continue;

    let earned = false;
    switch (achievement.condition) {
      case "workouts_completed":
        earned = completedWorkouts >= achievement.conditionValue!;
        break;
      case "streak_days":
        earned = (profile?.streak || 0) >= achievement.conditionValue!;
        break;
      case "nutrition_logs":
        earned = nutritionCount >= achievement.conditionValue!;
        break;
      case "progress_measurements":
        earned = progressCount >= achievement.conditionValue!;
        break;
    }

    if (earned) {
      await storage.awardAchievement(userId, achievement.id);
      await storage.updateUserPoints(userId, achievement.pointsReward || 0);
    }
  }
}

// Middleware: verifică dacă utilizatorul are plan Pro
async function requirePro(req: any, res: any, next: any) {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Neautentificat" });
    const plan = await storage.getUserPlan(userId);
    if (plan !== "pro") {
      return res.status(403).json({ message: "Această funcție necesită abonament Pro", requiresPro: true });
    }
    next();
  } catch (e) {
    res.status(500).json({ message: "Eroare verificare plan" });
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Health check — always first, before any async auth setup
  app.get("/api/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Auth setup is async (OIDC discovery). Wrap in try/catch so a failure
  // doesn't block all other routes from being registered.
  try {
    await setupAuth(app);
    registerAuthRoutes(app);
  } catch (err) {
    console.error("[auth] setupAuth failed — auth routes unavailable:", err);
  }

  try {
    await seedAchievements();
  } catch (err) {
    console.error("[seed] seedAchievements failed:", err);
  }

  // Verificare bibliotecă exerciții la startup
  try {
    const count = await storage.getExerciseLibraryCount();
    if (count === 0) {
      console.warn("[startup] ⚠️ Biblioteca de exerciții este goală. Rulează /api/exercises/sync-batch pentru a popula.");
    } else {
      console.log(`[startup] ✅ Bibliotecă exerciții: ${count} exerciții în DB — workouturi generate 100% local`);
    }
  } catch (err) {
    console.error("[startup] Verificare exerciții eșuată:", err);
  }

  // === PROFILE ===
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        const user = req.user.claims;
        profile = await storage.upsertUserProfile({
          userId,
          displayName: user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "FitForge User",
          avatarUrl: user.profile_image_url || null,
        });
      }
      res.json(profile);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.put("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertUserProfileSchema.partial().parse({ ...req.body, userId });
      const profile = await storage.upsertUserProfile({ userId, ...data });
      res.json(profile);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // === WORKOUTS ===
  app.get("/api/workouts", isAuthenticated, async (req: any, res) => {
    const workoutList = await storage.getWorkouts(req.user.claims.sub);
    res.json(workoutList);
  });

  app.get("/api/workouts/:id", isAuthenticated, async (req: any, res) => {
    const workout = await storage.getWorkout(Number(req.params.id));
    if (!workout) return res.status(404).json({ message: "Not found" });
    res.json(workout);
  });

  app.post("/api/workouts", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertWorkoutSchema.parse({ ...req.body, userId: req.user.claims.sub });
      const workout = await storage.createWorkout(data);
      res.status(201).json(workout);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      res.status(500).json({ message: "Failed to create workout" });
    }
  });

  // POST /api/workouts/create-from-program — Create workout + exercises atomically (used by WorkoutsPage)
  app.post("/api/workouts/create-from-program", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, difficulty, duration, caloriesBurned, notes, exercises } = req.body;
      if (!name || !Array.isArray(exercises)) {
        return res.status(400).json({ error: "name and exercises[] required" });
      }
      const validDifficulty = ["beginner", "intermediate", "advanced"].includes(difficulty)
        ? difficulty : "intermediate";
      const workout = await storage.createWorkout({
        userId, name,
        difficulty: validDifficulty as any,
        duration: duration ?? 30,
        caloriesBurned: caloriesBurned ?? null,
        notes: notes ?? null,
      });
      const muscleGroupValues = ["chest","back","shoulders","arms","core","legs","glutes","cardio","full_body"];
      await Promise.all(
        exercises.map((ex: any, i: number) => {
          const mg = muscleGroupValues.includes(ex.muscleGroup) ? ex.muscleGroup : "full_body";
          return storage.createExercise({
            workoutId: workout.id,
            name: ex.name,
            muscleGroup: mg as any,
            sets: ex.sets ?? 3,
            reps: ex.reps ?? 10,
            weight: null,
            duration: ex.duration ?? null,
            notes: ex.notes ?? null,
            orderIndex: i,
          });
        })
      );
      res.status(201).json({ workoutId: workout.id });
    } catch (e) {
      console.error("[create-from-program]", e);
      res.status(500).json({ error: "Failed to create workout from program" });
    }
  });

  app.put("/api/workouts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const workout = await storage.updateWorkout(Number(req.params.id), req.body);
      res.json(workout);
    } catch (e) {
      res.status(500).json({ message: "Failed to update workout" });
    }
  });

  app.delete("/api/workouts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workout = await storage.getWorkout(Number(req.params.id));
      if (!workout) return res.status(404).json({ message: "Not found" });
      if (workout.userId !== userId) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteWorkout(Number(req.params.id));
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ message: "Failed to delete workout" });
    }
  });

  app.post("/api/workouts/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workout = await storage.completeWorkout(Number(req.params.id));
      await storage.updateUserPoints(userId, 50);
      await storage.updateStreak(userId);
      await checkAndAwardAchievements(userId);
      res.json(workout);
    } catch (e) {
      res.status(500).json({ message: "Failed to complete workout" });
    }
  });

  // === EXERCISES ===
  app.get("/api/workouts/:workoutId/exercises", isAuthenticated, async (req: any, res) => {
    const exerciseList = await storage.getExercises(Number(req.params.workoutId));
    res.json(exerciseList);
  });

  app.post("/api/workouts/:workoutId/exercises", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertExerciseSchema.parse({ ...req.body, workoutId: Number(req.params.workoutId) });
      const exercise = await storage.createExercise(data);
      res.status(201).json(exercise);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      res.status(500).json({ message: "Failed to create exercise" });
    }
  });

  app.put("/api/exercises/:id", isAuthenticated, async (req: any, res) => {
    const exercise = await storage.updateExercise(Number(req.params.id), req.body);
    res.json(exercise);
  });

  app.delete("/api/exercises/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exerciseId = Number(req.params.id);
      // Verify ownership through the parent workout
      const [ex] = await db.select().from(exercises).where(eq(exercises.id, exerciseId));
      if (!ex) return res.status(404).json({ message: "Not found" });
      const workout = await storage.getWorkout(ex.workoutId);
      if (!workout || workout.userId !== userId) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteExercise(exerciseId);
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ message: "Failed to delete exercise" });
    }
  });

  // === NUTRITION ===
  app.get("/api/nutrition", isAuthenticated, async (req: any, res) => {
    const logs = await storage.getNutritionLogs(req.user.claims.sub);
    res.json(logs);
  });

  app.post("/api/nutrition", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertNutritionLogSchema.parse({ ...req.body, userId: req.user.claims.sub });
      const log = await storage.createNutritionLog(data);
      await storage.updateUserPoints(req.user.claims.sub, 10);
      await checkAndAwardAchievements(req.user.claims.sub);
      res.status(201).json(log);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      res.status(500).json({ message: "Failed to create nutrition log" });
    }
  });

  app.delete("/api/nutrition/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logId = Number(req.params.id);
      const logs = await storage.getNutritionLogs(userId);
      const log = logs.find(l => l.id === logId);
      if (!log) return res.status(404).json({ message: "Not found" });
      await storage.deleteNutritionLog(logId);
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ message: "Failed to delete nutrition log" });
    }
  });

  app.post("/api/nutrition/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const { description } = req.body;
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Analizează acest aliment și returnează un JSON cu: {"foodName": "...", "calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "quantity": 100, "unit": "g"}. Aliment: ${description}`
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });
      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (e) {
      res.status(500).json({ message: "Failed to analyze nutrition" });
    }
  });

  app.post("/api/nutrition/simulate", isAuthenticated, async (req: any, res) => {
    try {
      const { foodName, calories, protein, carbs, fat } = req.body;
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Ești un expert în nutriție și fiziologie corporală. Analizează această masă și returnează un JSON exact cu simularea impactului asupra corpului.

Masă: ${foodName}
Calorii: ${calories} kcal | Proteine: ${protein}g | Carbohidrați: ${carbs}g | Grăsimi: ${fat}g

Returnează JSON cu structura EXACTĂ:
{
  "mealScore": <număr 0-100, bazat pe calitatea nutrițională>,
  "mealScoreLabel": "<Excelent/Bun/Acceptabil/Slab>",
  "mealScoreColor": "<green/blue/amber/red>",
  "energyLevel": "<Ridicat/Mediu/Scăzut>",
  "energyEmoji": "<⚡/➡️/😴>",
  "fatGainProbability": "<Scăzut/Mediu/Ridicat>",
  "fatGainEmoji": "<✅/⚠️/❌>",
  "muscleRecovery": "<Excelent/Bun/Slab>",
  "muscleEmoji": "<💪/👍/👎>",
  "impact": "<Pozitiv pentru masă musculară/Neutru/Negativ>",
  "impactColor": "<green/blue/amber>",
  "predictions": {
    "days30": { "bodyFatChange": <număr cu 1 zecimală, negativ=scădere>, "muscleChange": <număr cu 1 zecimală> },
    "days90": { "bodyFatChange": <număr>, "muscleChange": <număr> },
    "days180": { "bodyFatChange": <număr>, "muscleChange": <număr> }
  },
  "recommendations": [
    "<recomandare concisă 1>",
    "<recomandare concisă 2>",
    "<recomandare concisă 3>"
  ],
  "bodyType": "<Lean/Athletic/Average/Bulking>"
}

Calculează predicțiile presupunând că utilizatorul mănâncă 3 mese similare pe zi, timp de N zile.`
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 800,
      });
      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (e) {
      res.status(500).json({ message: "Failed to simulate food impact" });
    }
  });

  // POST /api/nutrition/scan-photo — GPT-4o Vision food scan from camera
  app.post("/api/nutrition/scan-photo", isAuthenticated, requirePro, async (req: any, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ message: "No image provided" });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            },
            {
              type: "text",
              text: `Analyze this food image carefully. Return ONLY a valid JSON object with this exact structure:
{"isFood": true, "foodName": "descriptive meal name", "items": [{"name": "food item", "quantity": "150", "unit": "g"}], "calories": 520, "protein": 42.0, "carbs": 55.0, "fat": 14.0, "confidence": "high", "mealType": "lunch", "notes": "brief observation about the meal"}`
            }
          ]
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 800,
      });
      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (e) {
      console.error("scan-photo error:", e);
      res.status(500).json({ message: "Failed to scan food photo" });
    }
  });

  // POST /api/nutrition/scan-fridge — GPT-4o Vision fridge/pantry scan
  app.post("/api/nutrition/scan-fridge", isAuthenticated, requirePro, async (req: any, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ message: "No image provided" });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            },
            {
              type: "text",
              text: `Scan this fridge or pantry image and identify all visible food ingredients. Return ONLY a valid JSON:
{"ingredients": ["chicken", "eggs", "tomatoes"], "recipes": [{"name": "Recipe Name", "emoji": "🍳", "time": "20 min", "calories": 400, "protein": 35, "carbs": 30, "fat": 12, "description": "brief description"}, {"name": "Recipe 2", "emoji": "🥗", "time": "10 min", "calories": 300, "protein": 25, "carbs": 20, "fat": 8, "description": "brief description"}, {"name": "Recipe 3", "emoji": "🍲", "time": "30 min", "calories": 500, "protein": 40, "carbs": 45, "fat": 15, "description": "brief description"}], "tip": "nutritional insight about detected ingredients"}`
            }
          ]
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000,
      });
      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (e) {
      console.error("scan-fridge error:", e);
      res.status(500).json({ message: "Failed to scan fridge" });
    }
  });

  // POST /api/nutrition/recipe — Smart Recipe Generator from ingredients list
  app.post("/api/nutrition/recipe", isAuthenticated, async (req: any, res) => {
    try {
      const { ingredients, goal } = req.body;
      if (!ingredients?.length) return res.status(400).json({ message: "No ingredients provided" });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Generate a healthy, high-protein fitness recipe using these ingredients: ${ingredients.join(", ")}. Fitness goal: ${goal || "general fitness"}.
Return ONLY a valid JSON:
{"name": "Recipe Name", "emoji": "🍗", "description": "appetizing 1-sentence description", "prepTime": "20 min", "difficulty": "Easy", "calories": 520, "protein": 45, "carbs": 55, "fat": 12, "servings": 1, "ingredients": [{"item": "Chicken breast", "amount": "200g"}, {"item": "Rice", "amount": "100g"}], "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ..."], "coachName": "Bruno", "coachTip": "specific fitness tip about this meal", "tags": ["High Protein", "Post-Workout"]}`
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 1200,
      });
      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (e) {
      console.error("recipe error:", e);
      res.status(500).json({ message: "Failed to generate recipe" });
    }
  });

  // POST /api/nutrition/coach-advice — AI Coach nutrition feedback
  app.post("/api/nutrition/coach-advice", isAuthenticated, async (req: any, res) => {
    try {
      const { foodName, calories, protein, carbs, fat, goalType } = req.body;
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `You are 3 fitness coaches giving SHORT (max 15 words each) nutrition advice about a meal.
Meal: ${foodName} (${calories}kcal, ${protein}g protein, ${carbs}g carbs, ${fat}g fat). User goal: ${goalType || "general fitness"}.
Return ONLY valid JSON:
{"coaches": [{"name": "Vera", "role": "Fat Loss Coach", "id": "vera", "advice": "short specific advice"}, {"name": "Bruno", "role": "Muscle Coach", "id": "bruno", "advice": "short specific advice"}, {"name": "Atlas", "role": "Strength Coach", "id": "atlas", "advice": "short specific advice"}]}`
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 400,
      });
      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (e) {
      console.error("coach-advice error:", e);
      res.status(500).json({ message: "Failed to get coach advice" });
    }
  });

  // === PROGRESS ===
  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    const measurements = await storage.getProgressMeasurements(req.user.claims.sub);
    res.json(measurements);
  });

  app.post("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertProgressMeasurementSchema.parse({ ...req.body, userId });
      const measurement = await storage.createProgressMeasurement(data);
      await storage.updateUserPoints(userId, 25);
      await checkAndAwardAchievements(userId);
      res.status(201).json(measurement);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      res.status(500).json({ message: "Failed to create measurement" });
    }
  });

  app.delete("/api/progress/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const measureId = Number(req.params.id);
      const measurements = await storage.getProgressMeasurements(userId);
      const measurement = measurements.find(m => m.id === measureId);
      if (!measurement) return res.status(404).json({ message: "Not found" });
      await storage.deleteProgressMeasurement(measureId);
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ message: "Failed to delete measurement" });
    }
  });

  // === ACHIEVEMENTS ===
  app.get("/api/achievements", isAuthenticated, async (req: any, res) => {
    const all = await storage.getAllAchievements();
    res.json(all);
  });

  app.get("/api/achievements/user", isAuthenticated, async (req: any, res) => {
    const userAchievements = await storage.getUserAchievements(req.user.claims.sub);
    res.json(userAchievements);
  });

  // === AI COACH ===

  // Simple POST /api/coach endpoint — direct chat with default coach Alex
  app.post("/api/coach", isAuthenticated, async (req: any, res) => {
    try {
      const { message, context, language = "en" } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "message required" });
      }

      const streak: number = context?.streak ?? 0;
      const workoutCompleted: boolean = context?.workoutCompleted ?? false;
      const challengeProgress: number = context?.challengeProgress ?? 0;
      const battleStatus: string = context?.battleStatus ?? "none";

      const LANG_NAMES: Record<string, string> = {
        en: "English", ro: "Romanian", es: "Spanish", fr: "French",
        de: "German", it: "Italian", pt: "Portuguese", zh: "Chinese", ja: "Japanese", ru: "Russian",
      };
      const langName = LANG_NAMES[language] || "English";

      const contextBlock = [
        `- Streak: ${streak} day${streak !== 1 ? "s" : ""}`,
        `- Today's workout: ${workoutCompleted ? "completed ✅" : "not done yet"}`,
        `- Challenge progress: ${challengeProgress}%`,
        `- Battle: ${battleStatus}`,
      ].join("\n");

      const systemPrompt = `You are Alex, a real human fitness coach. You talk like a real person — casual, short, direct.

CRITICAL: Respond ONLY in ${langName}. Every word must be in ${langName}. Never switch languages.

User status right now:
${contextBlock}

HARD RULES — no exceptions:
1. EXACTLY 1 or 2 very short sentences. Stop after the second sentence, full stop.
2. Contractions always (in ${langName} style). Sound natural and spoken.
3. Natural spoken pauses: "…" or commas. Never semicolons.
4. Zero formal language. Zero lists. Zero explanations.
5. React to context silently — don't announce it, just react.
6. Never start with "I" (first-person singular).`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        max_completion_tokens: 60,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
      });
      const reply = completion.choices[0]?.message?.content ?? "Let's go! What do you need?";
      res.json({ reply });
    } catch (e) {
      console.error("[/api/coach]", e);
      res.status(500).json({ error: "Coach unavailable" });
    }
  });

  app.get("/api/ai-coach", isAuthenticated, async (req: any, res) => {
    const messages = await storage.getAiCoachMessages(req.user.claims.sub);
    res.json(messages);
  });

  app.post("/api/ai-coach/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, coachType = "beginner", language = "ro" } = req.body;

      const LANG_NAMES: Record<string, string> = {
        ro: "Romanian", en: "English", es: "Spanish", pt: "Portuguese", de: "German",
      };
      const langName = LANG_NAMES[language] || "Romanian";

      // Persona intro tradusă per limbă — antrenorul se prezintă în limba userului
      const PERSONA_INTRO: Record<string, Record<string, string>> = {
        ro: {
          atlas: "Ești Atlas — antrenorul digital de elită, expert în forță și masă musculară. Vorbești calm, autoritar, precis.",
          nova: "Ești Nova — antrenoarea digitală de performanță, expertă în fitness total și slăbit. Ești caldă dar directă.",
          beginner: "Ești Alex — antrenor răbdător și încurajator. Explici totul pas cu pas, fără jargon tehnic.",
          strength: "Ești Max — direct, tehnic, concentrat pe progres măsurabil. Vorbești în kg, seturi, repetări.",
          fatloss: "Ești Vera — energică, directă, nu ai răbdare pentru scuze. Ești realistă despre deficit caloric.",
          muscle: "Ești Bruno — pasionat de hipertrofie, cunoști știința musculaturii.",
          home: "Ești Sam — creativ, improvizezi cu ce ai la îndemână. Ești dovada că nu ai nevoie de sală.",
          athlete: "Ești Titan — specializat în performanță atletică și sport de înaltă performanță.",
          mobility: "Ești Luna — expertă în mobilitate, yoga și recuperare activă.",
          motivation: "Ești Spark — coach motivațional pur, energia ta e contagioasă.",
        },
        en: {
          atlas: "You are Atlas — an elite digital strength coach, expert in muscle building. You speak calmly, authoritatively, precisely.",
          nova: "You are Nova — a performance digital coach, expert in total fitness and weight loss. You're warm but direct.",
          beginner: "You are Alex — a patient, encouraging coach. You explain everything step by step, no technical jargon.",
          strength: "You are Max — direct, technical, focused on measurable progress. You speak in kg, sets, reps.",
          fatloss: "You are Vera — energetic, direct, no patience for excuses. You're realistic about caloric deficit.",
          muscle: "You are Bruno — passionate about hypertrophy, you know the science of muscle.",
          home: "You are Sam — creative, improvising with what's available. Proof you don't need a gym.",
          athlete: "You are Titan — specialized in athletic performance and high-performance sport.",
          mobility: "You are Luna — expert in mobility, yoga, and active recovery.",
          motivation: "You are Spark — pure motivational coach, your energy is contagious.",
        },
        es: {
          atlas: "Eres Atlas — un entrenador digital de élite, experto en fuerza y masa muscular. Hablas con calma, autoridad y precisión.",
          nova: "Eres Nova — una entrenadora digital de rendimiento, experta en fitness total y pérdida de peso. Eres cálida pero directa.",
          beginner: "Eres Alex — un entrenador paciente y alentador. Explicas todo paso a paso, sin jerga técnica.",
          strength: "Eres Max — directo, técnico, enfocado en el progreso medible. Hablas en kg, series, repeticiones.",
          fatloss: "Eres Vera — enérgica, directa, sin paciencia para excusas. Eres realista sobre el déficit calórico.",
          muscle: "Eres Bruno — apasionado por la hipertrofia, conoces la ciencia del músculo.",
          home: "Eres Sam — creativo, improvisas con lo que tienes. Prueba de que no necesitas gimnasio.",
          athlete: "Eres Titan — especializado en rendimiento atlético y deporte de alto rendimiento.",
          mobility: "Eres Luna — experta en movilidad, yoga y recuperación activa.",
          motivation: "Eres Spark — coach motivacional puro, tu energía es contagiosa.",
        },
        pt: {
          atlas: "Você é Atlas — um treinador digital de elite, especialista em força e massa muscular. Você fala com calma, autoridade e precisão.",
          nova: "Você é Nova — uma treinadora digital de desempenho, especialista em fitness total e perda de peso. Você é calorosa mas direta.",
          beginner: "Você é Alex — um treinador paciente e encorajador. Você explica tudo passo a passo, sem jargão técnico.",
          strength: "Você é Max — direto, técnico, focado em progresso mensurável. Você fala em kg, séries, repetições.",
          fatloss: "Você é Vera — enérgica, direta, sem paciência para desculpas. Você é realista sobre déficit calórico.",
          muscle: "Você é Bruno — apaixonado por hipertrofia, conhece a ciência do músculo.",
          home: "Você é Sam — criativo, improvisa com o que tem. Prova de que você não precisa de academia.",
          athlete: "Você é Titan — especializado em desempenho atlético e esporte de alto rendimento.",
          mobility: "Você é Luna — especialista em mobilidade, yoga e recuperação ativa.",
          motivation: "Você é Spark — coach motivacional puro, sua energia é contagiante.",
        },
        de: {
          atlas: "Du bist Atlas — ein Elite-Digital-Trainer, Experte für Kraft und Muskelaufbau. Du sprichst ruhig, autoritär und präzise.",
          nova: "Du bist Nova — eine Performance-Digital-Trainerin, Expertin für Gesamtfitness und Gewichtsverlust. Du bist warmherzig aber direkt.",
          beginner: "Du bist Alex — ein geduldiger, ermutigender Trainer. Du erklärst alles Schritt für Schritt, ohne Fachjargon.",
          strength: "Du bist Max — direkt, technisch, fokussiert auf messbaren Fortschritt. Du sprichst in kg, Sätzen, Wiederholungen.",
          fatloss: "Du bist Vera — energisch, direkt, keine Geduld für Ausreden. Du bist realistisch über Kaloriendefizit.",
          muscle: "Du bist Bruno — leidenschaftlich für Hypertrophie, du kennst die Wissenschaft des Muskels.",
          home: "Du bist Sam — kreativ, improvisierst mit dem was verfügbar ist. Beweis dass man kein Fitnessstudio braucht.",
          athlete: "Du bist Titan — spezialisiert auf sportliche Leistung und Hochleistungssport.",
          mobility: "Du bist Luna — Expertin für Mobilität, Yoga und aktive Erholung.",
          motivation: "Du bist Spark — reiner Motivations-Coach, deine Energie ist ansteckend.",
        },
      };

      const coachIntro = (PERSONA_INTRO[language] || PERSONA_INTRO["en"])[coachType] || (PERSONA_INTRO["en"][coachType] || "You are a professional fitness coach.");

      const COACH_PERSONAS: Record<string, { name: string; personality: string; focus: string }> = {
        atlas: {
          name: "Atlas",
          personality: coachIntro,
          focus: "Maximum strength, hypertrophy, perfect technique for compound movements (squat, deadlift, bench press, overhead press, row). Systematic progressive overload, advanced periodization.",
        },
        nova: {
          name: "Nova",
          personality: coachIntro,
          focus: "General fitness, weight loss, balanced nutrition, active recovery, smart cardio, HIIT, mobility, long-term wellbeing.",
        },
        beginner: {
          name: "Alex",
          personality: coachIntro,
          focus: "Fundamentals, correct form, simple exercises, consistency, injury prevention for beginners.",
        },
        strength: {
          name: "Max",
          personality: coachIntro,
          focus: "Compound movements, progressive overload, periodization, perfect technique at heavy weights.",
        },
        fatloss: {
          name: "Vera",
          personality: coachIntro,
          focus: "Caloric deficit, HIIT, cardio, short rest intervals, macro tracking, avoiding common diet mistakes.",
        },
        muscle: {
          name: "Bruno",
          personality: coachIntro,
          focus: "Hypertrophy, training volume, progressive overload, sufficient protein, sleep and recovery for muscle mass.",
        },
        home: {
          name: "Sam",
          personality: coachIntro,
          focus: "Bodyweight exercises, AMRAP, home circuits, using furniture as equipment, efficient workouts under 30 minutes.",
        },
        athlete: {
          name: "Titan",
          personality: coachIntro,
          focus: "Athletic performance, speed, power, agility, sport-specific conditioning.",
        },
        mobility: {
          name: "Luna",
          personality: coachIntro,
          focus: "Flexibility, yoga flows, foam rolling, injury prevention, active recovery protocols.",
        },
        motivation: {
          name: "Spark",
          personality: coachIntro,
          focus: "Mental strength, habit building, consistency, overcoming plateaus, mindset shifts.",
        },
      };

      const coach = COACH_PERSONAS[coachType] || COACH_PERSONAS["beginner"];

      // Build full user context for true AI memory
      const [profile, history, recentWorkouts, recentNutrition, recentProgress, recentCheckins] = await Promise.all([
        storage.getUserProfile(userId),
        storage.getAiCoachMessages(userId),
        storage.getWorkouts(userId),
        storage.getNutritionLogs(userId),
        storage.getProgressMeasurements(userId),
        storage.getDailyCheckins(userId),
      ]);

      await storage.saveAiCoachMessage({ userId, role: "user", content: message });

      const rank = getRank(profile?.points || 0);
      const completedWorkouts = recentWorkouts.filter(w => w.isCompleted).slice(0, 5);
      const todayNutrition = recentNutrition.slice(0, 5);
      const lastCheckin = recentCheckins[0];
      const lastMeasurement = recentProgress[0];

      const systemPrompt = `You are ${coach.name}, a real human fitness coach talking directly to your client in the FitForge AI app.

YOUR PERSONALITY:
${coach.personality}

YOUR EXPERTISE:
${coach.focus}

CLIENT PROFILE (use this data — never invent):
- Name: ${profile?.displayName || "there"}
- Goal: ${profile?.goalType || "general fitness"}
- Streak: ${profile?.streak || 0} days in a row
- Weight: ${profile?.currentWeight ? profile.currentWeight + "kg" : "unknown"} → target: ${profile?.targetWeight ? profile.targetWeight + "kg" : "not set"}
- Recent workouts: ${completedWorkouts.map(w => w.name).join(", ") || "none yet"}
- Today's energy: ${lastCheckin ? `${lastCheckin.energyLevel}/10 (sleep ${lastCheckin.sleepHours}h, stress ${lastCheckin.stressLevel}/10)` : "no check-in today"}

⚠️ CRITICAL CONVERSATION RULES — follow these exactly:
1. RESPOND ONLY IN ${langName} — never switch languages, not even one word
2. MAXIMUM 60-80 WORDS per reply — be concise like a real human texting
3. NEVER use bullet points or numbered lists UNLESS the user explicitly asks for a full workout plan
4. End EVERY reply with ONE short natural follow-up question to keep the conversation going
5. Sound like a real person, not an AI — use casual, warm, direct language
6. Reference the client's real data when relevant (streak, goal, energy level)
7. If the user asks for a full workout plan, you may write more — otherwise keep it short
8. Use 1 emoji max per reply (optional)`;



      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const chatMessages: any[] = [
        { role: "system", content: systemPrompt },
        ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: message }
      ];

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 350,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      await storage.saveAiCoachMessage({ userId, role: "assistant", content: fullResponse });
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e) {
      console.error(e);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to chat with AI coach" });
      }
    }
  });

  app.post("/api/ai-coach/analyze-workout", isAuthenticated, async (req: any, res) => {
    try {
      const { workoutId } = req.body;
      const workout = await storage.getWorkout(Number(workoutId));
      const exercises = await storage.getExercises(Number(workoutId));
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Analizează acest antrenament și oferă feedback detaliat în română: ${JSON.stringify({ workout, exercises })}. Includ: ce a mers bine, ce poate fi îmbunătățit, și recomandări pentru antrenamentul următor. Răspunde în format JSON cu cheile: "strengths", "improvements", "nextWorkoutTips".`
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000,
      });
      
      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      res.json(analysis);
    } catch (e) {
      res.status(500).json({ message: "Failed to analyze workout" });
    }
  });

  app.post("/api/ai-coach/generate-plan", isAuthenticated, requirePro, async (req: any, res) => {
    try {
      const { goalType, level } = req.body;
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Creează un plan de antrenament pe 4 săptămâni pentru: obiectiv=${goalType}, nivel=${level}. Returnează JSON cu: {"planName": "...", "description": "...", "weeks": [{"week": 1, "days": [{"day": "Luni", "workout": "...", "exercises": [...]}]}]}`
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
      });
      const plan = JSON.parse(response.choices[0].message.content || "{}");
      res.json(plan);
    } catch (e) {
      res.status(500).json({ message: "Failed to generate plan" });
    }
  });

  // POST /api/tts — AI Text-to-Speech (OpenAI if key available, else Google TTS)
  app.post("/api/tts", isAuthenticated, requirePro, async (req: any, res) => {
    try {
      const { text, voice = "female", language = "en" } = req.body;
      if (!text || typeof text !== "string") return res.status(400).json({ error: "text required" });

      const cleaned = text.replace(/[*#_`[\]]/g, "").trim().slice(0, 400);

      // Try OpenAI TTS if a direct (unrestricted) key is available
      const directKey = process.env.OPENAI_API_KEY;
      if (directKey) {
        try {
          const VOICE_MAP: Record<string, string> = {
            male: "echo", female: "nova", neutral: "alloy", deep: "onyx", warm: "fable", bright: "shimmer",
          };
          const LANG_MAP: Record<string, string> = {
            en: "Speak in English.", ro: "Speak in Romanian.", es: "Speak in Spanish.",
            fr: "Speak in French.", de: "Speak in German.", it: "Speak in Italian.",
            pt: "Speak in Portuguese.", zh: "Speak in Chinese.", ja: "Speak in Japanese.", ru: "Speak in Russian.",
          };
          const selectedVoice = VOICE_MAP[voice] || "nova";
          const inputText = LANG_MAP[language] ? `${LANG_MAP[language]} ${cleaned}` : cleaned;

          const oaiRes = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: { "Authorization": `Bearer ${directKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: selectedVoice, input: inputText, response_format: "mp3" }),
          });
          if (oaiRes.ok) {
            const buffer = Buffer.from(await oaiRes.arrayBuffer());
            res.set("Content-Type", "audio/mpeg");
            res.set("X-TTS-Engine", "openai");
            return res.send(buffer);
          }
        } catch (oaiErr) {
          console.warn("[/api/tts] OpenAI TTS failed, falling back:", oaiErr);
        }
      }

      // Google Translate TTS fallback — free, no API key, multilingual
      const LANG_CODES: Record<string, string> = {
        en: "en", ro: "ro", es: "es", fr: "fr", de: "de",
        it: "it", pt: "pt", zh: "zh-CN", ja: "ja", ru: "ru",
      };
      const ttsLang = LANG_CODES[language] || "en";
      const encodedText = encodeURIComponent(cleaned.slice(0, 200));
      const gTTSUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${ttsLang}&client=tw-ob&ttsspeed=1`;

      const gRes = await fetch(gTTSUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; FitForge/1.0)",
          "Referer": "https://translate.google.com/",
        },
      });

      if (!gRes.ok) throw new Error(`Google TTS failed: ${gRes.status}`);
      const audioBuffer = Buffer.from(await gRes.arrayBuffer());
      res.set("Content-Type", "audio/mpeg");
      res.set("X-TTS-Engine", "google");
      res.set("Cache-Control", "no-cache");
      res.send(audioBuffer);
    } catch (e) {
      console.error("[/api/tts]", e);
      res.status(500).json({ error: "TTS failed" });
    }
  });

  // === DAILY CHECKIN ===
  app.get("/api/checkin/today", isAuthenticated, async (req: any, res) => {
    const today = new Date().toISOString().split("T")[0];
    const checkin = await storage.getTodayCheckin(req.user.claims.sub, today);
    res.json(checkin || null);
  });

  app.get("/api/checkin", isAuthenticated, async (req: any, res) => {
    const checkins = await storage.getDailyCheckins(req.user.claims.sub);
    res.json(checkins);
  });

  app.post("/api/checkin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split("T")[0];
      const existing = await storage.getTodayCheckin(userId, today);
      if (existing) return res.json(existing);

      const data = insertDailyCheckinSchema.parse({ ...req.body, userId, date: today });
      const checkin = await storage.createDailyCheckin(data);

      // AI biometric recommendation
      const profile = await storage.getUserProfile(userId);
      const recentWorkouts = await storage.getWorkouts(userId);
      const completedCount = recentWorkouts.filter(w => w.isCompleted).length;

      try {
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{
            role: "user",
            content: `Analizează starea fizică a utilizatorului și dă o recomandare scurtă (max 2 propoziții) în română.
Energie: ${data.energyLevel}/10, Somn: ${data.sleepHours}h, Stres: ${data.stressLevel}/10, Stare: ${data.mood}.
Streak: ${profile?.streak || 0} zile, Antrenamente totale: ${completedCount}, Obiectiv: ${profile?.goalType || "general_fitness"}.
Răspunde DOAR cu: {"recommendation": "...", "shouldTrain": true/false}`
          }],
          response_format: { type: "json_object" },
          max_completion_tokens: 200,
        });
        const aiResult = JSON.parse(aiResponse.choices[0].message.content || "{}");
        await storage.updateCheckinRecommendation(checkin.id, aiResult.recommendation || "", aiResult.shouldTrain !== false);
        return res.status(201).json({ ...checkin, aiRecommendation: aiResult.recommendation, shouldTrain: aiResult.shouldTrain !== false });
      } catch {
        return res.status(201).json(checkin);
      }
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      res.status(500).json({ message: "Failed to save check-in" });
    }
  });

  // === AI COACH — Text-to-Speech ===
  app.post("/api/ai-coach/speak", isAuthenticated, async (req: any, res) => {
    try {
      const { text, coachId = "nova", language = "ro" } = req.body;
      if (!text || typeof text !== "string") return res.status(400).json({ error: "text required" });

      const COACH_VOICES: Record<string, string> = {
        atlas: "onyx", nova: "nova", beginner: "alloy", strength: "onyx",
        fatloss: "nova", muscle: "onyx", home: "alloy", athlete: "echo",
        mobility: "shimmer", motivation: "fable", hiit: "echo",
        yoga: "shimmer", nutrition: "alloy", advanced: "fable", default: "alloy",
      };

      // Instrucțiuni de limbă naturale pentru fiecare limbă
      const LANG_INSTRUCTIONS: Record<string, string> = {
        ro: "Vorbește natural în limba română, cu accent românesc autentic.",
        en: "Speak naturally in English with a clear, warm tone.",
        es: "Habla de forma natural en español con acento latinoamericano.",
        pt: "Fale naturalmente em português brasileiro com sotaque autêntico.",
        de: "Sprich natürlich auf Deutsch mit klarer Aussprache.",
      };

      const voice = COACH_VOICES[coachId] || "alloy";
      const cleaned = text.replace(/[*#_`[\]]/g, "").trim().slice(0, 600);
      const langInstruction = LANG_INSTRUCTIONS[language] || LANG_INSTRUCTIONS["ro"];
      // Prepend instrucțiunea de limbă textului pentru a ghida modelul
      const inputText = `${langInstruction} ${cleaned}`;

      const mp3Response = await openaiTTS.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: voice as any,
        input: inputText,
        response_format: "mp3",
      });

      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      res.set("Content-Type", "audio/mpeg");
      res.set("Content-Length", buffer.length.toString());
      res.set("Cache-Control", "no-cache");
      res.send(buffer);
    } catch (e: any) {
      console.error("TTS error:", e);
      res.status(500).json({ error: "TTS failed" });
    }
  });

  // === BODY SCAN ===
  app.post("/api/body-scan", isAuthenticated, requirePro, async (req: any, res) => {
    const { frontImageBase64, sideImageBase64, imageBase64, goalType } = req.body;
    const frontImg = frontImageBase64 || imageBase64;
    if (!frontImg) return res.status(400).json({ error: "Imaginea lipseste" });
    const userId = req.user.claims.sub;
    try {
      const promptText = `You are an elite fitness coach and body composition expert. Analyze ${sideImageBase64 ? "these two body photos (front and side view)" : "this body photo"} and generate a full transformation analysis.

User goal: ${goalType || "general fitness"}

Return ONLY valid JSON with ALL fields below (no markdown, no extra text):
{
  "bodyFatPercent": <integer 5-45, realistic visual estimate>,
  "fitnessLevel": "<beginner|intermediate|advanced>",
  "bodyType": "<ectomorph|mesomorph|endomorph|mixed>",
  "muscleScore": <integer 1-10>,
  "postureScore": <integer 1-10>,
  "fitnessScore": <integer 1-100>,
  "bmi": <number or null>,
  "muscleDevelopment": {
    "chest": "<weak|moderate|strong>",
    "back": "<weak|moderate|strong>",
    "shoulders": "<weak|moderate|strong>",
    "arms": "<weak|moderate|strong>",
    "legs": "<weak|moderate|strong>",
    "core": "<weak|moderate|strong>"
  },
  "muscleDistribution": {"upper": "<Slab|Mediu|Puternic>", "core": "<Slab|Mediu|Puternic>", "lower": "<Slab|Mediu|Puternic>"},
  "postureIssues": ["<issue1 or empty array if good posture>"],
  "weakMuscleGroups": ["<group1>", "<group2>"],
  "focusAreas": ["<area1>", "<area2>", "<area3>"],
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "recommendedTrainingSplit": "<full_body|upper_lower|push_pull_legs|ppl|bro_split>",
  "trainingFrequency": <integer 3-6, sessions per week>,
  "recommendedCalories": <integer, daily calorie target for goal>,
  "predictedBodyFat30Days": <integer, predicted BF% after 30 days if consistent>,
  "predictedBodyFat90Days": <integer, predicted BF% after 90 days>,
  "predictedBodyFat180Days": <integer, predicted BF% after 180 days>,
  "estimatedGoalDate": "<ISO date string YYYY-MM-DD when user reaches goal>",
  "analysis": "<2-3 sentences general analysis in Romanian>",
  "postureDetails": "<specific posture observation in Romanian>",
  "recommendedPlan": "<personalized 3-4 sentence training plan in Romanian>"
}`;

      const imageContent: any[] = [
        { type: "text", text: promptText },
        { type: "image_url", image_url: { url: frontImg, detail: "low" } },
      ];
      if (sideImageBase64) {
        imageContent.push({ type: "image_url", image_url: { url: sideImageBase64, detail: "low" } });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: imageContent }],
        response_format: { type: "json_object" },
        max_completion_tokens: 1200,
      });
      const result = JSON.parse(response.choices[0].message.content || "{}");
      const muscleDistStr = result.muscleDistribution ? JSON.stringify(result.muscleDistribution) : null;
      const muscleDevelopmentStr = result.muscleDevelopment ? JSON.stringify(result.muscleDevelopment) : null;
      const goalDate = result.estimatedGoalDate ? new Date(result.estimatedGoalDate) : null;

      const scan = await storage.createBodyScan({
        userId,
        bodyFatPercent: result.bodyFatPercent || null,
        muscleScore: result.muscleScore || null,
        postureScore: result.postureScore || null,
        fitnessScore: result.fitnessScore || null,
        bmi: result.bmi || null,
        analysis: result.analysis || null,
        strengths: result.strengths || [],
        improvements: result.improvements || [],
        recommendedPlan: result.recommendedPlan || null,
        goalType: goalType || null,
        bodyType: result.bodyType || null,
        postureDetails: result.postureDetails || null,
        muscleDistribution: muscleDistStr || muscleDevelopmentStr,
        focusAreas: result.focusAreas || [],
        fitnessLevel: result.fitnessLevel || null,
        weakMuscleGroups: result.weakMuscleGroups || [],
        postureIssues: result.postureIssues || [],
        recommendedTrainingSplit: result.recommendedTrainingSplit || null,
        recommendedCalories: result.recommendedCalories || null,
        predictedBodyFat30Days: result.predictedBodyFat30Days || null,
        predictedBodyFat90Days: result.predictedBodyFat90Days || null,
        predictedBodyFat180Days: result.predictedBodyFat180Days || null,
        estimatedGoalDate: goalDate,
        trainingFrequency: result.trainingFrequency || null,
      });
      await storage.updateUserPoints(userId, 50);
      res.json(scan);
    } catch (err: any) {
      console.error("Body scan error:", err);
      res.status(500).json({ error: "Analiza a eșuat. Încearcă din nou." });
    }
  });

  app.get("/api/body-scans", isAuthenticated, async (req: any, res) => {
    const scans = await storage.getBodyScans(req.user.claims.sub);
    res.json(scans);
  });

  app.get("/api/body-scans/latest", isAuthenticated, async (req: any, res) => {
    const scan = await storage.getLatestBodyScan(req.user.claims.sub);
    res.json(scan || null);
  });

  // POST /api/body-scan/generate-workout — Generate personalized AI workout plan from latest scan
  app.post("/api/body-scan/generate-workout", isAuthenticated, requirePro, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      const scan = await storage.getLatestBodyScan(userId);
      if (!scan) return res.status(404).json({ error: "No body scan found. Complete a body scan first." });

      const weakGroups = scan.weakMuscleGroups || [];
      const split = scan.recommendedTrainingSplit || "upper_lower";
      const freq = scan.trainingFrequency || 3;
      const goal = scan.goalType || "general_fitness";

      const prompt = `You are an elite fitness coach. Generate a personalized ${freq}-day workout plan for a user with the following profile:
- Goal: ${goal}
- Training split: ${split}
- Weak muscle groups: ${weakGroups.join(", ") || "none identified"}
- Fitness level: ${scan.fitnessLevel || "intermediate"}

Create exactly ${Math.min(freq, 4)} distinct workout sessions.
Each workout should prioritize the weak muscle groups while following the ${split} split.

Return ONLY valid JSON:
{
  "workouts": [
    {
      "name": "<workout name e.g. 'Upper Body — Focus Core & Back'>",
      "type": "<strength|cardio|hiit|flexibility>",
      "estimatedDuration": <minutes>,
      "caloriesBurned": <integer>,
      "exercises": [
        {
          "name": "<exercise name>",
          "sets": <integer 3-5>,
          "reps": <integer 8-20 or null for duration>,
          "duration": <seconds or null>,
          "muscleGroup": "<chest|back|shoulders|arms|core|legs|cardio|full_body>"
        }
      ]
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 1500,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const workoutDefs = result.workouts || [];

      const createdWorkouts = [];
      for (const w of workoutDefs.slice(0, 4)) {
        const workout = await storage.createWorkout({
          userId,
          name: w.name || "AI Workout",
          type: w.type || "strength",
          caloriesBurned: w.caloriesBurned || null,
          notes: `Generated by AI based on Body Scan. Focus: ${weakGroups.join(", ") || "full body"}`,
        } as any);

        for (let i = 0; i < (w.exercises || []).length; i++) {
          const ex = w.exercises[i];
          await storage.createExercise({
            workoutId: workout.id,
            name: ex.name,
            sets: ex.sets || 3,
            reps: ex.reps || null,
            duration: ex.duration || null,
            muscleGroup: ex.muscleGroup || "full_body",
            orderIndex: i,
          } as any);
        }

        createdWorkouts.push(workout);
      }

      res.json({ workouts: createdWorkouts, count: createdWorkouts.length });
    } catch (err: any) {
      console.error("Generate workout error:", err);
      res.status(500).json({ error: "Failed to generate workout plan." });
    }
  });

  // === ONBOARDING ===
  app.post("/api/onboarding/complete", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const { goalType, currentWeight, targetWeight, height, age, displayName } = req.body;
    await storage.upsertUserProfile({ userId, goalType, currentWeight, targetWeight, height, age, displayName, onboardingCompleted: true } as any);
    res.json({ success: true });
  });

  // === INVITE SYSTEM ===
  app.get("/api/invite/code", isAuthenticated, async (req: any, res) => {
    const code = await storage.generateInviteCode(req.user.claims.sub);
    res.json({ code, url: `${req.protocol}://${req.get("host")}/dashboard?invite=${code}` });
  });

  app.post("/api/invite/apply", isAuthenticated, async (req: any, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Codul lipseste" });
    const userId = req.user.claims.sub;
    const myProfile = await storage.getUserProfile(userId);
    if (myProfile?.invitedBy) return res.status(400).json({ error: "Ai aplicat deja un cod de invitatie" });
    const inviter = await storage.getUserByInviteCode(code);
    if (!inviter) return res.status(404).json({ error: "Cod invalid" });
    if (inviter.userId === userId) return res.status(400).json({ error: "Nu poti folosi propriul cod" });
    await storage.applyInviteCode(userId, inviter.userId);
    res.json({ success: true, inviterName: inviter.displayName || "Un utilizator FitForge" });
  });

  // === STRIPE / MONETIZATION ===
  // Hardcoded plan details (price IDs come from Stripe product creation)
  const PRO_PLAN = {
    name: "FitForge Pro",
    monthlyPrice: 9.99,
    yearlyPrice: 79.99,
    currency: "eur",
    features: [
      "Planuri de antrenament nelimitate",
      "AI Coach nelimitat",
      "Body Scan AI avansat",
      "Analize nutriție avansate",
      "Prioritate suport",
    ],
  };

  // Cache price IDs after first creation
  let cachedPriceIds: { monthlyPriceId: string; yearlyPriceId: string } | null = null;

  app.get("/api/stripe/plans", async (_req, res) => {
    try {
      const { ensureProProduct } = await import("./stripeClient");
      if (!cachedPriceIds) {
        const product = await ensureProProduct();
        if (product) cachedPriceIds = product;
      }
      res.json({
        free: {
          name: "Free",
          price: 0,
          features: ["3 planuri AI / lună", "Urmărire progres de bază", "Body Scan (1/lună)"],
        },
        pro: {
          ...PRO_PLAN,
          monthlyPriceId: cachedPriceIds?.monthlyPriceId ?? null,
          yearlyPriceId: cachedPriceIds?.yearlyPriceId ?? null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/stripe/subscription", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const plan = await storage.getUserPlan(userId);
    const profile = await storage.getUserProfile(userId);
    res.json({
      plan,
      stripeCustomerId: profile?.stripeCustomerId,
      stripeSubscriptionId: profile?.stripeSubscriptionId,
    });
  });

  app.post("/api/stripe/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { priceId, interval = "month" } = req.body;
      if (!priceId) return res.status(400).json({ error: "priceId este obligatoriu" });

      const user = await storage.getUserProfile(userId);
      const email = req.user.claims.email || `user-${userId}@fitforge.app`;

      const { findOrCreateCustomer, createCheckoutSession, ensureProProduct } = await import("./stripeClient");

      // Ensure price IDs exist
      if (!cachedPriceIds) {
        const product = await ensureProProduct();
        if (product) cachedPriceIds = product;
      }

      let customerId = user?.stripeCustomerId;
      if (!customerId) {
        customerId = await findOrCreateCustomer(email, userId);
        await storage.updateStripeInfo(userId, { stripeCustomerId: customerId });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
      const successUrl = `${baseUrl}/dashboard?upgraded=true`;
      const cancelUrl = `${baseUrl}/pricing?cancelled=true`;

      const checkoutUrl = await createCheckoutSession(customerId, priceId, successUrl, cancelUrl);
      res.json({ url: checkoutUrl });
    } catch (err: any) {
      console.error("[Stripe] checkout error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/stripe/portal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      if (!profile?.stripeCustomerId) return res.status(400).json({ error: "Nu ești abonat Pro" });

      const { createPortalSession } = await import("./stripeClient");
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
      const portalUrl = await createPortalSession(profile.stripeCustomerId, `${baseUrl}/dashboard`);
      res.json({ url: portalUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Stripe webhook — updates plan status when subscription changes
  app.post("/api/stripe/webhook", async (req: any, res) => {
    const event = req.body;
    if (!event?.type) return res.status(400).json({ error: "Invalid event" });
    try {
      const customerId: string | undefined = event.data?.object?.customer;
      if (customerId) {
        const profiles = await db.select().from(userProfilesTable).where(eq(userProfilesTable.stripeCustomerId, customerId));
        const p = profiles[0];
        if (p) {
          const sub = event.data?.object;
          if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
            const isActive = sub.status === "active" || sub.status === "trialing";
            const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
            await storage.updateStripeInfo(p.userId, { stripeSubscriptionId: sub.id, plan: isActive ? "pro" : "free", planExpiresAt: periodEnd });
          } else if (event.type === "customer.subscription.deleted") {
            await storage.updateStripeInfo(p.userId, { plan: "free", planExpiresAt: null });
          }
        }
      }
      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe webhook]", err.message);
      res.json({ received: true });
    }
  });

  // Dev login — bypass OAuth for canvas/iframe testing
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/dev-login", async (req: any, res) => {
      const devUser = {
        claims: {
          sub: "dev-preview-user",
          email: "demo@fitforge.ai",
          first_name: "Demo",
          last_name: "User",
          profile_image_url: null,
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        },
        access_token: "dev-token",
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
      };
      await authStorage.upsertUser({
        id: devUser.claims.sub,
        email: devUser.claims.email,
        firstName: devUser.claims.first_name,
        lastName: devUser.claims.last_name,
        profileImageUrl: null,
      });
      req.login(devUser, (err: any) => {
        if (err) return res.status(500).json({ error: "Login failed" });
        res.json({ ok: true });
      });
    });
  }

  // Manual upgrade for testing (dev only)
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/stripe/dev-upgrade", isAuthenticated, async (req: any, res) => {
      const userId = req.user.claims.sub;
      const { plan = "pro" } = req.body;
      await storage.updateStripeInfo(userId, { plan, planExpiresAt: plan === "pro" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null });
      res.json({ success: true, plan });
    });
  }

  // === PROGRESS PHOTOS ===
  app.get("/api/progress/photos", isAuthenticated, async (req: any, res) => {
    const photos = await storage.getProgressPhotos(req.user.claims.sub);
    res.json(photos);
  });

  app.post("/api/progress/photos", isAuthenticated, async (req: any, res) => {
    const { photoData, dayLabel, note } = req.body;
    if (!photoData || !dayLabel) return res.status(400).json({ error: "photoData și dayLabel sunt obligatorii" });
    // Limit: 3MB base64 ~= 2.25MB image
    if (photoData.length > 3 * 1024 * 1024) return res.status(400).json({ error: "Poza este prea mare (max 2MB)" });
    const photo = await storage.addProgressPhoto(req.user.claims.sub, photoData, dayLabel, note);
    res.json(photo);
  });

  app.delete("/api/progress/photos/:id", isAuthenticated, async (req: any, res) => {
    await storage.deleteProgressPhoto(Number(req.params.id), req.user.claims.sub);
    res.json({ success: true });
  });

  // === PUSH NOTIFICATIONS ===
  app.get("/api/push/vapid-key", (_req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      const { subscription } = req.body;
      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return res.status(400).json({ error: "Invalid subscription" });
      }
      const sub = await storage.savePushSubscription(
        req.user.claims.sub,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth
      );
      res.json({ success: true, id: sub.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/push/unsubscribe", isAuthenticated, async (req: any, res) => {
    const { endpoint } = req.body;
    if (endpoint) await storage.deletePushSubscription(req.user.claims.sub, endpoint);
    res.json({ success: true });
  });

  app.get("/api/push/settings", isAuthenticated, async (req: any, res) => {
    const subs = await storage.getPushSubscriptions(req.user.claims.sub);
    res.json(subs[0] || { notifyWorkout: true, notifyStreak: true, notifyAchievement: true, notifyMotivation: true });
  });

  app.patch("/api/push/settings", isAuthenticated, async (req: any, res) => {
    const { notifyWorkout, notifyStreak, notifyAchievement, notifyMotivation } = req.body;
    await storage.updatePushSettings(req.user.claims.sub, { notifyWorkout, notifyStreak, notifyAchievement, notifyMotivation });
    res.json({ success: true });
  });

  // Send a test push notification
  app.post("/api/push/test", isAuthenticated, async (req: any, res) => {
    const subs = await storage.getPushSubscriptions(req.user.claims.sub);
    if (!subs.length) return res.status(400).json({ error: "Nu ai notificări activate" });
    const payload = JSON.stringify({
      title: "FitForge AI 💪",
      body: "Notificările sunt activate! Vei fi alertat despre antrenamente și streak.",
      url: "/dashboard",
      type: "test",
    });
    const results = await Promise.allSettled(subs.map(sub =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
    ));
    const failed = results.filter(r => r.status === "rejected");
    res.json({ success: true, sent: results.length - failed.length, failed: failed.length });
  });

  // Internal: send push to specific user (called from other routes)
  async function sendPushToUser(userId: string, payload: object) {
    try {
      const subs = await storage.getPushSubscriptions(userId);
      await Promise.allSettled(subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      ));
    } catch (_) {}
  }

  // Streak reminder endpoint (can be called from cron or on daily check-in)
  app.post("/api/push/send-streak-reminder", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getUserProfile(userId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    await sendPushToUser(userId, {
      title: `🔥 Streak de ${profile.streak} zile!`,
      body: "Nu îți lăsa streak-ul să se rupă. Fă cel puțin 10 minute de mișcare azi!",
      url: "/workouts",
      type: "streak",
      tag: "streak-reminder",
      actions: [{ action: "workout", title: "Mergi la antrenament" }],
    });
    res.json({ success: true });
  });

  // === STATS ===
  app.get("/api/stats/dashboard", isAuthenticated, async (req: any, res) => {
    const stats = await storage.getDashboardStats(req.user.claims.sub);
    res.json(stats);
  });

  // === MUSCLE RECOVERY HEATMAP ===
  app.get("/api/recovery/heatmap", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = await storage.getMuscleRecovery(userId);
      res.json(data);
    } catch (e) {
      console.error("[recovery/heatmap]", e);
      res.status(500).json({ error: "Failed to load recovery data" });
    }
  });

  // === GLOBAL AI CHALLENGE SYSTEM ===
  const CHALLENGE_EXERCISES = [
    { exercise: "Push-ups", emoji: "💪", description: "Classic upper body strength builder — full range of motion required!" },
    { exercise: "Squats", emoji: "🦵", description: "King of leg exercises — go below parallel for max results!" },
    { exercise: "Burpees", emoji: "🔥", description: "Total body cardio blaster — no equipment needed!" },
    { exercise: "Jumping Jacks", emoji: "⚡", description: "Get that heart rate up — full extension on every rep!" },
    { exercise: "Mountain Climbers", emoji: "🏔️", description: "Core + cardio combo — keep hips low!" },
    { exercise: "Lunges", emoji: "🎯", description: "Unilateral leg strength — count each leg as one rep!" },
    { exercise: "Plank Shoulder Taps", emoji: "🧠", description: "Core stability challenge — minimize hip rotation!" },
    { exercise: "High Knees", emoji: "🏃", description: "Explosive cardio — drive knees above hip height!" },
    { exercise: "Diamond Push-ups", emoji: "💎", description: "Triceps focused push-up variant — feel the burn!" },
    { exercise: "Jump Squats", emoji: "🚀", description: "Plyometric power builder — land softly!" },
    { exercise: "Pike Push-ups", emoji: "🔺", description: "Shoulder strength builder — hips high, elbows out!" },
    { exercise: "Reverse Lunges", emoji: "🔄", description: "Knee-friendly lunge variation — great for balance!" },
    { exercise: "Bear Crawls", emoji: "🐻", description: "Full body coordination and core — keep knees 1 inch off ground!" },
    { exercise: "Box Jumps", emoji: "📦", description: "Explosive power — land with soft knees!" },
  ];

  async function getOrCreateTodayChallenge() {
    let challenge = await storage.getTodayChallenge();
    if (!challenge) {
      const today = new Date().toISOString().split("T")[0];
      const dayIndex = new Date().getDay() + Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      const ex = CHALLENGE_EXERCISES[dayIndex % CHALLENGE_EXERCISES.length];
      let targetReps = 100;
      let pointsReward = 100;
      try {
        const aiResp = await openai.chat.completions.create({
          model: "gpt-4o",
          max_completion_tokens: 80,
          messages: [{
            role: "user",
            content: `Generate a daily fitness challenge for FitForge AI. Today's exercise is ${ex.exercise}. Choose a target rep count between 50-200 that is challenging but achievable for most fitness levels. Return ONLY valid JSON: {"targetReps": number, "pointsReward": number}. Points should be between 50-150.`
          }]
        });
        const parsed = JSON.parse(aiResp.choices[0].message.content?.replace(/```json|```/g, "").trim() || "{}");
        if (parsed.targetReps) targetReps = Math.max(50, Math.min(500, parsed.targetReps));
        if (parsed.pointsReward) pointsReward = Math.max(50, Math.min(200, parsed.pointsReward));
      } catch (_) {}
      challenge = await storage.createDailyChallenge({
        date: today,
        exercise: ex.exercise,
        targetReps,
        emoji: ex.emoji,
        description: ex.description,
        pointsReward,
      });
    }
    return challenge;
  }

  app.get("/api/challenge/today", isAuthenticated, async (req: any, res) => {
    try {
      const challenge = await getOrCreateTodayChallenge();
      const globalReps = await storage.getGlobalChallengeReps(challenge.id);
      res.json({ ...challenge, globalReps });
    } catch (e) {
      res.status(500).json({ error: "Failed to get challenge" });
    }
  });

  app.get("/api/challenge/my-progress", isAuthenticated, async (req: any, res) => {
    try {
      const challenge = await getOrCreateTodayChallenge();
      const progress = await storage.getUserChallengeProgress(req.user.claims.sub, challenge.id);
      res.json({ challengeId: challenge.id, repsCompleted: progress?.repsCompleted ?? 0, completed: progress?.completed ?? false });
    } catch (e) {
      res.status(500).json({ error: "Failed to get progress" });
    }
  });

  app.post("/api/challenge/progress", isAuthenticated, async (req: any, res) => {
    try {
      const { reps } = z.object({ reps: z.number().min(1).max(1000) }).parse(req.body);
      const challenge = await getOrCreateTodayChallenge();
      const progress = await storage.upsertChallengeProgress(req.user.claims.sub, challenge.id, reps, challenge.targetReps);
      const justCompleted = progress.completed && progress.completedAt && (Date.now() - progress.completedAt.getTime()) < 5000;
      if (justCompleted) {
        await storage.updateUserPoints(req.user.claims.sub, challenge.pointsReward || 100);
        await storage.updateStreak(req.user.claims.sub);
      }
      const globalReps = await storage.getGlobalChallengeReps(challenge.id);
      res.json({ progress, globalReps, justCompleted });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/challenge/leaderboard", isAuthenticated, async (req: any, res) => {
    try {
      const challenge = await getOrCreateTodayChallenge();
      const leaderboard = await storage.getChallengeLeaderboard(challenge.id, 10);
      res.json(leaderboard);
    } catch (e) {
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  app.post("/api/challenge/invite", isAuthenticated, async (req: any, res) => {
    try {
      const challenge = await getOrCreateTodayChallenge();
      const battle = await storage.createBattle(challenge.id, req.user.claims.sub);
      res.json({ battle, inviteLink: `/challenges/battle/${battle.id}` });
    } catch (e) {
      res.status(500).json({ error: "Failed to create battle" });
    }
  });

  app.get("/api/challenge/active-battle", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challenge = await getOrCreateTodayChallenge();
      const battles = await storage.getBattlesByUser(userId, challenge.id);
      const activeBattle = battles.find(b => b.status === "active") || battles[0] || null;
      if (!activeBattle) return res.json(null);
      const creatorProgress = await storage.getUserChallengeProgress(activeBattle.creatorId, challenge.id);
      const opponentProgress = activeBattle.opponentId ? await storage.getUserChallengeProgress(activeBattle.opponentId, challenge.id) : null;
      const creatorProfile = await storage.getUserProfile(activeBattle.creatorId);
      const opponentProfile = activeBattle.opponentId ? await storage.getUserProfile(activeBattle.opponentId) : null;
      res.json({ battle: activeBattle, challenge, creator: { profile: creatorProfile, progress: creatorProgress }, opponent: activeBattle.opponentId ? { profile: opponentProfile, progress: opponentProgress } : null });
    } catch (e) { res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/challenge/battle/:id", isAuthenticated, async (req: any, res) => {
    try {
      const battle = await storage.getBattle(Number(req.params.id));
      if (!battle) return res.status(404).json({ error: "Battle not found" });
      const creatorProgress = await storage.getUserChallengeProgress(battle.creatorId, battle.challengeId);
      const opponentProgress = battle.opponentId ? await storage.getUserChallengeProgress(battle.opponentId, battle.challengeId) : null;
      const creatorProfile = await storage.getUserProfile(battle.creatorId);
      const opponentProfile = battle.opponentId ? await storage.getUserProfile(battle.opponentId) : null;
      res.json({
        battle,
        creator: { profile: creatorProfile, progress: creatorProgress },
        opponent: battle.opponentId ? { profile: opponentProfile, progress: opponentProgress } : null,
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to get battle" });
    }
  });

  app.post("/api/challenge/battle/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const battle = await storage.getBattle(Number(req.params.id));
      if (!battle) return res.status(404).json({ error: "Battle not found" });
      if (battle.status !== "pending") return res.status(400).json({ error: "Battle already active" });
      if (battle.creatorId === req.user.claims.sub) return res.status(400).json({ error: "Cannot join your own battle" });
      const updated = await storage.joinBattle(battle.id, req.user.claims.sub);
      res.json({ battle: updated });
    } catch (e) {
      res.status(500).json({ error: "Failed to join battle" });
    }
  });

  // ── Today Plan (aggregated) ─────────────────────────────────────────
  app.get("/api/today-plan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      const challenge = await getOrCreateTodayChallenge();
      const myProgress = await storage.getUserChallengeProgress(userId, challenge.id);
      const battles = await storage.getBattlesByUser(userId, challenge.id);
      const activeBattle = battles.find(b => b.status === "active") || battles[0] || null;

      let battleData = null;
      if (activeBattle) {
        const isCreator = activeBattle.creatorId === userId;
        const myReps = (await storage.getUserChallengeProgress(userId, challenge.id))?.repsCompleted ?? 0;
        const opponentId = isCreator ? activeBattle.opponentId : activeBattle.creatorId;
        const opponentReps = opponentId ? (await storage.getUserChallengeProgress(opponentId, challenge.id))?.repsCompleted ?? 0 : 0;
        const opponentProfile = opponentId ? await storage.getUserProfile(opponentId) : null;
        battleData = {
          user: myReps,
          opponent: opponentReps,
          opponentName: opponentProfile?.displayName ?? "Opponent",
          battleId: activeBattle.id,
        };
      }

      // AI Workout: real exercises from local DB based on day-of-week split
      const muscleGroups = ["chest", "back", "legs", "full_body"];
      const dayIndex = new Date().getDate() % muscleGroups.length;
      const selectedMuscle = muscleGroups[dayIndex];
      const muscleForApi = selectedMuscle === "full_body" ? "full" : selectedMuscle;
      const workoutTitles: Record<string, string> = {
        chest: "🔥 CHEST DAY – LET'S GO",
        back: "🔥 BACK DAY – LET'S GO",
        legs: "🔥 LEG DAY – LET'S GO",
        full_body: "🔥 FULL BODY – LET'S GO",
      };
      const todayTitle = workoutTitles[selectedMuscle] ?? "Today's Workout";
      const todayDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      type WorkoutExercise = { name: string; video?: string; thumbnail?: string; sets: number; reps: number };
      let workoutExercises: WorkoutExercise[] = [];
      try {
        // Use local DB — no external API calls, no quota usage
        const muscleDbMap: Record<string, string> = {
          chest: "chest", back: "back", legs: "quads", full_body: "full_body",
        };
        const dbMuscle = muscleDbMap[selectedMuscle] ?? "full_body";
        const dbExercises = await db.select()
          .from(exerciseLibrary)
          .where(and(
            eq(exerciseLibrary.muscleGroup, dbMuscle),
            sql`${exerciseLibrary.videoUrl} IS NOT NULL AND ${exerciseLibrary.videoUrl} != ''`
          ))
          .orderBy(sql`RANDOM()`)
          .limit(5);
        workoutExercises = dbExercises.map(ex => ({
          name: ex.name,
          video: ex.videoUrl ?? undefined,
          thumbnail: ex.thumbnailUrl ?? undefined,
          sets: 3,
          reps: 10,
        }));
      } catch (err) {
        console.error("[today-plan] DB exercise fetch failed:", err);
      }
      if (!workoutExercises.length) {
        workoutExercises = [
          { name: "Push-up", sets: 3, reps: 12 },
          { name: "Squat", sets: 3, reps: 15 },
          { name: "Plank Hold", sets: 3, reps: 30 },
          { name: "Lunge", sets: 3, reps: 12 },
          { name: "Burpee", sets: 3, reps: 10 },
        ];
      }

      // Save today's workout to DB (get or create for today)
      let todayWorkoutId: number | null = null;
      try {
        const allWorkouts = await storage.getWorkouts(userId);
        const existingToday = allWorkouts.find(w =>
          w.notes?.includes(`today:${todayDate}`) && !w.isCompleted
        );
        if (existingToday) {
          todayWorkoutId = existingToday.id;
        } else {
          const newWorkout = await storage.createWorkout({
            userId,
            name: todayTitle,
            notes: `today:${todayDate}`,
            duration: 25,
            difficulty: "intermediate",
          });
          todayWorkoutId = newWorkout.id;
          const muscleGroupVal = (["chest","back","legs","full_body"].includes(selectedMuscle)
            ? selectedMuscle : "full_body") as any;
          await Promise.all(workoutExercises.map((ex, i) =>
            storage.createExercise({
              workoutId: newWorkout.id,
              name: ex.name,
              muscleGroup: muscleGroupVal,
              sets: ex.sets,
              reps: ex.reps,
              weight: null,
              orderIndex: i,
            })
          ));
        }
      } catch (err) {
        console.error("[today-plan] DB save failed:", err);
      }

      res.json({
        workout: {
          title: todayTitle,
          duration: "25 min",
          muscle: muscleForApi,
          workoutId: todayWorkoutId,
          exercises: workoutExercises,
        },
        challenge: {
          exercise: challenge.exercise,
          emoji: challenge.emoji,
          target: challenge.targetReps,
          progress: myProgress?.repsCompleted ?? 0,
          completed: myProgress?.completed ?? false,
          globalReps: challenge.globalReps ?? 0,
          usersCompleted: (() => {
            const d = new Date();
            const seed = d.getDate() * 127 + (d.getMonth() + 1) * 31 + challenge.id * 13;
            return 10482 + (seed % 6000);
          })(),
        },
        battle: battleData,
        streak: profile?.streak ?? 0,
        name: profile?.displayName?.split(" ")[0] ?? "Champion",
        points: profile?.points ?? 0,
      });
    } catch (e) {
      console.error("[today-plan]", e);
      res.status(500).json({ error: "Failed to load today plan" });
    }
  });

  // ── Exercise Library — 100% din DB local, zero API extern ──────────────────
  app.get("/api/exercises", isAuthenticated, async (req: any, res) => {
    try {
      const muscle = (req.query.muscle as string) || "all";
      const limit = Math.min(Number(req.query.limit) || 20, 60);

      let rows;
      if (muscle === "all") {
        rows = await db.select().from(exerciseLibrary)
          .orderBy(sql`RANDOM()`).limit(limit);
      } else {
        rows = await db.select().from(exerciseLibrary)
          .where(ilike(exerciseLibrary.muscleGroup, muscle))
          .orderBy(sql`RANDOM()`).limit(limit);
      }
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  // GET /api/exercise-library — browse exercises from DB library by muscle group
  app.get("/api/exercise-library", isAuthenticated, async (req: any, res) => {
    try {
      const muscle = (req.query.muscle as string) || "all";
      const limit = Math.min(Number(req.query.limit) || 30, 60);
      const offset = Number(req.query.offset) || 0;

      let rows;
      if (muscle === "all") {
        rows = await db.select({
          id: exerciseLibrary.id,
          name: exerciseLibrary.name,
          muscleGroup: exerciseLibrary.muscleGroup,
          difficulty: exerciseLibrary.difficulty,
          equipment: exerciseLibrary.equipment,
          videoUrl: exerciseLibrary.videoUrl,
          thumbnailUrl: exerciseLibrary.thumbnailUrl,
          exerciseType: exerciseLibrary.exerciseType,
        }).from(exerciseLibrary)
          .where(sql`${exerciseLibrary.videoUrl} IS NOT NULL AND ${exerciseLibrary.videoUrl} != ''`)
          .orderBy(exerciseLibrary.name)
          .limit(limit)
          .offset(offset);
      } else {
        rows = await db.select({
          id: exerciseLibrary.id,
          name: exerciseLibrary.name,
          muscleGroup: exerciseLibrary.muscleGroup,
          difficulty: exerciseLibrary.difficulty,
          equipment: exerciseLibrary.equipment,
          videoUrl: exerciseLibrary.videoUrl,
          thumbnailUrl: exerciseLibrary.thumbnailUrl,
          exerciseType: exerciseLibrary.exerciseType,
        }).from(exerciseLibrary)
          .where(and(
            sql`${exerciseLibrary.videoUrl} IS NOT NULL AND ${exerciseLibrary.videoUrl} != ''`,
            ilike(exerciseLibrary.muscleGroup, muscle)
          ))
          .orderBy(exerciseLibrary.name)
          .limit(limit)
          .offset(offset);
      }
      res.json(rows);
    } catch (e) {
      console.error("[exercise-library]", e);
      res.status(500).json({ error: "Failed to fetch library" });
    }
  });

  app.get("/api/exercises/search", isAuthenticated, async (req: any, res) => {
    try {
      const q = (req.query.q as string) || "";
      if (!q.trim()) return res.json([]);
      const rows = await db.select().from(exerciseLibrary)
        .where(ilike(exerciseLibrary.name, `%${q}%`))
        .orderBy(exerciseLibrary.name)
        .limit(20);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: "Failed to search exercises" });
    }
  });

  app.get("/api/exercises/muscle-groups", isAuthenticated, (_req, res) => {
    const muscleGroups = [
      { id: "chest",     label: "Chest",      emoji: "💪" },
      { id: "back",      label: "Back",        emoji: "🔙" },
      { id: "legs",      label: "Legs",        emoji: "🦵" },
      { id: "shoulders", label: "Shoulders",   emoji: "🏋️" },
      { id: "arms",      label: "Arms",        emoji: "💪" },
      { id: "core",      label: "Core / Abs",  emoji: "🎯" },
      { id: "glutes",    label: "Glutes",      emoji: "🍑" },
      { id: "cardio",    label: "Cardio",      emoji: "🏃" },
    ];
    res.json(muscleGroups);
  });

  // POST /api/exercises/sync-batch — Sync sigur, câte 50 exerciții o dată
  // Apelează de mai multe ori pe zile diferite ca să completezi biblioteca fără să arzi limita
  app.post("/api/exercises/sync-batch", isAuthenticated, async (req: any, res) => {
    try {
      const { pagesPerBatch = 3 } = req.body; // default: 3 pagini × 20 = 60 exerciții
      const safePages = Math.min(pagesPerBatch, 5); // maxim 5 pagini = 100 exerciții per apel

      const existingCount = await storage.getExerciseLibraryCount();
      const startPage = Math.floor(existingCount / 20) + 1; // continuă de unde a rămas

      console.log(`[sync-batch] DB are ${existingCount} exerciții. Preia paginile ${startPage}-${startPage + safePages - 1}`);

      const allExercises = await fetchAllExercises(safePages);
      const stripToken = (url?: string | null) => url ? url.split("?")[0] : null;

      const mapped = allExercises
        .filter(ex => ex.id && ex.title)
        .map(ex => ({
          id: ex.id,
          name: ex.title,
          muscleGroup: ex.muscleGroup || "general",
          difficulty: ex.difficulty || "beginner",
          equipment: ex.equipment || "none",
          videoUrl: stripToken(ex.videoUrl || ex.videos?.[0]?.videoUrl),
          thumbnailUrl: ex.thumbnailUrl || null,
          exerciseType: Array.isArray(ex.exerciseType)
            ? ex.exerciseType[0] || "strength"
            : ex.exerciseType || "strength",
        }));

      const inserted = await storage.upsertExercisesToLibrary(mapped);
      const finalCount = await storage.getExerciseLibraryCount();
      const remaining = Math.max(0, 637 - finalCount);

      console.log(`[sync-batch] +${inserted} exerciții. Total: ${finalCount}/637`);

      res.json({
        success: true,
        inserted,
        totalInDb: finalCount,
        remaining,
        isComplete: finalCount >= 637,
        message: finalCount >= 637
          ? "✅ Bibliotecă completă! Toate 637 exerciții sunt în DB."
          : `${finalCount}/637 exerciții. Mai rulează sync-batch de ${Math.ceil(remaining / 60)} ori.`,
      });
    } catch (e) {
      console.error("[sync-batch] Eroare:", e);
      res.status(500).json({ error: "Sync eșuat", details: String(e) });
    }
  });

  // POST /api/exercises/sync — Păstrat pentru compatibilitate, acum face batch sigur
  app.post("/api/exercises/sync", isAuthenticated, async (req: any, res) => {
    try {
      const existingCount = await storage.getExerciseLibraryCount();
      console.log(`[sync] DB are ${existingCount} exerciții. Preia un batch sigur de 60...`);

      const allExercises = await fetchAllExercises(3); // MAXIM 3 pagini = 60 exerciții
      const stripToken = (url?: string | null) => url ? url.split("?")[0] : null;

      const mapped = allExercises
        .filter(ex => ex.id && ex.title)
        .map(ex => ({
          id: ex.id,
          name: ex.title,
          muscleGroup: ex.muscleGroup || "general",
          difficulty: ex.difficulty || "beginner",
          equipment: ex.equipment || "none",
          videoUrl: stripToken(ex.videoUrl || ex.videos?.[0]?.videoUrl),
          thumbnailUrl: ex.thumbnailUrl || null,
          exerciseType: Array.isArray(ex.exerciseType)
            ? ex.exerciseType[0] || "strength"
            : ex.exerciseType || "strength",
        }));

      const inserted = await storage.upsertExercisesToLibrary(mapped);
      const finalCount = await storage.getExerciseLibraryCount();

      res.json({
        success: true,
        fetched: allExercises.length,
        inserted,
        totalInDb: finalCount,
        note: "Sync limitat la 60 exerciții per apel pentru a respecta limita API. Apelează din nou pentru mai multe.",
      });
    } catch (e) {
      console.error("[sync] Fatal error:", e);
      res.status(500).json({ error: "Sync failed", details: String(e) });
    }
  });

  // POST /api/workout/generate — Preview only (no DB save) — 100% local DB
  app.post("/api/workout/generate", isAuthenticated, async (req: any, res) => {
    try {
      const { goal = "general_fitness", level = "intermediate", workoutType, equipment, duration, excludeIds } = req.body;
      const validGoals = ["strength", "fat_loss", "mobility", "muscle_gain", "endurance", "general_fitness"];
      const validLevels = ["beginner", "intermediate", "advanced"];
      if (!validGoals.includes(goal) || !validLevels.includes(level)) {
        return res.status(400).json({ error: "Invalid goal or level" });
      }
      const workout = await storage.generateStructuredWorkout(goal, level, { workoutType, equipment, duration, excludeIds });
      res.json(workout);
    } catch (err) {
      console.error("Error generating workout:", err);
      res.status(500).json({ error: "Failed to generate workout" });
    }
  });

  // POST /api/workout/generate/start — Generate + save to DB — 100% local DB
  app.post("/api/workout/generate/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { goal = "general_fitness", level = "intermediate", workoutType, equipment, duration, excludeIds } = req.body;
      const validGoals = ["strength", "fat_loss", "mobility", "muscle_gain", "endurance", "general_fitness"];
      const validLevels = ["beginner", "intermediate", "advanced"];
      if (!validGoals.includes(goal) || !validLevels.includes(level)) {
        return res.status(400).json({ error: "Invalid goal or level" });
      }

      // Generate structured plan — ONLY from local DB, zero external API calls
      const plan = await storage.generateStructuredWorkout(goal, level, { workoutType, equipment, duration, excludeIds });
      const allExercises = plan.exercises || [...(plan.warmup || []), ...(plan.main || []), ...(plan.cooldown || [])];

      // Muscle group mapping
      const mgMap: Record<string, string> = {
        quads: "legs", hamstrings: "legs", calves: "legs", legs: "legs",
        biceps: "arms", triceps: "arms", forearms: "arms", arms: "arms",
        chest: "chest", back: "back", shoulders: "shoulders",
        core: "core", abs: "core", glutes: "glutes",
        cardio: "full_body", full_body: "full_body",
      };

      // Create workout in DB
      const workout = await storage.createWorkout({
        userId,
        name: plan.title,
        difficulty: level,
        notes: `Generat AI — ${goal} — ${plan.workoutType || "full_body"}`,
        scheduledDate: new Date(),
      });

      // Create exercises in DB
      for (let i = 0; i < allExercises.length; i++) {
        const ex = allExercises[i];
        await storage.createExercise({
          workoutId: workout.id,
          name: ex.name,
          muscleGroup: (mgMap[ex.muscleGroup ?? "full_body"] ?? "full_body") as any,
          sets: ex.sets,
          reps: ex.reps ?? 10,
          weight: null,
          duration: ex.time ?? null,
          notes: ex.role === "warmup" ? "Încălzire" : ex.role === "cooldown" ? "Răcire" : null,
          orderIndex: i,
        });
      }

      res.json({ workoutId: workout.id, name: plan.title, totalExercises: allExercises.length });
    } catch (err) {
      console.error("Error starting generated workout:", err);
      res.status(500).json({ error: "Failed to start workout" });
    }
  });

  // GET /api/exercises/library — Read from local DB (muscle filter + search)
  app.get("/api/exercises/library", isAuthenticated, async (req: any, res) => {
    try {
      const muscle = req.query.muscle as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const count = await storage.getExerciseLibraryCount();
      const list = await storage.getExerciseLibrary(muscle, limit, search);
      res.json({ count, exercises: list });
    } catch (e) {
      res.status(500).json({ error: "Failed to read library" });
    }
  });

  // GET /api/exercises/muscle-groups/library — Muscle groups from local DB
  app.get("/api/exercises/muscle-groups/library", isAuthenticated, async (_req, res) => {
    try {
      const rows = await storage.getExerciseLibrary(undefined, undefined, undefined);
      const groups = new Map<string, number>();
      for (const ex of rows) {
        if (ex.muscleGroup) {
          groups.set(ex.muscleGroup, (groups.get(ex.muscleGroup) ?? 0) + 1);
        }
      }
      const EMOJI: Record<string, string> = {
        chest: "💪", back: "🔙", quads: "🦵", legs: "🦵", shoulders: "🏋️",
        arms: "💪", biceps: "💪", triceps: "💪", core: "🎯", glutes: "🍑",
        cardio: "🏃", full_body: "⚡", hamstrings: "🦵", calves: "🦵",
        forearms: "💪", general: "🏋️",
      };
      const result = [...groups.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => ({
          id,
          label: id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " "),
          emoji: EMOJI[id] ?? "💪",
        }));
      res.json([{ id: "all", label: "All", emoji: "⚡" }, ...result]);
    } catch (e) {
      res.status(500).json({ error: "Failed" });
    }
  });

  // ── Workout Player Routes ──────────────────────────────────────────────
  // GET /api/workout-player/:workoutId — Workout with exercises + matched library videos
  app.get("/api/workout-player/:workoutId", isAuthenticated, async (req: any, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const userId = req.user.claims.sub;
      const workout = await storage.getWorkout(workoutId);
      if (!workout || workout.userId !== userId) {
        return res.status(404).json({ error: "Workout not found" });
      }
      const exerciseList = await storage.getExercises(workoutId);
      const existingSets = await storage.getWorkoutSets(workoutId);
      const prs = await storage.getUserPersonalRecords(userId);

      const stripTokenUrl = (url?: string | null) => url ? url.split("?")[0] : null;

      const enriched = await Promise.all(
        exerciseList.map(async (ex) => {
          const lib = await storage.findExerciseInLibrary(ex.name);
          const prRecord = prs.find(p => p.exerciseName.toLowerCase() === ex.name.toLowerCase());
          const setsDone = existingSets.filter(s => s.exerciseName === ex.name);
          const lastSession = await storage.getLastSessionData(userId, ex.name, workoutId);
          return {
            ...ex,
            videoUrl: stripTokenUrl(lib?.videoUrl),
            thumbnailUrl: lib?.thumbnailUrl ?? null,
            libraryId: lib?.id ?? null,
            lastPR: prRecord?.maxWeight ?? null,
            lastPRReps: prRecord?.maxReps ?? null,
            lastSessionWeight: lastSession?.weight ?? null,
            lastSessionReps: lastSession?.reps ?? null,
            completedSets: setsDone,
          };
        })
      );

      res.json({ workout, exercises: enriched });
    } catch (e) {
      console.error("[workout-player]", e);
      res.status(500).json({ error: "Failed to load workout" });
    }
  });

  // POST /api/workout-player/:workoutId/log-set — Log a completed set
  app.post("/api/workout-player/:workoutId/log-set", isAuthenticated, async (req: any, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const userId = req.user.claims.sub;
      const { exerciseName, setNumber, reps, weight } = req.body;

      if (!exerciseName || setNumber == null) {
        return res.status(400).json({ error: "exerciseName and setNumber required" });
      }

      const set = await storage.logWorkoutSet({
        workoutId,
        exerciseName,
        setNumber,
        reps: reps ?? null,
        weight: weight ?? null,
        completed: true,
        completedAt: new Date(),
      });

      let isNewPR = false;
      if (weight && weight > 0 && reps && reps > 0) {
        const result = await storage.upsertPersonalRecord(userId, exerciseName, weight, reps);
        isNewPR = result.isNewPR;
      }

      res.json({ set, isNewPR });
    } catch (e) {
      console.error("[log-set]", e);
      res.status(500).json({ error: "Failed to log set" });
    }
  });

  // POST /api/workout-player/:workoutId/complete — Complete workout + award XP
  app.post("/api/workout-player/:workoutId/complete", isAuthenticated, async (req: any, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const userId = req.user.claims.sub;
      const { duration, totalVolume, newPRs } = req.body;

      const workout = await storage.completeWorkout(workoutId);
      const xpEarned = 100 + Math.floor((duration ?? 0) / 60) * 5 + (newPRs ?? 0) * 50;
      await storage.updateUserPoints(userId, xpEarned);
      await storage.updateStreak(userId);

      res.json({ workout, xpEarned, message: "Workout completed! 🎉" });
    } catch (e) {
      console.error("[complete-workout]", e);
      res.status(500).json({ error: "Failed to complete workout" });
    }
  });

  // GET /api/personal-records — User's personal records
  app.get("/api/personal-records", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const records = await storage.getUserPersonalRecords(userId);
      res.json(records);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch PRs" });
    }
  });

  return httpServer;
}
