import { createClient } from "@/lib/supabase/server";

/**
 * Records that the current user did something today and returns their streak.
 * Safe to call multiple times — idempotent within the same day.
 */
export async function recordActivity(): Promise<{ streak: number; isNewDay: boolean }> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("record_activity");
    const row = Array.isArray(data) ? data[0] : data;
    return { streak: row?.streak ?? 0, isNewDay: row?.is_new_day ?? false };
  } catch {
    return { streak: 0, isNewDay: false };
  }
}

/**
 * Returns the user's current streak without recording activity.
 * Used for dashboard display.
 */
export async function getStreak(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_streak");
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}
