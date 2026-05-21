// src/app/api/connected-projects/[id]/route.ts
// PATCH /api/connected-projects/:id — update notes or stack for a hub satellite

import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import { captureApiError } from '@/lib/error-reporting'

export const dynamic = 'force-dynamic'

interface PatchSatelliteRequest {
  notes?: string
  stack?: string
  repoUrl?: string
  healthStatus?: 'green' | 'yellow' | 'red' | 'unknown'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  const supabase = await createClient()

  let body: PatchSatelliteRequest
  try {
    body = await request.json() as PatchSatelliteRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.stack !== undefined) updates.stack = body.stack
  if (body.repoUrl !== undefined) updates.repo_url = body.repoUrl
  if (body.healthStatus !== undefined) updates.health_status = body.healthStatus

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('hub_satellites')
    .update(updates)
    .eq('id', id)
    .eq('founder_id', user.id)
    .select('*')
    .single()

  if (error) {
    captureApiError(error, { route: `/api/connected-projects/${id}`, method: 'PATCH', founderId: user.id })
    return NextResponse.json({ error: 'Failed to update hub satellite' }, { status: 500 })
  }

  return NextResponse.json(data)
}
