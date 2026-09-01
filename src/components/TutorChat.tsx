"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Explain this topic to me",
  "Quiz me on what I'm studying",
  "Give me an example",
  "What should I revise today?",
];

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
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const started = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  function autoGrow() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    setError(null);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setStreaming(true);
    // Placeholder assistant message we'll stream into.
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

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
        } catch {}
        if (res.status === 401) {
          setError("Your session expired. Redirecting you to log in…");
          setTimeout(() => router.push("/login?redirect=/tutor"), 1500);
        }
        setMessages((m) => m.slice(0, -1)); // remove empty assistant bubble
        setError(msg);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = {
              role: "assistant",
              content: copy[copy.length - 1].content + chunk,
            };
            return copy;
          });
        }
      }
    } catch {
      setMessages((m) => m.slice(0, -1));
      setError("Something went wrong reaching your tutor. Please try again.");
    } finally {
      setStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* header */}
      <div className="sticky top-0 z-40 border-b border-[var(--line-2)] bg-paper/85 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 sm:px-6">
          <button
            onClick={() => router.push("/school")}
            className="inline-flex items-center gap-1.5 rounded-full py-2 pl-2.5 pr-3.5 text-sm font-medium text-ink-2 transition-colors hover:bg-[rgba(20,22,42,.06)]"
          >
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
              <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[var(--indigo-2)] to-[var(--indigo)] text-2xl font-semibold text-white">
                {teacherName.charAt(0).toUpperCase()}
              </span>
              <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
                Hi {firstName}, I&rsquo;m {teacherName}.
              </h1>
              <p className="mt-2 max-w-md text-ink-2">
                Your personal tutor. Ask me to explain anything, quiz you, or
                help you revise — whatever you&rsquo;re working on.
              </p>
              <div className="mt-8 grid w-full max-w-lg gap-2.5 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-2xl border border-[var(--line-2)] bg-white px-4 py-3 text-left text-sm text-ink-2 transition-transform hover:-translate-y-0.5 hover:border-ink"
                    style={{ boxShadow: "var(--shadow-sm)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((m, i) => (
                <Bubble
                  key={i}
                  role={m.role}
                  content={m.content}
                  teacherInitial={teacherName.charAt(0).toUpperCase()}
                  streaming={
                    streaming &&
                    i === messages.length - 1 &&
                    m.role === "assistant"
                  }
                />
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-[rgba(224,118,91,.3)] bg-[rgba(224,118,91,.08)] px-4 py-3 text-sm text-[#8a3826]">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* composer */}
      <div className="sticky bottom-0 border-t border-[var(--line-2)] bg-paper/90 backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 py-3.5 sm:px-6">
          <div
            className="flex items-end gap-2 rounded-[22px] border border-[var(--line)] bg-white p-2 pl-4"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoGrow();
              }}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={`Ask ${teacherName} anything about your studies…`}
              className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              aria-label="Send"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo text-white transition-colors hover:bg-[var(--indigo-ink)] disabled:opacity-40"
            >
              {streaming ? (
                <span className="h-3.5 w-3.5 animate-pulse rounded-sm bg-white" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[11.5px] text-muted">
            {teacherName} is an AI tutor and focuses on learning. Double-check
            important facts.
          </p>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  role,
  content,
  teacherInitial,
  streaming,
}: {
  role: "user" | "assistant";
  content: string;
  teacherInitial: string;
  streaming: boolean;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[20px] rounded-br-md bg-indigo px-4 py-2.5 text-[15px] leading-relaxed text-white">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--indigo-2)] to-[var(--indigo)] text-[13px] font-semibold text-white">
        {teacherInitial}
      </span>
      <div className="max-w-[85%] whitespace-pre-wrap rounded-[20px] rounded-tl-md border border-[var(--line-2)] bg-white px-4 py-2.5 text-[15px] leading-relaxed text-ink-2">
        {content}
        {streaming && content.length === 0 && (
          <span className="inline-flex gap-1 py-1">
            <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
          </span>
        )}
        {streaming && content.length > 0 && (
          <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-ink-2" />
        )}
      </div>
    </div>
  );
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
      style={{ animationDelay: delay }}
    />
  );
}
