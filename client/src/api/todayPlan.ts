export interface WorkoutExercise {
  name: string;
  video?: string;
  thumbnail?: string;
  sets: number;
  reps: number;
}

export interface TodayPlanData {
  workout: {
    title: string;
    duration: string;
    muscle: string;
    workoutId: number | null;
    exercises: WorkoutExercise[];
  };
  challenge: {
    exercise: string;
    emoji: string;
    target: number;
    progress: number;
    completed: boolean;
    globalReps: number;
    usersCompleted: number;
  };
  battle: {
    user: number;
    opponent: number;
    opponentName: string;
    battleId: number;
  } | null;
  streak: number;
  name: string;
  points: number;
}

export async function fetchTodayPlan(): Promise<TodayPlanData> {
  const res = await fetch("/api/today-plan", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch today plan");
  return res.json();
}

export async function addChallengeReps(reps: number): Promise<{ justCompleted: boolean; xpEarned: number }> {
  const res = await fetch("/api/challenge/progress", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reps }),
  });
  if (!res.ok) throw new Error("Failed to add reps");
  return res.json();
}
