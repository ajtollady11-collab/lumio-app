"use client";

import { useState } from "react";

export function SubscribeButton() {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function subscribe() {
    setLoading(true);
    setNote(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url; // to Stripe's secure checkout
        return;
      }
      if (data.notReady) {
        setNote("Checkout is being set up and will be available very soon.");
      } else {
        setNote(data.error || "Couldn't start checkout. Please try again.");
      }
    } catch {
      setNote("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={subscribe}
        disabled={loading}
        className="mt-8 inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[var(--indigo-2)] to-[var(--indigo)] text-base font-medium text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {loading ? "Starting checkout…" : "Subscribe to Premium →"}
      </button>
      {note && <p className="mt-3 text-sm text-muted">{note}</p>}
    </>
  );
}
