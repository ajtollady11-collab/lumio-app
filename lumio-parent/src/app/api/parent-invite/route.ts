/**
 * Generate or retrieve a parent invite code for the current student.
 * GET — returns existing code or creates a new one
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: student } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 404 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 500 });

  // Check for existing valid code
  const { data: existing } = await admin
    .from("parent_invites")
    .select("code, expires_at")
    .eq("student_id", student.id)
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return NextResponse.json({ code: existing.code, expires_at: existing.expires_at });

  // Create new code
  const code = randomCode();
  await admin.from("parent_invites").insert({
    code,
    student_id: student.id,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  });

  return NextResponse.json({ code, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() });
}
