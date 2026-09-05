import Stripe from "stripe";

/**
 * Stripe server-side client. All keys come from environment variables that
 * you'll add in Vercel once your Stripe account is ready:
 *
 *   STRIPE_SECRET_KEY         - sk_test_... (then sk_live_... at launch)
 *   STRIPE_WEBHOOK_SECRET     - whsec_... (from the webhook endpoint)
 *   STRIPE_PRICE_ID           - price_... (the £29.99/mo recurring price)
 *   NEXT_PUBLIC_SITE_URL      - https://lumio-app-five.vercel.app (for redirects)
 *
 * Until STRIPE_SECRET_KEY is set, the payment routes return a friendly
 * "not configured yet" message instead of crashing.
 */

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Omitting apiVersion uses the account's default pinned version — simplest
  // and avoids mismatches across SDK upgrades.
  return new Stripe(key);
}

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://lumio-app-five.vercel.app"
  ).replace(/\/$/, "");
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && STRIPE_PRICE_ID);
}
