// src/app/api/email/contacts/import/route.ts
// Converts a parsed email sender into a founder-scoped CRM contact.

import { NextResponse } from 'next/server'
import { createClient, getUser } from '@/lib/supabase/server'
import {
  fetchFullThread,
  getAccessTokenForEmail,
  getConnectedGoogleAccounts,
  type FullThread,
} from '@/lib/integrations/google'

export const dynamic = 'force-dynamic'

const IMPORT_SOURCES = ['gmail', 'gmail_mock'] as const
type ImportSource = (typeof IMPORT_SOURCES)[number]

type ImportBody = {
  source?: string
  senderEmail?: string
  senderName?: string
  company?: string
  threadId?: string
  messageId?: string
  accountEmail?: string
}

type ParsedSender = {
  email: string
  name: string | null
}

function normaliseEmail(value: string | undefined) {
  return value?.trim().toLowerCase()
}

function isImportSource(value: string): value is ImportSource {
  return IMPORT_SOURCES.includes(value as ImportSource)
}

function stripSenderName(value: string) {
  return value
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseEmailSender(value: string | undefined): ParsedSender | null {
  const raw = value?.trim()
  if (!raw) return null

  const angleMatch = raw.match(/^(.*?)<([^<>@\s]+@[^<>@\s]+)>$/)
  if (angleMatch) {
    return {
      name: stripSenderName(angleMatch[1]) || null,
      email: angleMatch[2].trim().toLowerCase(),
    }
  }

  const emailMatch = raw.match(/([^\s<>()]+@[^\s<>()]+)/)
  if (!emailMatch) return null

  return {
    name: null,
    email: emailMatch[1].trim().toLowerCase(),
  }
}

function splitName(senderName: string | undefined) {
  const parts = (senderName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: 'Email', lastName: 'Contact' }
  if (parts.length === 1) return { firstName: parts[0], lastName: null }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

async function resolveGoogleAccount(founderId: string, requestedAccount: string | undefined) {
  const account = normaliseEmail(requestedAccount)
  if (account) return { account, status: 200 as const }

  const accounts = await getConnectedGoogleAccounts(founderId)
  const emails = accounts.map((row) => normaliseEmail(row.email)).filter((email): email is string => Boolean(email))
  const uniqueEmails = Array.from(new Set(emails))

  if (uniqueEmails.length === 0) {
    return {
      account: null,
      status: 503 as const,
      body: {
        error: 'Google account is not connected',
        code: 'gmail_account_not_connected',
        source: 'not_connected',
      },
    }
  }

  if (uniqueEmails.length > 1) {
    return {
      account: null,
      status: 400 as const,
      body: {
        error: 'accountEmail is required when multiple Google accounts are connected',
        code: 'gmail_account_required',
      },
    }
  }

  return { account: uniqueEmails[0], status: 200 as const }
}

function selectSender(thread: FullThread, accountEmail: string): ParsedSender | null {
  const account = accountEmail.toLowerCase()
  const parsed = thread.messages
    .map((message) => parseEmailSender(message.from))
    .filter((sender): sender is ParsedSender => Boolean(sender))

  return parsed.find((sender) => sender.email !== account) ?? parsed[0] ?? null
}

async function fetchMessageSender(founderId: string, accountEmail: string, messageId: string): Promise<ParsedSender | null> {
  const accessToken = await getAccessTokenForEmail(founderId, accountEmail)
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) throw new Error(`Gmail messages.get failed: ${res.status}`)

  const message = await res.json() as {
    payload?: {
      headers?: Array<{ name: string; value: string }>
    }
  }
  const from = message.payload?.headers?.find((header) => header.name.toLowerCase() === 'from')?.value
  return parseEmailSender(from)
}

function mapGmailFetchError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Failed to fetch Gmail thread'
  if (message.includes('No Google credentials found')) {
    return {
      status: 503,
      body: {
        error: 'Google account is not connected',
        code: 'gmail_account_not_connected',
        source: 'not_connected',
      },
    }
  }
  if (message.includes('No refresh token available') || message.includes('Token refresh failed: 401')) {
    return {
      status: 401,
      body: {
        error: 'Google OAuth token is not authorised for Gmail import',
        code: 'gmail_token_unauthorised',
        source: 'not_connected',
      },
    }
  }
  if (
    message.includes('Gmail threads.get failed: 401') ||
    message.includes('Gmail threads.get failed: 403') ||
    message.includes('Gmail messages.get failed: 401') ||
    message.includes('Gmail messages.get failed: 403')
  ) {
    return {
      status: 401,
      body: {
        error: 'Google OAuth token cannot access this Gmail item',
        code: 'gmail_item_unauthorised',
        source: 'not_connected',
      },
    }
  }
  return {
    status: 502,
    body: {
      error: 'Failed to fetch Gmail item',
      code: 'gmail_item_fetch_failed',
      source: 'gmail',
    },
  }
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
  if (!isImportSource(source)) {
    return NextResponse.json({
      error: 'Invalid email import source',
      code: 'invalid_import_source',
    }, { status: 400 })
  }

  if (source === 'gmail') {
    if (!body.threadId && !body.messageId) {
      return NextResponse.json({ error: 'threadId or messageId is required for live Gmail import' }, { status: 400 })
    }

    const accountResult = await resolveGoogleAccount(user.id, body.accountEmail)
    if (!accountResult.account) {
      return NextResponse.json(accountResult.body, { status: accountResult.status })
    }

    let sender: ParsedSender | null = null
    try {
      if (body.threadId) {
        const thread = await fetchFullThread(user.id, accountResult.account, body.threadId)
        sender = selectSender(thread, accountResult.account)
      } else if (body.messageId) {
        sender = await fetchMessageSender(user.id, accountResult.account, body.messageId)
      }
    } catch (error) {
      const mapped = mapGmailFetchError(error)
      return NextResponse.json(mapped.body, { status: mapped.status })
    }

    if (!sender) {
      return NextResponse.json({
        error: 'Gmail thread did not include a parseable sender',
        code: 'gmail_sender_not_found',
        source: 'gmail',
      }, { status: 422 })
    }

    const supabase = await createClient()

    const { data: existing, error: existingError } = await supabase
      .from('contacts')
      .select('*')
      .eq('founder_id', user.id)
      .eq('email', sender.email)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: 'Failed to check existing contact' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({
        contact: existing,
        created: false,
        source: 'gmail',
      })
    }

    const { firstName, lastName } = splitName(sender.name ?? undefined)
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        founder_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: sender.email,
        company: body.company?.trim() || null,
        status: 'lead',
        tags: ['gmail_import'],
        metadata: {
          source: 'gmail_import',
          importMode: 'live_gmail_thread',
          threadId: body.threadId ?? null,
          messageId: body.messageId ?? null,
          accountEmail: accountResult.account,
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
      source: 'gmail',
    }, { status: 201 })
  }

  if (source !== 'gmail_mock') {
    return NextResponse.json({
      error: 'Invalid email import source',
      code: 'invalid_import_source',
    }, { status: 400 })
  }

  const email = normaliseEmail(body.senderEmail)
  if (!email) return NextResponse.json({ error: 'senderEmail is required' }, { status: 400 })
  if (!email.endsWith('@unite-hub.test') && !email.includes('__pw_test__')) {
    return NextResponse.json({
      error: 'Mock Gmail import only accepts tagged non-deliverable test senders',
      code: 'unsafe_mock_sender',
    }, { status: 400 })
  }

  const supabase = await createClient()

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
