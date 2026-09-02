import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfile, TeacherProfile } from "@/types";
import { PERSONALITY_OPTIONS } from "@/types";
import { checkAndCount } from "@/lib/usage";
import { PAYWALL_COPY } from "@/lib/plans";

export const runtime = "nodejs";
export const maxDuration = 45;

const MODEL = "claude-haiku-4-5";

type Mode = "lesson" | "flashcards" | "quiz" | "lecture";

interface GenerateBody {
  mode: Mode;
  subject: string;
  topic?: string;
}

/** Per-mode instruction + the exact JSON shape we want back. */
function instructionFor(mode: Mode): string {
  switch (mode) {
    case "lesson":
      return `Create a short, engaging LESSON. Return JSON:
{"type":"lesson","title":"<lesson title>","intro":"<1-2 sentence hook>","sections":[{"heading":"<heading>","body":"<2-4 sentences, clear and simple>"}],"keyPoints":["<key point>","<key point>","<key point>"],"check":{"question":"<one multiple-choice question>","options":["<a>","<b>","<c>","<d>"],"correct":<0-3>,"explanation":"<why>"}}
Use 3-4 sections. Pitch it at the student's school year.`;
    case "lecture":
      return `Create a structured LECTURE — like a teacher presenting, broken into slides. Return JSON:
{"type":"lecture","title":"<lecture title>","slides":[{"heading":"<slide heading>","points":["<bullet>","<bullet>","<bullet>"],"narration":"<2-3 sentences the teacher would say aloud for this slide>"}]}
Use 4-6 slides that build understanding progressively.`;
    case "flashcards":
      return `Create a FLASHCARD deck for revision. Return JSON:
{"type":"flashcards","title":"<deck title>","cards":[{"front":"<question or term>","back":"<concise answer/definition>"}]}
Create 8-10 cards covering the most important things to remember.`;
    case "quiz":
      return `Create a QUIZ to test understanding. Return JSON:
{"type":"quiz","title":"<quiz title>","questions":[{"question":"<question>","options":["<a>","<b>","<c>","<d>"],"correct":<0-3>,"explanation":"<why the correct answer is right>"}]}
Create 5 questions of varying difficulty, pitched at the student's level.`;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Not configured yet. Please try again later." },
      { status: 503 },
    );
  }

  let body: GenerateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const modes: Mode[] = ["lesson", "flashcards", "quiz", "lecture"];
  if (!modes.includes(body.mode) || !body.subject) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const subject = String(body.subject).slice(0, 80);
  const topic = body.topic ? String(body.topic).slice(0, 120) : "";

  // Enforce the monthly usage limit (free tier caps; premium unlimited).
  const usage = await checkAndCount(user.id, "generation");
  if (!usage.allowed) {
    return NextResponse.json(
      { error: PAYWALL_COPY.generation.body, paywall: PAYWALL_COPY.generation, limitReached: true },
      { status: 402 },
    );
  }

  // Personalisation from the student's profile.
  const { data: student } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<StudentProfile>();

  let teacher: TeacherProfile | null = null;
  if (student) {
    const { data: t } = await supabase
      .from("teacher_profiles")
      .select("*")
      .eq("student_id", student.id)
      .maybeSingle<TeacherProfile>();
    teacher = t;
  }

  const year = student?.school_year || "their school year";
  const curriculum = student?.curriculum || "their curriculum";
  const personality =
    PERSONALITY_OPTIONS.find((p) => p.value === teacher?.personality)?.label ??
    "Encouraging";

  const system = `You are an expert teacher creating learning material for a student in ${year} following ${curriculum}. Your teaching personality is ${personality}. The material must be accurate, age-appropriate, and pitched at the right level. You ONLY create legitimate educational content. Respond with ONLY valid JSON in the exact shape requested — no markdown, no code fences, no commentary before or after.`;

  const userPrompt = `Subject: ${subject}${topic ? `\nTopic: ${topic}` : "\n(Choose a suitable core topic for this subject.)"}\n\n${instructionFor(body.mode)}`;

  const anthropic = new Anthropic({ apiKey });
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    // Be tolerant: strip any stray code fences, then parse.
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let data: unknown;
    try {
      data = JSON.parse(cleaned);
    } catch {
      // Last resort: find the first {...} block.
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("no json");
      data = JSON.parse(match[0]);
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Couldn't create that just now. Please try again." },
      { status: 502 },
    );
  }
}
