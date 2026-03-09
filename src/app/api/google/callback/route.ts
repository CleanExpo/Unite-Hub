import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') ?? 'gmail'

  if (!code) {
    return NextResponse.redirect(new URL(`/founder/${state}?error=no_code`, request.url))
  }

  // TODO: Exchange code for tokens when GOOGLE_CLIENT_ID/SECRET configured
  return NextResponse.redirect(new URL(`/founder/${state}?connected=pending`, request.url))
}
