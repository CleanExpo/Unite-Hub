// src/app/api/command-centre/overnight-summary/route.ts
//
// CC-19 — Morning digest (read API). GET returns the founder's overnight summary
// synthesised from tasks + execution sessions. Auth-gated (getUser → 401),
// founder-scoped by RLS. Read-only.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { gatherOvernightDigest } from '@/lib/command-centre/overnight-summary'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const digest = await gatherOvernightDigest({ founderId: user.id, generatedAt: new Date().toISOString() })
    return NextResponse.json({ digest })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to build digest' },
      { status: 500 },
    )
  }
}
