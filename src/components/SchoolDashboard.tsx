"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UsageMeter } from "@/components/UsageMeter";

/* ---------- types passed from the server component ---------- */
export interface DashboardProps {
  firstName: string;
  teacherName: string;
  personalityLabel: string;
  voice: string;
  curriculum: string | null;
  subjects: string[];
}

/* ---------- subject metadata (icons/colours/current topic) ---------- */
const SUBJECT_META: Record<
  string,
  { icon: string; color: string; topic: string }
> = {
  Mathematics: { icon: "∑", color: "91,84,224", topic: "Quadratic Equations" },
  English: { icon: "✎", color: "224,118,91", topic: "Persuasive Writing" },
  "English Language": { icon: "✎", color: "224,118,91", topic: "Persuasive Writing" },
  "English Literature": { icon: "❝", color: "224,118,91", topic: "Macbeth: Themes" },
  Science: { icon: "⚛", color: "111,160,136", topic: "Energy Transfers" },
  Biology: { icon: "🧬", color: "111,160,136", topic: "Cell Division" },
  Chemistry: { icon: "⚗", color: "111,160,136", topic: "The Periodic Table" },
  Physics: { icon: "◎", color: "91,84,224", topic: "Forces & Motion" },
  History: { icon: "⏳", color: "207,156,43", topic: "The Cold War" },
  Geography: { icon: "🌍", color: "63,120,180", topic: "Coastal Landscapes" },
  "Computer Science": { icon: "⌘", color: "91,84,224", topic: "Algorithms" },
  Languages: { icon: "🗣", color: "224,118,91", topic: "Tenses" },
  Art: { icon: "🎨", color: "207,156,43", topic: "Composition" },
  Music: { icon: "♪", color: "91,84,224", topic: "Rhythm & Metre" },
};
function meta(name: string) {
  return SUBJECT_META[name] ?? { icon: "◆", color: "91,84,224", topic: "Getting Started" };
}

/* deterministic per-subject progress so it's stable */


const DEFAULT_PROGRESS = { goalDone: 0, lessonsDone: 0, testsDone: 0, avgScore: 0 };

/** Reads saved progress from localStorage once. SSR-safe (returns defaults on server). */
// Old fake defaults that were shipped — clear them so returning users get zeros
const OLD_FAKE_DEFAULTS = { goalDone: 14, lessonsDone: 24, testsDone: 8, avgScore: 87 };

function readSaved() {
  if (typeof window === "undefined") return { ...DEFAULT_PROGRESS };
  try {
    const raw = window.localStorage.getItem("lumio_progress");
    if (raw) {
      const d = JSON.parse(raw);
      // If this looks like the old fake data, wipe it
      if (d.goalDone === OLD_FAKE_DEFAULTS.goalDone && d.lessonsDone === OLD_FAKE_DEFAULTS.lessonsDone) {
        window.localStorage.removeItem("lumio_progress");
        return { ...DEFAULT_PROGRESS };
      }
      return {
        goalDone: typeof d.goalDone === "number" ? d.goalDone : DEFAULT_PROGRESS.goalDone,
        lessonsDone: typeof d.lessonsDone === "number" ? d.lessonsDone : DEFAULT_PROGRESS.lessonsDone,
        testsDone: typeof d.testsDone === "number" ? d.testsDone : DEFAULT_PROGRESS.testsDone,
        avgScore: typeof d.avgScore === "number" ? d.avgScore : DEFAULT_PROGRESS.avgScore,
      };
    }
  } catch {}
  return { ...DEFAULT_PROGRESS };
}

export function SchoolDashboard(props: DashboardProps) {
  const subjects = props.subjects.length
    ? props.subjects
    : ["Mathematics", "English", "Science"];

  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  // progress state (persisted locally).
  const [goalDone] = useState(0); // Real goal tracking comes with proper activity recording
  const [lessonsDone, setLessonsDone] = useState(0);
  const [testsDone, setTestsDone] = useState(0);
  const [avgScore, setAvgScore] = useState(0);

  // Fetch real completion stats
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setLessonsDone(d.lessonsThisMonth ?? 0);
          setTestsDone(d.quizzesThisMonth ?? 0);
          setAvgScore(d.avgScore ?? 0);
        }
      })
      .catch(() => {});
  }, []);
  const goalTotal = 20;
  const [streak, setStreak] = useState(0);

  // Fetch real streak from database on mount
  useEffect(() => {
    fetch("/api/streak")
      .then((r) => r.ok ? r.json() : { streak: 0 })
      .then((d) => setStreak(d.streak ?? 0))
      .catch(() => {});
  }, []);
  const overall = 0;

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as unknown as { t?: number }).t);
    (showToast as unknown as { t?: number }).t = window.setTimeout(
      () => setToast(null),
      3200,
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Dashboard
        {...props}
        subjects={subjects}
        goalDone={goalDone}
        goalTotal={goalTotal}
        streak={streak}
        lessonsDone={lessonsDone}
        testsDone={testsDone}
        avgScore={avgScore}
        overall={overall}
        onAskTeacher={() => router.push("/tutor")}
        onLearn={(mode) => router.push(mode ? `/learn?mode=${mode}` : "/learn")}
        onLearnSubject={(s, mode) => router.push(`/learn?mode=${mode}&subject=${encodeURIComponent(s)}`)}
      />

      {toast && (
        <div className="fixed bottom-7 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ============================ DASHBOARD ============================ */
function Dashboard(
  props: DashboardProps & {
    subjects: string[];
    goalDone: number;
    goalTotal: number;
    streak: number;
    lessonsDone: number;
    testsDone: number;
    avgScore: number;
    overall: number;
    onAskTeacher: () => void;
    onLearn: (mode?: string) => void;
    onLearnSubject: (subject: string, mode: string) => void;
  },
) {
  const {
    firstName, teacherName, personalityLabel, curriculum, subjects,
    goalDone, goalTotal, streak, lessonsDone, testsDone, avgScore, overall,
    onAskTeacher, onLearn, onLearnSubject,
  } = props;
  const goalPct = Math.min(100, Math.round((goalDone / goalTotal) * 100));
  const remain = Math.max(0, goalTotal - goalDone);

  return (
    <>
      <Header firstName={firstName} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8">
        <p className="text-sm text-muted">{lessonsDone > 0 || streak > 0 ? "Welcome back to your school" : "Welcome to your school"}</p>
        <h1 className="font-display text-[clamp(30px,5vw,42px)] font-semibold tracking-tight">
          Hello, {firstName}
        </h1>
        <p className="mt-1 text-[15px] text-ink-2">{lessonsDone > 0 ? "Ready to continue learning?" : "Your tutor is ready when you are."}</p>

        {/* today's learning */}
        <Section title="Today's learning">
          <div
            className="relative grid gap-6 overflow-hidden rounded-3xl bg-ink p-7 text-white md:grid-cols-[1.5fr_1fr] md:items-center"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(55% 90% at 88% 0%, rgba(122,114,240,.4), transparent 60%), radial-gradient(50% 80% at 5% 100%, rgba(232,184,75,.18), transparent 60%)",
              }}
            />
            <div className="relative z-[1]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12.5px] font-medium text-[#d7d3f7]">
                Start learning with your AI tutor
              </span>
              <p className="mt-4 text-[13px] font-semibold tracking-wide text-gold">
                {subjects[0] ?? "Your subjects"}
              </p>
              <p className="mt-1.5 font-display text-[28px] font-semibold leading-tight">
                Ready when you are
              </p>
              <p className="mt-2.5 max-w-[30rem] text-[14.5px] leading-relaxed text-[#c3c5d6]">
                Ask your tutor to teach you anything, make flashcards, give you a lecture, or test your knowledge — all personalised to you.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => onLearn("lesson")}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-b from-[#f0c765] to-[var(--gold)] px-7 text-base font-medium text-[#3a2c05] transition-transform hover:-translate-y-0.5"
                >
                  Start a lesson →
                </button>
                <button
                  onClick={onAskTeacher}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 text-base font-medium text-white transition-transform hover:-translate-y-0.5"
                >
                  Ask your tutor
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* goal / streak / stats */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MiniCard>
            <span className="text-[13px] font-medium text-muted">Today&rsquo;s goal</span>
            <div className="mt-3 flex items-center gap-4">
              <SmallRing pct={goalPct} />
              <div>
                <div className="font-display text-xl font-semibold">
                  {goalDone} / {goalTotal} min
                </div>
                <div className="mt-0.5 text-[12.5px] text-muted">
                  {remain > 0 ? `${remain} minutes to go` : goalDone > 0 ? "Goal reached — nice work!" : "Start learning to set your first goal"}
                </div>
              </div>
            </div>
          </MiniCard>
          <MiniCard>
            <div className="flex items-center gap-3.5">
              <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-[rgba(232,184,75,.22)] to-[rgba(224,118,91,.14)]">
                <FlameIcon />
              </span>
              <div>
                <div className="font-display text-xl font-semibold">{streak > 0 ? `${streak} day streak` : "Start your streak"}</div>
                <div className="mt-0.5 text-[12.5px] text-muted">{streak > 0 ? "Keep it going tomorrow." : "Learn something today to begin."}</div>
              </div>
            </div>
          </MiniCard>
          <MiniCard>
            <span className="text-[13px] font-medium text-muted">This month</span>
            <div className="mt-3 flex flex-col gap-2.5">
              <StatRow k="Lessons" v={lessonsDone > 0 ? lessonsDone : "—"} />
              <StatRow k="Tests" v={testsDone > 0 ? testsDone : "—"} />
              <StatRow k="Avg. score" v={avgScore > 0 ? `${avgScore}%` : "—"} />
            </div>
          </MiniCard>
        </div>

        {/* quick actions */}
        <Section title="Quick actions">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickAction label="Learn a topic" onClick={() => onLearn("lesson")} bg="91,84,224" icon={<PlayIcon />} />
            <QuickAction label="Quiz me" onClick={() => onLearn("quiz")} bg="232,184,75" icon={<TestIcon />} />
            <QuickAction label="Flashcards" onClick={() => onLearn("flashcards")} bg="224,118,91" icon={<RedoIcon />} />
            <QuickAction label="Ask your teacher" onClick={onAskTeacher} bg="111,160,136" icon={<ChatIcon />} />
          </div>
        </Section>

        {/* ways to learn (AI modes) */}
        <Section title="Ways to learn" link="Powered by your AI tutor">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ModeCard label="Learn a topic" desc="A guided lesson, made for you" icon="📖" bg="91,84,224" onClick={() => onLearn("lesson")} />
            <ModeCard label="Watch a lecture" desc="Slide-by-slide teaching" icon="🎓" bg="63,120,180" onClick={() => onLearn("lecture")} />
            <ModeCard label="Flashcards" desc="Revise key facts fast" icon="📋" bg="232,184,75" onClick={() => onLearn("flashcards")} />
            <ModeCard label="Quiz me" desc="Test yourself, get feedback" icon="✅" bg="111,160,136" onClick={() => onLearn("quiz")} />
          </div>
        </Section>

        {/* subjects */}
        <Section title="Your subjects">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => {
              const m = meta(s);
              return (
                <button
                  key={s}
                  onClick={() => onLearnSubject(s, "lesson")}
                  className="flex flex-col gap-1 rounded-[20px] border border-[var(--line-2)] bg-white p-[22px] text-left transition-transform hover:-translate-y-1"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
                      style={{ background: `rgba(${m.color},.14)`, color: `rgb(${m.color})` }}
                    >
                      {m.icon}
                    </span>
                    <div>
                      <div className="font-display text-lg font-semibold">{s}</div>
                      <div className="text-[13px] text-muted">AI-powered lessons</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span onClick={(e) => { e.stopPropagation(); onLearnSubject(s, "lesson"); }} className="rounded-full border border-[var(--line)] bg-paper-2 px-3 py-1 text-[12px] text-ink-2 hover:border-ink">Lesson</span>
                    <span onClick={(e) => { e.stopPropagation(); onLearnSubject(s, "quiz"); }} className="rounded-full border border-[var(--line)] bg-paper-2 px-3 py-1 text-[12px] text-ink-2 hover:border-ink">Quiz</span>
                    <span onClick={(e) => { e.stopPropagation(); onLearnSubject(s, "flashcards"); }} className="rounded-full border border-[var(--line)] bg-paper-2 px-3 py-1 text-[12px] text-ink-2 hover:border-ink">Flashcards</span>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-indigo">
                    Start learning →
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* up next */}
        <Section title="Up next" link="Pick what to do">
          <div className="grid gap-4 md:grid-cols-3">
            <NextCard tag="Lesson" topic={`Learn ${subjects[0] ?? "a topic"}`} time="~15 min" why={`A personalised lesson on ${subjects[0] ?? "your subject"}, generated just for you.`} onClick={() => onLearnSubject(subjects[0] ?? "", "lesson")} />
            <NextCard tag="Quiz" topic={`Test yourself on ${subjects[1] ?? subjects[0] ?? "a topic"}`} time="~10 min" why="A quick check to see what you know — scored instantly." onClick={() => onLearnSubject(subjects[1] ?? subjects[0] ?? "", "quiz")} />
            <NextCard tag="Tutor" topic="Ask your teacher anything" time="anytime" why="Chat with your personal tutor — they can teach, quiz, and guide you." onClick={onAskTeacher} />
          </div>
        </Section>

        {/* activity + progress */}
        <Section title="">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-[var(--line-2)] bg-white p-7" style={{ boxShadow: "var(--shadow-sm)" }}>
              <h3 className="font-display text-xl font-semibold">Recent activity</h3>
              <div className="mt-3 flex flex-col">
                <div className="py-6 text-center text-sm text-muted">
                  Your activity will appear here as you learn. Start a lesson or quiz to get going!
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <UsageMeter />
              <div className="rounded-3xl border border-[var(--line-2)] bg-white p-7 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
                <h3 className="font-display text-xl font-semibold">Learning progress</h3>
                <div className="mt-2 flex justify-center">
                  <Ring pct={overall} label={overall > 0 ? "Overall mastery" : "Start learning"} tone="indigo" />
                </div>
                {overall === 0 ? (
                  <p className="mt-4 text-sm text-muted">Complete lessons and quizzes to track your progress here.</p>
                ) : (
                <div className="mt-5 grid grid-cols-2 gap-2.5 text-left">
                  <Stat n={lessonsDone} l="Lessons completed" />
                  <Stat n={testsDone} l="Tests completed" />
                  <Stat n={avgScore > 0 ? `${avgScore}%` : "—"} l="Average score" />
                  <Stat n={streak > 0 ? streak : "—"} l="Day streak" />
                </div>
                )}
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(70% 90% at 100% 0%, rgba(91,84,224,.09), transparent 60%)" }} />
                <div className="relative z-[1]">
                  <h3 className="text-sm font-medium text-muted">Your AI teacher</h3>
                  <div className="mt-3 flex items-center gap-3.5">
                    <span className="relative grid h-[54px] w-[54px] place-items-center rounded-2xl bg-gradient-to-br from-[var(--indigo-2)] to-[var(--indigo)] text-xl font-semibold text-white">
                      {teacherInitial(teacherName)}
                      <span className="absolute -bottom-0.5 -right-0.5 h-[15px] w-[15px] rounded-full border-[2.5px] border-white bg-[var(--sage)]" />
                    </span>
                    <div>
                      <p className="font-display text-xl font-semibold">{teacherName}</p>
                      <p className="text-[13px] text-muted">{personalityLabel} · Interactive</p>
                    </div>
                  </div>
                  <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-paper-3 px-3.5 py-2.5 text-[13.5px] text-ink-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--sage)]" /> Ready when you are.
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button onClick={() => onLearn("lesson")} className="inline-flex h-10 items-center gap-2 rounded-full bg-indigo px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--indigo-ink)]">
                      Start a lesson →
                    </button>
                    <button onClick={onAskTeacher} className="inline-flex h-10 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-medium text-ink transition-colors hover:border-ink">
                      Ask a question
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {curriculum && (
          <p className="mt-8 text-center text-xs text-muted">
            Curriculum: {curriculum}
          </p>
        )}
      </main>
    </>
  );
}

/* ============================ SHARED BITS ============================ */
function Header({ firstName }: { firstName: string }) {
  return (
    <div className="sticky top-0 z-40 py-3">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex items-center justify-between gap-4 rounded-full border border-[var(--line)]/90 bg-paper-3/80 py-2.5 pl-[18px] pr-3 backdrop-blur-xl" style={{ boxShadow: "var(--shadow-sm)" }}>
          <LogoMark />
          <div className="flex items-center gap-2">
            <a href="/settings" className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 py-1.5 pl-1.5 pr-3 transition-colors hover:border-ink sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[var(--indigo-2)] to-[var(--indigo)] text-[13px] font-semibold text-white">
                {firstName.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium">{firstName}</span>
            </a>
            <a href="/settings" aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] bg-white text-ink-2 transition-colors hover:border-ink">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M18.4 5.6l-2 2M7.6 16.4l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </a>
            <form action="/auth/signout" method="post">
              <button type="submit" className="inline-flex h-10 items-center rounded-full border border-[var(--line)] bg-white px-4 text-sm font-medium text-ink transition-colors hover:border-ink">
                Log out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


function Section({ title, link, children }: { title: string; link?: string; children: React.ReactNode }) {
  return (
    <div className="mt-8.5">
      {title && (
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <span className="font-display text-xl font-semibold tracking-tight">{title}</span>
          {link && <span className="text-[13.5px] font-medium text-indigo">{link}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

function MiniCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-[var(--line-2)] bg-white p-5 transition-transform hover:-translate-y-0.5" style={{ boxShadow: "var(--shadow-sm)" }}>
      {children}
    </div>
  );
}

function ModeCard({ label, desc, icon, bg, onClick }: { label: string; desc: string; icon: string; bg: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col gap-2 rounded-2xl border border-[var(--line-2)] bg-white p-5 text-left transition-transform hover:-translate-y-1" style={{ boxShadow: "var(--shadow-sm)" }}>
      <span className="grid h-11 w-11 place-items-center rounded-xl text-xl" style={{ background: `rgba(${bg},.14)` }}>{icon}</span>
      <span className="mt-1 font-display text-[16px] font-semibold">{label}</span>
      <span className="text-[13px] text-muted">{desc}</span>
    </button>
  );
}

function QuickAction({ label, onClick, bg, icon }: { label: string; onClick: () => void; bg: string; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-2xl border border-[var(--line-2)] bg-white p-4 text-left transition-transform hover:-translate-y-1" style={{ boxShadow: "var(--shadow-sm)" }}>
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl" style={{ background: `rgba(${bg},.14)` }}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function NextCard({ tag, topic, time, why, onClick }: { tag: string; topic: string; time: string; why: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-[18px] border border-[var(--line-2)] bg-white p-5 text-left transition-transform hover:-translate-y-1" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="text-[11.5px] font-semibold uppercase tracking-wide text-indigo">{tag}</div>
      <div className="mt-2 font-display text-[17px] font-semibold">{topic}</div>
      <div className="mt-1 text-[12.5px] text-muted">⏱ {time}</div>
      <div className="mt-2.5 rounded-[10px] bg-paper-3 px-2.5 py-2 text-[12.5px] leading-snug text-ink-2">{why}</div>
    </button>
  );
}

function StatRow({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted">{k}</span>
      <span className="font-semibold tabular-nums">{v}</span>
    </div>
  );
}

function Stat({ n, l }: { n: string | number; l: string }) {
  return (
    <div className="rounded-[13px] border border-[var(--line-2)] bg-paper-3 p-3.5">
      <div className="font-display text-[22px] font-semibold leading-none">{n}</div>
      <div className="mt-1 text-[11.5px] text-muted">{l}</div>
    </div>
  );
}

function Activity({ type, title, time, score }: { type: string; title: string; time: string; score?: string }) {
  const bg = type === "test" ? "rgba(232,184,75,.18)" : type === "start" ? "rgba(91,84,224,.14)" : type === "review" ? "rgba(224,118,91,.14)" : "rgba(111,160,136,.15)";
  const glyph = type === "test" ? "📝" : type === "start" ? "▶" : type === "review" ? "↺" : "✓";
  return (
    <div className="flex items-center gap-3 border-b border-[var(--line-2)] py-3 last:border-b-0">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-[13px]" style={{ background: bg }}>{glyph}</span>
      <div className="flex-1">
        <div className="text-sm">{title}</div>
        <div className="mt-0.5 text-xs text-muted">{time}</div>
      </div>
      {score && <div className="font-display text-[15px] font-semibold text-[var(--sage)]">{score}</div>}
    </div>
  );
}

function Ring({ pct, label, big, tone }: { pct: number; label: string; big?: boolean; tone?: "indigo" | "sage" }) {
  const color = tone === "indigo" ? "var(--indigo)" : "var(--indigo-2)";
  const size = big ? 128 : 132;
  const inner = big ? 11 : 12;
  const bgTrack = big ? "rgba(255,255,255,.12)" : "var(--paper-2)";
  const innerBg = big ? "#191c31" : "var(--white)";
  return (
    <div className="relative grid place-items-center rounded-full" style={{ width: size, height: size, background: `conic-gradient(${color} ${pct}%, ${bgTrack} 0)` }}>
      <div className="absolute rounded-full" style={{ inset: inner, background: innerBg }} />
      <div className="relative z-[1] text-center">
        <div className={`font-display font-semibold leading-none ${big ? "text-[26px] text-white" : "text-[30px]"}`}>{pct}%</div>
        <div className={`mt-0.5 text-[11px] ${big ? "text-[#b9bccd]" : "text-muted"}`}>{label}</div>
      </div>
    </div>
  );
}

function SmallRing({ pct }: { pct: number }) {
  return (
    <div className="relative grid h-[62px] w-[62px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--sage) ${pct}%, var(--paper-2) 0)` }}>
      <div className="absolute inset-[7px] rounded-full bg-white" />
      <span className="relative z-[1] font-display text-[13px] font-bold">{pct}%</span>
    </div>
  );
}


function teacherInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

/* icons */
function LogoMark({ small }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={small ? 26 : 30} height={small ? 26 : 30} viewBox="0 0 30 30" fill="none">
        <rect width="30" height="30" rx="9" fill="var(--ink)" />
        <circle cx="15" cy="12.5" r="5.2" fill="var(--gold)" />
        <path d="M11.6 19.5h6.8M12.8 22.2h4.4" stroke="var(--paper)" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[19px] font-semibold tracking-tight">Lumio</span>
    </span>
  );
}
function FlameIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3c1 3-1 4-1 6a3 3 0 006 0c0-1-.3-2-1-3 2 1 3.5 3.3 3.5 6a6.5 6.5 0 01-13 0C6.5 8 10 6 12 3z" fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth="1.1" strokeLinejoin="round" /></svg>;
}
function PlayIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M5 4v16l14-8z" fill="var(--indigo)" /></svg>;
}
function TestIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M6 3h9l3 3v15H6z" stroke="var(--gold-deep)" strokeWidth="1.7" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="var(--gold-deep)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function RedoIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M4 4v6h6M4 10a8 8 0 113 8" stroke="var(--coral)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ChatIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v11H9l-4 3z" stroke="var(--sage)" strokeWidth="1.7" strokeLinejoin="round" /></svg>;
}
