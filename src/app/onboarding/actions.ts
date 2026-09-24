"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { VoicePreference } from "@/types";

interface QuizAnswers {
  goal: string;
  learningStyle: string;
  biggestChallenge: string;
  timePerDay: string;
  achievement: string;
}

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
  quizAnswers?: QuizAnswers;
}

export type OnboardingResult = { ok: true } | { ok: false; error: string };

const GOAL_LABELS: Record<string, string> = {
  grades: "get better grades",
  catchup: "catch up on missed topics",
  ahead: "get ahead of their class",
  exams: "prepare for exams",
  curious: "learn out of curiosity",
};

const STYLE_LABELS: Record<string, string> = {
  simple: "prefers simple and clear explanations",
  detail: "likes full detail and depth",
  examples: "learns best with worked examples",
  visual: "prefers visual explanations",
};

const TIME_LABELS: Record<string, string> = {
  "15": "15 minutes per day",
  "30": "30 minutes per day",
  "60": "1 hour per day",
  unlimited: "as much time as needed",
};

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
        quiz_answers: input.quizAnswers || null,
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

  // Save quiz answers into tutor memory so every AI session is personalised
  if (input.quizAnswers) {
    const q = input.quizAnswers;
    const goalLabel = GOAL_LABELS[q.goal] || q.goal;
    const styleLabel = STYLE_LABELS[q.learningStyle] || q.learningStyle;
    const timeLabel = TIME_LABELS[q.timePerDay] || q.timePerDay;

    const memoryLines = [
      `${input.firstName}'s main goal is to ${goalLabel}.`,
      `They ${styleLabel}.`,
      q.biggestChallenge ? `Their biggest challenge is: ${q.biggestChallenge}` : null,
      `They can commit ${timeLabel} to studying.`,
      q.achievement ? `They want to achieve: ${q.achievement}` : null,
    ].filter(Boolean).join(" ");

    await supabase.from("tutor_memory").upsert(
      {
        student_id: student.id,
        key: "onboarding_quiz",
        value: memoryLines,
      },
      { onConflict: "student_id,key" },
    );
  }

  redirect("/school");
}
