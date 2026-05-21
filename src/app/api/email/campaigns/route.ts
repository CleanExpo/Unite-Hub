// src/app/api/email/campaigns/route.ts
// GET:  List email campaigns for the founder
// POST: Create a new campaign (draft status)

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const business = searchParams.get('business')

  const supabase = createServiceClient()

  let query = supabase
    .from('email_campaigns')
    .select('*')
    .eq('founder_id', user.id)
    .order('created_at', { ascending: false })

  if (business) {
    query = query.eq('business_key', business)
  }

  const { data, error } = await query

  if (error) {
    console.error('[email/campaigns] GET failed:', error.message)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }

  return NextResponse.json({ campaigns: data ?? [] })
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: {
    businessKey: string
    name: string
    subject: string
    bodyHtml: string
    bodyText?: string
    recipientList?: Array<{ email: string; name?: string }>
    categories?: string[]
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.businessKey?.trim()) {
    return NextResponse.json({ error: 'businessKey is required' }, { status: 400 })
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!body.subject?.trim()) {
    return NextResponse.json({ error: 'subject is required' }, { status: 400 })
  }
  if (!body.bodyHtml?.trim()) {
    return NextResponse.json({ error: 'bodyHtml is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert({
      founder_id: user.id,
      business_key: body.businessKey.trim(),
      name: body.name.trim(),
      subject: body.subject.trim(),
      body_html: body.bodyHtml,
      body_text: body.bodyText ?? null,
      recipient_list: body.recipientList ?? [],
      categories: body.categories ?? [],
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    console.error('[email/campaigns] POST failed:', error.message)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }

  return NextResponse.json({ campaign: data }, { status: 201 })
}
