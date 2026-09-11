"use client";

import { useEffect, useState } from "react";

interface Note {
  id: string;
  subject: string;
  topic: string;
  content: { title?: string; sections?: { heading: string; body: string }[]; keyPoints?: string[] };
  created_at: string;
}

export function LessonNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/notes")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { setNotes(d); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || notes.length === 0) return null;

  return (
    <div className="rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
      <h3 className="font-display text-xl font-semibold">Your lesson notes</h3>
      <p className="mt-1 text-sm text-muted">Saved automatically from your recent lessons.</p>
      <div className="mt-4 space-y-2">
        {notes.map((note) => {
          const isOpen = expanded === note.id;
          const date = new Date(note.created_at);
          const isToday = date.toDateString() === new Date().toDateString();
          const timeLabel = isToday ? "Today" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
          return (
            <div key={note.id} className="rounded-2xl border border-[var(--line-2)] overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : note.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-paper-2"
              >
                <div>
                  <span className="text-[14px] font-semibold">{note.content?.title ?? note.topic}</span>
                  <span className="ml-2 text-[12px] text-muted">{note.subject}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-muted">{timeLabel}</span>
                  <span className="text-muted">{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-[var(--line-2)] px-4 py-4 space-y-3 bg-paper-2">
                  {note.content?.sections?.slice(0, 3).map((s, i) => (
                    <div key={i}>
                      <div className="text-[13px] font-semibold text-ink">{s.heading}</div>
                      <div className="text-[13px] text-ink-2 mt-0.5 leading-relaxed">{s.body}</div>
                    </div>
                  ))}
                  {(note.content?.keyPoints?.length ?? 0) > 0 && (
                    <div className="rounded-xl bg-[var(--indigo)]/8 px-3 py-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo mb-2">Key points</div>
                      {(note.content.keyPoints ?? []).map((k, i) => (
                        <div key={i} className="text-[13px] text-ink-2 flex gap-2">
                          <span className="text-[var(--sage)]">✓</span> {k}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
