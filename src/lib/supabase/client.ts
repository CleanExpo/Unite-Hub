import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

/**
 * Create a Supabase client for client-side operations
 */
export function createSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton instance
let supabaseClientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Get or create a singleton Supabase client instance
 */
export function getSupabaseClient() {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createSupabaseClient()
  }
  return supabaseClientInstance
}

// Export with expected names for backward compatibility
export const supabaseClient = getSupabaseClient()
export const supabase = supabaseClient
