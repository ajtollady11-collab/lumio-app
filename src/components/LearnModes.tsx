"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Paywall } from "@/components/Paywall";

type Mode = "lesson" | "lecture" | "flashcards" | "quiz";

const MODE_META: Record<
  Mode,
  { label: string; blurb: string; color: string; icon: string }
> = {
  lesson: { label: "Learn a topic", blurb: "A guided lesson with a check for understanding", color: "91,84,224", icon: "📖" },
  lecture: { label: "Watch a lecture", blurb: "A structured, slide-by-slide teacher explanation", color: "63,120,180", icon: "🎓" },
  flashcards: { label: "Flashcards", blurb: "Flip through key facts to revise fast", color: "232,184,75", icon: "🃏" },
  quiz: { label: "Quiz me", blurb: "Test yourself with instant feedback", color: "111,160,136", icon: "✅" },
};

/* ---------- generated content shapes ---------- */
interface LessonData {
  type: "lesson";
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
  keyPoints: string[];
  check?: { question: string; options: string[]; correct: number; explanation: string };
}
interface LectureData {
  type: "lecture";
  title: string;
  slides: { heading: string; points: string[]; narration: string }[];
}
interface FlashData {
  type: "flashcards";
  title: string;
  cards: { front: string; back: string }[];
}
interface QuizData {
  type: "quiz";
  title: string;
  questions: { question: string; options: string[]; correct: number; explanation: string }[];
}
type GenData = LessonData | LectureData | FlashData | QuizData;

export function LearnModes({
  subjects,
  initialMode,
}: {
  subjects: string[];
  initialMode?: Mode;
}) {
  const router = useRouter();
  const subs = subjects.length ? subjects : ["Mathematics", "English", "Science"];

  const [mode, setMode] = useState<Mode | null>(initialMode ?? null);
  const [subject, setSubject] = useState<string>(subs[0]);
  const [otherSubject, setOtherSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<{ title: string; body: string } | null>(null);
  const [data, setData] = useState<GenData | null>(null);

  async function generate() {
    if (!mode) return;
    const effectiveSubject =
      subject === "__other__" ? otherSubject.trim() : subject;
    if (!effectiveSubject) {
      setError("Please type the subject you'd like to learn.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, subject: effectiveSubject, topic: topic.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 402 && json?.paywall) {
          setPaywall(json.paywall);
        } else {
          setError(json?.error || "Couldn't create that. Please try again.");
        }
      } else {
        setData(json.data as GenData);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setData(null);
    setError(null);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40 border-b border-[var(--line-2)] bg-paper/85 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 sm:px-6">
          <button
            onClick={() => (data ? reset() : mode ? setMode(null) : router.push("/school"))}
            className="inline-flex items-center gap-1.5 rounded-full py-2 pl-2.5 pr-3.5 text-sm font-medium text-ink-2 transition-colors hover:bg-[rgba(20,22,42,.06)]"
          >
            ← {data ? "New" : mode ? "Modes" : "Back to dashboard"}
          </button>
          <span className="font-display text-lg font-semibold">Lumio</span>
        </div>
      </div>

      <main className="flex-1 px-5 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {/* Step 1: pick a mode */}
          {!mode && (
            <>
              <h1 className="font-display text-[clamp(28px,4vw,38px)] font-semibold tracking-tight">
                What would you like to do?
              </h1>
              <p className="mt-2 text-ink-2">
                Pick a way to learn — Lumio will create it for your subject, just for you.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {(Object.keys(MODE_META) as Mode[]).map((m) => {
                  const meta = MODE_META[m];
                  return (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className="flex items-start gap-4 rounded-3xl border border-[var(--line-2)] bg-white p-6 text-left transition-transform hover:-translate-y-1"
                      style={{ boxShadow: "var(--shadow-sm)" }}
                    >
                      <span
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
                        style={{ background: `rgba(${meta.color},.14)` }}
                      >
                        {meta.icon}
                      </span>
                      <span>
                        <span className="block font-display text-lg font-semibold">{meta.label}</span>
                        <span className="mt-1 block text-sm text-ink-2">{meta.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Step 2: pick subject + topic */}
          {mode && !data && !loading && (
            <>
              <div className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 place-items-center rounded-2xl text-xl"
                  style={{ background: `rgba(${MODE_META[mode].color},.14)` }}
                >
                  {MODE_META[mode].icon}
                </span>
                <h1 className="font-display text-2xl font-semibold">{MODE_META[mode].label}</h1>
              </div>

              <div className="mt-6 rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
                <label className="text-sm font-medium">Subject</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {subs.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                        subject === s
                          ? "border-transparent bg-[var(--indigo)]/10 font-semibold text-indigo shadow-[inset_0_0_0_1.5px_rgba(91,84,224,.4)]"
                          : "border-[var(--line)] bg-white text-ink-2 hover:border-ink"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => setSubject("__other__")}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      subject === "__other__"
                        ? "border-transparent bg-[var(--indigo)]/10 font-semibold text-indigo shadow-[inset_0_0_0_1.5px_rgba(91,84,224,.4)]"
                        : "border-dashed border-[var(--line)] bg-white text-ink-2 hover:border-ink"
                    }`}
                  >
                    + Other…
                  </button>
                </div>

                {subject === "__other__" && (
                  <input
                    value={otherSubject}
                    onChange={(e) => setOtherSubject(e.target.value)}
                    placeholder="Type any subject — e.g. Psychology, Latin, Business…"
                    autoFocus
                    className="mt-3 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
                    onKeyDown={(e) => e.key === "Enter" && generate()}
                  />
                )}

                <label className="mt-5 block text-sm font-medium">
                  Topic <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. a specific topic — or leave blank"
                  className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
                  onKeyDown={(e) => e.key === "Enter" && generate()}
                />

                <button
                  onClick={generate}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo text-base font-medium text-white transition-colors hover:bg-[var(--indigo-ink)]"
                >
                  Create it →
                </button>
              </div>
            </>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="flex gap-1.5">
                <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
              </div>
              <p className="mt-5 font-display text-xl font-semibold">
                Creating your {mode} on {subject}…
              </p>
              <p className="mt-1 text-sm text-muted">Your tutor is putting this together just for you.</p>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-[rgba(224,118,91,.3)] bg-[rgba(224,118,91,.08)] px-4 py-3 text-sm text-[#8a3826]">
              {error}
              <button onClick={() => setError(null)} className="ml-2 font-semibold underline">Try again</button>
            </div>
          )}

          {/* Result */}
          {data && !loading && (
            <div className="pb-10">
              {data.type === "lesson" && <LessonView d={data} />}
              {data.type === "lecture" && <LectureView d={data} />}
              {data.type === "flashcards" && <FlashcardsView d={data} />}
              {data.type === "quiz" && <QuizView d={data} />}
              <div className="mt-8 flex justify-center gap-3">
                <button onClick={reset} className="inline-flex h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-medium hover:border-ink">
                  Make another
                </button>
                <button onClick={() => router.push("/school")} className="inline-flex h-11 items-center rounded-full bg-indigo px-5 text-sm font-medium text-white hover:bg-[var(--indigo-ink)]">
                  Back to dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {paywall && (
        <Paywall
          title={paywall.title}
          body={paywall.body}
          onClose={() => setPaywall(null)}
          onUpgrade={() => router.push("/upgrade")}
        />
      )}
    </div>
  );
}

/* ================= LESSON ================= */
function LessonView({ d }: { d: LessonData }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div>
      <h1 className="font-display text-[clamp(26px,4vw,34px)] font-semibold tracking-tight">{d.title}</h1>
      {d.intro && <p className="mt-2 text-lg text-ink-2">{d.intro}</p>}
      <div className="mt-6 space-y-4">
        {d.sections?.map((s, i) => (
          <div key={i} className="rounded-2xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
            <h3 className="font-display text-lg font-semibold">{s.heading}</h3>
            <p className="mt-2 leading-relaxed text-ink-2">{s.body}</p>
          </div>
        ))}
      </div>
      {d.keyPoints?.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[var(--line-2)] bg-paper-3 p-6">
          <h4 className="text-[13px] font-semibold uppercase tracking-wide text-indigo">Key points</h4>
          <ul className="mt-3 space-y-2">
            {d.keyPoints.map((k, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] text-ink-2">
                <span className="mt-1 text-[var(--sage)]">✓</span> {k}
              </li>
            ))}
          </ul>
        </div>
      )}
      {d.check && (
        <div className="mt-6 rounded-2xl border border-[rgba(91,84,224,.16)] bg-[rgba(91,84,224,.04)] p-6">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-indigo">Quick check</span>
          <p className="mt-2 font-display text-lg font-semibold">{d.check.question}</p>
          <div className="mt-4 space-y-2.5">
            {d.check.options.map((o, i) => {
              const locked = picked !== null;
              const isC = i === d.check!.correct;
              let cls = "border-[var(--line)] bg-white";
              if (locked && isC) cls = "border-[var(--sage)] bg-[var(--sage)]/10";
              else if (locked && picked === i) cls = "border-[var(--coral)] bg-[var(--coral)]/8";
              return (
                <button key={i} disabled={locked} onClick={() => setPicked(i)}
                  className={`flex w-full items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 text-left text-[15px] transition-transform ${cls} ${locked ? "" : "hover:-translate-y-0.5 hover:border-indigo"}`}>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-paper-2 text-[13px] font-semibold">{String.fromCharCode(65 + i)}</span>
                  {o}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${picked === d.check.correct ? "border-[rgba(111,160,136,.3)] bg-[rgba(111,160,136,.12)] text-[#2f5e46]" : "border-[rgba(224,118,91,.3)] bg-[rgba(224,118,91,.1)] text-[#8a3826]"}`}>
              <b>{picked === d.check.correct ? "Correct! " : "Not quite. "}</b>{d.check.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================= LECTURE ================= */
function LectureView({ d }: { d: LectureData }) {
  const [i, setI] = useState(0);
  const slide = d.slides[i];
  const last = i === d.slides.length - 1;
  return (
    <div>
      <h1 className="font-display text-[clamp(24px,4vw,32px)] font-semibold tracking-tight">{d.title}</h1>
      <div className="mt-2 flex items-center gap-2">
        {d.slides.map((_, idx) => (
          <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-indigo" : idx < i ? "w-3 bg-[var(--sage)]" : "w-3 bg-paper-2"}`} />
        ))}
        <span className="ml-2 text-xs text-muted">Slide {i + 1} of {d.slides.length}</span>
      </div>
      <div className="mt-5 rounded-3xl border border-[var(--line-2)] bg-white p-7 sm:p-9" style={{ boxShadow: "var(--shadow-md)" }}>
        <h2 className="font-display text-2xl font-semibold">{slide.heading}</h2>
        <ul className="mt-5 space-y-3">
          {slide.points.map((p, idx) => (
            <li key={idx} className="flex gap-3 text-[16px] text-ink-2">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo" /> {p}
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-2xl bg-paper-3 p-4 text-[14.5px] italic leading-relaxed text-ink-2">
          &ldquo;{slide.narration}&rdquo;
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}
          className="inline-flex h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-medium disabled:opacity-40 hover:border-ink">
          ← Previous
        </button>
        {!last ? (
          <button onClick={() => setI(i + 1)} className="inline-flex h-11 items-center rounded-full bg-indigo px-6 text-sm font-medium text-white hover:bg-[var(--indigo-ink)]">
            Next slide →
          </button>
        ) : (
          <span className="text-sm font-medium text-[var(--sage)]">Lecture complete ✓</span>
        )}
      </div>
    </div>
  );
}

/* ================= FLASHCARDS ================= */
function FlashcardsView({ d }: { d: FlashData }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = d.cards[i];
  function next() { setFlipped(false); setI((i + 1) % d.cards.length); }
  function prev() { setFlipped(false); setI((i - 1 + d.cards.length) % d.cards.length); }
  return (
    <div>
      <h1 className="font-display text-[clamp(24px,4vw,32px)] font-semibold tracking-tight">{d.title}</h1>
      <p className="mt-1 text-sm text-muted">Card {i + 1} of {d.cards.length} · tap to flip</p>
      <button
        onClick={() => setFlipped(!flipped)}
        className="mt-5 flex min-h-[240px] w-full flex-col items-center justify-center rounded-3xl border border-[var(--line-2)] bg-white p-8 text-center transition-transform hover:-translate-y-0.5"
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {flipped ? "Answer" : "Question"}
        </span>
        <span className={`mt-4 ${flipped ? "text-lg text-ink-2" : "font-display text-2xl font-semibold"}`}>
          {flipped ? card.back : card.front}
        </span>
        {!flipped && <span className="mt-6 text-xs text-muted">tap to reveal</span>}
      </button>
      <div className="mt-5 flex items-center justify-between">
        <button onClick={prev} className="inline-flex h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-medium hover:border-ink">← Prev</button>
        <button onClick={() => setFlipped(!flipped)} className="inline-flex h-11 items-center rounded-full bg-white border border-[var(--line)] px-5 text-sm font-medium hover:border-ink">Flip</button>
        <button onClick={next} className="inline-flex h-11 items-center rounded-full bg-indigo px-5 text-sm font-medium text-white hover:bg-[var(--indigo-ink)]">Next →</button>
      </div>
    </div>
  );
}

/* ================= QUIZ ================= */
function QuizView({ d }: { d: QuizData }) {
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = d.questions[i];

  if (done) {
    const pct = Math.round((score / d.questions.length) * 100);
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold">Quiz complete</h1>
        <div className="mx-auto mt-6 grid h-36 w-36 place-items-center rounded-full"
          style={{ background: `conic-gradient(var(--sage) ${pct}%, var(--paper-2) 0)` }}>
          <div className="grid h-[108px] w-[108px] place-items-center rounded-full bg-paper">
            <div>
              <div className="font-display text-3xl font-semibold">{pct}%</div>
              <div className="text-xs text-muted">{score} of {d.questions.length}</div>
            </div>
          </div>
        </div>
        <p className="mt-5 text-ink-2">
          {pct >= 80 ? "Excellent — you really know this!" : pct >= 50 ? "Good effort. Worth another go." : "Keep practising — you'll get there."}
        </p>
        <button onClick={() => { setI(0); setAnswered(null); setScore(0); setDone(false); }}
          className="mt-6 inline-flex h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-medium hover:border-ink">
          Retry quiz
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[clamp(22px,4vw,30px)] font-semibold tracking-tight">{d.title}</h1>
      <p className="mt-1 text-sm text-muted">Question {i + 1} of {d.questions.length}</p>
      <div className="mt-4 rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
        <h3 className="font-display text-xl font-semibold">{q.question}</h3>
        <div className="mt-4 space-y-2.5">
          {q.options.map((o, idx) => {
            const locked = answered !== null;
            const isC = idx === q.correct;
            let cls = "border-[var(--line)] bg-white";
            if (locked && isC) cls = "border-[var(--sage)] bg-[var(--sage)]/10";
            else if (locked && answered === idx) cls = "border-[var(--coral)] bg-[var(--coral)]/8";
            return (
              <button key={idx} disabled={locked}
                onClick={() => { setAnswered(idx); if (idx === q.correct) setScore((s) => s + 1); }}
                className={`flex w-full items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 text-left text-[15px] transition-transform ${cls} ${locked ? "" : "hover:-translate-y-0.5 hover:border-indigo"}`}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-paper-2 text-[13px] font-semibold">{String.fromCharCode(65 + idx)}</span>
                {o}
              </button>
            );
          })}
        </div>
        {answered !== null && (
          <>
            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${answered === q.correct ? "border-[rgba(111,160,136,.3)] bg-[rgba(111,160,136,.12)] text-[#2f5e46]" : "border-[rgba(224,118,91,.3)] bg-[rgba(224,118,91,.1)] text-[#8a3826]"}`}>
              <b>{answered === q.correct ? "Correct! " : "Not quite. "}</b>{q.explanation}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => { if (i === d.questions.length - 1) setDone(true); else { setI(i + 1); setAnswered(null); } }}
                className="inline-flex h-11 items-center rounded-full bg-indigo px-6 text-sm font-medium text-white hover:bg-[var(--indigo-ink)]">
                {i === d.questions.length - 1 ? "See results" : "Next question"} →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return <span className="inline-block h-2.5 w-2.5 animate-bounce rounded-full bg-indigo" style={{ animationDelay: delay }} />;
}
