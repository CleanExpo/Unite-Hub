import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          // @ts-expect-error: Cookie store has get method at runtime
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            // @ts-expect-error: Cookie store has set method at runtime
            cookieStore.set({ name, value, ...options })
          } catch {
            // Ignore errors
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            // @ts-expect-error: Cookie store has set method at runtime
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Ignore errors
          }
        },
      },
    }
  )
}
