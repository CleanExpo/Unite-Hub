// src/app/api/satellites/dispatch/route.ts
// POST: Dispatch a work package to a satellite business by creating a Linear issue.
// GET:  List recently dispatched work packages (from satellite_dispatches table).
//
// A "work package" is a structured task from the CEO dispatched to one of the 6 businesses.
// It becomes a Linear issue in the correct team, with context attached.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createIssue } from '@/lib/integrations/linear'
import { BUSINESSES } from '@/lib/businesses'

export const dynamic = 'force-dynamic'

// Linear team key mapping (matches linear.ts BUSINESS_TO_TEAM)
const BUSINESS_TO_TEAM: Record<string, string> = {
  synthex: 'SYN',
  dr:      'DR',
  nrpg:   'DR',
  carsi:  'GP',
  restore: 'RA',
  ccw:    'UNI',
  ato:    'UNI',
}

const PRIORITY_LABEL: Record<number, string> = {
  1: 'Urgent',
  2: 'High',
  3: 'Normal',
  4: 'Low',
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: {
    businessKey: string
    title: string
    description?: string
    priority?: number
    type?: string
    deadline?: string
  }

  try {
    body = await request.json() as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { businessKey, title, description, priority = 3, type = 'task', deadline } = body

  if (!businessKey?.trim()) return NextResponse.json({ error: 'businessKey is required' }, { status: 400 })
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const biz = BUSINESSES.find(b => b.key === businessKey)
  if (!biz) return NextResponse.json({ error: `Unknown business: ${businessKey}` }, { status: 400 })

  const teamKey = BUSINESS_TO_TEAM[businessKey]
  if (!teamKey) return NextResponse.json({ error: `No Linear team mapped for: ${businessKey}` }, { status: 400 })

  // Build Linear issue description
  const deadlineSection = deadline ? `\n\n**Deadline:** ${deadline}` : ''
  const issueDescription = [
    `**Dispatched from:** Unite-Group CEO Board`,
    `**Business:** ${biz.name}`,
    `**Type:** ${type}`,
    `**Priority:** ${PRIORITY_LABEL[priority] ?? 'Normal'}`,
    deadlineSection,
    '',
    description ? `## Details\n${description}` : '',
  ].filter(Boolean).join('\n')

  let issueId: string | undefined
  let issueUrl: string | undefined
  let linearError: string | undefined

  try {
    const issue = await createIssue({
      title,
      description: issueDescription,
      teamKey,
      priority: priority as 1 | 2 | 3 | 4,
    })
    issueId = issue.id
    issueUrl = issue.url
  } catch (err) {
    linearError = err instanceof Error ? err.message : 'Linear issue creation failed'
    console.error('[Satellite Dispatch] Linear error:', linearError)
  }

  // Record dispatch in Supabase (even if Linear fails — track intent)
  const supabase = createServiceClient()
  const { data: dispatch, error: dbError } = await supabase
    .from('satellite_dispatches')
    .insert({
      founder_id:   user.id,
      business_key: businessKey,
      title,
      description: description ?? null,
      priority,
      type,
      deadline:    deadline ?? null,
      linear_issue_id:  issueId ?? null,
      linear_issue_url: issueUrl ?? null,
      status: linearError ? 'linear_failed' : 'dispatched',
    })
    .select()
    .single()

  if (dbError) {
    console.error('[Satellite Dispatch] DB error:', dbError.code, dbError.message)
    // If both Linear and DB fail, return error
    if (linearError) {
      return NextResponse.json({ error: linearError }, { status: 502 })
    }
    // Linear succeeded but DB failed — return success anyway (Linear is source of truth)
  }

  return NextResponse.json({
    dispatch: dispatch ?? { businessKey, title, linear_issue_id: issueId, linear_issue_url: issueUrl },
    linearIssueId:  issueId,
    linearIssueUrl: issueUrl,
    warning: linearError ?? undefined,
  }, { status: 201 })
}

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('businessKey')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

  const supabase = createServiceClient()
  let query = supabase
    .from('satellite_dispatches')
    .select('*')
    .eq('founder_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (businessKey) query = query.eq('business_key', businessKey)

  const { data, error } = await query
  if (error) {
    console.error('[Satellite Dispatch] GET error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ dispatches: data ?? [] })
}
