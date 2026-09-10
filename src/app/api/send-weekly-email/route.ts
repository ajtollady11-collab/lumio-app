/**
 * Weekly re-engagement email — called by a cron job or manually.
 * Sends a personalised nudge to every user who hasn't been active in 2+ days.
 * Protected by a secret token so it can only be called server-side.
 */
import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = "Lumio <onboarding@resend.dev>";

function emailHtml(firstName: string, streak: number, teacherName: string): string {
  const streakMsg = streak > 0
    ? `🔥 You're on a <strong>${streak}-day streak</strong> — don't break it now!`
    : `Your tutor <strong>${teacherName}</strong> is ready when you are.`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f2ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr><td>
      <div style="background:#14162a;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;font-weight:700;color:#fff;font-family:Georgia,serif;">Lumio</div>
        <div style="font-size:13px;color:#7c7f95;margin-top:4px;">Your personal AI school</div>
      </div>
      <div style="background:#fff;border-radius:16px;padding:32px;margin-bottom:16px;">
        <h1 style="margin:0 0 8px;font-size:24px;color:#14162a;font-family:Georgia,serif;">Hi ${firstName} 👋</h1>
        <p style="margin:0 0 20px;color:#33374f;font-size:15px;line-height:1.6;">${streakMsg}</p>
        <p style="margin:0 0 24px;color:#5a5e78;font-size:14px;line-height:1.6;">
          Your tutor remembers everything you've been working on and is ready to pick up where you left off — 
          whether that's a lesson, a quiz, or just a quick chat about something you're stuck on.
        </p>
        <a href="https://lumio-app-five.vercel.app/tutor" 
           style="display:inline-block;background:#5b54e0;color:#fff;text-decoration:none;padding:14px 28px;border-radius:100px;font-size:15px;font-weight:600;">
          Continue learning →
        </a>
      </div>
      <p style="text-align:center;color:#9a9db0;font-size:12px;margin:0;">
        You're receiving this because you have a Lumio account.<br>
        <a href="https://lumio-app-five.vercel.app/settings" style="color:#9a9db0;">Manage email preferences</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  // Accept either our manual CRON_SECRET or Vercel's built-in cron auth header
  const auth = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (!isVercelCron && CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 503 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  // Get all users who haven't been active in the last 2 days
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const { data: inactive } = await admin.rpc("get_inactive_users", {
    since: twoDaysAgo.toISOString().split("T")[0],
  }).limit(100);

  if (!inactive?.length) {
    return NextResponse.json({ sent: 0, message: "No inactive users to email" });
  }

  const resend = new Resend(RESEND_API_KEY);
  let sent = 0;

  for (const user of inactive) {
    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: user.streak > 0
          ? `🔥 Your ${user.streak}-day streak is waiting, ${user.first_name}`
          : `${user.teacher_name ?? "Your tutor"} is ready for you, ${user.first_name}`,
        html: emailHtml(user.first_name, user.streak, user.teacher_name ?? "Alex"),
      });
      sent++;
    } catch {}
  }

  return NextResponse.json({ sent, total: inactive.length });
}
