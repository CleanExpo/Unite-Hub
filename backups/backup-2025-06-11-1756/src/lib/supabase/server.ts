import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseKey)
}

export function createServerClient() {
  return createSupabaseClient(supabaseUrl, supabaseKey)
}

// Default export for compatibility
export default createClient()
