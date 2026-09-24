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

const STEPS = ["About you", "Your subjects", "Your teacher", "Quick quiz"] as const;

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

interface QuizAnswers {
  goal: string;
  learningStyle: string;
  biggestChallenge: string;
  timePerDay: string;
  achievement: string;
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

const initialQuiz: QuizAnswers = {
  goal: "",
  learningStyle: "",
  biggestChallenge: "",
  timePerDay: "",
  achievement: "",
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
  const [quiz, setQuiz] = useState<QuizAnswers>(initialQuiz);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleSubject(subject: string) {
    set(
      "subjects",
      form.subjects.includes(subject)
        ? form.subjects.filter((s) => s !== subject)
        : [...form.subjects, subject],
    );
  }

  function nextStep() {
    setError(null);
    if (step === 0) {
      if (!form.firstName.trim()) return setError("Please enter a first name.");
    }
    if (step === 1) {
      if (form.subjects.length === 0) return setError("Pick at least one subject.");
    }
    if (step === 2) {
      if (!form.teacherName.trim()) return setError("Please give your teacher a name.");
    }
    setStep((s) => s + 1);
  }

  async function submit() {
    setError(null);
    if (!quiz.goal) return setError("Please answer all questions.");
    if (!quiz.learningStyle) return setError("Please answer all questions.");
    if (!quiz.timePerDay) return setError("Please answer all questions.");

    setSubmitting(true);
    const result = await completeOnboarding({
      firstName: form.firstName,
      age: form.age ? parseInt(form.age) : null,
      schoolYear: form.schoolYear,
      country: form.country,
      curriculum: form.curriculum,
      subjects: form.subjects,
      teacherName: form.teacherName,
      voicePreference: form.voicePreference,
      personality: form.personality,
      quizAnswers: quiz,
    });
    setSubmitting(false);
    if (!result.ok) return setError(result.error);
    router.push("/school");
  }

  const GOAL_OPTIONS = [
    { value: "grades", label: "🎯 Get better grades" },
    { value: "catchup", label: "📚 Catch up on missed topics" },
    { value: "ahead", label: "🚀 Get ahead of my class" },
    { value: "exams", label: "📝 Prepare for exams" },
    { value: "curious", label: "💡 I just love learning" },
  ];

  const STYLE_OPTIONS = [
    { value: "simple", label: "🧩 Keep it simple and clear" },
    { value: "detail", label: "🔬 Give me the full detail" },
    { value: "examples", label: "✏️ Teach me with examples" },
    { value: "visual", label: "🎨 Explain it visually" },
  ];

  const TIME_OPTIONS = [
    { value: "15", label: "⚡ 15 minutes" },
    { value: "30", label: "📖 30 minutes" },
    { value: "60", label: "🎓 1 hour" },
    { value: "unlimited", label: "🔥 As much as I need" },
  ];

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
            <div className={`h-1.5 w-full rounded-full transition-colors ${i <= step ? "bg-indigo" : "bg-[var(--line-2)]"}`} />
            <span className={`text-[11px] font-medium ${i === step ? "text-indigo" : "text-muted"}`}>{s}</span>
          </div>
        ))}
      </div>

      {/* Step 0 — About you */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">Let's get started</h1>
            <p className="mt-1 text-sm text-muted">Tell us a bit about the student.</p>
          </div>
          <Field label="First name">
            <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="e.g. Alfie" autoFocus />
          </Field>
          <Field label="Age">
            <Input type="number" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="e.g. 15" min={5} max={25} />
          </Field>
          <Field label="School year">
            <Select value={form.schoolYear} onChange={(e) => set("schoolYear", e.target.value)}>
              <option value="">Select year…</option>
              {["Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13","University","Other"].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </Field>
          <Field label="Country">
            <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="e.g. United Kingdom" />
          </Field>
          <Field label="Curriculum">
            <Select value={form.curriculum} onChange={(e) => set("curriculum", e.target.value)}>
              <option value="">Select curriculum…</option>
              {CURRICULUM_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          {error && <FormError>{error}</FormError>}
          <Button onClick={nextStep} className="w-full">Continue →</Button>
        </div>
      )}

      {/* Step 1 — Subjects */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">Your subjects</h1>
            <p className="mt-1 text-sm text-muted">Pick everything you study.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SUBJECT_OPTIONS.map((subject) => {
              const selected = form.subjects.includes(subject);
              return (
                <button
                  key={subject}
                  onClick={() => toggleSubject(subject)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${selected ? "border-indigo bg-indigo/8 text-indigo" : "border-[var(--line-2)] text-ink-2 hover:border-[var(--line)]"}`}
                >
                  {subject}
                </button>
              );
            })}
          </div>
          {error && <FormError>{error}</FormError>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
            <Button onClick={nextStep} className="flex-1">Continue →</Button>
          </div>
        </div>
      )}

      {/* Step 2 — Teacher */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">Your AI teacher</h1>
            <p className="mt-1 text-sm text-muted">Personalise your tutor.</p>
          </div>
          <Field label="Teacher name">
            <Input value={form.teacherName} onChange={(e) => set("teacherName", e.target.value)} placeholder="e.g. Mr Smith, Ms Johnson…" autoFocus />
          </Field>
          <Field label="Teaching style">
            <Select value={form.personality} onChange={(e) => set("personality", e.target.value)}>
              {PERSONALITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
          </Field>
          <Field label="Voice">
            <Select value={form.voicePreference} onChange={(e) => set("voicePreference", e.target.value as VoicePreference)}>
              {VOICE_OPTIONS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </Select>
          </Field>
          {error && <FormError>{error}</FormError>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button onClick={nextStep} className="flex-1">Continue →</Button>
          </div>
        </div>
      )}

      {/* Step 3 — Quiz */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">Just 5 quick questions</h1>
            <p className="mt-1 text-sm text-muted">So {form.teacherName || "your teacher"} can tailor every lesson to you.</p>
          </div>

          {/* Q1 */}
          <div>
            <p className="mb-2.5 text-[14px] font-semibold text-ink">1. What's your main goal with Lumio?</p>
            <div className="grid grid-cols-1 gap-2">
              {GOAL_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => setQuiz((q) => ({ ...q, goal: o.value }))}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${quiz.goal === o.value ? "border-indigo bg-indigo/8 text-indigo" : "border-[var(--line-2)] text-ink-2 hover:border-[var(--line)]"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2 */}
          <div>
            <p className="mb-2.5 text-[14px] font-semibold text-ink">2. How do you learn best?</p>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => setQuiz((q) => ({ ...q, learningStyle: o.value }))}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${quiz.learningStyle === o.value ? "border-indigo bg-indigo/8 text-indigo" : "border-[var(--line-2)] text-ink-2 hover:border-[var(--line)]"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q3 */}
          <div>
            <p className="mb-2.5 text-[14px] font-semibold text-ink">3. What's your biggest challenge right now?</p>
            <textarea
              value={quiz.biggestChallenge}
              onChange={(e) => setQuiz((q) => ({ ...q, biggestChallenge: e.target.value }))}
              placeholder="e.g. I struggle with essay structure, maths confuses me, I can't focus…"
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-ink outline-none focus:border-indigo resize-none"
              rows={3}
            />
          </div>

          {/* Q4 */}
          <div>
            <p className="mb-2.5 text-[14px] font-semibold text-ink">4. How much time can you commit per day?</p>
            <div className="grid grid-cols-2 gap-2">
              {TIME_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => setQuiz((q) => ({ ...q, timePerDay: o.value }))}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${quiz.timePerDay === o.value ? "border-indigo bg-indigo/8 text-indigo" : "border-[var(--line-2)] text-ink-2 hover:border-[var(--line)]"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q5 */}
          <div>
            <p className="mb-2.5 text-[14px] font-semibold text-ink">5. What do you want to achieve?</p>
            <textarea
              value={quiz.achievement}
              onChange={(e) => setQuiz((q) => ({ ...q, achievement: e.target.value }))}
              placeholder="e.g. Pass my Maths GCSE, get an A in English, understand Chemistry…"
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-ink outline-none focus:border-indigo resize-none"
              rows={3}
            />
          </div>

          {error && <FormError>{error}</FormError>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
            <Button onClick={submit} disabled={submitting} className="flex-1">
              {submitting ? "Setting up your school…" : "Start learning →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
