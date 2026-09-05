import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, STRIPE_PRICE_ID, siteUrl, stripeConfigured } from "@/lib/stripe";
import type { StudentProfile } from "@/types";

export const runtime = "nodejs";

/**
 * Starts a Stripe Checkout session for the £29.99/mo Premium subscription.
 * Returns { url } for the client to redirect to. Until Stripe is configured,
 * returns a friendly notReady flag so the UI can say "coming soon".
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  if (!stripeConfigured()) {
    return NextResponse.json(
      { notReady: true, error: "Checkout is being set up. Please check back soon." },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ notReady: true }, { status: 503 });
  }

  // Look up (or remember) the Stripe customer for this user so subscriptions
  // stay tied to the same customer across sessions.
  const { data: student } = await supabase
    .from("student_profiles")
    .select("id, stripe_customer_id, first_name")
    .eq("user_id", user.id)
    .maybeSingle<StudentProfile & { stripe_customer_id: string | null }>();

  let customerId = student?.stripe_customer_id ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    // Persist it (column added in migration 0003).
    await supabase
      .from("student_profiles")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${siteUrl()}/school?upgraded=1`,
      cancel_url: `${siteUrl()}/upgrade?cancelled=1`,
      allow_promotion_codes: true,
      // Carry the user id so the webhook can match payment → account.
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      metadata: { supabase_user_id: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: "Couldn't start checkout. Please try again." },
      { status: 502 },
    );
  }
}
