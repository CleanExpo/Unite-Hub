import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase Admin Client with service_role key for server-side operations
// This client has full database access and should ONLY be used on the server
// See: https://supabase.com/docs/reference/javascript/initializing

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Supabase client with admin privileges for server-side operations
 * This client should ONLY be used in server contexts (API routes, server components, etc)
 * NEVER expose this client or its key to the client-side
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
