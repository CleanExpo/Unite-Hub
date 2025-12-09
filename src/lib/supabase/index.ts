/**
 * Supabase Client Utilities
 * Barrel export for all Supabase client types and instances
 */

// Admin client (service role - full database access)
export { supabaseAdmin } from './admin';

// Browser client (anon key - RLS protected)
export { createClient } from './client';

// Server client (PKCE cookies - RSC/SSR)
export { createClient as createServerClient } from './server';
export { getSupabaseServer } from './server';

// Database types
export type { Database } from './types';
