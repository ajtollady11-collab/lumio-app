/**
 * ============================================================
 *  LUMIO PLANS & LIMITS — THE SINGLE SOURCE OF TRUTH
 * ============================================================
 *  Change any number here to change what each tier gets.
 *  Nothing else in the app hard-codes these — everything reads
 *  from this file. This is what protects margins and drives
 *  upgrades.
 *
 *  `null` = unlimited.
 *  Limits are counted per calendar month (UTC), per user.
 * ============================================================
 */

export type Tier = "free" | "premium";

/** Every meterable AI action in the product. */
export type UsageAction =
  | "tutor_message" // one message to the AI tutor
  | "generation" // one lesson / quiz / flashcards / lecture
  | "voice"; // one spoken piece of audio (added when voice ships)

export interface TierLimits {
  tutor_message: number | null;
  generation: number | null;
  voice: number | null;
}

/**
 * The plan definitions. Tune these freely.
 * These starting numbers keep free genuinely useful but clearly
 * limited, and keep costs tiny (see the economics model).
 */
export const PLANS: Record<Tier, { label: string; priceGbp: number; limits: TierLimits }> = {
  free: {
    label: "Free",
    priceGbp: 0,
    limits: {
      tutor_message: 15, // ~15 tutor messages / month
      generation: 3, // 3 lessons/quizzes/flashcards / month
      voice: 0, // no voice on free
    },
  },
  premium: {
    label: "Premium",
    priceGbp: 29.99,
    limits: {
      tutor_message: null, // unlimited
      generation: null, // unlimited
      voice: 50, // capped — protects margins (see economics). Tune freely.
    },
  },
};

/** Friendly labels for each action, used in paywall copy. */
export const ACTION_LABELS: Record<UsageAction, string> = {
  tutor_message: "tutor messages",
  generation: "lessons",
  voice: "spoken lessons",
};

/** Contextual paywall messages when a free user hits a limit. */
export const PAYWALL_COPY: Record<UsageAction, { title: string; body: string }> = {
  tutor_message: {
    title: "Your tutor is ready to keep going",
    body: "You've used your free tutor messages for this month. Upgrade to Lumio Premium for unlimited tutoring.",
  },
  generation: {
    title: "Want to keep learning?",
    body: "You've used your free lessons for this month. Upgrade to Lumio Premium for unlimited lessons, quizzes and flashcards.",
  },
  voice: {
    title: "You've used your spoken lessons",
    body: "You've reached your spoken-lesson limit for this month.",
  },
};

/** The current month key, e.g. "2026-09" (UTC). Used to reset counts monthly. */
export function currentPeriod(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function limitFor(tier: Tier, action: UsageAction): number | null {
  return PLANS[tier].limits[action];
}
