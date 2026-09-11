import { NextResponse } from "next/server";
import { getRecentActivity } from "@/lib/completions";

export const runtime = "nodejs";

export async function GET() {
  const activity = await getRecentActivity(5);
  return NextResponse.json(activity);
}
