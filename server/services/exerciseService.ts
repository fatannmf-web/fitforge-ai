const YMOVE_BASE = "https://ymove.app/api/v2";

export interface YMoveVideo {
  videoUrl: string;
  videoHlsUrl?: string;
  thumbnailUrl?: string;
  tag?: string;
  orientation?: string;
  isPrimary?: boolean;
}

export interface YMoveExercise {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  instructions?: string[];
  importantPoints?: string[];
  muscleGroup?: string;
  secondaryMuscles?: string[] | null;
  equipment?: string;
  category?: string;
  difficulty?: string;
  exerciseType?: string[];
  hasVideo?: boolean;
  videoUrl?: string;
  videoHlsUrl?: string;
  thumbnailUrl?: string;
  videos?: YMoveVideo[];
}

async function ymoveFetch(path: string): Promise<YMoveExercise[]> {
  try {
    const response = await fetch(`${YMOVE_BASE}${path}`, {
      headers: {
        "X-API-Key": process.env.YMOVE_API_KEY ?? "",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[yMove] API ${response.status}: ${await response.text()}`);
      return [];
    }

    const json = await response.json();
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.exercises)) return json.exercises;
    return [];
  } catch (err) {
    console.error("[yMove] Fetch error:", err);
    return [];
  }
}

export async function getExercises(muscle?: string, limit?: number): Promise<YMoveExercise[]> {
  const params = new URLSearchParams();
  if (muscle) params.set("muscle", muscle);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return ymoveFetch(`/exercises${qs ? `?${qs}` : ""}`);
}

export async function searchExercises(query: string): Promise<YMoveExercise[]> {
  return ymoveFetch(`/exercises?search=${encodeURIComponent(query)}`);
}

export async function getExerciseBySlug(slug: string): Promise<YMoveExercise | null> {
  const list = await ymoveFetch(`/exercises?slug=${encodeURIComponent(slug)}`);
  return list[0] ?? null;
}

/**
 * Fetch all available exercises using page-based pagination.
 * Stops when we get 0 new unique IDs in a page (end of catalog).
 * Rate limit: 30 req/min → 400ms delay between calls.
 */
export async function fetchAllExercises(maxPages = 13): Promise<YMoveExercise[]> {
  const seen = new Set<string>();
  const all: YMoveExercise[] = [];

  for (let page = 1; page <= maxPages; page++) {
    await new Promise(r => setTimeout(r, 400));
    const batch = await ymoveFetch(`/exercises?limit=20&page=${page}`);

    if (batch.length === 0) {
      console.log(`[yMove] Page ${page} empty — stopping.`);
      break;
    }

    let newInPage = 0;
    for (const ex of batch) {
      if (!seen.has(ex.id)) {
        seen.add(ex.id);
        all.push(ex);
        newInPage++;
      }
    }

    console.log(`[yMove] Page ${page}: ${batch.length} fetched, ${newInPage} new (total ${all.length})`);

    if (newInPage === 0) {
      console.log(`[yMove] No new exercises on page ${page} — catalog exhausted.`);
      break;
    }
  }

  return all;
}
