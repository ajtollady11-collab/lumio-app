/**
 * LemonSqueezy webhook — replaces the old Stripe webhook.
 * Listens for subscription events and flips user tier in Supabase.
 * Kept at /api/stripe-webhook path so we don't need a new Vercel env var
 * for the webhook URL (we'll just update the URL in LemonSqueezy dashboard).
 */
import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { LS_WEBHOOK_SECRET } from "@/lib/lemonsqueezy";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function setTier(userId: string, tier: "free" | "premium") {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("student_profiles").update({ tier }).eq("user_id", userId);
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  if (!LS_WEBHOOK_SECRET) {
    // Not configured — acknowledge so LS doesn't retry forever
    return NextResponse.json({ received: true, notConfigured: true });
  }

  const signature = request.headers.get("x-signature") ?? "";
  const rawBody = await request.text();

  if (!verifySignature(rawBody, signature, LS_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: { meta: { event_name: string; custom_data?: { supabase_user_id?: string } }; data: { attributes: { status?: string; user_email?: string } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const eventName = event.meta?.event_name;
  const userId = event.meta?.custom_data?.supabase_user_id;
  const status = event.data?.attributes?.status;

  if (!userId) {
    // Can't match to a user — acknowledge and move on
    return NextResponse.json({ received: true });
  }

  try {
    switch (eventName) {
      case "order_created":
        await setTier(userId, "premium");
        break;
      case "subscription_created":
      case "subscription_resumed":
      case "subscription_unpaused":
        await setTier(userId, "premium");
        break;
      case "subscription_cancelled":
      case "subscription_expired":
      case "subscription_paused":
        await setTier(userId, "free");
        break;
      case "subscription_updated":
        // active/on_trial → premium, anything else → free
        if (status === "active" || status === "on_trial") {
          await setTier(userId, "premium");
        } else if (status === "cancelled" || status === "expired" || status === "paused") {
          await setTier(userId, "free");
        }
        break;
      default:
        break;
    }
  } catch (e) {
    console.error("Webhook handler error:", e);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
