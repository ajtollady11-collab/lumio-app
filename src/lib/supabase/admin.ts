import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using the SERVICE ROLE key. Bypasses RLS, so it must
 * ONLY ever be used in trusted server code (e.g. the Stripe webhook, which has
 * no user session but must update a user's tier).
 *
 * Requires env var: SUPABASE_SERVICE_ROLE_KEY  (server-only, never NEXT_PUBLIC_).
 * Returns null if not configured.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
