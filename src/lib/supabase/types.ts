/**
 * Typed Supabase Client
 * Provides type-safe access to Supabase with Database schema
 */

import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/database.generated';

// Export Database type for use elsewhere
export type { Database };

// JSON helper type from database schema
export type Json = Database['public']['Tables'] extends Record<string, { Row: { [key: string]: infer J } }>
  ? J
  : never;

/**
 * Create a typed browser client
 */
export function createTypedBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Create a typed server client with cookie handling
 */
export async function createTypedServerClient(getCookieStore: () => Promise<any>) {
  const cookieStore = await getCookieStore();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        get(name: string) {
          if (!cookieStore) return undefined;
          try {
            return cookieStore.get(name)?.value;
          } catch {
            return undefined;
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          if (!cookieStore) return;
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Setting cookies in Server Components may fail
          }
        },
        remove(name: string, options: CookieOptions) {
          if (!cookieStore) return;
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Removing cookies in Server Components may fail
          }
        },
      },
    }
  );
}

/**
 * Type-safe table name type
 */
export type TableName = keyof Database['public']['Tables'];

/**
 * Type-safe row type for a table
 */
export type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];

/**
 * Type-safe insert type for a table
 */
export type Insert<T extends TableName> = Database['public']['Tables'][T]['Insert'];

/**
 * Type-safe update type for a table
 */
export type Update<T extends TableName> = Database['public']['Tables'][T]['Update'];
