import { NextResponse, type NextRequest } from "next/server";
import { recordCompletion } from "@/lib/completions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { type, subject, score } = await request.json();
    await recordCompletion(type, subject, score ?? undefined);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
