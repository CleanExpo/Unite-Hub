import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  // HYBRID APPROACH: Handle both PKCE and Implicit flows

  // If no code parameter, assume implicit flow (tokens in URL hash)
  // Redirect to client-side page that can read hash fragments
  if (!code) {
    console.log('No code parameter - assuming implicit flow with hash tokens')
    return NextResponse.redirect(`${origin}/auth/implicit-callback`)
  }

  // PKCE Flow: Exchange code for session server-side
  console.log('Code parameter found - using PKCE flow')

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options) {
          cookieStore.delete(name)
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth exchange error:', error)
    return NextResponse.redirect(`${origin}/login?error=${error.message}`)
  }

  if (!data.session) {
    console.error('No session created')
    return NextResponse.redirect(`${origin}/login?error=no_session`)
  }

  console.log('PKCE session created for user:', data.user?.email)

  // Redirect to dashboard after session is set
  return NextResponse.redirect(`${origin}/dashboard/overview`)
}
