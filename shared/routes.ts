import { z } from "zod";
import {
  insertWorkoutSchema,
  insertExerciseSchema,
  insertNutritionLogSchema,
  insertProgressMeasurementSchema,
  insertUserProfileSchema,
} from "./schema";

export const errorSchemas = {
  notFound: z.object({ message: z.string() }),
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    user: { method: "GET" as const, path: "/api/auth/user" as const },
    login: { method: "GET" as const, path: "/api/login" as const },
    logout: { method: "GET" as const, path: "/api/logout" as const },
  },
  profile: {
    get: { method: "GET" as const, path: "/api/profile" as const },
    upsert: { method: "PUT" as const, path: "/api/profile" as const, input: insertUserProfileSchema.partial() },
  },
  workouts: {
    list: { method: "GET" as const, path: "/api/workouts" as const },
    get: { method: "GET" as const, path: "/api/workouts/:id" as const },
    create: { method: "POST" as const, path: "/api/workouts" as const, input: insertWorkoutSchema },
    update: { method: "PUT" as const, path: "/api/workouts/:id" as const, input: insertWorkoutSchema.partial() },
    delete: { method: "DELETE" as const, path: "/api/workouts/:id" as const },
    complete: { method: "POST" as const, path: "/api/workouts/:id/complete" as const },
  },
  exercises: {
    list: { method: "GET" as const, path: "/api/workouts/:workoutId/exercises" as const },
    create: { method: "POST" as const, path: "/api/workouts/:workoutId/exercises" as const, input: insertExerciseSchema },
    update: { method: "PUT" as const, path: "/api/exercises/:id" as const, input: insertExerciseSchema.partial() },
    delete: { method: "DELETE" as const, path: "/api/exercises/:id" as const },
  },
  nutrition: {
    list: { method: "GET" as const, path: "/api/nutrition" as const },
    create: { method: "POST" as const, path: "/api/nutrition" as const, input: insertNutritionLogSchema },
    delete: { method: "DELETE" as const, path: "/api/nutrition/:id" as const },
    analyze: { method: "POST" as const, path: "/api/nutrition/analyze" as const, input: z.object({ description: z.string() }) },
  },
  progress: {
    list: { method: "GET" as const, path: "/api/progress" as const },
    create: { method: "POST" as const, path: "/api/progress" as const, input: insertProgressMeasurementSchema },
    delete: { method: "DELETE" as const, path: "/api/progress/:id" as const },
  },
  achievements: {
    list: { method: "GET" as const, path: "/api/achievements" as const },
    userAchievements: { method: "GET" as const, path: "/api/achievements/user" as const },
  },
  aiCoach: {
    messages: { method: "GET" as const, path: "/api/ai-coach" as const },
    chat: { method: "POST" as const, path: "/api/ai-coach/chat" as const, input: z.object({ message: z.string() }) },
    analyzeWorkout: { method: "POST" as const, path: "/api/ai-coach/analyze-workout" as const, input: z.object({ workoutId: z.number() }) },
    generatePlan: { method: "POST" as const, path: "/api/ai-coach/generate-plan" as const, input: z.object({ goalType: z.string(), level: z.string() }) },
  },
  stats: {
    dashboard: { method: "GET" as const, path: "/api/stats/dashboard" as const },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ProfileUpsertInput = z.infer<typeof api.profile.upsert.input>;
export type WorkoutCreateInput = z.infer<typeof api.workouts.create.input>;
export type NutritionCreateInput = z.infer<typeof api.nutrition.create.input>;
export type ProgressCreateInput = z.infer<typeof api.progress.create.input>;
export type AiChatInput = z.infer<typeof api.aiCoach.chat.input>;
