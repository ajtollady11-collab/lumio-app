"use client";

import { useEffect, useState } from "react";

interface Affiliate {
  id: string; name: string; email: string; code: string;
  commission_pct: number; created_at: string;
  totalSignups: number; converted: number; totalEarned: number; totalOwed: number;
}

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "lumio-cron-secret-2026";

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", code: "", commission_pct: "20" });
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);

  function auth() {
    if (secret === "lumio-cron-secret-2026") setAuthed(true);
  }

  useEffect(() => {
    if (!authed) return;
    fetch("/api/affiliates", { headers: { "x-admin-secret": "lumio-cron-secret-2026" } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setAffiliates(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authed]);

  async function addAffiliate() {
    setSaving(true);
    const res = await fetch("/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": "lumio-cron-secret-2026" },
      body: JSON.stringify({ ...form, commission_pct: Number(form.commission_pct) }),
    });
    if (res.ok) {
      const data = await res.json();
      setAffiliates(a => [{ ...data, totalSignups: 0, converted: 0, totalEarned: 0, totalOwed: 0 }, ...a]);
      setForm({ name: "", email: "", code: "", commission_pct: "20" });
      setAdding(false);
    }
    setSaving(false);
  }

  async function markPaid(affiliateId: string) {
    await fetch("/api/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-secret": "lumio-cron-secret-2026" },
      body: JSON.stringify({ affiliate_id: affiliateId, mark_paid: true }),
    });
    setAffiliates(a => a.map(x => x.id === affiliateId ? { ...x, totalOwed: 0 } : x));
  }

  if (!authed) return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="w-80 rounded-3xl border border-[var(--line-2)] bg-white p-8" style={{ boxShadow: "var(--shadow-sm)" }}>
        <h1 className="font-display text-xl font-semibold">Admin access</h1>
        <input value={secret} onChange={e => setSecret(e.target.value)} onKeyDown={e => e.key === "Enter" && auth()}
          type="password" placeholder="Enter admin secret"
          className="mt-4 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-indigo" />
        <button onClick={auth} className="mt-3 w-full rounded-full bg-indigo py-2.5 text-sm font-medium text-white hover:opacity-90">
          Enter
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold">Affiliates</h1>
            <p className="mt-1 text-sm text-muted">Manage affiliate partners and track their earnings.</p>
          </div>
          <button onClick={() => setAdding(true)}
            className="rounded-full bg-indigo px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
            + Add affiliate
          </button>
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total affiliates", value: affiliates.length },
            { label: "Total signups", value: affiliates.reduce((s, a) => s + a.totalSignups, 0) },
            { label: "Paid conversions", value: affiliates.reduce((s, a) => s + a.converted, 0) },
            { label: "Total owed", value: `£${affiliates.reduce((s, a) => s + a.totalOwed, 0).toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-[var(--line-2)] bg-white p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="text-[13px] text-muted">{label}</div>
              <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
            </div>
          ))}
        </div>

        {/* Add affiliate form */}
        {adding && (
          <div className="mt-6 rounded-3xl border border-[var(--indigo)]/30 bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
            <h2 className="font-semibold text-lg mb-4">New affiliate</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[13px] font-medium">Full name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. James Smith"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-indigo" />
              </div>
              <div>
                <label className="text-[13px] font-medium">Email</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="james@example.com" type="email"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-indigo" />
              </div>
              <div>
                <label className="text-[13px] font-medium">Promo code</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. JAMES20"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-mono outline-none focus:border-indigo uppercase" />
              </div>
              <div>
                <label className="text-[13px] font-medium">Commission %</label>
                <input value={form.commission_pct} onChange={e => setForm(f => ({ ...f, commission_pct: e.target.value }))}
                  type="number" min="1" max="50"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-indigo" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={addAffiliate} disabled={saving || !form.name || !form.email || !form.code}
                className="rounded-full bg-indigo px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90">
                {saving ? "Saving…" : "Add affiliate"}
              </button>
              <button onClick={() => setAdding(false)}
                className="rounded-full border border-[var(--line)] px-6 py-2.5 text-sm font-medium text-ink-2 hover:border-ink">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Affiliate list */}
        {loading ? (
          <div className="mt-8 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--line)] border-t-indigo" /></div>
        ) : affiliates.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-[var(--line-2)] bg-white p-10 text-center text-muted" style={{ boxShadow: "var(--shadow-sm)" }}>
            No affiliates yet. Add your first one above.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {affiliates.map(a => (
              <div key={a.id} className="rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg font-semibold">{a.name}</span>
                      <span className="rounded-full bg-[var(--indigo)]/10 px-2.5 py-0.5 font-mono text-[13px] font-bold text-indigo">{a.code}</span>
                      <span className="text-[13px] text-muted">{a.commission_pct}% commission</span>
                    </div>
                    <div className="mt-0.5 text-[13px] text-muted">{a.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/affiliate?code=${a.code}`} target="_blank"
                      className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[12px] font-medium text-ink-2 hover:border-ink">
                      View dashboard ↗
                    </a>
                    {a.totalOwed > 0 && (
                      <button onClick={() => markPaid(a.id)}
                        className="rounded-full bg-[var(--sage)] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90">
                        Mark £{a.totalOwed.toFixed(2)} paid
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-4 border-t border-[var(--line-2)] pt-4">
                  {[
                    { label: "Signups", value: a.totalSignups },
                    { label: "Converted to paid", value: a.converted },
                    { label: "Conversion rate", value: a.totalSignups > 0 ? `${Math.round((a.converted / a.totalSignups) * 100)}%` : "—" },
                    { label: "Owed", value: `£${a.totalOwed.toFixed(2)}`, highlight: a.totalOwed > 0 },
                  ].map(({ label, value, highlight }) => (
                    <div key={label}>
                      <div className="text-[12px] text-muted">{label}</div>
                      <div className={`mt-0.5 text-xl font-bold ${highlight ? "text-[var(--sage)]" : ""}`}>{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-xl bg-paper-2 px-3 py-2 text-[12px] text-muted">
                  Referral link: <span className="font-mono text-ink">lumio-app-five.vercel.app?ref={a.code}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
