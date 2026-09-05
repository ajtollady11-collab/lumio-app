import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
// Stripe requires the raw, unparsed body for signature verification.
export const dynamic = "force-dynamic";

async function setTierByCustomer(customerId: string, tier: "free" | "premium") {
  const admin = createAdminClient();
  if (!admin) return;
  await admin
    .from("student_profiles")
    .update({ tier })
    .eq("stripe_customer_id", customerId);
}

async function setTierByUserId(userId: string, tier: "free" | "premium") {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("student_profiles").update({ tier }).eq("user_id", userId);
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    // Not configured yet — acknowledge so Stripe doesn't retry forever.
    return NextResponse.json({ received: true, notConfigured: true });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const customerId =
          typeof session.customer === "string" ? session.customer : undefined;
        if (userId) await setTierByUserId(userId, "premium");
        else if (customerId) await setTierByCustomer(customerId, "premium");
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        // Active/trialing => premium; anything else => free.
        const active = sub.status === "active" || sub.status === "trialing";
        await setTierByCustomer(customerId, active ? "premium" : "free");
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await setTierByCustomer(customerId, "free");
        break;
      }
      default:
        // Ignore other event types.
        break;
    }
  } catch {
    // Log-free fail: return 500 so Stripe retries.
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
