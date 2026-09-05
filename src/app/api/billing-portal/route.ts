import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, siteUrl, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Opens the Stripe customer portal so a premium user can update payment
 * details or cancel. Returns { url } to redirect to.
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
    return NextResponse.json({ notReady: true }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ notReady: true }, { status: 503 });

  const { data: student } = await supabase
    .from("student_profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>();

  if (!student?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No subscription found." },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: student.stripe_customer_id,
      return_url: `${siteUrl()}/school`,
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: "Couldn't open billing. Please try again." },
      { status: 502 },
    );
  }
}
