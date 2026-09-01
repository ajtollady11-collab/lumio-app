import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfile, TeacherProfile } from "@/types";
import { PERSONALITY_OPTIONS } from "@/types";
import { TutorChat } from "@/components/TutorChat";

export const metadata = { title: "Your tutor — Lumio" };

export default async function TutorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/tutor");

  const { data: student } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<StudentProfile>();

  if (!student) redirect("/onboarding");

  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("student_id", student.id)
    .maybeSingle<TeacherProfile>();

  const personalityLabel =
    PERSONALITY_OPTIONS.find((p) => p.value === teacher?.personality)?.label ??
    "Encouraging";

  return (
    <TutorChat
      firstName={student.first_name}
      teacherName={teacher?.teacher_name ?? "Alex"}
      personalityLabel={personalityLabel}
    />
  );
}
