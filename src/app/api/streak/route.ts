import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStreak } from "@/lib/streak";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ streak: 0 });
  const streak = await getStreak();
  return NextResponse.json({ streak });
}
