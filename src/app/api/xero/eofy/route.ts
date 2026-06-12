// src/app/api/xero/eofy/route.ts
//
// Lane X (Xero EOFY sprint, Phase B) — EOFY window route.
//
// Auth-gated, read-only. Returns the XeroEofyWindow for the current
// calendar year. Useful for the founder UI to render "X days to EOFY"
// and the BAS draft generator to adapt to the window phase.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { computeEofyWindow } from '@/lib/integrations/xero/eofy'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const window = computeEofyWindow()
    return NextResponse.json(window)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[xero/eofy]', message)
    return NextResponse.json({ error: 'EOFY window computation failed' }, { status: 500 })
  }
}
