import { createClient } from "@/lib/supabase/server";
import {
  currentPeriod,
  limitFor,
  type Tier,
  type UsageAction,
} from "@/lib/plans";

export interface LimitResult {
  allowed: boolean;
  action: UsageAction;
  tier: Tier;
  limit: number | null;
  used: number;
}

/**
 * Resolves the signed-in user's tier from their profile (defaults to 'free').
 */
export async function getUserTier(userId: string): Promise<Tier> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_profiles")
    .select("tier")
    .eq("user_id", userId)
    .maybeSingle<{ tier: Tier }>();
  return data?.tier === "premium" ? "premium" : "free";
}

/**
 * Atomically checks the limit for `action` and, if allowed, counts one use.
 * Returns whether it was allowed plus context for paywall messaging.
 *
 * Relies on the `increment_usage` SQL function (migration 0002) so counting
 * is atomic and users can't tamper with their own totals.
 */
export async function checkAndCount(
  userId: string,
  action: UsageAction,
): Promise<LimitResult> {
  const supabase = await createClient();
  const tier = await getUserTier(userId);
  const limit = limitFor(tier, action);
  const period = currentPeriod();

  // Unlimited is passed to SQL as -1.
  const pLimit = limit === null ? -1 : limit;

  const { data, error } = await supabase.rpc("increment_usage", {
    p_action: action,
    p_period: period,
    p_limit: pLimit,
  });

  // Fail-safe: if the meter errors, don't hard-block a paying user, but do
  // block if we truly can't tell and they're on free with a zero limit.
  if (error || !data || !Array.isArray(data) || data.length === 0) {
    // Allow premium through on meter failure; block free at 0-limits.
    const allowed = limit === null || limit > 0;
    return { allowed, action, tier, limit, used: 0 };
  }

  const row = data[0] as { allowed: boolean; new_count: number; current_count: number };
  return {
    allowed: row.allowed,
    action,
    tier,
    limit,
    used: row.current_count,
  };
}
