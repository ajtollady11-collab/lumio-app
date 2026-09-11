import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);
  const { data } = await supabase
    .from("lesson_notes")
    .select("id, subject, topic, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { subject, topic, content } = await request.json();
  const { data } = await supabase.from("lesson_notes").insert({
    user_id: user.id, subject, topic, content,
  }).select().single();
  return NextResponse.json(data ?? {});
}
