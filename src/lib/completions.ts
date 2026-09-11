import { createClient } from "@/lib/supabase/server";

type CompletionType = "lesson" | "quiz" | "flashcards" | "lecture";

/**
 * Records that the user completed a lesson/quiz/flashcards/lecture.
 * Fire-and-forget — safe to call without awaiting.
 */
export async function recordCompletion(
  type: CompletionType,
  subject?: string,
  score?: number
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("completions").insert({
      user_id: user.id,
      type,
      subject: subject ?? null,
      score: score ?? null,
    });
  } catch {}
}

/**
 * Gets this month's completion stats for the dashboard.
 */
export async function getCompletionStats(): Promise<{
  lessonsThisMonth: number;
  quizzesThisMonth: number;
  avgScore: number;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { lessonsThisMonth: 0, quizzesThisMonth: 0, avgScore: 0 };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("completions")
      .select("type, score")
      .eq("user_id", user.id)
      .gte("completed_at", startOfMonth.toISOString());

    const rows = data ?? [];
    const lessons = rows.filter((r) => r.type === "lesson" || r.type === "lecture").length;
    const quizzes = rows.filter((r) => r.type === "quiz").length;
    const scores = rows.filter((r) => r.score !== null).map((r) => r.score as number);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return { lessonsThisMonth: lessons, quizzesThisMonth: quizzes, avgScore: avg };
  } catch {
    return { lessonsThisMonth: 0, quizzesThisMonth: 0, avgScore: 0 };
  }
}

/**
 * Gets the last N completions for the dashboard activity feed.
 */
export async function getRecentActivity(limit = 5): Promise<Array<{
  type: string;
  subject: string | null;
  score: number | null;
  completed_at: string;
}>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("completions")
      .select("type, subject, score, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}
