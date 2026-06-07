// src/app/api/campaigns/drip/route.ts
// Minimal founder-scoped drip lifecycle backed by existing email_campaigns rows.

import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

type JsonObject = Record<string, unknown>

type DripStep = {
  id: string
  order: number
  subject: string
  bodyHtml: string
  bodyText: string | null
  delayMinutes: number
}

type DripEnrollment = {
  id: string
  contactId: string
  email: string
  name: string | null
  status: 'active' | 'completed'
  currentStepIndex: number
  nextRunAt: string
  enrolledAt: string
  completedAt?: string
}

type DripEvent = {
  id: string
  enrollmentId: string
  contactId: string
  stepId: string
  eventType: 'dry_run_processed'
  createdAt: string
}

type DripState = {
  name: string
  steps: DripStep[]
  enrollments: DripEnrollment[]
  events: DripEvent[]
}

type CampaignRow = {
  id: string
  founder_id: string
  business_key: string
  subject: string
  body_html: string
  body_text: string | null
  recipient_list: unknown
  status: string
  metadata: unknown
}

type ContactRow = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
}

type CreateCampaignBody = {
  action: 'create_campaign'
  businessKey?: string
  name?: string
  subject?: string
  bodyHtml?: string
  bodyText?: string
}

type AddStepBody = {
  action: 'add_step'
  campaignId?: string
  subject?: string
  bodyHtml?: string
  bodyText?: string
  delayMinutes?: number
}

type EnrollBody = {
  action: 'enroll_contact'
  campaignId?: string
  contactId?: string
}

type ProcessBody = {
  action: 'process_pending'
  campaignId?: string
  dryRun?: boolean
}

type DripBody = CreateCampaignBody | AddStepBody | EnrollBody | ProcessBody

function objectValue(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {}
}

function dripState(metadata: unknown): DripState {
  const root = objectValue(metadata)
  const drip = objectValue(root.drip)

  return {
    name: typeof drip.name === 'string' ? drip.name : '',
    steps: Array.isArray(drip.steps) ? drip.steps.filter(isDripStep) : [],
    enrollments: Array.isArray(drip.enrollments) ? drip.enrollments.filter(isDripEnrollment) : [],
    events: Array.isArray(drip.events) ? drip.events.filter(isDripEvent) : [],
  }
}

function withDripState(metadata: unknown, drip: DripState): JsonObject {
  return {
    ...objectValue(metadata),
    drip,
  }
}

function isDripStep(value: unknown): value is DripStep {
  const row = objectValue(value)
  return (
    typeof row.id === 'string' &&
    typeof row.order === 'number' &&
    typeof row.subject === 'string' &&
    typeof row.bodyHtml === 'string' &&
    (typeof row.bodyText === 'string' || row.bodyText === null) &&
    typeof row.delayMinutes === 'number'
  )
}

function isDripEnrollment(value: unknown): value is DripEnrollment {
  const row = objectValue(value)
  return (
    typeof row.id === 'string' &&
    typeof row.contactId === 'string' &&
    typeof row.email === 'string' &&
    (typeof row.name === 'string' || row.name === null) &&
    (row.status === 'active' || row.status === 'completed') &&
    typeof row.currentStepIndex === 'number' &&
    typeof row.nextRunAt === 'string' &&
    typeof row.enrolledAt === 'string'
  )
}

function isDripEvent(value: unknown): value is DripEvent {
  const row = objectValue(value)
  return (
    typeof row.id === 'string' &&
    typeof row.enrollmentId === 'string' &&
    typeof row.contactId === 'string' &&
    typeof row.stepId === 'string' &&
    row.eventType === 'dry_run_processed' &&
    typeof row.createdAt === 'string'
  )
}

function required(value: string | undefined, name: string): string | NextResponse {
  if (!value?.trim()) {
    return NextResponse.json({ error: `${name} is required` }, { status: 400 })
  }
  return value.trim()
}

function contactName(contact: ContactRow): string | null {
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim()
  return name || null
}

function isSafeDryRunRecipient(email: string): boolean {
  return email.endsWith('@unite-hub.test') || email.includes('__PW_TEST__')
}

async function loadCampaign(supabase: ReturnType<typeof createServiceClient>, founderId: string, campaignId: string) {
  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('founder_id', founderId)
    .single()

  if (error || !data) return null
  return data as CampaignRow
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: DripBody
  try {
    body = await request.json() as DripBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  if (body.action === 'create_campaign') {
    const businessKey = required(body.businessKey, 'businessKey')
    if (businessKey instanceof NextResponse) return businessKey
    const name = required(body.name, 'name')
    if (name instanceof NextResponse) return name
    const subject = required(body.subject, 'subject')
    if (subject instanceof NextResponse) return subject
    const bodyHtml = required(body.bodyHtml, 'bodyHtml')
    if (bodyHtml instanceof NextResponse) return bodyHtml

    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({
        founder_id: user.id,
        business_key: businessKey,
        subject,
        body_html: bodyHtml,
        body_text: body.bodyText ?? null,
        recipient_list: [],
        status: 'draft',
        metadata: withDripState({ name, categories: ['drip'] }, {
          name,
          steps: [],
          enrollments: [],
          events: [],
        }),
      })
      .select('*')
      .single()

    if (error || !data) {
      console.error('[campaigns/drip] create failed:', error?.message)
      return NextResponse.json({ error: 'Failed to create drip campaign' }, { status: 500 })
    }

    return NextResponse.json({ campaign: data }, { status: 201 })
  }

  const campaignId = required(body.campaignId, 'campaignId')
  if (campaignId instanceof NextResponse) return campaignId

  const campaign = await loadCampaign(supabase, user.id, campaignId)
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  if (body.action === 'add_step') {
    const subject = required(body.subject, 'subject')
    if (subject instanceof NextResponse) return subject
    const bodyHtml = required(body.bodyHtml, 'bodyHtml')
    if (bodyHtml instanceof NextResponse) return bodyHtml

    const drip = dripState(campaign.metadata)
    const step: DripStep = {
      id: randomUUID(),
      order: drip.steps.length + 1,
      subject,
      bodyHtml,
      bodyText: body.bodyText ?? null,
      delayMinutes: Math.max(0, body.delayMinutes ?? 0),
    }
    drip.steps.push(step)

    const { error } = await supabase
      .from('email_campaigns')
      .update({ metadata: withDripState(campaign.metadata, drip) })
      .eq('id', campaign.id)
      .eq('founder_id', user.id)

    if (error) return NextResponse.json({ error: 'Failed to add drip step' }, { status: 500 })
    return NextResponse.json({ step, stepCount: drip.steps.length })
  }

  if (body.action === 'enroll_contact') {
    const contactId = required(body.contactId, 'contactId')
    if (contactId instanceof NextResponse) return contactId

    const { data: contact, error } = await supabase
      .from('contacts')
      .select('id,email,first_name,last_name')
      .eq('id', contactId)
      .eq('founder_id', user.id)
      .single()

    if (error || !contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    const typedContact = contact as ContactRow
    if (!typedContact.email?.trim()) {
      return NextResponse.json({ error: 'Contact has no email address' }, { status: 400 })
    }

    const drip = dripState(campaign.metadata)
    if (drip.steps.length === 0) {
      return NextResponse.json({ error: 'Campaign has no drip steps' }, { status: 400 })
    }
    if (drip.enrollments.some((enrollment) => enrollment.contactId === typedContact.id)) {
      return NextResponse.json({ error: 'Contact is already enrolled' }, { status: 409 })
    }

    const now = new Date().toISOString()
    const enrollment: DripEnrollment = {
      id: randomUUID(),
      contactId: typedContact.id,
      email: typedContact.email.trim(),
      name: contactName(typedContact),
      status: 'active',
      currentStepIndex: 0,
      nextRunAt: now,
      enrolledAt: now,
    }
    drip.enrollments.push(enrollment)

    const recipients = Array.isArray(campaign.recipient_list)
      ? campaign.recipient_list.filter((recipient): recipient is JsonObject => typeof recipient === 'object' && recipient !== null)
      : []
    recipients.push({ email: enrollment.email, name: enrollment.name ?? undefined, contactId: enrollment.contactId })

    const { error: updateError } = await supabase
      .from('email_campaigns')
      .update({
        recipient_list: recipients,
        metadata: withDripState(campaign.metadata, drip),
      })
      .eq('id', campaign.id)
      .eq('founder_id', user.id)

    if (updateError) return NextResponse.json({ error: 'Failed to enroll contact' }, { status: 500 })
    return NextResponse.json({ enrollment })
  }

  if (body.action === 'process_pending') {
    const dryRun = body.dryRun !== false
    const drip = dripState(campaign.metadata)
    const now = new Date()
    let processed = 0
    let skipped = 0
    let failed = 0

    for (const enrollment of drip.enrollments) {
      if (enrollment.status !== 'active') continue
      if (new Date(enrollment.nextRunAt) > now) {
        skipped++
        continue
      }

      const step = drip.steps[enrollment.currentStepIndex]
      if (!step) {
        enrollment.status = 'completed'
        enrollment.completedAt = now.toISOString()
        skipped++
        continue
      }

      if (!dryRun || !isSafeDryRunRecipient(enrollment.email)) {
        failed++
        continue
      }

      drip.events.push({
        id: randomUUID(),
        enrollmentId: enrollment.id,
        contactId: enrollment.contactId,
        stepId: step.id,
        eventType: 'dry_run_processed',
        createdAt: now.toISOString(),
      })

      enrollment.currentStepIndex += 1
      const nextStep = drip.steps[enrollment.currentStepIndex]
      if (nextStep) {
        enrollment.nextRunAt = new Date(now.getTime() + nextStep.delayMinutes * 60_000).toISOString()
      } else {
        enrollment.status = 'completed'
        enrollment.completedAt = now.toISOString()
      }
      processed++
    }

    const { error } = await supabase
      .from('email_campaigns')
      .update({
        metadata: withDripState(campaign.metadata, drip),
        status: failed > 0 ? 'partial' : campaign.status,
      })
      .eq('id', campaign.id)
      .eq('founder_id', user.id)

    if (error) return NextResponse.json({ error: 'Failed to process pending drip steps' }, { status: 500 })

    return NextResponse.json({
      result: {
        processed,
        skipped,
        failed,
        dryRun,
        providerSend: 'not_attempted',
      },
    })
  }

  return NextResponse.json({ error: `Unsupported action: ${(body as { action: string }).action}` }, { status: 400 })
}
