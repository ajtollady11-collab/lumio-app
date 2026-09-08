/**
 * LemonSqueezy customer portal — lets premium users manage their subscription.
 * LemonSqueezy provides a self-serve portal URL per subscription.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LS_API_KEY, lsConfigured } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  if (!lsConfigured()) return NextResponse.json({ notReady: true }, { status: 503 });

  // Find this user's subscription in LemonSqueezy by email
  const email = encodeURIComponent(user.email ?? "");
  const res = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions?filter[user_email]=${email}&page[size]=1`,
    {
      headers: {
        "Accept": "application/vnd.api+json",
        "Authorization": `Bearer ${LS_API_KEY}`,
      },
    }
  );

  if (!res.ok) return NextResponse.json({ error: "Couldn't find subscription." }, { status: 502 });

  const json = await res.json();
  const sub = json?.data?.[0];
  const portalUrl = sub?.attributes?.urls?.customer_portal;

  if (!portalUrl) {
    return NextResponse.json(
      { error: "No active subscription found. If you just subscribed, try again in a moment." },
      { status: 404 }
    );
  }

  return NextResponse.json({ url: portalUrl });
}
