/**
 * Sends push notifications — called by cron every evening
 * to remind students whose streak is at risk.
 */
import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (!isVercelCron && CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 503 });
  }

  webpush.setVapidDetails(
    "mailto:hello@lumio.school",
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 500 });

  // Get users who were active yesterday but not today — streak at risk
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data: atRisk } = await admin
    .from("push_subscriptions")
    .select("user_id, subscription")
    .limit(200);

  if (!atRisk?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const row of atRisk) {
    // Check if they were active yesterday but not today
    const { count: todayCount } = await admin
      .from("user_activity")
      .select("*", { count: "exact", head: true })
      .eq("user_id", row.user_id)
      .eq("activity_date", today);

    if (todayCount && todayCount > 0) continue; // Already active today

    const { count: yesterdayCount } = await admin
      .from("user_activity")
      .select("*", { count: "exact", head: true })
      .eq("user_id", row.user_id)
      .eq("activity_date", yesterday);

    if (!yesterdayCount || yesterdayCount === 0) continue; // No streak to protect

    try {
      await webpush.sendNotification(
        row.subscription,
        JSON.stringify({
          title: "🔥 Your streak is at risk!",
          body: "Log in to keep your learning streak alive. Your tutor is ready.",
          icon: "/icon-192.png",
          url: "/school",
        })
      );
      sent++;
    } catch {
      // Subscription expired — remove it
      await admin.from("push_subscriptions").delete().eq("user_id", row.user_id);
    }
  }

  return NextResponse.json({ sent });
}
