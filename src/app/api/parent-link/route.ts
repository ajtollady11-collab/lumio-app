/**
 * Parent uses an invite code to link to a student.
 * POST { code } — links the current user as a parent
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 500 });

  // Find valid invite
  const { data: invite } = await admin
    .from("parent_invites")
    .select("code, student_id, expires_at, used")
    .eq("code", code.toUpperCase().trim())
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!invite) return NextResponse.json({ error: "Invalid or expired code. Ask your child for a new one." }, { status: 404 });

  // Link parent to student
  const { error } = await admin.from("parent_profiles").upsert({
    parent_user_id: user.id,
    student_id: invite.student_id,
  });

  if (error) return NextResponse.json({ error: "Already linked or error." }, { status: 400 });

  // Mark invite as used
  await admin.from("parent_invites").update({ used: true }).eq("code", code.toUpperCase().trim());

  return NextResponse.json({ ok: true, student_id: invite.student_id });
}

export async function GET() {
  // Return the student(s) this parent is linked to
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  const admin = createAdminClient();
  if (!admin) return NextResponse.json([]);

  const { data } = await admin
    .from("parent_profiles")
    .select("student_id, student_profiles(first_name, subjects, school_year, curriculum)")
    .eq("parent_user_id", user.id);

  return NextResponse.json(data ?? []);
}
