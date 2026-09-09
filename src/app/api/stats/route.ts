import { NextResponse } from "next/server";
import { getCompletionStats } from "@/lib/completions";

export const runtime = "nodejs";

export async function GET() {
  const stats = await getCompletionStats();
  return NextResponse.json(stats);
}
