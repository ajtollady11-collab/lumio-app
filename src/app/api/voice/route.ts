/**
 * Voice API — converts tutor text to speech via ElevenLabs.
 * Returns audio as a streamable response.
 * 
 * Cost controls:
 * - Max 500 chars per request (trims longer responses)
 * - Only authenticated users can call this
 * - Free tier: ~10,000 chars/month
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? "";

// Voice IDs — warm and natural
const VOICES: Record<string, string> = {
  female: "EXAVITQu4vr4xnSDxMaL", // Sarah — warm, clear
  male:   "TX3LPaxmHKxFdv7VOQHJ", // Liam — friendly, natural
  neutral: "EXAVITQu4vr4xnSDxMaL", // Default to Sarah
};

const MAX_CHARS = 300; // Shorter = faster audio start

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "Voice not configured" }, { status: 503 });
  }

  let text: string;
  let voicePreference: string;
  try {
    const body = await request.json();
    text = String(body.text ?? "").trim();
    voicePreference = String(body.voice ?? "neutral");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

  // Trim to cost cap and strip markdown
  const clean = text
    .replace(/[*_`#>\-]+/g, " ")  // strip markdown
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CHARS);

  const voiceId = VOICES[voicePreference] ?? VOICES.neutral;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text: clean,
          model_id: "eleven_flash_v2_5", // Fastest model — lowest latency
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("ElevenLabs error:", err);
      return NextResponse.json({ error: "Voice generation failed" }, { status: 502 });
    }

    // Stream audio back to the browser
    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });

  } catch (e) {
    console.error("Voice exception:", e);
    return NextResponse.json({ error: "Voice unavailable" }, { status: 502 });
  }
}
