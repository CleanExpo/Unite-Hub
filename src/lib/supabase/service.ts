// src/lib/supabase/service.ts
// Service-role client — bypasses RLS for vault/admin operations
// NEVER expose to browser or client components

import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, requireSupabaseEnv } from './env-guard'

export function createServiceClient() {
  // Fail loud and specific if the URL or service-role key is missing/truncated.
  const url = getSupabaseUrl()
  const serviceKey = requireSupabaseEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
  return createClient(
    url,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
