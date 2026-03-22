import { sql } from "drizzle-orm";
import {
  pgTable, text, varchar, integer, serial, boolean, timestamp, real, pgEnum
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth and chat models
export * from "./models/auth";
export * from "./models/chat";

// Enums
export const goalTypeEnum = pgEnum("goal_type", ["weight_loss", "muscle_gain", "endurance", "flexibility", "general_fitness"]);
export const difficultyEnum = pgEnum("difficulty", ["beginner", "intermediate", "advanced"]);
export const muscleGroupEnum = pgEnum("muscle_group", ["chest", "back", "shoulders", "arms", "core", "legs", "glutes", "cardio", "full_body"]);

// === USER PROFILES ===
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  displayName: varchar("display_name"),
  bio: text("bio"),
  avatarUrl: varchar("avatar_url"),
  city: varchar("city"),
  goalType: goalTypeEnum("goal_type").default("general_fitness"),
  currentWeight: real("current_weight"),
  targetWeight: real("target_weight"),
  height: real("height"),
  age: integer("age"),
  customCaloriesTraining: integer("custom_calories_training"),
  customCaloriesRest: integer("custom_calories_rest"),
  customProtein: integer("custom_protein"),
  points: integer("points").default(0),
  level: integer("level").default(1),
  streak: integer("streak").default(0),
  lastWorkoutDate: timestamp("last_workout_date"),
  language: varchar("language").default("ro"),
  selectedTrainerId: varchar("selected_trainer_id"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  inviteCode: varchar("invite_code"),
  invitedBy: varchar("invited_by"),
  inviteCount: integer("invite_count").default(0),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  plan: varchar("plan").default("free"),
  planExpiresAt: timestamp("plan_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === WORKOUTS ===
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  notes: text("notes"),
  duration: integer("duration"),
  caloriesBurned: integer("calories_burned"),
  difficulty: difficultyEnum("difficulty").default("intermediate"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === EXERCISES ===
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull().references(() => workouts.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  muscleGroup: muscleGroupEnum("muscle_group").default("full_body"),
  sets: integer("sets").default(3),
  reps: integer("reps").default(10),
  weight: real("weight"),
  duration: integer("duration"),
  notes: text("notes"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// === EXERCISE LIBRARY (yMove API cache) ===
export const exerciseLibrary = pgTable("exercise_library", {
  id: varchar("id").primaryKey(),           // yMove exercise ID (string)
  name: varchar("name").notNull(),
  muscleGroup: varchar("muscle_group").default("full_body"),
  difficulty: varchar("difficulty").default("beginner"),
  equipment: varchar("equipment").default("none"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  exerciseType: varchar("exercise_type").default("strength"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export const insertExerciseLibrarySchema = createInsertSchema(exerciseLibrary);
export type ExerciseLibrary = typeof exerciseLibrary.$inferSelect;
export type InsertExerciseLibrary = typeof insertExerciseLibrarySchema._type;

// === NUTRITION LOGS ===
export const nutritionLogs = pgTable("nutrition_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").defaultNow(),
  mealType: varchar("meal_type").notNull().default("lunch"),
  foodName: varchar("food_name").notNull(),
  calories: integer("calories").default(0),
  protein: real("protein").default(0),
  carbs: real("carbs").default(0),
  fat: real("fat").default(0),
  quantity: real("quantity").default(1),
  unit: varchar("unit").default("g"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === PROGRESS MEASUREMENTS ===
export const progressMeasurements = pgTable("progress_measurements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  weight: real("weight"),
  bodyFat: real("body_fat"),
  chest: real("chest"),
  waist: real("waist"),
  hips: real("hips"),
  arms: real("arms"),
  legs: real("legs"),
  notes: text("notes"),
  photoUrl: varchar("photo_url"),
  measuredAt: timestamp("measured_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === ACHIEVEMENTS ===
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").notNull(),
  pointsReward: integer("points_reward").default(100),
  condition: varchar("condition").notNull(),
  conditionValue: integer("condition_value").default(1),
});

// === USER ACHIEVEMENTS ===
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// === AI COACH MESSAGES ===
export const aiCoachMessages = pgTable("ai_coach_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  role: varchar("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === DAILY CHECKINS ===
export const dailyCheckins = pgTable("daily_checkins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  date: varchar("date").notNull(),
  energyLevel: integer("energy_level").notNull(),
  sleepHours: real("sleep_hours").notNull(),
  stressLevel: integer("stress_level").notNull(),
  mood: varchar("mood").notNull(),
  notes: text("notes"),
  aiRecommendation: text("ai_recommendation"),
  shouldTrain: boolean("should_train").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === BODY SCANS ===
export const bodyScans = pgTable("body_scans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  bodyFatPercent: integer("body_fat_percent"),
  muscleScore: integer("muscle_score"),
  postureScore: integer("posture_score"),
  fitnessScore: integer("fitness_score"),
  bmi: real("bmi"),
  analysis: text("analysis"),
  strengths: text("strengths").array(),
  improvements: text("improvements").array(),
  recommendedPlan: text("recommended_plan"),
  goalType: varchar("goal_type"),
  bodyType: varchar("body_type"),
  postureDetails: text("posture_details"),
  muscleDistribution: text("muscle_distribution"),
  focusAreas: text("focus_areas").array(),
  // v2: Transformation Engine fields
  fitnessLevel: varchar("fitness_level"),
  weakMuscleGroups: text("weak_muscle_groups").array(),
  postureIssues: text("posture_issues").array(),
  recommendedTrainingSplit: varchar("recommended_training_split"),
  recommendedCalories: integer("recommended_calories"),
  predictedBodyFat30Days: integer("predicted_body_fat_30_days"),
  predictedBodyFat90Days: integer("predicted_body_fat_90_days"),
  predictedBodyFat180Days: integer("predicted_body_fat_180_days"),
  estimatedGoalDate: timestamp("estimated_goal_date"),
  trainingFrequency: integer("training_frequency"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === PROGRESS PHOTOS ===
export const progressPhotos = pgTable("progress_photos", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  photoData: text("photo_data").notNull(),
  dayLabel: varchar("day_label", { length: 50 }).notNull(),
  note: text("note"),
  takenAt: timestamp("taken_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === DAILY CHALLENGES ===
export const dailyChallenges = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  date: varchar("date").notNull().unique(),
  exercise: varchar("exercise").notNull(),
  targetReps: integer("target_reps").notNull(),
  emoji: varchar("emoji").default("💪"),
  description: text("description"),
  pointsReward: integer("points_reward").default(100),
  createdAt: timestamp("created_at").defaultNow(),
});

// === CHALLENGE PROGRESS ===
export const challengeProgress = pgTable("challenge_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  challengeId: integer("challenge_id").notNull().references(() => dailyChallenges.id),
  repsCompleted: integer("reps_completed").default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === CHALLENGE BATTLES ===
export const challengeBattles = pgTable("challenge_battles", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => dailyChallenges.id),
  creatorId: varchar("creator_id").notNull(),
  opponentId: varchar("opponent_id"),
  status: varchar("status").default("pending"),
  winnerId: varchar("winner_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === WORKOUT SETS (per-set logging — Hevy style) ===
export const workoutSets = pgTable("workout_sets", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull().references(() => workouts.id, { onDelete: "cascade" }),
  exerciseName: varchar("exercise_name").notNull(),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weight: real("weight"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === PERSONAL RECORDS ===
export const personalRecords = pgTable("personal_records", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  exerciseName: varchar("exercise_name").notNull(),
  maxWeight: real("max_weight"),
  maxReps: integer("max_reps"),
  achievedAt: timestamp("achieved_at").defaultNow(),
});

// === PUSH SUBSCRIPTIONS ===
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  notifyWorkout: boolean("notify_workout").default(true),
  notifyStreak: boolean("notify_streak").default(true),
  notifyAchievement: boolean("notify_achievement").default(true),
  notifyMotivation: boolean("notify_motivation").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  workouts: many(workouts),
  nutritionLogs: many(nutritionLogs),
  progressMeasurements: many(progressMeasurements),
  userAchievements: many(userAchievements),
  aiCoachMessages: many(aiCoachMessages),
}));

export const workoutsRelations = relations(workouts, ({ many }) => ({
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one }) => ({
  workout: one(workouts, { fields: [exercises.workoutId], references: [workouts.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

// === INSERT SCHEMAS ===
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true, createdAt: true });
export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true, createdAt: true });
export const insertNutritionLogSchema = createInsertSchema(nutritionLogs).omit({ id: true, createdAt: true });
export const insertProgressMeasurementSchema = createInsertSchema(progressMeasurements).omit({ id: true, createdAt: true });
export const insertAiCoachMessageSchema = createInsertSchema(aiCoachMessages).omit({ id: true, createdAt: true });
export const insertDailyCheckinSchema = createInsertSchema(dailyCheckins).omit({ id: true, createdAt: true });
export const insertBodyScanSchema = createInsertSchema(bodyScans).omit({ id: true, createdAt: true });
export const insertProgressPhotoSchema = createInsertSchema(progressPhotos).omit({ id: true, createdAt: true });
export const insertDailyChallengeSchema = createInsertSchema(dailyChallenges).omit({ id: true, createdAt: true });
export const insertChallengeProgressSchema = createInsertSchema(challengeProgress).omit({ id: true, createdAt: true });
export const insertChallengeBattleSchema = createInsertSchema(challengeBattles).omit({ id: true, createdAt: true });
export const insertWorkoutSetSchema = createInsertSchema(workoutSets).omit({ id: true, createdAt: true });
export const insertPersonalRecordSchema = createInsertSchema(personalRecords).omit({ id: true });

// === TYPES ===
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type InsertNutritionLog = z.infer<typeof insertNutritionLogSchema>;
export type ProgressMeasurement = typeof progressMeasurements.$inferSelect;
export type InsertProgressMeasurement = z.infer<typeof insertProgressMeasurementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type AiCoachMessage = typeof aiCoachMessages.$inferSelect;
export type InsertAiCoachMessage = z.infer<typeof insertAiCoachMessageSchema>;
export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type InsertDailyCheckin = z.infer<typeof insertDailyCheckinSchema>;
export type BodyScan = typeof bodyScans.$inferSelect;
export type InsertBodyScan = z.infer<typeof insertBodyScanSchema>;
export type ProgressPhoto = typeof progressPhotos.$inferSelect;
export type InsertProgressPhoto = z.infer<typeof insertProgressPhotoSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type InsertDailyChallenge = z.infer<typeof insertDailyChallengeSchema>;
export type ChallengeProgress = typeof challengeProgress.$inferSelect;
export type InsertChallengeProgress = z.infer<typeof insertChallengeProgressSchema>;
export type ChallengeBattle = typeof challengeBattles.$inferSelect;
export type InsertChallengeBattle = z.infer<typeof insertChallengeBattleSchema>;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type InsertWorkoutSet = z.infer<typeof insertWorkoutSetSchema>;
export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertPersonalRecord = z.infer<typeof insertPersonalRecordSchema>;

// === RANK UTILITY ===
export function getRank(points: number): { title: string; emoji: string; next: string; nextPoints: number } {
  if (points >= 5000) return { title: "FitForger Elite", emoji: "⭐", next: "Maxim", nextPoints: 5000 };
  if (points >= 3000) return { title: "Legend", emoji: "👑", next: "FitForger Elite", nextPoints: 5000 };
  if (points >= 1500) return { title: "Champion", emoji: "🏆", next: "Legend", nextPoints: 3000 };
  if (points >= 500) return { title: "Warrior", emoji: "⚔️", next: "Champion", nextPoints: 1500 };
  return { title: "Rookie", emoji: "🥉", next: "Warrior", nextPoints: 500 };
}
