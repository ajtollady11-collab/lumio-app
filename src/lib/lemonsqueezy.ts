/**
 * LemonSqueezy config — reads env vars added to Vercel.
 *
 * Required env vars:
 *   LEMONSQUEEZY_API_KEY        — your API key from app.lemonsqueezy.com/settings/api
 *   LEMONSQUEEZY_STORE_ID       — numeric store ID (Settings → Store)
 *   LEMONSQUEEZY_VARIANT_ID     — numeric variant ID of the £29.99/mo product
 *   LEMONSQUEEZY_WEBHOOK_SECRET — signing secret for the webhook
 *   NEXT_PUBLIC_SITE_URL        — https://lumio-app-five.vercel.app
 */

export function lsConfigured(): boolean {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY &&
    process.env.LEMONSQUEEZY_VARIANT_ID
  );
}

export const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY ?? "";
export const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID ?? "";
export const LS_VARIANT_ID = process.env.LEMONSQUEEZY_VARIANT_ID ?? "";
export const LS_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lumio-app-five.vercel.app").replace(/\/$/, "");
}
