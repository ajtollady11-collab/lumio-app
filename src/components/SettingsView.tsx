"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SUBJECT_OPTIONS,
  CURRICULUM_OPTIONS,
  PERSONALITY_OPTIONS,
  VOICE_OPTIONS,
  type VoicePreference,
} from "@/types";
import { updateSettings } from "@/app/settings/actions";

type Tab = "profile" | "plan" | "account";

export interface SettingsData {
  firstName: string;
  age: number | null;
  schoolYear: string;
  country: string;
  curriculum: string;
  subjects: string[];
  teacherName: string;
  voicePreference: VoicePreference;
  personality: string;
  tier: "free" | "premium";
  email: string;
}

export function SettingsView(props: SettingsData) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6">
      <button
        onClick={() => router.push("/school")}
        className="inline-flex items-center gap-1.5 rounded-full py-2 pl-2.5 pr-3.5 text-sm font-medium text-ink-2 hover:bg-[rgba(20,22,42,.06)]"
      >
        ← Back to dashboard
      </button>
      <h1 className="mt-4 font-display text-[clamp(28px,4vw,38px)] font-semibold tracking-tight">
        Settings
      </h1>

      {/* tabs */}
      <div className="mt-6 flex gap-1 rounded-full border border-[var(--line)] bg-white p-1" style={{ boxShadow: "var(--shadow-sm)" }}>
        {(["profile", "plan", "account"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-ink text-white" : "text-ink-2 hover:bg-paper-2"
            }`}
          >
            {t === "plan" ? "Plan & billing" : t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "profile" && <ProfileTab {...props} />}
        {tab === "plan" && <PlanTab tier={props.tier} />}
        {tab === "account" && <AccountTab email={props.email} />}
      </div>
    </div>
  );
}

/* ================= PROFILE ================= */
function ProfileTab(props: SettingsData) {
  const [firstName, setFirstName] = useState(props.firstName);
  const [age, setAge] = useState(props.age ? String(props.age) : "");
  const [schoolYear, setSchoolYear] = useState(props.schoolYear);
  const [country, setCountry] = useState(props.country);
  const [curriculum, setCurriculum] = useState(props.curriculum);
  const [subjects, setSubjects] = useState<string[]>(props.subjects);
  const [teacherName, setTeacherName] = useState(props.teacherName);
  const [voice, setVoice] = useState<VoicePreference>(props.voicePreference);
  const [personality, setPersonality] = useState(props.personality);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function toggleSubject(s: string) {
    setSubjects((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await updateSettings({
      firstName, age: age ? Number(age) : null, schoolYear, country,
      curriculum, subjects, teacherName, voicePreference: voice, personality,
    });
    setSaving(false);
    setMsg(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: res.error });
  }

  return (
    <div className="space-y-5">
      <Card title="Student profile">
        <Field label="First name">
          <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Age">
            <input className={inputCls} type="number" min={4} max={19} value={age} onChange={(e) => setAge(e.target.value)} />
          </Field>
          <Field label="School year / grade">
            <input className={inputCls} value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} placeholder="e.g. Year 10" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Country">
            <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />
          </Field>
          <Field label="Curriculum">
            <select className={inputCls} value={curriculum} onChange={(e) => setCurriculum(e.target.value)}>
              <option value="">Select…</option>
              {CURRICULUM_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Subjects">
          <div className="flex flex-wrap gap-2">
            {SUBJECT_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSubject(s)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  subjects.includes(s)
                    ? "border-transparent bg-[var(--indigo)]/10 font-semibold text-indigo shadow-[inset_0_0_0_1.5px_rgba(91,84,224,.4)]"
                    : "border-[var(--line)] bg-white text-ink-2 hover:border-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>
      </Card>

      <Card title="Your teacher">
        <Field label="Teacher name">
          <input className={inputCls} value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
        </Field>
        <Field label="Voice preference">
          <div className="flex gap-2">
            {VOICE_OPTIONS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setVoice(v.value)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  voice === v.value
                    ? "border-transparent bg-[var(--indigo)]/10 font-semibold text-indigo shadow-[inset_0_0_0_1.5px_rgba(91,84,224,.4)]"
                    : "border-[var(--line)] bg-white text-ink-2 hover:border-ink"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Teaching personality">
          <div className="grid gap-2 sm:grid-cols-2">
            {PERSONALITY_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPersonality(p.value)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  personality === p.value
                    ? "border-transparent bg-[var(--indigo)]/8 shadow-[inset_0_0_0_1.5px_rgba(91,84,224,.4)]"
                    : "border-[var(--line)] bg-white hover:border-ink"
                }`}
              >
                <span className="block text-sm font-semibold">{p.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{p.hint}</span>
              </button>
            ))}
          </div>
        </Field>
      </Card>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="inline-flex h-11 items-center rounded-full bg-indigo px-6 text-sm font-medium text-white hover:bg-[var(--indigo-ink)] disabled:opacity-60">
          {saving ? "Saving…" : "Save changes"}
        </button>
        {msg && (
          <span className={`text-sm ${msg.ok ? "text-[var(--sage)]" : "text-[var(--coral)]"}`}>{msg.text}</span>
        )}
      </div>
    </div>
  );
}

/* ================= PLAN & BILLING ================= */
function PlanTab({ tier }: { tier: "free" | "premium" }) {
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function openPortal() {
    setPortalLoading(true);
    setNote(null);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setNote(data.notReady ? "Billing management is being set up." : data.error || "Couldn't open billing.");
    } catch {
      setNote("Something went wrong. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  if (tier === "free") {
    return (
      <Card title="Your plan">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-paper-2 px-3 py-1 text-sm font-medium">Free plan</span>
        </div>
        <p className="mt-3 text-sm text-ink-2">
          You&rsquo;re on the free plan with limited tutoring and lessons each month.
          Upgrade for unlimited access.
        </p>
        <button onClick={() => router.push("/upgrade")} className="mt-4 inline-flex h-11 items-center rounded-full bg-gradient-to-b from-[var(--indigo-2)] to-[var(--indigo)] px-6 text-sm font-medium text-white hover:-translate-y-0.5 transition-transform">
          Upgrade to Premium →
        </button>
      </Card>
    );
  }

  // Premium
  return (
    <>
      <Card title="Your plan">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-gold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3z" fill="currentColor" /></svg>
          </span>
          <div>
            <div className="font-display text-lg font-semibold">Lumio Premium</div>
            <div className="text-sm text-muted">£29.99 / month · unlimited access</div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={openPortal} disabled={portalLoading} className="inline-flex h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-medium hover:border-ink disabled:opacity-60">
            {portalLoading ? "Opening…" : "Manage payment & invoices"}
          </button>
          <button onClick={() => setShowCancel(true)} className="inline-flex h-11 items-center rounded-full px-5 text-sm font-medium text-muted hover:text-ink">
            Cancel membership
          </button>
        </div>
        {note && <p className="mt-3 text-sm text-muted">{note}</p>}
      </Card>

      {showCancel && (
        <CancelFlow onClose={() => setShowCancel(false)} onProceed={openPortal} />
      )}
    </>
  );
}

/**
 * A FAIR retention flow: reminds them what they'll lose, offers to pause,
 * asks ONE optional question, then lets them cancel cleanly via Stripe's
 * portal. No dark patterns — cancelling stays one clear click away.
 */
function CancelFlow({ onClose, onProceed }: { onClose: () => void; onProceed: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--line)] bg-paper p-7" style={{ boxShadow: "var(--shadow-lg)" }}>
        <h2 className="font-display text-2xl font-semibold">Before you go</h2>
        <p className="mt-2 text-sm text-ink-2">
          Cancelling means you&rsquo;ll lose unlimited tutoring, lessons and all your
          premium features at the end of your billing period.
        </p>

        <div className="mt-5 rounded-2xl border border-[var(--line-2)] bg-white p-4">
          <p className="text-sm font-medium">Not ready to leave for good?</p>
          <p className="mt-1 text-xs text-muted">You can manage or pause your plan from the billing portal instead.</p>
        </div>

        <label className="mt-5 block text-sm font-medium">
          What made you consider leaving? <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          className="mt-2 w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
          rows={3}
          placeholder="Your feedback helps us improve Lumio."
        />

        <div className="mt-6 flex flex-col gap-2">
          <button onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-full bg-indigo px-6 text-sm font-medium text-white hover:bg-[var(--indigo-ink)]">
            Keep my membership
          </button>
          <button onClick={onProceed} className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-6 text-sm font-medium text-ink-2 hover:border-ink">
            Continue to cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= ACCOUNT ================= */
function AccountTab({ email }: { email: string }) {
  return (
    <div className="space-y-5">
      <Card title="Account">
        <Field label="Email">
          <input className={`${inputCls} text-muted`} value={email} disabled />
        </Field>
        <p className="text-xs text-muted">To change your email, please contact support.</p>
      </Card>

      <Card title="Sign out">
        <p className="text-sm text-ink-2">Sign out of Lumio on this device.</p>
        <form action="/auth/signout" method="post" className="mt-3">
          <button type="submit" className="inline-flex h-11 items-center rounded-full border border-[var(--line)] bg-white px-6 text-sm font-medium hover:border-ink">
            Log out
          </button>
        </form>
      </Card>

      <Card title="Delete account">
        <p className="text-sm text-ink-2">
          Permanently delete your account and all your learning data. This
          can&rsquo;t be undone.
        </p>
        <button
          onClick={() => alert("To delete your account and data, please email support. Full self-service deletion is coming soon.")}
          className="mt-3 inline-flex h-11 items-center rounded-full border border-[rgba(224,118,91,.4)] bg-white px-6 text-sm font-medium text-[var(--coral)] hover:bg-[rgba(224,118,91,.06)]"
        >
          Delete account
        </button>
      </Card>
    </div>
  );
}

/* ================= shared bits ================= */
const inputCls =
  "w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[var(--line-2)] bg-white p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
