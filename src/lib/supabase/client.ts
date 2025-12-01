/**
 * Supabase Browser Client - PKCE Flow
 *
 * This client is used in browser/client components.
 * PKCE (Proof Key for Code Exchange) stores session in cookies,
 * making it accessible to both client and server.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.generated';

type TypedSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

let supabaseClient: TypedSupabaseClient | null = null;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

  return supabaseClient;
}

// Export singleton for convenience
export const supabaseBrowser = new Proxy({} as TypedSupabaseClient, {
  get(target, prop) {
    return createClient()[prop as keyof TypedSupabaseClient];
  },
});
