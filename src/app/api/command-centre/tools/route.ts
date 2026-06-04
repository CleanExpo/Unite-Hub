// GET /api/command-centre/tools - read-only tool-catalogue discovery (list-only).
// Auth-gated by the existing Supabase session pattern; unauthenticated -> 401.
// This endpoint NEVER invokes a tool — it only lists discovered sources.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getToolCatalogue } from '@/lib/command-centre/tools/catalogue'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const tools = await getToolCatalogue()
    return NextResponse.json({ tools, count: tools.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load tool catalogue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
