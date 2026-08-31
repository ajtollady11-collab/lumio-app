"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { VoicePreference } from "@/types";

export interface OnboardingInput {
  firstName: string;
  age: number | null;
  schoolYear: string;
  country: string;
  curriculum: string;
  subjects: string[];
  teacherName: string;
  voicePreference: VoicePreference;
  personality: string;
}

export type OnboardingResult = { ok: true } | { ok: false; error: string };

/**
 * Persists the student and teacher profiles for the signed-in user.
 * RLS ensures a user can only write rows tied to their own auth id.
 */
export async function completeOnboarding(
  input: OnboardingInput,
): Promise<OnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Your session has expired. Please log in again." };
  }

  if (!input.firstName.trim()) {
    return { ok: false, error: "Please enter the student's first name." };
  }
  if (!input.teacherName.trim()) {
    return { ok: false, error: "Please give your teacher a name." };
  }

  // Upsert the student profile (one per user).
  const { data: student, error: studentError } = await supabase
    .from("student_profiles")
    .upsert(
      {
        user_id: user.id,
        first_name: input.firstName.trim(),
        age: input.age,
        school_year: input.schoolYear || null,
        country: input.country || null,
        curriculum: input.curriculum || null,
        subjects: input.subjects,
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();

  if (studentError || !student) {
    return {
      ok: false,
      error: studentError?.message ?? "Could not save your profile.",
    };
  }

  // Upsert the teacher profile (one per student).
  const { error: teacherError } = await supabase
    .from("teacher_profiles")
    .upsert(
      {
        student_id: student.id,
        teacher_name: input.teacherName.trim(),
        voice_preference: input.voicePreference,
        personality: input.personality,
      },
      { onConflict: "student_id" },
    );

  if (teacherError) {
    return { ok: false, error: teacherError.message };
  }

  return { ok: true };
}

export async function finishOnboarding() {
  redirect("/school");
}
