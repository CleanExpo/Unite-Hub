import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

type DripStep = {
  id: string
  order: number
  delayHours: number
  subject: string
  bodyText: string
  bodyHtml: string
}

type DripEnrollment = {
  id: string
  contactId: string
  email: string
  status: 'pending' | 'processed' | 'skipped'
  enrolledAt: string
  processedAt?: string
  lastResult?: string
}

type DripMetadata = {
  name?: string
  drip?: {
    steps?: DripStep[]
    enrollments?: DripEnrollment[]
    processRuns?: Array<{ id: string; processed: number; skipped: number; dryRun: true; processedAt: string }>
  }
}

function metadataOf(value: unknown): DripMetadata {
  return value && typeof value === 'object' ? (value as DripMetadata) : {}
}

function dripOf(value: unknown) {
  const metadata = metadataOf(value)
  return {
    ...metadata,
    drip: {
      steps: metadata.drip?.steps ?? [],
      enrollments: metadata.drip?.enrollments ?? [],
      processRuns: metadata.drip?.processRuns ?? [],
    },
  }
}

function isTestAddress(email: string) {
  return email.endsWith('@unite-hub.test') || email.endsWith('.test')
}

async function loadCampaign(supabase: ReturnType<typeof createServiceClient>, founderId: string, id: string) {
  return supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', id)
    .eq('founder_id', founderId)
    .single()
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: {
    action?: string
    campaignId?: string
    contactId?: string
    businessKey?: string
    name?: string
    subject?: string
    bodyText?: string
    bodyHtml?: string
    delayHours?: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  if (body.action === 'create') {
    if (!body.businessKey?.trim()) return NextResponse.json({ error: 'businessKey is required' }, { status: 400 })
    if (!body.name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({
        founder_id: user.id,
        business_key: body.businessKey.trim(),
        subject: body.subject?.trim() || body.name.trim(),
        body_html: body.bodyHtml || '<p>Drip campaign draft.</p>',
        body_text: body.bodyText ?? null,
        recipient_list: [],
        status: 'draft',
        metadata: {
          name: body.name.trim(),
          source: 'drip',
          drip: { steps: [], enrollments: [], processRuns: [] },
        },
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create drip campaign' }, { status: 500 })
    return NextResponse.json({ campaign: data }, { status: 201 })
  }

  if (!body.campaignId) return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
  const { data: campaign, error: campaignError } = await loadCampaign(supabase, user.id, body.campaignId)
  if (campaignError || !campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const metadata = dripOf(campaign.metadata)

  if (body.action === 'add_step') {
    if (!body.subject?.trim()) return NextResponse.json({ error: 'subject is required' }, { status: 400 })
    if (!body.bodyText?.trim() && !body.bodyHtml?.trim()) {
      return NextResponse.json({ error: 'bodyText or bodyHtml is required' }, { status: 400 })
    }

    const step: DripStep = {
      id: randomUUID(),
      order: metadata.drip.steps.length + 1,
      delayHours: Math.max(0, Number(body.delayHours ?? 0)),
      subject: body.subject.trim(),
      bodyText: body.bodyText ?? '',
      bodyHtml: body.bodyHtml ?? `<p>${body.bodyText ?? ''}</p>`,
    }

    metadata.drip.steps.push(step)
    const { error } = await supabase
      .from('email_campaigns')
      .update({ metadata })
      .eq('id', campaign.id)
      .eq('founder_id', user.id)

    if (error) return NextResponse.json({ error: 'Failed to add drip step' }, { status: 500 })
    return NextResponse.json({ step })
  }

  if (body.action === 'enroll') {
    if (!body.contactId) return NextResponse.json({ error: 'contactId is required' }, { status: 400 })

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, email')
      .eq('id', body.contactId)
      .eq('founder_id', user.id)
      .single()

    if (contactError || !contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    if (!contact.email) return NextResponse.json({ error: 'Contact email is required' }, { status: 400 })

    const enrollment: DripEnrollment = {
      id: randomUUID(),
      contactId: contact.id as string,
      email: contact.email as string,
      status: 'pending',
      enrolledAt: now,
    }

    metadata.drip.enrollments.push(enrollment)
    const { error } = await supabase
      .from('email_campaigns')
      .update({ metadata })
      .eq('id', campaign.id)
      .eq('founder_id', user.id)

    if (error) return NextResponse.json({ error: 'Failed to enroll contact' }, { status: 500 })
    return NextResponse.json({ enrollment })
  }

  if (body.action === 'process_pending') {
    let processed = 0
    let skipped = 0

    const updatedEnrollments = metadata.drip.enrollments.map((enrollment) => {
      if (enrollment.status !== 'pending') return enrollment
      if (!metadata.drip.steps.length || !isTestAddress(enrollment.email)) {
        skipped += 1
        return {
          ...enrollment,
          status: 'skipped' as const,
          processedAt: now,
          lastResult: !metadata.drip.steps.length ? 'no_step' : 'non_test_address_blocked',
        }
      }

      processed += 1
      return {
        ...enrollment,
        status: 'processed' as const,
        processedAt: now,
        lastResult: 'dry_run_no_email_sent',
      }
    })

    metadata.drip.enrollments = updatedEnrollments
    metadata.drip.processRuns.push({ id: randomUUID(), processed, skipped, dryRun: true, processedAt: now })

    const { error } = await supabase
      .from('email_campaigns')
      .update({ metadata })
      .eq('id', campaign.id)
      .eq('founder_id', user.id)

    if (error) return NextResponse.json({ error: 'Failed to process drip campaign' }, { status: 500 })
    return NextResponse.json({ processed, skipped, dryRun: true, emailSent: false, enrollments: updatedEnrollments })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
