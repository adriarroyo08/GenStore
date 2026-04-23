import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Admin client — bypasses RLS, for server-side operations
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Creates a per-request client using the user's JWT — respects RLS
export function supabaseForUser(accessToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
