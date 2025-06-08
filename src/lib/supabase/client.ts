import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

/**
 * Create a Supabase client for client-side operations
 */
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    // Return a dummy client that won't crash the app
    return {
      from: () => ({ select: () => ({ data: null, error: new Error('Supabase not configured') }) }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signIn: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      }
    } as any
  }

  return createBrowserClient<Database>(url, anonKey)
}

// Singleton instance
let supabaseClientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Get or create a singleton Supabase client instance
 */
export function getSupabaseClient() {
  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createSupabaseClient()
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      // Return dummy client on error
      return createSupabaseClient()
    }
  }
  return supabaseClientInstance
}

// Export with expected names for backward compatibility
export const supabaseClient = getSupabaseClient()
export const supabase = supabaseClient
