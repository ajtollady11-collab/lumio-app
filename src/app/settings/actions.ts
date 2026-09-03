"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { VoicePreference } from "@/types";

export interface SettingsInput {
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

export type SettingsResult = { ok: true } | { ok: false; error: string };

/** Saves edits to the student's own profile + teacher. RLS keeps it to self. */
export async function updateSettings(
  input: SettingsInput,
): Promise<SettingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has expired. Please log in again." };

  if (!input.firstName.trim()) {
    return { ok: false, error: "Please enter a first name." };
  }
  if (!input.teacherName.trim()) {
    return { ok: false, error: "Please give your teacher a name." };
  }
  if (input.subjects.length === 0) {
    return { ok: false, error: "Please choose at least one subject." };
  }

  const { data: student, error: sErr } = await supabase
    .from("student_profiles")
    .update({
      first_name: input.firstName.trim(),
      age: input.age,
      school_year: input.schoolYear || null,
      country: input.country || null,
      curriculum: input.curriculum || null,
      subjects: input.subjects,
    })
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (sErr || !student) {
    return { ok: false, error: sErr?.message ?? "Couldn't save your profile." };
  }

  const { error: tErr } = await supabase
    .from("teacher_profiles")
    .update({
      teacher_name: input.teacherName.trim(),
      voice_preference: input.voicePreference,
      personality: input.personality,
    })
    .eq("student_id", student.id);

  if (tErr) return { ok: false, error: tErr.message };

  revalidatePath("/school");
  revalidatePath("/settings");
  return { ok: true };
}
