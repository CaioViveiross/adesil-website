import { createClient } from '@supabase/supabase-js';

// Server-only client that bypasses RLS.
// Use ONLY in:
//   - Webhook handlers (no user session)
//   - Cron jobs
//   - Internal data migrations
// NEVER expose to the browser or pass to client components.
export function createAdminClient() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
