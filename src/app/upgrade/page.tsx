import Link from "next/link";
import { PLANS } from "@/lib/plans";

export const metadata = { title: "Upgrade to Premium — Lumio" };

const FEATURES = [
  "Unlimited AI tutoring",
  "Unlimited lessons, quizzes & flashcards",
  "All subjects, fully personalised",
  "Progress tracking across every subject",
  "Priority access to new features as they launch",
];

export default function UpgradePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-md text-center">
        <span className="inline-block rounded-full bg-ink px-3 py-1 text-[12px] font-semibold tracking-wide text-gold">
          LUMIO PREMIUM
        </span>
        <h1 className="mt-5 font-display text-[clamp(30px,5vw,42px)] font-semibold tracking-tight">
          Your personal tutor,<br />always available
        </h1>
        <div className="mt-5 flex items-baseline justify-center gap-1">
          <span className="font-display text-5xl font-semibold">£{PLANS.premium.priceGbp}</span>
          <span className="text-muted">/ month</span>
        </div>

        <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-3 text-[15px] text-ink-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--sage)]/15">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M4 10.5l3.5 3.5L16 6" stroke="var(--sage)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-2xl border border-dashed border-[var(--line)] bg-paper-2/60 p-5 text-sm text-ink-2">
          <span className="font-semibold">Checkout is coming next.</span> Secure card
          payment via Stripe is being set up — you&rsquo;ll be able to subscribe here shortly.
        </div>

        <Link
          href="/school"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-6 text-sm font-medium hover:border-ink"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
