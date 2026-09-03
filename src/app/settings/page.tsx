import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfile, TeacherProfile } from "@/types";
import { SettingsView } from "@/components/SettingsView";

export const metadata = { title: "Settings — Lumio" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/settings");

  const { data: student } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<StudentProfile & { tier: "free" | "premium" }>();

  if (!student) redirect("/onboarding");

  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("student_id", student.id)
    .maybeSingle<TeacherProfile>();

  return (
    <main className="flex min-h-screen flex-col">
      <SettingsView
        firstName={student.first_name}
        age={student.age}
        schoolYear={student.school_year ?? ""}
        country={student.country ?? ""}
        curriculum={student.curriculum ?? ""}
        subjects={student.subjects ?? []}
        teacherName={teacher?.teacher_name ?? "Alex"}
        voicePreference={teacher?.voice_preference ?? "neutral"}
        personality={teacher?.personality ?? "encouraging"}
        tier={student.tier === "premium" ? "premium" : "free"}
        email={user.email ?? ""}
      />
    </main>
  );
}
