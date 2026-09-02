"use client";

import { useEffect, useState } from "react";
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
function subjProgress(name: string) {
  let seed = 0;
  for (let i = 0; i < name.length; i++) seed += name.charCodeAt(i);
  return 25 + (seed % 55);
}

/* ---------- demo lesson + test content ---------- */
const LESSON = {
  subject: "Geography",
  topic: "Coastal Landscapes",
  section: "Coastal Erosion",
  body: "Waves shape our coastlines through several erosion processes. Hydraulic action occurs when waves force air into cracks in the rock, increasing pressure and eventually causing the rock to break apart. Over time, this widens cracks into caves, arches and stacks.",
  keypoints: [
    "Hydraulic action — trapped air pressure shatters rock.",
    "Abrasion — waves fling sand and pebbles at the cliff.",
    "Attrition — rock fragments knock together and become smaller and rounder.",
  ],
  q: {
    prompt: "What happens during hydraulic action?",
    options: [
      "Rock fragments knock together and become smaller",
      "Waves force air into cracks, and pressure breaks the rock apart",
      "Waves fling sand and pebbles at the cliff face",
      "Dissolved chemicals slowly weaken the rock",
    ],
    correct: 1,
    explain:
      "Hydraulic action is all about pressure: waves compress air trapped in cracks, and when the wave retreats the pressure releases explosively, prising the rock apart.",
  },
};

const TEST = [
  { q: "Which process involves waves compressing air in cracks?", o: ["Abrasion", "Attrition", "Hydraulic action", "Solution"], c: 2, e: "Hydraulic action compresses trapped air, which shatters the rock." },
  { q: "What is a stack?", o: ["A type of wave", "An isolated pillar of rock left after an arch collapses", "A river mouth", "A sandy beach ridge"], c: 1, e: "When an arch collapses, an isolated column called a stack is left standing." },
  { q: "Abrasion is best described as…", o: ["Rocks dissolving in seawater", "Waves throwing sand and pebbles at cliffs", "Air pressure in cracks", "Fragments rounding off"], c: 1, e: "Abrasion is the sandpaper effect of material being hurled at the cliff." },
  { q: "Longshore drift transports material…", o: ["Straight out to sea", "Along the coastline in a zigzag", "Up the cliff face", "Only during storms"], c: 1, e: "Swash pushes material up the beach at an angle; backwash pulls it straight down — creating a zigzag along the coast." },
  { q: "Which landform forms by deposition, not erosion?", o: ["Cave", "Arch", "Spit", "Stack"], c: 2, e: "A spit is built up from deposited sediment carried by longshore drift." },
];

type View = "dashboard" | "lesson" | "test" | "subject";

const DEFAULT_PROGRESS = { goalDone: 14, lessonsDone: 24, testsDone: 8, avgScore: 87 };

/** Reads saved progress from localStorage once. SSR-safe (returns defaults on server). */
function readSaved() {
  if (typeof window === "undefined") return { ...DEFAULT_PROGRESS };
  try {
    const raw = window.localStorage.getItem("lumio_progress");
    if (raw) {
      const d = JSON.parse(raw);
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
    : ["Geography", "Mathematics", "English Language", "Biology", "History", "Physics"];

  const router = useRouter();
  const [view, setView] = useState<View>("dashboard");
  const [activeSubject, setActiveSubject] = useState<string>(subjects[0]);
  const [toast, setToast] = useState<string | null>(null);

  // progress state (persisted locally so the demo feels alive).
  // A lazy initialiser reads any saved progress once, on first render.
  const saved = readSaved();
  const [goalDone, setGoalDone] = useState(saved.goalDone);
  const [lessonsDone, setLessonsDone] = useState(saved.lessonsDone);
  const [testsDone, setTestsDone] = useState(saved.testsDone);
  const [avgScore, setAvgScore] = useState(saved.avgScore);
  const goalTotal = 20;
  const streak = 5;
  const overall = 42;

  function persist(next: Partial<{ goalDone: number; lessonsDone: number; testsDone: number; avgScore: number }>) {
    try {
      const cur = { goalDone, lessonsDone, testsDone, avgScore, ...next };
      localStorage.setItem("lumio_progress", JSON.stringify(cur));
    } catch {}
  }

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as unknown as { t?: number }).t);
    (showToast as unknown as { t?: number }).t = window.setTimeout(
      () => setToast(null),
      3200,
    );
  }

  function completeLesson() {
    const nl = lessonsDone + 1;
    const ng = Math.min(goalTotal, goalDone + 6);
    setLessonsDone(nl);
    setGoalDone(ng);
    persist({ lessonsDone: nl, goalDone: ng });
    setView("dashboard");
    showToast("Lesson complete · +6 min toward today's goal");
  }
  function finishTest(pct: number) {
    const nt = testsDone + 1;
    const na = Math.round((avgScore + pct) / 2);
    const ng = Math.min(goalTotal, goalDone + 4);
    setTestsDone(nt);
    setAvgScore(na);
    setGoalDone(ng);
    persist({ testsDone: nt, avgScore: na, goalDone: ng });
  }

  return (
    <div className="flex min-h-screen flex-col">
      {view === "dashboard" && (
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
          onLesson={() => setView("lesson")}
          onTest={() => setView("test")}
          onSubject={(s) => {
            setActiveSubject(s);
            setView("subject");
          }}
          onAskTeacher={() => router.push("/tutor")}
          onLearn={(mode) => router.push(mode ? `/learn?mode=${mode}` : "/learn")}
        />
      )}

      {view === "lesson" && (
        <LessonView
          onBack={() => setView("dashboard")}
          onComplete={completeLesson}
        />
      )}

      {view === "test" && (
        <TestView onBack={() => setView("dashboard")} onFinish={finishTest} />
      )}

      {view === "subject" && (
        <SubjectView
          name={activeSubject}
          avgScore={avgScore}
          onBack={() => setView("dashboard")}
          onLesson={() => setView("lesson")}
          onTest={() => setView("test")}
        />
      )}

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
    onLesson: () => void;
    onTest: () => void;
    onSubject: (s: string) => void;
    onAskTeacher: () => void;
    onLearn: (mode?: string) => void;
  },
) {
  const {
    firstName, teacherName, personalityLabel, curriculum, subjects,
    goalDone, goalTotal, streak, lessonsDone, testsDone, avgScore, overall,
    onLesson, onTest, onSubject, onAskTeacher, onLearn,
  } = props;
  const goalPct = Math.min(100, Math.round((goalDone / goalTotal) * 100));
  const remain = Math.max(0, goalTotal - goalDone);

  return (
    <>
      <Header firstName={firstName} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8">
        <p className="text-sm text-muted">Welcome back to your school</p>
        <h1 className="font-display text-[clamp(30px,5vw,42px)] font-semibold tracking-tight">
          Hello, {firstName}
        </h1>
        <p className="mt-1 text-[15px] text-ink-2">Ready to continue learning?</p>

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
                Continue where you left off
              </span>
              <p className="mt-4 text-[13px] font-semibold tracking-wide text-gold">
                Geography
              </p>
              <p className="mt-1.5 font-display text-[28px] font-semibold leading-tight">
                Coastal Landscapes
              </p>
              <p className="mt-2.5 max-w-[30rem] text-[14.5px] leading-relaxed text-[#c3c5d6]">
                Learn how erosion shapes coastlines and test your knowledge.
              </p>
              <div className="mt-4.5 flex flex-wrap items-center gap-4 text-[13px] text-[#b9bccd]">
                <span>⏱ 12 min</span>
                <span>65% complete</span>
              </div>
              <button
                onClick={() => onLearn("lesson")}
                className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-b from-[#f0c765] to-[var(--gold)] px-7 text-base font-medium text-[#3a2c05] transition-transform hover:-translate-y-0.5"
              >
                Continue lesson →
              </button>
            </div>
            <div className="relative z-[1] flex justify-center">
              <Ring pct={65} label="this topic" big />
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
                  {remain > 0 ? `${remain} minutes to go` : "Goal reached — nice work!"}
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
                <div className="font-display text-xl font-semibold">{streak} day streak</div>
                <div className="mt-0.5 text-[12.5px] text-muted">Keep it going tomorrow.</div>
              </div>
            </div>
          </MiniCard>
          <MiniCard>
            <span className="text-[13px] font-medium text-muted">This week</span>
            <div className="mt-3 flex flex-col gap-2.5">
              <StatRow k="Lessons" v={lessonsDone} />
              <StatRow k="Tests" v={testsDone} />
              <StatRow k="Avg. score" v={`${avgScore}%`} />
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
            <ModeCard label="Flashcards" desc="Revise key facts fast" icon="🃏" bg="232,184,75" onClick={() => onLearn("flashcards")} />
            <ModeCard label="Quiz me" desc="Test yourself, get feedback" icon="✅" bg="111,160,136" onClick={() => onLearn("quiz")} />
          </div>
        </Section>

        {/* subjects */}
        <Section title="Your subjects">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => {
              const m = meta(s);
              const p = subjProgress(s);
              const done = Math.round((p / 100) * 19);
              return (
                <button
                  key={s}
                  onClick={() => onSubject(s)}
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
                      <div className="text-[13px] text-muted">{m.topic}</div>
                    </div>
                  </div>
                  <div className="mt-3.5 flex items-center justify-between text-[13px]">
                    <span className="font-semibold">{p}% complete</span>
                    <span className="text-muted">{done} / 19 lessons</span>
                  </div>
                  <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-paper-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p}%`, background: `linear-gradient(90deg,rgba(${m.color},.7),rgb(${m.color}))` }}
                    />
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-indigo">
                    Continue →
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* up next */}
        <Section title="Up next" link="Recommended for you">
          <div className="grid gap-4 md:grid-cols-3">
            <NextCard tag="Next up" topic="Coastal Management" time="15 min" why="Recommended because you're currently studying Coastal Landscapes." onClick={onLesson} />
            <NextCard tag="Suggested" topic="Rivers: The Long Profile" time="18 min" why="Builds on the erosion processes you just learned." onClick={onLesson} />
            <NextCard tag="Practice" topic="Coastal Landforms — Quick Test" time="10 min" why="A short check to lock in this week's progress." onClick={onTest} />
          </div>
        </Section>

        {/* activity + progress */}
        <Section title="">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-[var(--line-2)] bg-white p-7" style={{ boxShadow: "var(--shadow-sm)" }}>
              <h3 className="font-display text-xl font-semibold">Recent activity</h3>
              <div className="mt-3 flex flex-col">
                <Activity type="lesson" title='Completed "Weather & Climate" lesson' time="Today" />
                <Activity type="test" title="Scored 92% on a Geography test" time="Today" score="92%" />
                <Activity type="start" title='Started "Coastal Landscapes"' time="Yesterday" />
                <Activity type="review" title="Reviewed 6 mistakes" time="2 days ago" />
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <UsageMeter />
              <div className="rounded-3xl border border-[var(--line-2)] bg-white p-7 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
                <h3 className="font-display text-xl font-semibold">Learning progress</h3>
                <div className="mt-2 flex justify-center">
                  <Ring pct={overall} label="Overall mastery" tone="indigo" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2.5 text-left">
                  <Stat n={lessonsDone} l="Lessons completed" />
                  <Stat n={testsDone} l="Tests completed" />
                  <Stat n={`${avgScore}%`} l="Average score" />
                  <Stat n={streak} l="Day streak" />
                </div>
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
                    <button onClick={onLesson} className="inline-flex h-10 items-center gap-2 rounded-full bg-indigo px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--indigo-ink)]">
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

/* ============================ LESSON ============================ */
function LessonView({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const [answered, setAnswered] = useState<number | null>(null);
  const L = LESSON;
  const correct = L.q.correct;

  return (
    <>
      <SubHeader onBack={onBack} />
      <main className="flex-1 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[760px]">
          <div className="text-[13px] text-muted">
            <b className="font-semibold text-indigo">{L.subject}</b> · {L.topic}
          </div>
          <h1 className="mt-2 font-display text-[clamp(28px,4vw,38px)] font-semibold tracking-tight">
            {L.section}
          </h1>

          <div className="mt-6 rounded-[22px] border border-[var(--line-2)] bg-white p-[30px]" style={{ boxShadow: "var(--shadow-sm)" }}>
            <h3 className="font-display text-[22px] font-semibold">Understanding coastal erosion</h3>
            <p className="mt-3 text-base leading-relaxed text-ink-2">{L.body}</p>
            <div className="mt-5 rounded-2xl border border-[var(--line-2)] bg-paper-3 p-4">
              <h4 className="text-[13px] font-semibold uppercase tracking-wide text-indigo">Key points</h4>
              <ul className="mt-3 flex flex-col gap-2.5">
                {L.keypoints.map((k) => (
                  <li key={k} className="flex gap-2.5 text-[14.5px] leading-snug text-ink-2">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[var(--sage)]/15">
                      <CheckSmall />
                    </span>
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* quick check */}
          <div className="mt-6 rounded-[22px] border border-[rgba(91,84,224,.16)] bg-gradient-to-br from-[rgba(91,84,224,.06)] to-[rgba(91,84,224,.015)] p-[26px]">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-indigo">✦ Quick check</span>
            <div className="mt-3 font-display text-[21px] font-semibold leading-snug">{L.q.prompt}</div>
            <div className="mt-4.5 flex flex-col gap-2.5">
              {L.q.options.map((o, i) => {
                const locked = answered !== null;
                const isC = i === correct;
                const isPickedWrong = answered === i && i !== correct;
                const showC = locked && isC;
                let cls = "border-[var(--line)] bg-white";
                if (showC) cls = "border-[var(--sage)] bg-[var(--sage)]/10";
                else if (isPickedWrong) cls = "border-[var(--coral)] bg-[var(--coral)]/8";
                return (
                  <button
                    key={o}
                    disabled={locked}
                    onClick={() => setAnswered(i)}
                    className={`flex items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-3.5 text-left text-[15px] transition-transform ${cls} ${locked ? "" : "hover:-translate-y-0.5 hover:border-indigo"}`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-paper-2 text-[13px] font-semibold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{o}</span>
                  </button>
                );
              })}
            </div>
            {answered !== null && (
              <div
                className={`mt-4 rounded-[14px] border px-4 py-3.5 text-sm leading-snug ${
                  answered === correct
                    ? "border-[rgba(111,160,136,.3)] bg-[rgba(111,160,136,.12)] text-[#2f5e46]"
                    : "border-[rgba(224,118,91,.3)] bg-[rgba(224,118,91,.1)] text-[#8a3826]"
                }`}
              >
                <b>{answered === correct ? "Correct! " : "Not quite. "}</b>
                {L.q.explain}
              </div>
            )}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button onClick={onBack} className="inline-flex h-10 items-center rounded-full px-5 text-sm font-medium text-ink-2 hover:bg-[rgba(20,22,42,.05)]">
                Exit lesson
              </button>
              {answered !== null && (
                <button onClick={onComplete} className="inline-flex h-10 items-center gap-2 rounded-full bg-indigo px-6 text-sm font-medium text-white hover:bg-[var(--indigo-ink)]">
                  Continue →
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/* ============================ TEST ============================ */
function TestView({ onBack, onFinish }: { onBack: () => void; onFinish: (pct: number) => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<{ picked: number; correct: number }[]>([]);
  const [answered, setAnswered] = useState<number | null>(null);

  const done = i >= TEST.length;
  const right = answers.filter((a) => a.picked === a.correct).length;
  const pct = done ? Math.round((right / TEST.length) * 100) : 0;

  // Report the score once, after the results screen renders.
  useEffect(() => {
    if (done) onFinish(pct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (done) {
    const wrong = answers
      .map((a, idx) => ({ a, idx }))
      .filter((x) => x.a.picked !== x.a.correct);
    return (
      <>
        <SubHeader onBack={onBack} />
        <main className="flex-1 px-5 py-8 sm:px-8">
          <div className="mx-auto max-w-[760px]">
            <div className="text-[13px] text-muted"><b className="font-semibold text-indigo">Geography · Coastal Landscapes</b></div>
            <h1 className="mt-2 font-display text-[clamp(28px,4vw,38px)] font-semibold tracking-tight">Test complete</h1>
            <div className="mt-6 rounded-[22px] border border-[var(--line-2)] bg-white p-[30px] text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="flex justify-center">
                <ScoreRing pct={pct} sub={`${right} of ${TEST.length} correct`} />
              </div>
              <p className="mt-4.5 text-[15px] text-ink-2">
                {pct >= 80 ? "Excellent work — you've really got this." : pct >= 50 ? "Good effort. Review the ones you missed below." : "Keep going — review these and try again."}
              </p>
              {wrong.length > 0 ? (
                <div className="mt-5.5 text-left">
                  <h3 className="font-display text-base font-semibold">Review your mistakes</h3>
                  {wrong.map((x) => {
                    const Q = TEST[x.idx];
                    return (
                      <div key={x.idx} className="mt-3 rounded-[14px] border border-[var(--line-2)] bg-paper-3 p-4">
                        <div className="text-[14.5px] font-semibold">{Q.q}</div>
                        <div className="mt-2 flex items-start gap-2 text-[13.5px] text-[var(--coral)]">
                          <span>✗</span> Your answer: {Q.o[x.a.picked]}
                        </div>
                        <div className="mt-1 flex items-start gap-2 text-[13.5px] text-[var(--sage)]">
                          <span>✓</span> Correct: {Q.o[Q.c]}
                        </div>
                        <div className="mt-2 text-[13px] leading-snug text-ink-2">{Q.e}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 font-semibold text-[var(--sage)]">Perfect score — no mistakes to review!</p>
              )}
              <div className="mt-6.5 flex justify-center gap-3">
                <button
                  onClick={() => { setI(0); setAnswers([]); setAnswered(null); }}
                  className="inline-flex h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-medium text-ink hover:border-ink"
                >
                  Retry test
                </button>
                <button onClick={onBack} className="inline-flex h-11 items-center gap-2 rounded-full bg-indigo px-5 text-sm font-medium text-white hover:bg-[var(--indigo-ink)]">
                  Back to dashboard →
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  const Q = TEST[i];
  return (
    <>
      <SubHeader onBack={onBack} />
      <main className="flex-1 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[760px]">
          <div className="text-[13px] text-muted"><b className="font-semibold text-indigo">Geography · Coastal Landscapes</b></div>
          <h1 className="mt-2 font-display text-[clamp(28px,4vw,38px)] font-semibold tracking-tight">Test yourself</h1>
          <div className="mt-4.5 flex items-center justify-between gap-3.5">
            <span className="text-[13px] font-medium text-muted">Question {i + 1} of {TEST.length}</span>
            <span className="flex gap-1.5">
              {TEST.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-2 w-2 rounded-full ${idx < i ? "bg-[var(--sage)]" : idx === i ? "scale-125 bg-indigo" : "bg-paper-2"}`}
                />
              ))}
            </span>
          </div>
          <div className="mt-4 rounded-[22px] border border-[var(--line-2)] bg-white p-[30px]" style={{ boxShadow: "var(--shadow-sm)" }}>
            <h3 className="font-display text-xl font-semibold">{Q.q}</h3>
            <div className="mt-4 flex flex-col gap-2.5">
              {Q.o.map((o, idx) => {
                const locked = answered !== null;
                const isC = idx === Q.c;
                const isPickedWrong = answered === idx && idx !== Q.c;
                const showC = locked && isC;
                let cls = "border-[var(--line)] bg-white";
                if (showC) cls = "border-[var(--sage)] bg-[var(--sage)]/10";
                else if (isPickedWrong) cls = "border-[var(--coral)] bg-[var(--coral)]/8";
                return (
                  <button
                    key={o}
                    disabled={locked}
                    onClick={() => {
                      setAnswered(idx);
                      setAnswers((a) => [...a, { picked: idx, correct: Q.c }]);
                    }}
                    className={`flex items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-3.5 text-left text-[15px] transition-transform ${cls} ${locked ? "" : "hover:-translate-y-0.5 hover:border-indigo"}`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-paper-2 text-[13px] font-semibold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{o}</span>
                  </button>
                );
              })}
            </div>
            {answered !== null && (
              <div
                className={`mt-4 rounded-[14px] border px-4 py-3.5 text-sm leading-snug ${
                  answered === Q.c
                    ? "border-[rgba(111,160,136,.3)] bg-[rgba(111,160,136,.12)] text-[#2f5e46]"
                    : "border-[rgba(224,118,91,.3)] bg-[rgba(224,118,91,.1)] text-[#8a3826]"
                }`}
              >
                <b>{answered === Q.c ? "Correct! " : "Not quite. "}</b>
                {Q.e}
              </div>
            )}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button onClick={onBack} className="inline-flex h-10 items-center rounded-full px-5 text-sm font-medium text-ink-2 hover:bg-[rgba(20,22,42,.05)]">
                Exit
              </button>
              {answered !== null && (
                <button
                  onClick={() => { setI(i + 1); setAnswered(null); }}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-indigo px-6 text-sm font-medium text-white hover:bg-[var(--indigo-ink)]"
                >
                  {i === TEST.length - 1 ? "See results" : "Next question"} →
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/* ============================ SUBJECT ============================ */
function SubjectView({
  name, avgScore, onBack, onLesson, onTest,
}: { name: string; avgScore: number; onBack: () => void; onLesson: () => void; onTest: () => void }) {
  const m = meta(name);
  const p = subjProgress(name);
  const lessonsDone = Math.round((p / 100) * 19);
  const topics = [
    { t: m.topic, done: true },
    { t: "Core Concepts", done: p > 40 },
    { t: "Applied Examples", done: p > 60 },
    { t: "Exam Practice", done: p > 80 },
    { t: "Extension & Mastery", done: false },
  ];
  return (
    <>
      <SubHeader onBack={onBack} />
      <main className="flex-1 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[760px]">
          <div className="text-[13px] text-muted"><b className="font-semibold text-indigo">Your subjects</b> · {name}</div>
          <div className="mt-2.5 flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl text-[26px]" style={{ background: `rgba(${m.color},.14)`, color: `rgb(${m.color})` }}>
              {m.icon}
            </span>
            <div>
              <h1 className="font-display text-[clamp(28px,4vw,38px)] font-semibold tracking-tight">{name}</h1>
              <div className="text-sm text-muted">Current topic · {m.topic}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MiniCard>
              <span className="text-[13px] font-medium text-muted">Progress</span>
              <div className="mt-1.5 font-display text-xl font-semibold">{p}%</div>
              <div className="mt-2.5 h-[7px] overflow-hidden rounded-full bg-paper-2">
                <div className="h-full rounded-full" style={{ width: `${p}%`, background: `linear-gradient(90deg,rgba(${m.color},.7),rgb(${m.color}))` }} />
              </div>
            </MiniCard>
            <MiniCard>
              <span className="text-[13px] font-medium text-muted">Lessons</span>
              <div className="mt-1.5 font-display text-xl font-semibold">{lessonsDone} / 19</div>
              <div className="text-[12.5px] text-muted">completed</div>
            </MiniCard>
            <MiniCard>
              <span className="text-[13px] font-medium text-muted">Avg. score</span>
              <div className="mt-1.5 font-display text-xl font-semibold">{avgScore}%</div>
              <div className="text-[12.5px] text-muted">across tests</div>
            </MiniCard>
          </div>

          <div className="mt-6 rounded-[22px] border border-[var(--line-2)] bg-white p-[30px]" style={{ boxShadow: "var(--shadow-sm)" }}>
            <h3 className="font-display text-xl font-semibold">Topics</h3>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {topics.map((tp) => (
                <div key={tp.t} className="flex items-center justify-between rounded-xl border border-[var(--line-2)] bg-paper-3 px-3.5 py-3 text-[13px]">
                  <span className="flex items-center gap-2.5">
                    {tp.done ? (
                      <span className="grid h-[18px] w-[18px] place-items-center rounded-md bg-[var(--sage)]"><CheckSmallWhite /></span>
                    ) : (
                      <span className="h-[18px] w-[18px] rounded-md border-[1.5px] border-[var(--line)]" />
                    )}
                    {tp.t}
                  </span>
                  <button onClick={onLesson} className="inline-flex items-center gap-1 text-[13px] font-semibold text-indigo">
                    {tp.done ? "Review" : "Start"} →
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-5.5 flex gap-3">
              <button onClick={onTest} className="inline-flex h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-medium text-ink hover:border-ink">
                Take a test
              </button>
              <button onClick={onLesson} className="inline-flex h-11 items-center gap-2 rounded-full bg-indigo px-5 text-sm font-medium text-white hover:bg-[var(--indigo-ink)]">
                Continue learning →
              </button>
            </div>
          </div>
        </div>
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
            <span className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 py-1.5 pl-1.5 pr-3 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[var(--indigo-2)] to-[var(--indigo)] text-[13px] font-semibold text-white">
                {firstName.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium">{firstName}</span>
            </span>
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

function SubHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="sticky top-0 z-40 border-b border-[var(--line-2)] bg-paper/85 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 rounded-full py-2 pl-2.5 pr-3.5 text-sm font-medium text-ink-2 hover:bg-[rgba(20,22,42,.06)]">
          ← Back to dashboard
        </button>
        <LogoMark small />
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

function ScoreRing({ pct, sub }: { pct: number; sub: string }) {
  return (
    <div className="relative grid h-[150px] w-[150px] place-items-center rounded-full" style={{ background: `conic-gradient(var(--sage) ${pct}%, var(--paper-2) 0)` }}>
      <div className="absolute inset-[13px] rounded-full bg-white" />
      <div className="relative z-[1] text-center">
        <div className="font-display text-[38px] font-semibold leading-none">{pct}%</div>
        <div className="mt-1 text-xs text-muted">{sub}</div>
      </div>
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
function CheckSmall() {
  return <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><path d="M4 10.5l3.5 3.5L16 6" stroke="var(--sage)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function CheckSmallWhite() {
  return <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><path d="M4 10.5l3.5 3.5L16 6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
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
