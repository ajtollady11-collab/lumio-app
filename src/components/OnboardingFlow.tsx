"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Field, Input, Select, FormError } from "@/components/Field";
import {
  SUBJECT_OPTIONS,
  CURRICULUM_OPTIONS,
  PERSONALITY_OPTIONS,
  VOICE_OPTIONS,
  type VoicePreference,
} from "@/types";
import { completeOnboarding } from "@/app/onboarding/actions";

const STEPS = ["About you", "Your subjects", "Your teacher"] as const;

interface FormState {
  firstName: string;
  age: string;
  schoolYear: string;
  country: string;
  curriculum: string;
  subjects: string[];
  teacherName: string;
  voicePreference: VoicePreference;
  personality: string;
}

const initialState: FormState = {
  firstName: "",
  age: "",
  schoolYear: "",
  country: "",
  curriculum: "",
  subjects: [],
  teacherName: "",
  voicePreference: "neutral",
  personality: "encouraging",
};

export function OnboardingFlow({
  defaultFirstName = "",
}: {
  defaultFirstName?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    ...initialState,
    firstName: defaultFirstName,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleSubject(subject: string) {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(subject)
        ? f.subjects.filter((s) => s !== subject)
        : [...f.subjects, subject],
    }));
  }

  function next() {
    setError(null);
    if (step === 0 && !form.firstName.trim()) {
      setError("Please enter a first name to continue.");
      return;
    }
    if (step === 1 && form.subjects.length === 0) {
      setError("Choose at least one subject.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    setError(null);
    if (!form.teacherName.trim()) {
      setError("Give your teacher a name to finish.");
      return;
    }
    setSaving(true);
    const result = await completeOnboarding({
      firstName: form.firstName,
      age: form.age ? Number(form.age) : null,
      schoolYear: form.schoolYear,
      country: form.country,
      curriculum: form.curriculum,
      subjects: form.subjects,
      teacherName: form.teacherName,
      voicePreference: form.voicePreference,
      personality: form.personality,
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/school");
    router.refresh();
  }

  return (
    <div className="w-full max-w-xl">
      {/* Progress — genuinely sequential, so numbered steps are appropriate */}
      <ol className="mb-8 flex items-center gap-3">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-3">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                i <= step
                  ? "bg-indigo text-white"
                  : "bg-white text-muted border border-[var(--line)]"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`hidden text-sm sm:block ${
                i === step ? "font-medium text-ink" : "text-muted"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="h-px flex-1 bg-[var(--line)]" aria-hidden />
            )}
          </li>
        ))}
      </ol>

      <div className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(23,26,43,0.35)] sm:p-8">
        <FormError>{error}</FormError>

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Tell us about the student
            </h2>
            <Field label="First name" htmlFor="firstName">
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="e.g. Maya"
                autoComplete="given-name"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Age" htmlFor="age">
                <Input
                  id="age"
                  type="number"
                  min={4}
                  max={19}
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                  placeholder="e.g. 14"
                />
              </Field>
              <Field label="School year / grade" htmlFor="schoolYear">
                <Input
                  id="schoolYear"
                  value={form.schoolYear}
                  onChange={(e) => update("schoolYear", e.target.value)}
                  placeholder="e.g. Year 10"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Country" htmlFor="country">
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  placeholder="e.g. United Kingdom"
                  autoComplete="country-name"
                />
              </Field>
              <Field label="Curriculum" htmlFor="curriculum">
                <Select
                  id="curriculum"
                  value={form.curriculum}
                  onChange={(e) => update("curriculum", e.target.value)}
                >
                  <option value="">Select…</option>
                  {CURRICULUM_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold text-ink">
              What would you like to learn?
            </h2>
            <p className="text-sm text-muted">
              Pick the subjects to start with. You can change these later.
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {SUBJECT_OPTIONS.map((subject) => {
                const selected = form.subjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    aria-pressed={selected}
                    className={`focus-ring rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      selected
                        ? "border-indigo bg-[var(--indigo)]/8 font-medium text-indigo"
                        : "border-[var(--line)] bg-white text-ink-2 hover:border-ink"
                    }`}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">
                Create your personal teacher
              </h2>
              <p className="mt-1 text-sm text-muted">
                We&rsquo;ll save these preferences now. Your teacher comes to
                life in a later release.
              </p>
            </div>
            <Field label="Teacher name" htmlFor="teacherName">
              <Input
                id="teacherName"
                value={form.teacherName}
                onChange={(e) => update("teacherName", e.target.value)}
                placeholder="e.g. Professor Ada"
              />
            </Field>
            <Field label="Voice preference">
              <div className="flex gap-2.5">
                {VOICE_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => update("voicePreference", v.value)}
                    aria-pressed={form.voicePreference === v.value}
                    className={`focus-ring flex-1 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      form.voicePreference === v.value
                        ? "border-indigo bg-[var(--indigo)]/8 font-medium text-indigo"
                        : "border-[var(--line)] bg-white text-ink-2 hover:border-ink"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Teaching personality">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {PERSONALITY_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => update("personality", p.value)}
                    aria-pressed={form.personality === p.value}
                    className={`focus-ring rounded-xl border p-3 text-left transition-colors ${
                      form.personality === p.value
                        ? "border-indigo bg-[var(--indigo)]/8"
                        : "border-[var(--line)] bg-white hover:border-ink"
                    }`}
                  >
                    <span className="block text-sm font-medium text-ink">
                      {p.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {p.hint}
                    </span>
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={back}
            disabled={step === 0 || saving}
            className={step === 0 ? "invisible" : ""}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={saving}>
              {saving ? "Setting up…" : "Enter my school"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
