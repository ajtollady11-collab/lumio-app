import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Loads the stored memory summary for the current user.
 * Returns empty string if none exists yet.
 */
export async function loadMemory(userId: string): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tutor_memory")
      .select("summary")
      .eq("user_id", userId)
      .maybeSingle<{ summary: string }>();
    return data?.summary ?? "";
  } catch {
    return "";
  }
}

/**
 * After a conversation, summarise what was discussed and merge it
 * with the existing memory. Keeps memory concise (max ~200 words).
 * Fire-and-forget — don't await in the hot path.
 */
export async function updateMemory(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  existingMemory: string
): Promise<void> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || messages.length < 2) return;

    const anthropic = new Anthropic({ apiKey });

    // Build a compact transcript (last 6 messages max)
    const recent = messages.slice(-6);
    const transcript = recent
      .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content.slice(0, 300)}`)
      .join("\n");

    const prompt = existingMemory
      ? `Existing memory:\n${existingMemory}\n\nNew conversation:\n${transcript}\n\nUpdate the memory to include important new things (struggles, topics covered, progress). Keep it under 150 words, factual, third-person ("The student..."). Return only the updated memory text.`
      : `Conversation:\n${transcript}\n\nSummarise the key things to remember about this student from this conversation (topics covered, struggles, progress). Under 100 words, factual, third-person ("The student..."). Return only the summary text.`;

    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 250,
      messages: [{ role: "user", content: prompt }],
    });

    const newMemory = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!newMemory) return;

    const supabase = await createClient();
    await supabase.from("tutor_memory").upsert({
      user_id: userId,
      summary: newMemory,
      updated_at: new Date().toISOString(),
    });
  } catch {}
}
