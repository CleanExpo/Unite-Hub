// src/app/api/xero/health/route.ts
//
// Lane X (Xero EOFY sprint, Phase B) — Xero health route.
//
// Auth-gated, read-only. Returns the structured XeroHealth shape so the
// founder UI and the EOFY summary cron can both report status without
// having to know the env-var names.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getXeroHealth } from '@/lib/integrations/xero/health'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const health = getXeroHealth()
    return NextResponse.json(health)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[xero/health]', message)
    return NextResponse.json({ error: 'Xero health check failed' }, { status: 500 })
  }
}
