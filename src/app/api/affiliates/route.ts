import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ADMIN_SECRET = process.env.CRON_SECRET ?? "";

function isAdmin(request: NextRequest) {
  return request.headers.get("x-admin-secret") === ADMIN_SECRET ||
    request.cookies.get("admin_secret")?.value === ADMIN_SECRET;
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 500 });

  const { data: affiliates } = await admin.from("affiliates").select("*").order("created_at", { ascending: false });

  // Get stats for each affiliate
  const result = await Promise.all((affiliates ?? []).map(async (a) => {
    const { data: referrals } = await admin
      .from("affiliate_referrals")
      .select("converted_to_paid, earnings_amount, paid_out, created_at")
      .eq("affiliate_id", a.id);

    const rows = referrals ?? [];
    const totalSignups = rows.length;
    const converted = rows.filter(r => r.converted_to_paid).length;
    const totalEarned = rows.reduce((sum, r) => sum + Number(r.earnings_amount), 0);
    const totalOwed = rows.filter(r => !r.paid_out && r.converted_to_paid)
      .reduce((sum, r) => sum + Number(r.earnings_amount), 0);

    return { ...a, totalSignups, converted, totalEarned, totalOwed };
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 500 });

  const { name, email, code, commission_pct } = await request.json();
  if (!name || !email || !code) return NextResponse.json({ error: "name, email and code required" }, { status: 400 });

  const { data, error } = await admin.from("affiliates").insert({
    name, email,
    code: code.toUpperCase().trim(),
    commission_pct: commission_pct ?? 20,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 500 });

  const { affiliate_id, mark_paid } = await request.json();
  if (mark_paid) {
    await admin.from("affiliate_referrals")
      .update({ paid_out: true })
      .eq("affiliate_id", affiliate_id)
      .eq("converted_to_paid", true)
      .eq("paid_out", false);
  }
  return NextResponse.json({ ok: true });
}
