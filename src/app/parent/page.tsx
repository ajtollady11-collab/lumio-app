"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface StudentLink {
  student_id: string;
  student_profiles: {
    first_name: string;
    subjects: string[];
    school_year: string;
    curriculum: string;
  };
}

interface Stats {
  student: { first_name: string; subjects: string[]; school_year: string };
  activeToday: boolean;
  lessonsThisMonth: number;
  quizzesThisMonth: number;
  avgScore: number | null;
  recentActivity: Array<{ type: string; subject: string; score: number | null; completed_at: string }>;
  upcomingExams: Array<{ exam_name: string; subject: string; exam_date: string }>;
}

export default function ParentPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentLink[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/parent-link")
      .then(r => r.ok ? r.json() : [])
      .then((d: StudentLink[]) => {
        setStudents(d);
        if (d.length > 0) setSelected(d[0].student_id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setStats(null);
    fetch(`/api/parent-stats?student_id=${selected}`)
      .then(r => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {});
  }, [selected]);

  async function linkStudent() {
    if (!code.trim()) return;
    setLinking(true);
    setLinkError(null);
    const res = await fetch("/api/parent-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLinkError(data.error);
      setLinking(false);
      return;
    }
    setLinkSuccess(true);
    setTimeout(() => router.refresh(), 1000);
  }

  function daysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--line)] border-t-indigo" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[var(--line-2)] bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--indigo)] text-sm font-bold text-white">L</div>
            <div>
              <div className="font-display text-base font-semibold">Lumio</div>
              <div className="text-[11px] text-muted">Parent view</div>
            </div>
          </div>
          <button onClick={() => router.push("/school")} className="rounded-full border border-[var(--line)] bg-white px-4 py-1.5 text-sm font-medium text-ink-2 hover:border-ink">
            My account
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">

        {/* No students linked yet */}
        {students.length === 0 && (
          <div className="mx-auto max-w-md">
            <h1 className="font-display text-3xl font-semibold">Link your child's account</h1>
            <p className="mt-2 text-[15px] text-muted">Ask your child to go to Settings → Parent Access and share their invite code with you.</p>

            <div className="mt-8 rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
              <label className="text-[14px] font-semibold">Enter invite code</label>
              <div className="mt-3 flex gap-3">
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AB12CD"
                  maxLength={6}
                  className="flex-1 rounded-2xl border border-[var(--line)] px-4 py-3 text-center font-mono text-xl tracking-widest outline-none focus:border-indigo uppercase"
                />
                <button
                  onClick={linkStudent}
                  disabled={linking || code.length < 6}
                  className="rounded-2xl bg-indigo px-6 py-3 font-semibold text-white disabled:opacity-50 hover:opacity-90"
                >
                  {linking ? "…" : "Link"}
                </button>
              </div>
              {linkError && <p className="mt-3 text-sm text-[var(--coral)]">{linkError}</p>}
              {linkSuccess && <p className="mt-3 text-sm text-[var(--sage)]">✓ Linked! Refreshing…</p>}
            </div>
          </div>
        )}

        {/* Student selector if multiple */}
        {students.length > 1 && (
          <div className="mb-6 flex gap-2">
            {students.map(s => (
              <button key={s.student_id}
                onClick={() => setSelected(s.student_id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${selected === s.student_id ? "bg-indigo text-white" : "border border-[var(--line)] bg-white text-ink-2 hover:border-ink"}`}
              >
                {s.student_profiles.first_name}
              </button>
            ))}
          </div>
        )}

        {/* Student stats */}
        {students.length > 0 && stats && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-3xl font-semibold">{stats.student.first_name}</h1>
                <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${stats.activeToday ? "bg-[var(--sage)]/20 text-[var(--sage)]" : "bg-paper-3 text-muted"}`}>
                  {stats.activeToday ? "✓ Active today" : "Not active today"}
                </span>
              </div>
              <p className="mt-1 text-[14px] text-muted">
                {stats.student.school_year && `Year ${stats.student.school_year} · `}
                {stats.student.subjects?.slice(0, 3).join(", ")}
                {stats.student.subjects?.length > 3 && ` +${stats.student.subjects.length - 3} more`}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Lessons this month", value: stats.lessonsThisMonth || "—", icon: "📖" },
                { label: "Quizzes this month", value: stats.quizzesThisMonth || "—", icon: "✅" },
                { label: "Average score", value: stats.avgScore ? `${stats.avgScore}%` : "—", icon: "🎯" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="rounded-3xl border border-[var(--line-2)] bg-white p-5" style={{ boxShadow: "var(--shadow-sm)" }}>
                  <div className="text-2xl">{icon}</div>
                  <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
                  <div className="mt-0.5 text-[13px] text-muted">{label}</div>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            {stats.recentActivity.length > 0 && (
              <div className="rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
                <h2 className="font-display text-xl font-semibold">Recent activity</h2>
                <div className="mt-4 space-y-0">
                  {stats.recentActivity.map((item, i) => {
                    const date = new Date(item.completed_at);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const timeLabel = isToday ? "Today" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                    const icon = item.type === "quiz" ? "✅" : item.type === "lecture" ? "🎓" : "📖";
                    const label = item.type === "quiz"
                      ? `Scored ${item.score ?? "?"}% on a ${item.subject} quiz`
                      : `Completed a ${item.subject} ${item.type}`;
                    return (
                      <div key={i} className="flex items-center gap-3 border-b border-[var(--line-2)] py-3 last:border-0">
                        <span className="text-lg">{icon}</span>
                        <span className="flex-1 text-[14px] text-ink-2">{label}</span>
                        <span className="text-[12px] text-muted">{timeLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming exams */}
            {stats.upcomingExams.length > 0 && (
              <div className="rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
                <h2 className="font-display text-xl font-semibold">Upcoming exams</h2>
                <div className="mt-4 space-y-3">
                  {stats.upcomingExams.map((exam, i) => {
                    const days = daysUntil(exam.exam_date);
                    return (
                      <div key={i} className="flex items-center justify-between rounded-2xl bg-paper-2 px-4 py-3">
                        <div>
                          <div className="text-[14px] font-semibold">{exam.exam_name}</div>
                          <div className="text-[12px] text-muted">{exam.subject}</div>
                        </div>
                        <div className={`text-right font-bold ${days <= 7 ? "text-[var(--coral)]" : days <= 14 ? "text-[var(--gold)]" : "text-indigo"}`}>
                          {days}d
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No activity yet */}
            {stats.recentActivity.length === 0 && (
              <div className="rounded-3xl border border-[var(--line-2)] bg-white p-8 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
                <p className="text-muted">No activity recorded yet this month. Encourage {stats.student.first_name} to start a lesson or quiz.</p>
              </div>
            )}
          </div>
        )}

        {students.length > 0 && !stats && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--line)] border-t-indigo" />
          </div>
        )}
      </div>
    </div>
  );
}
