import Link from "next/link";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { SubscribeButton } from "@/components/SubscribeButton";

export const metadata = { title: "Upgrade to Premium — Lumio" };

const FEATURES = [
  "Unlimited AI tutoring",
  "Unlimited lessons, quizzes & flashcards",
  "All subjects, fully personalised",
  "Progress tracking across every subject",
  "Priority access to new features as they launch",
];

export default async function UpgradePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/upgrade");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-16">
      <div className="flex w-full max-w-md flex-col items-center text-center">
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

        <SubscribeButton />

        <Link
          href="/school"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full text-sm font-medium text-muted hover:text-ink"
        >
          Maybe later
        </Link>
      </div>
    </main>
  );
}
