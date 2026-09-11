"use client";

import { useState, useEffect } from "react";

interface Exam {
  id: string;
  subject: string;
  exam_name: string;
  exam_date: string;
}

export function ExamCountdown({ subjects }: { subjects: string[] }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ subject: subjects[0] ?? "", exam_name: "", exam_date: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.ok ? r.json() : [])
      .then(setExams)
      .catch(() => {});
  }, []);

  function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  }

  async function addExam() {
    if (!form.exam_name.trim() || !form.exam_date) return;
    setSaving(true);
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const exam = await res.json();
    setExams((e) => [...e, exam].sort((a, b) => a.exam_date.localeCompare(b.exam_date)));
    setAdding(false);
    setForm({ subject: subjects[0] ?? "", exam_name: "", exam_date: "" });
    setSaving(false);
  }

  async function removeExam(id: string) {
    await fetch("/api/exams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setExams((e) => e.filter((x) => x.id !== id));
  }

  const upcoming = exams.filter((e) => daysUntil(e.exam_date) >= 0);

  return (
    <div className="rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold">Exam countdown</h3>
        <button
          onClick={() => setAdding(true)}
          className="rounded-full border border-[var(--line)] px-3.5 py-1.5 text-[13px] font-medium text-ink-2 hover:border-ink"
        >
          + Add exam
        </button>
      </div>

      {upcoming.length === 0 && !adding && (
        <p className="mt-4 text-sm text-muted">Add your upcoming exams to count down and stay focused.</p>
      )}

      {upcoming.length > 0 && (
        <div className="mt-4 space-y-3">
          {upcoming.map((exam) => {
            const days = daysUntil(exam.exam_date);
            const urgent = days <= 7;
            const soon = days <= 14;
            return (
              <div key={exam.id} className="flex items-center justify-between rounded-2xl border border-[var(--line-2)] bg-paper-2 px-4 py-3">
                <div>
                  <div className="text-[14px] font-semibold">{exam.exam_name}</div>
                  <div className="text-[12px] text-muted">{exam.subject}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-right ${urgent ? "text-[var(--coral)]" : soon ? "text-[var(--gold)]" : "text-indigo"}`}>
                    <div className="text-xl font-bold leading-none">{days}</div>
                    <div className="text-[11px]">days</div>
                  </div>
                  <button onClick={() => removeExam(exam.id)} className="text-muted hover:text-ink text-lg leading-none">×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {adding && (
        <div className="mt-4 space-y-3 rounded-2xl border border-[var(--line-2)] bg-paper-2 p-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium">Exam name</label>
            <input
              value={form.exam_name}
              onChange={(e) => setForm((f) => ({ ...f, exam_name: e.target.value }))}
              placeholder="e.g. GCSE Mathematics Paper 1"
              className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
              >
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Date</label>
              <input
                type="date"
                value={form.exam_date}
                onChange={(e) => setForm((f) => ({ ...f, exam_date: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addExam} disabled={saving || !form.exam_name.trim() || !form.exam_date}
              className="rounded-full bg-indigo px-5 py-2 text-[13px] font-medium text-white disabled:opacity-50 hover:bg-[var(--indigo-ink)]">
              {saving ? "Saving…" : "Add exam"}
            </button>
            <button onClick={() => setAdding(false)} className="rounded-full border border-[var(--line)] px-5 py-2 text-[13px] font-medium text-ink-2 hover:border-ink">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
