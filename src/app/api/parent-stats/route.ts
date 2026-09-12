/**
 * Returns stats for a student the parent is linked to.
 * GET ?student_id=xxx
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const studentId = request.nextUrl.searchParams.get("student_id");
  if (!studentId) return NextResponse.json({ error: "student_id required" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 500 });

  // Verify this parent is linked to this student
  const { data: link } = await admin
    .from("parent_profiles")
    .select("id")
    .eq("parent_user_id", user.id)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!link) return NextResponse.json({ error: "Not authorised for this student" }, { status: 403 });

  // Get student info
  const { data: student } = await admin
    .from("student_profiles")
    .select("first_name, subjects, school_year, curriculum")
    .eq("id", studentId)
    .maybeSingle();

  // Get the student's user_id
  const { data: studentWithUser } = await admin
    .from("student_profiles")
    .select("user_id")
    .eq("id", studentId)
    .maybeSingle();

  const userId = studentWithUser?.user_id;

  // Get streak
  const today = new Date().toISOString().split("T")[0];
  const { count: todayActivity } = await admin
    .from("user_activity")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("activity_date", today);

  // Get this month's completions
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: completions } = await admin
    .from("completions")
    .select("type, subject, score, completed_at")
    .eq("user_id", userId)
    .gte("completed_at", startOfMonth.toISOString())
    .order("completed_at", { ascending: false });

  const rows = completions ?? [];
  const lessons = rows.filter(r => r.type === "lesson" || r.type === "lecture").length;
  const quizzes = rows.filter(r => r.type === "quiz").length;
  const scores = rows.filter(r => r.score !== null).map(r => r.score as number);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  // Get recent activity (last 5)
  const recent = rows.slice(0, 5);

  // Get upcoming exams
  const { data: exams } = await admin
    .from("exams")
    .select("exam_name, subject, exam_date")
    .eq("user_id", userId)
    .gte("exam_date", today)
    .order("exam_date", { ascending: true })
    .limit(3);

  return NextResponse.json({
    student,
    activeToday: (todayActivity ?? 0) > 0,
    lessonsThisMonth: lessons,
    quizzesThisMonth: quizzes,
    avgScore,
    recentActivity: recent,
    upcomingExams: exams ?? [],
  });
}
