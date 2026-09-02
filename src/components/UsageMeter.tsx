"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UsageItem {
  action: "tutor_message" | "generation";
  used: number;
  limit: number | null;
}
interface UsageResp {
  tier: "free" | "premium";
  planLabel: string;
  items: UsageItem[];
}

const LABELS: Record<UsageItem["action"], string> = {
  tutor_message: "Tutor messages",
  generation: "Lessons & quizzes",
};

export function UsageMeter() {
  const router = useRouter();
  const [data, setData] = useState<UsageResp | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive) {
          setData(d);
          setLoaded(true);
        }
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  if (!loaded || !data) {
    return (
      <div className="rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="h-4 w-24 animate-pulse rounded bg-paper-2" />
        <div className="mt-4 h-2 w-full animate-pulse rounded bg-paper-2" />
        <div className="mt-4 h-2 w-full animate-pulse rounded bg-paper-2" />
      </div>
    );
  }

  // Premium: simple confident badge, no meters needed.
  if (data.tier === "premium") {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(70% 90% at 100% 0%, rgba(91,84,224,.08), transparent 60%)" }} />
        <div className="relative z-[1] flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-gold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3z" fill="currentColor" /></svg>
          </span>
          <div>
            <div className="font-display text-lg font-semibold">Lumio Premium</div>
            <div className="text-sm text-muted">Unlimited tutoring & lessons</div>
          </div>
        </div>
      </div>
    );
  }

  // Free: show meters + upgrade nudge.
  const anyLow = data.items.some(
    (it) => it.limit !== null && it.used >= it.limit * 0.6,
  );

  return (
    <div className="rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted">This month · Free plan</h3>
      </div>

      <div className="mt-4 space-y-4">
        {data.items.map((it) => {
          const limit = it.limit ?? 0;
          const pct = limit > 0 ? Math.min(100, Math.round((it.used / limit) * 100)) : 0;
          const remaining = Math.max(0, limit - it.used);
          const full = remaining === 0;
          return (
            <div key={it.action}>
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="font-medium text-ink-2">{LABELS[it.action]}</span>
                <span className={full ? "font-semibold text-[var(--coral)]" : "text-muted"}>
                  {it.used} / {limit}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: full
                      ? "linear-gradient(90deg,#ed9a86,var(--coral))"
                      : pct >= 60
                        ? "linear-gradient(90deg,#f0cd74,var(--gold))"
                        : "linear-gradient(90deg,var(--indigo-2),var(--indigo))",
                  }}
                />
              </div>
              {full && (
                <p className="mt-1 text-xs text-[var(--coral)]">
                  You&rsquo;ve used all your {LABELS[it.action].toLowerCase()} this month.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {anyLow && (
        <button
          onClick={() => router.push("/upgrade")}
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-[var(--indigo-2)] to-[var(--indigo)] text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
        >
          Upgrade for unlimited →
        </button>
      )}
    </div>
  );
}
