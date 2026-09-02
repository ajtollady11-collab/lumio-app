"use client";

import { PLANS } from "@/lib/plans";

const PREMIUM_FEATURES = [
  "Unlimited AI tutoring",
  "Unlimited lessons, quizzes & flashcards",
  "All subjects, fully personalised",
  "Progress tracking",
  "Priority access to new features",
];

/**
 * A polished, non-aggressive premium upgrade prompt. Shown when a free user
 * reaches a usage limit. `title`/`body` are contextual (from PAYWALL_COPY).
 */
export function Paywall({
  title,
  body,
  onClose,
  onUpgrade,
}: {
  title: string;
  body: string;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--line)] bg-paper"
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        {/* header band */}
        <div className="relative overflow-hidden bg-ink px-7 py-8 text-center text-white">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(60% 90% at 80% 0%, rgba(122,114,240,.35), transparent 60%), radial-gradient(50% 80% at 10% 100%, rgba(232,184,75,.2), transparent 60%)",
            }}
          />
          <div className="relative z-[1]">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold tracking-wide text-gold">
              LUMIO PREMIUM
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-[#c3c5d6]">{body}</p>
          </div>
        </div>

        {/* body */}
        <div className="px-7 py-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-display text-4xl font-semibold">
              £{PLANS.premium.priceGbp}
            </span>
            <span className="text-sm text-muted">/ month</span>
          </div>
          <p className="mt-1 text-center text-sm text-ink-2">
            Your personal tutor, always available.
          </p>

          <ul className="mt-5 space-y-2.5">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[14.5px] text-ink-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--sage)]/15">
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10.5l3.5 3.5L16 6" stroke="var(--sage)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={onUpgrade}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[var(--indigo-2)] to-[var(--indigo)] text-base font-medium text-white transition-transform hover:-translate-y-0.5"
          >
            Upgrade to Lumio →
          </button>
          <button
            onClick={onClose}
            className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-medium text-muted hover:text-ink"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
