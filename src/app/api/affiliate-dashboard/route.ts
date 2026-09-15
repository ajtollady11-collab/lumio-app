import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 500 });

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const { data: affiliate } = await admin
    .from("affiliates")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (!affiliate) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

  const { data: referrals } = await admin
    .from("affiliate_referrals")
    .select("converted_to_paid, earnings_amount, paid_out, created_at")
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false });

  const rows = referrals ?? [];
  const totalSignups = rows.length;
  const converted = rows.filter(r => r.converted_to_paid).length;
  const totalEarned = rows.reduce((sum, r) => sum + Number(r.earnings_amount), 0);
  const totalOwed = rows.filter(r => !r.paid_out && r.converted_to_paid)
    .reduce((sum, r) => sum + Number(r.earnings_amount), 0);
  const totalPaid = rows.filter(r => r.paid_out)
    .reduce((sum, r) => sum + Number(r.earnings_amount), 0);

  return NextResponse.json({
    affiliate: { name: affiliate.name, email: affiliate.email, code: affiliate.code, commission_pct: affiliate.commission_pct },
    stats: { totalSignups, converted, totalEarned, totalOwed, totalPaid },
    referrals: rows.slice(0, 20),
  });
}
