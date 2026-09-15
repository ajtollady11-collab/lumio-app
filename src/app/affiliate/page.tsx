"use client";

import { useEffect, useState } from "react";

interface AffiliateStats {
  affiliate: { name: string; email: string; code: string; commission_pct: number };
  stats: { totalSignups: number; converted: number; totalEarned: number; totalOwed: number; totalPaid: number };
  referrals: Array<{ converted_to_paid: boolean; earnings_amount: number; paid_out: boolean; created_at: string }>;
}

export default function AffiliatePage() {
  const [data, setData] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [entered, setEntered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check for code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("code");
    if (urlCode) { setCode(urlCode.toUpperCase()); loadDashboard(urlCode); }
  }, []);

  async function loadDashboard(c: string) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/affiliate-dashboard?code=${encodeURIComponent(c.toUpperCase().trim())}`);
    if (!res.ok) {
      setError("Invalid code. Please check and try again.");
      setLoading(false);
      return;
    }
    const d = await res.json();
    setData(d);
    setEntered(true);
    setLoading(false);
  }

  function copyLink() {
    if (!data) return;
    navigator.clipboard.writeText(`https://lumio-app-five.vercel.app?ref=${data.affiliate.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatDate(str: string) {
    const d = new Date(str);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday ? "Today" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  if (!entered) return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--indigo)] text-2xl font-bold text-white">L</div>
          <h1 className="mt-4 font-display text-2xl font-semibold">Lumio Affiliate Portal</h1>
          <p className="mt-2 text-sm text-muted">Enter your affiliate code to view your dashboard.</p>
        </div>
        <div className="rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
          <label className="text-[13px] font-medium">Your affiliate code</label>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && loadDashboard(code)}
            placeholder="e.g. JAMES20" maxLength={20}
            className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-center font-mono text-lg tracking-widest outline-none focus:border-indigo uppercase" />
          {error && <p className="mt-2 text-sm text-[var(--coral)]">{error}</p>}
          <button onClick={() => loadDashboard(code)} disabled={loading || !code.trim()}
            className="mt-4 w-full rounded-full bg-indigo py-3 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90">
            {loading ? "Loading…" : "View my dashboard"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!data) return <div className="flex min-h-screen items-center justify-center bg-paper"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--line)] border-t-indigo" /></div>;

  const { affiliate, stats, referrals } = data;
  const conversionRate = stats.totalSignups > 0 ? Math.round((stats.converted / stats.totalSignups) * 100) : 0;

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-[var(--line-2)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--indigo)] text-sm font-bold text-white">L</div>
            <div>
              <div className="font-display font-semibold">Lumio Affiliates</div>
              <div className="text-[11px] text-muted">Welcome back, {affiliate.name}</div>
            </div>
          </div>
          <div className="rounded-full border border-[var(--line)] bg-paper-2 px-3 py-1.5 font-mono text-sm font-bold text-indigo">
            {affiliate.code}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">

        {/* Referral link */}
        <div className="rounded-3xl border border-[var(--indigo)]/25 bg-gradient-to-br from-[var(--indigo)]/8 to-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="text-[13px] font-semibold uppercase tracking-wider text-indigo">Your referral link</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 rounded-xl bg-white border border-[var(--line)] px-4 py-2.5 font-mono text-[13px] text-ink truncate">
              lumio-app-five.vercel.app?ref={affiliate.code}
            </div>
            <button onClick={copyLink} className="shrink-0 rounded-full bg-indigo px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
              {copied ? "Copied! ✓" : "Copy link"}
            </button>
          </div>
          <p className="mt-3 text-[13px] text-muted">
            Share this link and earn <strong>{affiliate.commission_pct}%</strong> of every £29.99/month subscription — that's <strong>£{(29.99 * affiliate.commission_pct / 100).toFixed(2)}</strong> per paying student.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total signups", value: stats.totalSignups, icon: "👥", sub: "via your link" },
            { label: "Paid subscribers", value: stats.converted, icon: "💳", sub: `${conversionRate}% conversion` },
            { label: "Total earned", value: `£${stats.totalEarned.toFixed(2)}`, icon: "💰", sub: "all time" },
            { label: "Pending payout", value: `£${stats.totalOwed.toFixed(2)}`, icon: "⏳", sub: stats.totalOwed > 0 ? "awaiting payment" : "all paid out", highlight: stats.totalOwed > 0 },
          ].map(({ label, value, icon, sub, highlight }) => (
            <div key={label} className={`rounded-3xl border p-5 ${highlight ? "border-[var(--gold)]/40 bg-[var(--gold)]/8" : "border-[var(--line-2)] bg-white"}`} style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="text-2xl">{icon}</div>
              <div className={`mt-2 font-display text-2xl font-semibold ${highlight ? "text-[#8a6800]" : ""}`}>{value}</div>
              <div className="mt-0.5 text-[13px] font-medium">{label}</div>
              <div className="text-[12px] text-muted">{sub}</div>
            </div>
          ))}
        </div>

        {/* Earnings breakdown */}
        <div className="rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
          <h2 className="font-display text-xl font-semibold">Earnings breakdown</h2>
          <div className="mt-4 grid grid-cols-3 gap-4 rounded-2xl bg-paper-2 p-4 text-center">
            <div>
              <div className="text-[13px] text-muted">Total paid out</div>
              <div className="mt-1 text-xl font-bold text-[var(--sage)]">£{stats.totalPaid.toFixed(2)}</div>
            </div>
            <div className="border-x border-[var(--line-2)]">
              <div className="text-[13px] text-muted">Pending</div>
              <div className="mt-1 text-xl font-bold text-[var(--gold)]">£{stats.totalOwed.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[13px] text-muted">Per conversion</div>
              <div className="mt-1 text-xl font-bold">£{(29.99 * affiliate.commission_pct / 100).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Recent referrals */}
        <div className="rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
          <h2 className="font-display text-xl font-semibold">Recent referrals</h2>
          {referrals.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No referrals yet. Share your link to get started!</p>
          ) : (
            <div className="mt-4 space-y-0">
              {referrals.map((r, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-[var(--line-2)] py-3 last:border-0">
                  <span className="text-lg">{r.converted_to_paid ? "💳" : "👤"}</span>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium">
                      {r.converted_to_paid ? "Converted to paid subscriber" : "Signed up (free)"}
                    </div>
                    <div className="text-[12px] text-muted">{formatDate(r.created_at)}</div>
                  </div>
                  <div className="text-right">
                    {r.converted_to_paid ? (
                      <div>
                        <div className={`text-[14px] font-semibold ${r.paid_out ? "text-[var(--sage)]" : "text-[var(--gold)]"}`}>
                          +£{Number(r.earnings_amount).toFixed(2)}
                        </div>
                        <div className="text-[11px] text-muted">{r.paid_out ? "Paid out" : "Pending"}</div>
                      </div>
                    ) : (
                      <span className="text-[13px] text-muted">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
          <h2 className="font-display text-xl font-semibold">How it works</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { step: "1", title: "Share your link", desc: `Send lumio-app-five.vercel.app?ref=${affiliate.code} to students, parents, or post it online.` },
              { step: "2", title: "They sign up", desc: "When someone signs up via your link, they're tracked to you automatically." },
              { step: "3", title: "Earn commission", desc: `When they subscribe to Premium (£29.99/mo), you earn £${(29.99 * affiliate.commission_pct / 100).toFixed(2)} per month they stay.` },
            ].map(({ step, title, desc }) => (
              <div key={step} className="rounded-2xl bg-paper-2 p-4">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-indigo text-[13px] font-bold text-white">{step}</div>
                <div className="mt-2 font-semibold text-[14px]">{title}</div>
                <div className="mt-1 text-[13px] text-muted">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
