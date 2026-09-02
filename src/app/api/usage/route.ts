import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/usage";
import { currentPeriod, limitFor, PLANS, type UsageAction } from "@/lib/plans";

export const runtime = "nodejs";

/**
 * Returns the signed-in user's tier plus this month's usage and limits for
 * each meterable action. Powers the dashboard usage meter.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const tier = await getUserTier(user.id);
  const period = currentPeriod();

  const { data: rows } = await supabase
    .from("usage_counters")
    .select("action, count")
    .eq("user_id", user.id)
    .eq("period", period);

  const used: Record<string, number> = {};
  (rows ?? []).forEach((r: { action: string; count: number }) => {
    used[r.action] = r.count;
  });

  const actions: UsageAction[] = ["tutor_message", "generation"];
  const items = actions.map((action) => ({
    action,
    used: used[action] ?? 0,
    limit: limitFor(tier, action), // null = unlimited
  }));

  return NextResponse.json({
    tier,
    planLabel: PLANS[tier].label,
    items,
  });
}
