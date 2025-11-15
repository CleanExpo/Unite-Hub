import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard/overview'

  console.log('OAuth callback received:', { code: !!code, origin, redirectTo })

  if (code) {
    const cookieStore = await cookies()
    const response = NextResponse.redirect(`${origin}${redirectTo}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              console.log('Setting cookie:', name, 'with options:', options)
              cookieStore.set({ name, value, ...options })
              response.cookies.set({ name, value, ...options })
            } catch (error) {
              console.error('Error setting cookie:', error)
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              console.log('Removing cookie:', name)
              cookieStore.set({ name, value: '', ...options })
              response.cookies.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Error removing cookie:', error)
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }

    console.log('Session created successfully:', {
      hasSession: !!data.session,
      userId: data.user?.id,
      expiresAt: data.session?.expires_at
    })

    return response
  }

  console.log('No code in callback, redirecting to login')
  return NextResponse.redirect(`${origin}/login`)
}
