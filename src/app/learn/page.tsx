import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfile } from "@/types";
import { LearnModes } from "@/components/LearnModes";

export const metadata = { title: "Learn — Lumio" };

type Mode = "lesson" | "lecture" | "flashcards" | "quiz";
const VALID: Mode[] = ["lesson", "lecture", "flashcards", "quiz"];

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/learn");

  const { data: student } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<StudentProfile>();

  if (!student) redirect("/onboarding");

  const { mode } = await searchParams;
  const initialMode = VALID.includes(mode as Mode) ? (mode as Mode) : undefined;

  return (
    <LearnModes subjects={student.subjects ?? []} initialMode={initialMode} />
  );
}
