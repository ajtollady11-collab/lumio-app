import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfile, TeacherProfile } from "@/types";
import { PERSONALITY_OPTIONS } from "@/types";
import { SchoolDashboard } from "@/components/SchoolDashboard";

export const metadata = { title: "Your school — Lumio" };

export default async function SchoolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<StudentProfile>();

  // No profile yet → send them through onboarding first.
  if (!student) redirect("/onboarding");

  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("student_id", student.id)
    .maybeSingle<TeacherProfile>();

  const personalityLabel =
    PERSONALITY_OPTIONS.find((p) => p.value === teacher?.personality)?.label ??
    teacher?.personality ??
    "Encouraging";

  return (
    <SchoolDashboard
      firstName={student.first_name}
      teacherName={teacher?.teacher_name ?? "Alex"}
      personalityLabel={personalityLabel}
      voice={teacher?.voice_preference ?? "neutral"}
      curriculum={student.curriculum}
      subjects={student.subjects ?? []}
    />
  );
}
