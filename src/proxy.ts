import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  const { response, session } = await updateSession(request)

  // Protect /founder/* routes — redirect unauthenticated users to login
  if (request.nextUrl.pathname.startsWith('/founder') && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/founder/:path*', '/auth/:path*'],
}
