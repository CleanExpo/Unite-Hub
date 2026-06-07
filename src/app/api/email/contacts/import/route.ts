// src/app/api/email/contacts/import/route.ts
// Converts a parsed email sender into a founder-scoped CRM contact.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

type ImportBody = {
  source?: 'gmail_mock' | 'gmail'
  senderEmail?: string
  senderName?: string
  company?: string
  threadId?: string
  accountEmail?: string
}

function normaliseEmail(value: string | undefined) {
  return value?.trim().toLowerCase()
}

function splitName(senderName: string | undefined) {
  const parts = (senderName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: 'Email', lastName: 'Contact' }
  if (parts.length === 1) return { firstName: parts[0], lastName: null }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: ImportBody
  try {
    body = await request.json() as ImportBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const source = body.source ?? 'gmail'
  if (source === 'gmail') {
    return NextResponse.json({
      error: 'Live Gmail import requires completed Google OAuth consent and thread fetch wiring',
      code: 'gmail_live_import_not_connected',
    }, { status: 503 })
  }

  const email = normaliseEmail(body.senderEmail)
  if (!email) return NextResponse.json({ error: 'senderEmail is required' }, { status: 400 })
  if (!email.endsWith('@unite-hub.test') && !email.includes('__pw_test__')) {
    return NextResponse.json({
      error: 'Mock Gmail import only accepts tagged non-deliverable test senders',
      code: 'unsafe_mock_sender',
    }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: existing, error: existingError } = await supabase
    .from('contacts')
    .select('*')
    .eq('founder_id', user.id)
    .eq('email', email)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: 'Failed to check existing contact' }, { status: 500 })
  }

  if (existing) {
    return NextResponse.json({
      contact: existing,
      created: false,
      source: 'mocked_gmail_sender',
    })
  }

  const { firstName, lastName } = splitName(body.senderName)
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      founder_id: user.id,
      first_name: firstName,
      last_name: lastName,
      email,
      company: body.company?.trim() || null,
      status: 'lead',
      tags: ['gmail_import', '__PW_TEST__'],
      metadata: {
        source: 'gmail_import',
        importMode: 'mocked_sender',
        threadId: body.threadId ?? null,
        accountEmail: body.accountEmail ?? null,
      },
    })
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to import contact' }, { status: 500 })
  }

  return NextResponse.json({
    contact: data,
    created: true,
    source: 'mocked_gmail_sender',
  }, { status: 201 })
}
