import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

/**
 * Creates a Supabase client for browser environments
 * @returns Supabase browser client
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * Singleton instance of the Supabase client
 * This is the named export that was missing and causing the deployment error
 */
export const supabaseClient = createClient()

/**
 * Default export for convenience
 * Includes both the createClient function and the supabaseClient instance
 */
export default { createClient, supabaseClient }
