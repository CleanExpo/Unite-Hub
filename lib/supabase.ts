import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export { createClient } from "@supabase/supabase-js"

// Create a singleton Supabase client for the browser
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

// Export the supabase client directly for backward compatibility
export const supabase =
  typeof window !== "undefined"
    ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    : null

export function getSupabaseClient() {
  if (!supabaseClient && typeof window !== "undefined") {
    // Only create the client on the client side
    supabaseClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return supabaseClient
}

// Create a singleton Supabase client for server components
let supabaseServerClient: ReturnType<typeof createSupabaseClient> | null = null

export function getServerSupabaseClient() {
  if (!supabaseServerClient) {
    supabaseServerClient = createSupabaseClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return supabaseServerClient
}
