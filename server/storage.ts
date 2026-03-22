import { db } from "./db";
import {
  userProfiles, workouts, exercises, nutritionLogs, progressMeasurements,
  achievements, userAchievements,
  aiCoachMessages, dailyCheckins,
  bodyScans, pushSubscriptions, progressPhotos,
  dailyChallenges, challengeProgress, challengeBattles,
  exerciseLibrary, workoutSets, personalRecords,
  type UserProfile, type InsertUserProfile,
  type Workout, type InsertWorkout,
  type Exercise, type InsertExercise,
  type NutritionLog, type InsertNutritionLog,
  type ProgressMeasurement, type InsertProgressMeasurement,
  type Achievement, type UserAchievement,
  type AiCoachMessage, type InsertAiCoachMessage,
  type DailyCheckin, type InsertDailyCheckin,
  type BodyScan, type InsertBodyScan,
  type PushSubscription,
  type ProgressPhoto,
  type DailyChallenge, type InsertDailyChallenge,
  type ChallengeProgress,
  type ChallengeBattle,
  type ExerciseLibrary, type InsertExerciseLibrary,
  type WorkoutSet, type InsertWorkoutSet,
  type PersonalRecord,
} from "@shared/schema";
import { eq, desc, and, sql, sum, ilike, or } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserPoints(userId: string, points: number): Promise<void>;
  updateStreak(userId: string): Promise<void>;

  // Workouts
  getWorkouts(userId: string): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout>;
  deleteWorkout(id: number): Promise<void>;
  completeWorkout(id: number): Promise<Workout>;

  // Exercises
  getExercises(workoutId: number): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise>;
  deleteExercise(id: number): Promise<void>;

  // Nutrition
  getNutritionLogs(userId: string): Promise<NutritionLog[]>;
  createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog>;
  deleteNutritionLog(id: number): Promise<void>;

  // Progress
  getProgressMeasurements(userId: string): Promise<ProgressMeasurement[]>;
  createProgressMeasurement(measurement: InsertProgressMeasurement): Promise<ProgressMeasurement>;
  deleteProgressMeasurement(id: number): Promise<void>;

  // Achievements
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]>;
  awardAchievement(userId: string, achievementId: number): Promise<void>;

  // AI Coach
  getAiCoachMessages(userId: string): Promise<AiCoachMessage[]>;
  saveAiCoachMessage(message: InsertAiCoachMessage): Promise<AiCoachMessage>;
  clearAiCoachMessages(userId: string): Promise<void>;

  // Daily Checkins
  getTodayCheckin(userId: string, date: string): Promise<DailyCheckin | undefined>;
  getDailyCheckins(userId: string): Promise<DailyCheckin[]>;
  createDailyCheckin(checkin: InsertDailyCheckin): Promise<DailyCheckin>;
  updateCheckinRecommendation(id: number, recommendation: string, shouldTrain: boolean): Promise<void>;

  // Exercise Library
  getExerciseLibrary(muscle?: string, limit?: number, search?: string): Promise<ExerciseLibrary[]>;
  getExerciseLibraryCount(): Promise<number>;
  upsertExercisesToLibrary(exercises: InsertExerciseLibrary[]): Promise<number>;
  findExerciseInLibrary(name: string): Promise<ExerciseLibrary | undefined>;
  findExerciseWithVideoByKeyword(keyword: string): Promise<ExerciseLibrary | undefined>;
  getExercisesWithVideo(limit: number): Promise<ExerciseLibrary[]>;

  // Workout Sets (per-set logging)
  getWorkoutSets(workoutId: number): Promise<WorkoutSet[]>;
  logWorkoutSet(set: InsertWorkoutSet): Promise<WorkoutSet>;
  updateWorkoutSet(id: number, data: Partial<InsertWorkoutSet>): Promise<WorkoutSet>;
  deleteWorkoutSets(workoutId: number): Promise<void>;
  getLastSessionData(userId: string, exerciseName: string, currentWorkoutId: number): Promise<{ weight: number; reps: number } | null>;
  getMuscleRecovery(userId: string): Promise<{ muscleGroup: string; lastTrainedAt: Date | null; hoursSince: number | null }[]>;

  // Personal Records
  getPersonalRecord(userId: string, exerciseName: string): Promise<PersonalRecord | undefined>;
  getUserPersonalRecords(userId: string): Promise<PersonalRecord[]>;
  upsertPersonalRecord(userId: string, exerciseName: string, weight: number, reps: number): Promise<{ isNewPR: boolean; record: PersonalRecord }>;

  // Body Scans
  getBodyScans(userId: string): Promise<BodyScan[]>;
  getLatestBodyScan(userId: string): Promise<BodyScan | undefined>;
  createBodyScan(scan: InsertBodyScan): Promise<BodyScan>;

  // Progress Photos
  getProgressPhotos(userId: string): Promise<ProgressPhoto[]>;
  addProgressPhoto(userId: string, photoData: string, dayLabel: string, note?: string): Promise<ProgressPhoto>;
  deleteProgressPhoto(id: number, userId: string): Promise<void>;

  // Push Notifications
  savePushSubscription(userId: string, endpoint: string, p256dh: string, auth: string): Promise<PushSubscription>;
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
  deletePushSubscription(userId: string, endpoint: string): Promise<void>;
  updatePushSettings(userId: string, settings: Partial<Pick<PushSubscription, "notifyWorkout" | "notifyStreak" | "notifyAchievement" | "notifyMotivation">>): Promise<void>;

  // Stripe / Subscription
  updateStripeInfo(userId: string, info: { stripeCustomerId?: string; stripeSubscriptionId?: string; plan?: string; planExpiresAt?: Date | null }): Promise<void>;
  getUserPlan(userId: string): Promise<string>;

  // Onboarding
  markOnboardingComplete(userId: string): Promise<void>;

  // Invite System
  generateInviteCode(userId: string): Promise<string>;
  getUserByInviteCode(code: string): Promise<UserProfile | undefined>;
  applyInviteCode(newUserId: string, inviterUserId: string): Promise<void>;

  // Stats
  getDashboardStats(userId: string): Promise<{
    totalWorkouts: number;
    totalCaloriesBurned: number;
    currentStreak: number;
    totalPoints: number;
    thisWeekWorkouts: number;
    todayCalories: number;
  }>;

  // Challenges
  getTodayChallenge(): Promise<DailyChallenge | undefined>;
  createDailyChallenge(challenge: InsertDailyChallenge): Promise<DailyChallenge>;
  getUserChallengeProgress(userId: string, challengeId: number): Promise<ChallengeProgress | undefined>;
  upsertChallengeProgress(userId: string, challengeId: number, repsToAdd: number, targetReps: number): Promise<ChallengeProgress>;
  getGlobalChallengeReps(challengeId: number): Promise<number>;
  getChallengeLeaderboard(challengeId: number, limit?: number): Promise<Array<{ userId: string; displayName: string | null; avatarUrl: string | null; repsCompleted: number }>>;
  createBattle(challengeId: number, creatorId: string): Promise<ChallengeBattle>;
  getBattle(id: number): Promise<ChallengeBattle | undefined>;
  joinBattle(battleId: number, opponentId: string): Promise<ChallengeBattle>;
  getBattlesByUser(userId: string, challengeId: number): Promise<ChallengeBattle[]>;
}

export class DatabaseStorage implements IStorage {
  // Profiles
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [result] = await db
      .insert(userProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: { ...profile, updatedAt: new Date() },
      })
      .returning();
    return result;
  }

  async updateUserPoints(userId: string, pointsToAdd: number): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return;
    const newPoints = (profile.points || 0) + pointsToAdd;
    const newLevel = Math.floor(newPoints / 500) + 1;
    await db.update(userProfiles)
      .set({ points: newPoints, level: newLevel, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId));
  }

  async updateStreak(userId: string): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return;
    const now = new Date();
    const lastWorkout = profile.lastWorkoutDate;
    let newStreak = profile.streak || 0;
    if (lastWorkout) {
      const diffDays = Math.floor((now.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
    } else {
      newStreak = 1;
    }
    await db.update(userProfiles)
      .set({ streak: newStreak, lastWorkoutDate: now, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId));
  }

  // Workouts
  async getWorkouts(userId: string): Promise<Workout[]> {
    return db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(desc(workouts.createdAt));
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout;
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [result] = await db.insert(workouts).values(workout).returning();
    return result;
  }

  async updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout> {
    const [result] = await db.update(workouts).set(workout).where(eq(workouts.id, id)).returning();
    return result;
  }

  async deleteWorkout(id: number): Promise<void> {
    await db.delete(workouts).where(eq(workouts.id, id));
  }

  async completeWorkout(id: number): Promise<Workout> {
    const [result] = await db.update(workouts)
      .set({ isCompleted: true, completedAt: new Date() })
      .where(eq(workouts.id, id))
      .returning();
    return result;
  }

  // Exercises
  async getExercises(workoutId: number): Promise<Exercise[]> {
    return db.select().from(exercises).where(eq(exercises.workoutId, workoutId)).orderBy(exercises.orderIndex);
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [result] = await db.insert(exercises).values(exercise).returning();
    return result;
  }

  async updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise> {
    const [result] = await db.update(exercises).set(exercise).where(eq(exercises.id, id)).returning();
    return result;
  }

  async deleteExercise(id: number): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  // Nutrition
  async getNutritionLogs(userId: string): Promise<NutritionLog[]> {
    return db.select().from(nutritionLogs).where(eq(nutritionLogs.userId, userId)).orderBy(desc(nutritionLogs.date));
  }

  async createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog> {
    const [result] = await db.insert(nutritionLogs).values(log).returning();
    return result;
  }

  async deleteNutritionLog(id: number): Promise<void> {
    await db.delete(nutritionLogs).where(eq(nutritionLogs.id, id));
  }

  // Progress
  async getProgressMeasurements(userId: string): Promise<ProgressMeasurement[]> {
    return db.select().from(progressMeasurements).where(eq(progressMeasurements.userId, userId)).orderBy(desc(progressMeasurements.measuredAt));
  }

  async createProgressMeasurement(measurement: InsertProgressMeasurement): Promise<ProgressMeasurement> {
    const [result] = await db.insert(progressMeasurements).values(measurement).returning();
    return result;
  }

  async deleteProgressMeasurement(id: number): Promise<void> {
    await db.delete(progressMeasurements).where(eq(progressMeasurements.id, id));
  }

  // Achievements
  async getAllAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements);
  }

  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const result = await db
      .select({ userAchievement: userAchievements, achievement: achievements })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
    return result.map(r => ({ ...r.userAchievement, achievement: r.achievement }));
  }

  async awardAchievement(userId: string, achievementId: number): Promise<void> {
    await db.insert(userAchievements).values({ userId, achievementId }).onConflictDoNothing();
  }

  // AI Coach
  async getAiCoachMessages(userId: string): Promise<AiCoachMessage[]> {
    return db.select().from(aiCoachMessages).where(eq(aiCoachMessages.userId, userId)).orderBy(aiCoachMessages.createdAt).limit(50);
  }

  async saveAiCoachMessage(message: InsertAiCoachMessage): Promise<AiCoachMessage> {
    const [result] = await db.insert(aiCoachMessages).values(message).returning();
    return result;
  }

  async clearAiCoachMessages(userId: string): Promise<void> {
    await db.delete(aiCoachMessages).where(eq(aiCoachMessages.userId, userId));
  }

  // Daily Checkins
  async getTodayCheckin(userId: string, date: string): Promise<DailyCheckin | undefined> {
    const [checkin] = await db.select().from(dailyCheckins)
      .where(and(eq(dailyCheckins.userId, userId), eq(dailyCheckins.date, date)));
    return checkin;
  }

  async getDailyCheckins(userId: string): Promise<DailyCheckin[]> {
    return db.select().from(dailyCheckins)
      .where(eq(dailyCheckins.userId, userId))
      .orderBy(desc(dailyCheckins.createdAt))
      .limit(30);
  }

  async createDailyCheckin(checkin: InsertDailyCheckin): Promise<DailyCheckin> {
    const [result] = await db.insert(dailyCheckins).values(checkin).returning();
    return result;
  }

  async updateCheckinRecommendation(id: number, recommendation: string, shouldTrain: boolean): Promise<void> {
    await db.update(dailyCheckins)
      .set({ aiRecommendation: recommendation, shouldTrain })
      .where(eq(dailyCheckins.id, id));
  }

  // Exercise Library
  async getExerciseLibrary(muscle?: string, limit?: number, search?: string): Promise<ExerciseLibrary[]> {
    let query = db.select().from(exerciseLibrary).$dynamic();
    if (search) {
      query = query.where(ilike(exerciseLibrary.name, `%${search}%`));
    } else if (muscle && muscle !== "all" && muscle !== "full") {
      query = query.where(ilike(exerciseLibrary.muscleGroup, `%${muscle}%`));
    }
    query = query.orderBy(exerciseLibrary.name);
    if (limit) {
      query = query.limit(limit);
    }
    return query;
  }

  async getExerciseLibraryCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(exerciseLibrary);
    return result[0]?.count ?? 0;
  }

  async upsertExercisesToLibrary(exercises: InsertExerciseLibrary[]): Promise<number> {
    if (exercises.length === 0) return 0;
    const result = await db.insert(exerciseLibrary)
      .values(exercises)
      .onConflictDoNothing({ target: exerciseLibrary.id })
      .returning();
    return result.length;
  }

  async findExerciseInLibrary(name: string): Promise<ExerciseLibrary | undefined> {
    const [ex] = await db.select().from(exerciseLibrary)
      .where(ilike(exerciseLibrary.name, name))
      .limit(1);
    if (ex) return ex;
    const words = name.split(" ").slice(0, 2).join(" ");
    const [fuzzy] = await db.select().from(exerciseLibrary)
      .where(ilike(exerciseLibrary.name, `%${words}%`))
      .limit(1);
    return fuzzy;
  }

  async findExerciseWithVideoByKeyword(keyword: string): Promise<ExerciseLibrary | undefined> {
    const [result] = await db.select().from(exerciseLibrary)
      .where(and(
        sql`${exerciseLibrary.videoUrl} IS NOT NULL AND ${exerciseLibrary.videoUrl} != ''`,
        ilike(exerciseLibrary.name, `%${keyword}%`)
      ))
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return result;
  }

  async getExercisesWithVideo(limit: number): Promise<ExerciseLibrary[]> {
    // Prefer bodyweight exercises for home workouts, shuffled for variety
    const bodyweight = await db.select().from(exerciseLibrary)
      .where(sql`${exerciseLibrary.videoUrl} IS NOT NULL AND ${exerciseLibrary.videoUrl} != '' AND ${exerciseLibrary.equipment} = 'bodyweight'`)
      .orderBy(sql`RANDOM()`)
      .limit(limit);
    if (bodyweight.length >= 15) return bodyweight;
    // fallback to all exercises with video (shuffled)
    return db.select().from(exerciseLibrary)
      .where(sql`${exerciseLibrary.videoUrl} IS NOT NULL AND ${exerciseLibrary.videoUrl} != ''`)
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  // ── Workout Generator ───────────────────────────────────────────────────
  async generateStructuredWorkout(goal: string, level: string, userProfile?: any) {

    // ── Voice cues per grupă musculară ────────────────────────────────────────
    const voiceSteps = (mg: string | null) => {
      const push = ["chest", "shoulders", "triceps", "forearms"];
      const pull = ["back", "biceps"];
      const legs = ["quads", "hamstrings", "glutes", "calves"];
      const core = ["core"];
      if (push.includes(mg ?? "")) return [
        { time: 0, text: "Pregătit" }, { time: 2, text: "Coboară lent" },
        { time: 5, text: "Împinge!" }, { time: 8, text: "Sus!" },
      ];
      if (pull.includes(mg ?? "")) return [
        { time: 0, text: "Pregătit" }, { time: 2, text: "Trage tare" },
        { time: 5, text: "Controlat" }, { time: 8, text: "Extinde" },
      ];
      if (legs.includes(mg ?? "")) return [
        { time: 0, text: "Pregătit" }, { time: 2, text: "Coboară" },
        { time: 5, text: "Împinge!" }, { time: 8, text: "Sus!" },
      ];
      if (core.includes(mg ?? "")) return [
        { time: 0, text: "Tensionează" }, { time: 3, text: "Ține!" },
        { time: 6, text: "Respiră" }, { time: 9, text: "Bine!" },
      ];
      return [
        { time: 0, text: "Hai!" }, { time: 3, text: "Ritm!" },
        { time: 6, text: "Respiră" }, { time: 9, text: "Termină!" },
      ];
    };

    // ── Parametri seturi/reps/rest per obiectiv + nivel ───────────────────────
    type GoalKey = "strength" | "fat_loss" | "muscle" | "mobility" | "beginner";
    type LevelKey = "beginner" | "intermediate" | "advanced";

    const params: Record<GoalKey, Record<LevelKey, { sets: number; reps: number; rest: number; duration: number }>> = {
      strength:  {
        beginner:     { sets: 3, reps: 8,  rest: 120, duration: 35 },
        intermediate: { sets: 4, reps: 5,  rest: 180, duration: 45 },
        advanced:     { sets: 5, reps: 3,  rest: 240, duration: 60 },
      },
      fat_loss:  {
        beginner:     { sets: 3, reps: 12, rest: 60,  duration: 30 },
        intermediate: { sets: 3, reps: 15, rest: 45,  duration: 35 },
        advanced:     { sets: 4, reps: 20, rest: 30,  duration: 40 },
      },
      muscle:    {
        beginner:     { sets: 3, reps: 10, rest: 90,  duration: 40 },
        intermediate: { sets: 4, reps: 8,  rest: 90,  duration: 50 },
        advanced:     { sets: 4, reps: 10, rest: 60,  duration: 55 },
      },
      mobility:  {
        beginner:     { sets: 2, reps: 10, rest: 45,  duration: 25 },
        intermediate: { sets: 2, reps: 12, rest: 45,  duration: 30 },
        advanced:     { sets: 3, reps: 12, rest: 30,  duration: 35 },
      },
      beginner:  {
        beginner:     { sets: 2, reps: 10, rest: 90,  duration: 25 },
        intermediate: { sets: 3, reps: 10, rest: 75,  duration: 30 },
        advanced:     { sets: 3, reps: 12, rest: 60,  duration: 35 },
      },
    };

    const normalizedGoal = (goal === "weight_loss" ? "fat_loss" : goal === "muscle_gain" ? "muscle" : goal) as GoalKey;
    const safeGoal = params[normalizedGoal] ? normalizedGoal : "strength";
    const safeLevel = (["beginner", "intermediate", "advanced"].includes(level) ? level : "intermediate") as LevelKey;
    const p = params[safeGoal][safeLevel];

    // ── Titluri antrenamente per split ────────────────────────────────────────
    const workoutTitles: Record<string, string[]> = {
      strength:  ["Push Day — Piept & Triceps", "Pull Day — Spate & Biceps", "Leg Day — Picioare & Fese", "Upper Body Power", "Lower Body Strength"],
      fat_loss:  ["Full Body HIIT", "Cardio + Core Burn", "Total Body Shred", "Fat Burn Circuit", "Metabolic Conditioning"],
      muscle:    ["Chest & Triceps", "Back & Biceps", "Legs & Glutes", "Shoulders & Arms", "Full Body Hypertrophy"],
      mobility:  ["Morning Flow", "Hip & Hamstring Release", "Full Body Stretch", "Yoga Flow", "Active Recovery"],
      beginner:  ["Full Body — Ziua 1", "Full Body — Ziua 2", "Full Body — Ziua 3", "Intro to Strength", "Bodyweight Basics"],
    };

    // ── Split bazat pe obiectiv + rotație zilnică ─────────────────────────────
    type SplitType = "push" | "pull" | "legs" | "full_body" | "upper" | "lower";
    const splitMuscles: Record<SplitType, string[]> = {
      push:      ["chest", "shoulders", "triceps"],
      pull:      ["back", "biceps"],
      legs:      ["quads", "hamstrings", "glutes", "calves"],
      full_body: ["chest", "back", "quads", "shoulders", "core"],
      upper:     ["chest", "back", "shoulders", "biceps", "triceps"],
      lower:     ["quads", "hamstrings", "glutes", "calves"],
    };

    const dayOfYear = Math.floor(Date.now() / 86400000);
    let split: SplitType = "full_body";
    if (safeGoal === "strength" || safeGoal === "muscle") {
      const splits: SplitType[] = ["push", "pull", "legs", "upper", "lower"];
      split = splits[dayOfYear % splits.length];
    }

    const mainMuscles = splitMuscles[split];
    const titles = workoutTitles[safeGoal] ?? workoutTitles.strength;
    const title = titles[dayOfYear % titles.length];

    // ── Fetch exerciții din DB cu fallback inteligent ─────────────────────────
    const pickFrom = async (muscles: string[], count: number, preferVideo = true) => {
      const muscleList = sql.join(muscles.map(m => sql`${m}`), sql`, `);

      // Încearcă cu video
      if (preferVideo) {
        const withVideo = await db.select().from(exerciseLibrary)
          .where(sql`muscle_group = ANY(ARRAY[${muscleList}]::text[]) AND video_url IS NOT NULL AND video_url != ''`)
          .orderBy(sql`RANDOM()`)
          .limit(count * 3);
        if (withVideo.length >= count) {
          const seen = new Set<string>();
          return withVideo.filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; }).slice(0, count);
        }
      }

      // Fallback fără filtru video
      const rows = await db.select().from(exerciseLibrary)
        .where(sql`muscle_group = ANY(ARRAY[${muscleList}]::text[])`)
        .orderBy(sql`RANDOM()`)
        .limit(count * 3);

      // Fallback final — orice exercițiu
      const source = rows.length >= count ? rows : await db.select().from(exerciseLibrary).orderBy(sql`RANDOM()`).limit(count * 2);
      const seen = new Set<string>();
      return source.filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; }).slice(0, count);
    };

    // ── Format exercițiu pentru WorkoutPlayer ─────────────────────────────────
    const fmt = (ex: ExerciseLibrary, role: "warmup" | "main" | "finisher" | "cooldown") => {
      const isMain = role === "main";
      const isCardio = role !== "main";
      return {
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        videoUrl: ex.videoUrl || null,
        thumbnailUrl: ex.thumbnailUrl || null,
        role,
        sets: isMain ? p.sets : 1,
        reps: isCardio ? null : p.reps,
        time: isCardio ? 45 : null,
        rest: isMain ? p.rest : 30,
        equipment: ex.equipment || "bodyweight",
        exerciseType: ex.exerciseType || "strength",
        voiceSteps: voiceSteps(ex.muscleGroup),
      };
    };

    // ── Construiește antrenamentul ────────────────────────────────────────────
    const mainCount = safeGoal === "fat_loss" ? 6 : 5;
    const [warmupRows, mainRows, finisherRows, cooldownRows] = await Promise.all([
      pickFrom(["core", "full_body"], 2, false),
      pickFrom(mainMuscles, mainCount, true),
      pickFrom(["full_body", "quads", "core"], 1, false),
      pickFrom(["core", "hamstrings", "full_body"], 1, false),
    ]);

    const warmup   = warmupRows.map(e => fmt(e, "warmup"));
    const main     = mainRows.map(e => fmt(e, "main"));
    const finisher = finisherRows.map(e => fmt(e, "finisher"));
    const cooldown = cooldownRows.map(e => fmt(e, "cooldown"));
    const allExercises = [...warmup, ...main, ...finisher, ...cooldown];

    return {
      title,
      goal: safeGoal,
      level: safeLevel,
      split,
      duration: p.duration,
      totalExercises: allExercises.length,
      params: { sets: p.sets, reps: p.reps, rest: p.rest },
      warmup,
      main,
      finisher,
      cooldown,
      exercises: allExercises,
    };
  }

  async getWorkoutSets(workoutId: number): Promise<WorkoutSet[]> {
    return db.select().from(workoutSets)
      .where(eq(workoutSets.workoutId, workoutId))
      .orderBy(workoutSets.exerciseName, workoutSets.setNumber);
  }

  async logWorkoutSet(set: InsertWorkoutSet): Promise<WorkoutSet> {
    const [created] = await db.insert(workoutSets).values(set).returning();
    return created;
  }

  async updateWorkoutSet(id: number, data: Partial<InsertWorkoutSet>): Promise<WorkoutSet> {
    const [updated] = await db.update(workoutSets).set(data).where(eq(workoutSets.id, id)).returning();
    return updated;
  }

  async getLastSessionData(userId: string, exerciseName: string, currentWorkoutId: number): Promise<{ weight: number; reps: number } | null> {
    const rows = await db
      .select({ weight: workoutSets.weight, reps: workoutSets.reps, createdAt: workoutSets.createdAt })
      .from(workoutSets)
      .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
      .where(and(
        eq(workouts.userId, userId),
        ilike(workoutSets.exerciseName, exerciseName),
        sql`${workoutSets.workoutId} != ${currentWorkoutId}`
      ))
      .orderBy(desc(workoutSets.createdAt))
      .limit(1);
    if (!rows.length) return null;
    return { weight: rows[0].weight ?? 0, reps: rows[0].reps ?? 0 };
  }

  async deleteWorkoutSets(workoutId: number): Promise<void> {
    await db.delete(workoutSets).where(eq(workoutSets.workoutId, workoutId));
  }

  async getMuscleRecovery(userId: string): Promise<{ muscleGroup: string; lastTrainedAt: Date | null; hoursSince: number | null }[]> {
    const ALL_GROUPS = ["chest", "back", "shoulders", "biceps", "triceps", "core", "quads", "hamstrings", "glutes", "calves", "forearms", "full_body"];
    const rows = await db
      .select({ muscleGroup: exerciseLibrary.muscleGroup, lastTrainedAt: sql<Date>`MAX(${workouts.completedAt})` })
      .from(workoutSets)
      .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
      .innerJoin(exerciseLibrary, ilike(workoutSets.exerciseName, exerciseLibrary.name))
      .where(and(eq(workouts.userId, userId), eq(workouts.isCompleted, true)))
      .groupBy(exerciseLibrary.muscleGroup);

    const now = Date.now();
    const map = new Map(rows.map(r => [r.muscleGroup, r.lastTrainedAt]));
    return ALL_GROUPS.map(g => {
      const lastTrained = map.get(g) ?? null;
      const hoursSince = lastTrained ? (now - new Date(lastTrained).getTime()) / 3600000 : null;
      return { muscleGroup: g, lastTrainedAt: lastTrained, hoursSince };
    });
  }

  async getPersonalRecord(userId: string, exerciseName: string): Promise<PersonalRecord | undefined> {
    const [record] = await db.select().from(personalRecords)
      .where(and(eq(personalRecords.userId, userId), ilike(personalRecords.exerciseName, exerciseName)))
      .limit(1);
    return record;
  }

  async getUserPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    return db.select().from(personalRecords)
      .where(eq(personalRecords.userId, userId))
      .orderBy(desc(personalRecords.achievedAt));
  }

  async upsertPersonalRecord(userId: string, exerciseName: string, weight: number, reps: number): Promise<{ isNewPR: boolean; record: PersonalRecord }> {
    const existing = await this.getPersonalRecord(userId, exerciseName);
    const isNewPR = !existing || weight > (existing.maxWeight ?? 0) || (weight === existing.maxWeight && reps > (existing.maxReps ?? 0));
    if (isNewPR) {
      const [record] = await db.insert(personalRecords)
        .values({ userId, exerciseName, maxWeight: weight, maxReps: reps })
        .onConflictDoNothing()
        .returning();
      if (record) return { isNewPR: true, record };
      const updated = await this.getPersonalRecord(userId, exerciseName);
      return { isNewPR: true, record: updated! };
    }
    return { isNewPR: false, record: existing! };
  }

  // Body Scans
  async getBodyScans(userId: string): Promise<BodyScan[]> {
    return db.select().from(bodyScans).where(eq(bodyScans.userId, userId)).orderBy(desc(bodyScans.createdAt));
  }

  async getLatestBodyScan(userId: string): Promise<BodyScan | undefined> {
    const [scan] = await db.select().from(bodyScans).where(eq(bodyScans.userId, userId)).orderBy(desc(bodyScans.createdAt)).limit(1);
    return scan;
  }

  async createBodyScan(scan: InsertBodyScan): Promise<BodyScan> {
    const [created] = await db.insert(bodyScans).values(scan).returning();
    return created;
  }

  // Progress Photos
  async getProgressPhotos(userId: string): Promise<ProgressPhoto[]> {
    return db.select().from(progressPhotos).where(eq(progressPhotos.userId, userId)).orderBy(desc(progressPhotos.takenAt));
  }

  async addProgressPhoto(userId: string, photoData: string, dayLabel: string, note?: string): Promise<ProgressPhoto> {
    const [photo] = await db.insert(progressPhotos).values({ userId, photoData, dayLabel, note }).returning();
    return photo;
  }

  async deleteProgressPhoto(id: number, userId: string): Promise<void> {
    await db.delete(progressPhotos).where(and(eq(progressPhotos.id, id), eq(progressPhotos.userId, userId)));
  }

  // Push Notifications
  async savePushSubscription(userId: string, endpoint: string, p256dh: string, auth: string): Promise<PushSubscription> {
    const existing = await db.select().from(pushSubscriptions).where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
    if (existing.length > 0) return existing[0];
    const [sub] = await db.insert(pushSubscriptions).values({ userId, endpoint, p256dh, auth }).returning();
    return sub;
  }

  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions);
  }

  async deletePushSubscription(userId: string, endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
  }

  async updatePushSettings(userId: string, settings: Partial<Pick<PushSubscription, "notifyWorkout" | "notifyStreak" | "notifyAchievement" | "notifyMotivation">>): Promise<void> {
    await db.update(pushSubscriptions).set(settings).where(eq(pushSubscriptions.userId, userId));
  }

  // Stripe / Subscription
  async updateStripeInfo(userId: string, info: { stripeCustomerId?: string; stripeSubscriptionId?: string; plan?: string; planExpiresAt?: Date | null }): Promise<void> {
    await db.update(userProfiles).set({ ...info, updatedAt: new Date() }).where(eq(userProfiles.userId, userId));
  }

  async getUserPlan(userId: string): Promise<string> {
    const [profile] = await db.select({ plan: userProfiles.plan, planExpiresAt: userProfiles.planExpiresAt }).from(userProfiles).where(eq(userProfiles.userId, userId));
    if (!profile) return "free";
    if (profile.plan === "pro") {
      if (profile.planExpiresAt && profile.planExpiresAt < new Date()) return "free";
      return "pro";
    }
    return "free";
  }

  // Onboarding
  async markOnboardingComplete(userId: string): Promise<void> {
    await db.update(userProfiles).set({ onboardingCompleted: true, updatedAt: new Date() }).where(eq(userProfiles.userId, userId));
  }

  // Invite System
  async generateInviteCode(userId: string): Promise<string> {
    const [existing] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    if (existing?.inviteCode) return existing.inviteCode;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.update(userProfiles).set({ inviteCode: code }).where(eq(userProfiles.userId, userId));
    return code;
  }

  async getUserByInviteCode(code: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.inviteCode, code.toUpperCase()));
    return profile;
  }

  async applyInviteCode(newUserId: string, inviterUserId: string): Promise<void> {
    await db.update(userProfiles).set({ invitedBy: inviterUserId }).where(eq(userProfiles.userId, newUserId));
    await db.update(userProfiles).set({
      inviteCount: sql`${userProfiles.inviteCount} + 1`,
      points: sql`${userProfiles.points} + 200`,
    }).where(eq(userProfiles.userId, inviterUserId));
    await db.update(userProfiles).set({ points: sql`${userProfiles.points} + 100` }).where(eq(userProfiles.userId, newUserId));
  }

  // Challenges
  async getTodayChallenge(): Promise<DailyChallenge | undefined> {
    const today = new Date().toISOString().split("T")[0];
    const [ch] = await db.select().from(dailyChallenges).where(eq(dailyChallenges.date, today));
    return ch;
  }

  async createDailyChallenge(challenge: InsertDailyChallenge): Promise<DailyChallenge> {
    const [ch] = await db.insert(dailyChallenges).values(challenge).returning();
    return ch;
  }

  async getUserChallengeProgress(userId: string, challengeId: number): Promise<ChallengeProgress | undefined> {
    const [p] = await db.select().from(challengeProgress)
      .where(and(eq(challengeProgress.userId, userId), eq(challengeProgress.challengeId, challengeId)));
    return p;
  }

  async upsertChallengeProgress(userId: string, challengeId: number, repsToAdd: number, targetReps: number): Promise<ChallengeProgress> {
    const existing = await this.getUserChallengeProgress(userId, challengeId);
    if (existing) {
      const newReps = Math.min((existing.repsCompleted || 0) + repsToAdd, targetReps);
      const completed = newReps >= targetReps;
      const [updated] = await db.update(challengeProgress)
        .set({
          repsCompleted: newReps,
          completed,
          completedAt: completed && !existing.completed ? new Date() : existing.completedAt,
        })
        .where(eq(challengeProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const newReps = Math.min(repsToAdd, targetReps);
      const completed = newReps >= targetReps;
      const [created] = await db.insert(challengeProgress).values({
        userId,
        challengeId,
        repsCompleted: newReps,
        completed,
        completedAt: completed ? new Date() : undefined,
      }).returning();
      return created;
    }
  }

  async getGlobalChallengeReps(challengeId: number): Promise<number> {
    const [result] = await db.select({ total: sum(challengeProgress.repsCompleted) })
      .from(challengeProgress)
      .where(eq(challengeProgress.challengeId, challengeId));
    return Number(result?.total ?? 0);
  }

  async getChallengeLeaderboard(challengeId: number, limit = 10): Promise<Array<{ userId: string; displayName: string | null; avatarUrl: string | null; repsCompleted: number }>> {
    const rows = await db.select({
      userId: challengeProgress.userId,
      repsCompleted: challengeProgress.repsCompleted,
      displayName: userProfiles.displayName,
      avatarUrl: userProfiles.avatarUrl,
    })
      .from(challengeProgress)
      .leftJoin(userProfiles, eq(challengeProgress.userId, userProfiles.userId))
      .where(eq(challengeProgress.challengeId, challengeId))
      .orderBy(desc(challengeProgress.repsCompleted))
      .limit(limit);
    return rows.map(r => ({
      userId: r.userId,
      displayName: r.displayName ?? null,
      avatarUrl: r.avatarUrl ?? null,
      repsCompleted: r.repsCompleted ?? 0,
    }));
  }

  async createBattle(challengeId: number, creatorId: string): Promise<ChallengeBattle> {
    const [battle] = await db.insert(challengeBattles).values({ challengeId, creatorId, status: "pending" }).returning();
    return battle;
  }

  async getBattle(id: number): Promise<ChallengeBattle | undefined> {
    const [battle] = await db.select().from(challengeBattles).where(eq(challengeBattles.id, id));
    return battle;
  }

  async joinBattle(battleId: number, opponentId: string): Promise<ChallengeBattle> {
    const [battle] = await db.update(challengeBattles)
      .set({ opponentId, status: "active" })
      .where(eq(challengeBattles.id, battleId))
      .returning();
    return battle;
  }

  async getBattlesByUser(userId: string, challengeId: number): Promise<ChallengeBattle[]> {
    return db.select().from(challengeBattles)
      .where(and(eq(challengeBattles.challengeId, challengeId), eq(challengeBattles.creatorId, userId)));
  }

  // Stats
  async getDashboardStats(userId: string) {
    const allWorkouts = await this.getWorkouts(userId);
    const completedWorkouts = allWorkouts.filter(w => w.isCompleted);
    const totalCaloriesBurned = completedWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekWorkouts = completedWorkouts.filter(w => w.completedAt && w.completedAt > oneWeekAgo).length;

    const profile = await this.getUserProfile(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nutritionToday = await db.select().from(nutritionLogs)
      .where(and(eq(nutritionLogs.userId, userId), sql`${nutritionLogs.date} >= ${today}`));
    const todayCalories = nutritionToday.reduce((sum, n) => sum + (n.calories || 0), 0);

    return {
      totalWorkouts: completedWorkouts.length,
      totalCaloriesBurned,
      currentStreak: profile?.streak || 0,
      totalPoints: profile?.points || 0,
      thisWeekWorkouts,
      todayCalories,
    };
  }
}

export const storage = new DatabaseStorage();
