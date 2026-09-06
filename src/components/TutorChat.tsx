"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paywall } from "@/components/Paywall";

interface Msg {
  role: "user" | "assistant";
  content: string;
  actions?: Action[];
}

interface Action {
  tool: string;
  subject: string;
  topic: string;
  reason: string;
  autoNavigate: boolean;
}

const SUGGESTIONS = [
  "I don't understand quadratic equations",
  "Quiz me on what I've been studying",
  "Make me some flashcards to revise",
  "Give me a lecture on photosynthesis",
];

const ACTION_META: Record<string, { label: string; icon: string; color: string; mode: string }> = {
  generate_lesson:     { label: "Go to lesson",     icon: "📖", color: "91,84,224",  mode: "lesson" },
  generate_quiz:       { label: "Start quiz",        icon: "✅", color: "111,160,136", mode: "quiz" },
  generate_flashcards: { label: "Open flashcards",   icon: "🃏", color: "232,184,75",  mode: "flashcards" },
  generate_lecture:    { label: "Watch lecture",     icon: "🎓", color: "63,120,180",  mode: "lecture" },
};

export function TutorChat({
  firstName,
  teacherName,
  personalityLabel,
}: {
  firstName: string;
  teacherName: string;
  personalityLabel: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<{ title: string; body: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const started = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function autoGrow() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  function navigate(action: Action) {
    const meta = ACTION_META[action.tool];
    if (!meta) return;
    const url = `/learn?mode=${meta.mode}&subject=${encodeURIComponent(action.subject)}&topic=${encodeURIComponent(action.topic)}`;
    router.push(url);
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok) {
        let msg = "Your tutor is unavailable right now. Please try again.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
          if (res.status === 402 && data?.paywall) { setPaywall(data.paywall); setLoading(false); return; }
        } catch {}
        if (res.status === 401) { router.push("/login?redirect=/tutor"); return; }
        setError(msg);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const textContent: string = data.text ?? "";
      const actions: Action[] = data.actions ?? [];

      // Add the assistant message with any actions attached
      setMessages((m) => [...m, { role: "assistant", content: textContent, actions }]);

      // Auto-navigate for lessons and quizzes (after a short delay so user sees the message)
      const autoActions = actions.filter((a) => a.autoNavigate);
      if (autoActions.length > 0) {
        setTimeout(() => {
          navigate(autoActions[0]);
        }, 1800);
      }

    } catch {
      setError("Something went wrong reaching your tutor. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* header */}
      <div className="sticky top-0 z-40 border-b border-[var(--line-2)] bg-paper/85 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 sm:px-6">
          <button onClick={() => router.push("/school")} className="inline-flex items-center gap-1.5 rounded-full py-2 pl-2.5 pr-3.5 text-sm font-medium text-ink-2 hover:bg-[rgba(20,22,42,.06)]">
            ← Back to dashboard
          </button>
          <div className="flex items-center gap-2.5">
            <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--indigo-2)] to-[var(--indigo)] text-sm font-semibold text-white">
              {teacherName.charAt(0).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-paper bg-[var(--sage)]" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">{teacherName}</div>
              <div className="text-xs text-muted">{personalityLabel} · online</div>
            </div>
          </div>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-6 sm:px-6">
          {!started ? (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[var(--indigo-2)] to-[var(--indigo)] text-2xl font-semibold text-white">
                {teacherName.charAt(0).toUpperCase()}
              </span>
              <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
                Hi {firstName}, I&rsquo;m {teacherName}.
              </h1>
              <p className="mt-2 max-w-md text-ink-2">
                Your personal tutor. Ask me anything — I can explain topics, quiz you, make flashcards, or give you a full lecture.
              </p>
              <div className="mt-8 grid w-full max-w-lg gap-2.5 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="rounded-2xl border border-[var(--line-2)] bg-white px-4 py-3 text-left text-sm text-ink-2 transition-transform hover:-translate-y-0.5 hover:border-ink"
                    style={{ boxShadow: "var(--shadow-sm)" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((m, i) => (
                <div key={i}>
                  <Bubble role={m.role} content={m.content} teacherInitial={teacherName.charAt(0).toUpperCase()} />
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2 pl-11">
                      {m.actions.map((action, ai) => (
                        <ActionCard key={ai} action={action} onNavigate={() => navigate(action)} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--indigo-2)] to-[var(--indigo)] text-[13px] font-semibold text-white">
                    {teacherName.charAt(0).toUpperCase()}
                  </span>
                  <div className="rounded-[20px] rounded-tl-md border border-[var(--line-2)] bg-white px-4 py-3">
                    <span className="inline-flex gap-1 py-1">
                      <Dot /><Dot delay="0.15s" /><Dot delay="0.3s" />
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-2xl border border-[rgba(224,118,91,.3)] bg-[rgba(224,118,91,.08)] px-4 py-3 text-sm text-[#8a3826]">{error}</div>
          )}
        </div>
      </div>

      {/* composer */}
      <div className="sticky bottom-0 border-t border-[var(--line-2)] bg-paper/90 backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 py-3.5 sm:px-6">
          <div className="flex items-end gap-2 rounded-[22px] border border-[var(--line)] bg-white p-2 pl-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <textarea ref={taRef} value={input}
              onChange={(e) => { setInput(e.target.value); autoGrow(); }}
              onKeyDown={onKeyDown} rows={1}
              placeholder={`Ask ${teacherName} anything about your studies…`}
              className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted"
            />
            <button onClick={() => send(input)} disabled={!input.trim() || loading} aria-label="Send"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo text-white transition-colors hover:bg-[var(--indigo-ink)] disabled:opacity-40">
              {loading ? (
                <span className="h-3.5 w-3.5 animate-pulse rounded-sm bg-white" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[11.5px] text-muted">
            {teacherName} is an AI tutor focused on learning.
          </p>
        </div>
      </div>

      {paywall && (
        <Paywall title={paywall.title} body={paywall.body}
          onClose={() => setPaywall(null)} onUpgrade={() => router.push("/upgrade")} />
      )}
    </div>
  );
}

// ── Action card ───────────────────────────────────────────────────────────────

function ActionCard({ action, onNavigate }: { action: Action; onNavigate: () => void }) {
  const [navigating, setNavigating] = useState(false);
  const meta = ACTION_META[action.tool];
  if (!meta) return null;

  function handleClick() {
    setNavigating(true);
    onNavigate();
  }

  return (
    <div className="inline-flex max-w-sm items-center gap-3 rounded-2xl border border-[var(--line-2)] bg-white p-4 transition-transform hover:-translate-y-0.5"
      style={{ boxShadow: "var(--shadow-sm)" }}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
        style={{ background: `rgba(${meta.color},.14)` }}>
        {meta.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{action.topic}</div>
        <div className="mt-0.5 text-[12px] text-muted truncate">{action.reason}</div>
      </div>
      {action.autoNavigate ? (
        <div className="flex items-center gap-1.5 text-[12px] text-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--sage)]" />
          {navigating ? "Going…" : "Heading there…"}
        </div>
      ) : (
        <button onClick={handleClick} disabled={navigating}
          className="inline-flex h-9 shrink-0 items-center rounded-full bg-indigo px-3.5 text-[13px] font-medium text-white hover:bg-[var(--indigo-ink)] disabled:opacity-60">
          {navigating ? "Going…" : meta.label}
        </button>
      )}
    </div>
  );
}

// ── Bubble ────────────────────────────────────────────────────────────────────

function Bubble({ role, content, teacherInitial }: { role: string; content: string; teacherInitial: string }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[20px] rounded-br-md bg-indigo px-4 py-2.5 text-[15px] leading-relaxed text-white">
          {content}
        </div>
      </div>
    );
  }
  if (!content) return null;
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--indigo-2)] to-[var(--indigo)] text-[13px] font-semibold text-white">
        {teacherInitial}
      </span>
      <div className="max-w-[85%] whitespace-pre-wrap rounded-[20px] rounded-tl-md border border-[var(--line-2)] bg-white px-4 py-2.5 text-[15px] leading-relaxed text-ink-2">
        {content}
      </div>
    </div>
  );
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: delay }} />;
}
