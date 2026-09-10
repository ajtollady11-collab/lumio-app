import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfile, TeacherProfile } from "@/types";
import { LecturePlayer } from "@/components/LecturePlayer";

export const metadata = { title: "Lecture — Lumio" };

export default async function LecturePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; topic?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/lecture");

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

  const { subject, topic } = await searchParams;

  return (
    <LecturePlayer
      subject={decodeURIComponent(subject ?? student.subjects?.[0] ?? "Mathematics")}
      topic={decodeURIComponent(topic ?? "")}
      teacherName={teacher?.teacher_name ?? "Alex"}
      voicePreference={teacher?.voice_preference ?? "neutral"}
      firstName={student.first_name}
    />
  );
}
