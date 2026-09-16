import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false });

  const { code, user_id } = await request.json();
  if (!code || !user_id) return NextResponse.json({ ok: false });

  const { data: affiliate } = await admin
    .from("affiliates")
    .select("id")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (!affiliate) return NextResponse.json({ ok: false, error: "Invalid code" });

  // Don't double-track
  const { data: existing } = await admin
    .from("affiliate_referrals")
    .select("id")
    .eq("user_id", user_id)
    .maybeSingle();

  if (existing) return NextResponse.json({ ok: true, already: true });

  await admin.from("affiliate_referrals").insert({
    affiliate_id: affiliate.id,
    user_id,
    converted_to_paid: false,
    earnings_amount: 0,
  });

  return NextResponse.json({ ok: true });
}

// Called when a user converts to paid (from webhook)
export async function PATCH(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false });

  const { user_id } = await request.json();
  if (!user_id) return NextResponse.json({ ok: false });

  // Find their referral
  const { data: referral } = await admin
    .from("affiliate_referrals")
    .select("id, affiliate_id")
    .eq("user_id", user_id)
    .eq("converted_to_paid", false)
    .maybeSingle();

  if (!referral) return NextResponse.json({ ok: false });

  // £29.99 * commission_pct / 100
  const pct = 20;
  const earnings = Math.round(29.99 * pct) / 100;

  await admin.from("affiliate_referrals").update({
    converted_to_paid: true,
    earnings_amount: earnings,
  }).eq("id", referral.id);

  return NextResponse.json({ ok: true, earnings });
}
