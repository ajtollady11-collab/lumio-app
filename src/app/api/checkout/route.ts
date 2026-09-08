import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { lsConfigured, LS_API_KEY, LS_STORE_ID, LS_VARIANT_ID, siteUrl } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  if (!lsConfigured()) {
    return NextResponse.json(
      { notReady: true, error: "Checkout is being set up. Please check back soon." },
      { status: 503 }
    );
  }

  // Build a LemonSqueezy checkout URL via their API
  const res = await fetch(`https://api.lemonsqueezy.com/v1/checkouts`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      "Authorization": `Bearer ${LS_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: user.email ?? "",
            custom: { supabase_user_id: user.id },
          },
          checkout_options: {
            embed: false,
          },
          product_options: {
            redirect_url: `${siteUrl()}/school?upgraded=1`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: LS_STORE_ID } },
          variant: { data: { type: "variants", id: LS_VARIANT_ID } },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("LemonSqueezy checkout error:", err);
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
  }

  const json = await res.json();
  const url = json?.data?.attributes?.url;
  if (!url) return NextResponse.json({ error: "Couldn't start checkout." }, { status: 502 });

  return NextResponse.json({ url });
}
