import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createServiceClient: vi.fn(),
  fetchFullThread: vi.fn(),
  getAccessTokenForEmail: vi.fn(),
  getConnectedGoogleAccounts: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  getUser: mocks.getUser,
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/integrations/google', () => ({
  fetchFullThread: mocks.fetchFullThread,
  getAccessTokenForEmail: mocks.getAccessTokenForEmail,
  getConnectedGoogleAccounts: mocks.getConnectedGoogleAccounts,
}))

import { POST, parseEmailSender } from '../route'

function request(body: unknown) {
  return new Request('https://app.test/api/email/contacts/import', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function contactsClient(options: {
  existing?: unknown
  existingError?: unknown
  inserted?: unknown
  insertError?: unknown
}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: options.existing ?? null,
    error: options.existingError ?? null,
  })
  const existingEqEmail = vi.fn(() => ({ maybeSingle }))
  const existingEqFounder = vi.fn(() => ({ eq: existingEqEmail }))
  const selectExisting = vi.fn(() => ({ eq: existingEqFounder }))

  const single = vi.fn().mockResolvedValue({
    data: options.inserted ?? null,
    error: options.insertError ?? null,
  })
  const selectInserted = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select: selectInserted }))
  const from = vi.fn(() => ({ select: selectExisting, insert }))

  return {
    client: { from },
    calls: {
      from,
      selectExisting,
      existingEqFounder,
      existingEqEmail,
      maybeSingle,
      insert,
      selectInserted,
      single,
    },
  }
}

describe('POST /api/email/contacts/import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUser.mockResolvedValue({ id: 'founder-123' })
  })

  it('returns 401 before authentication', async () => {
    mocks.getUser.mockResolvedValue(null)

    const res = await POST(request({ source: 'gmail', threadId: 'thread-1' }))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorised')
  })

  it('keeps live import honest when no Google account is connected', async () => {
    mocks.getConnectedGoogleAccounts.mockResolvedValue([])

    const res = await POST(request({ source: 'gmail', threadId: 'thread-1' }))
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body).toMatchObject({
      code: 'gmail_account_not_connected',
      source: 'not_connected',
    })
    expect(mocks.getConnectedGoogleAccounts).toHaveBeenCalledWith('founder-123')
    expect(mocks.fetchFullThread).not.toHaveBeenCalled()
    expect(mocks.createServiceClient).not.toHaveBeenCalled()
  })

  it('imports a live Gmail sender into a founder-scoped contact', async () => {
    mocks.fetchFullThread.mockResolvedValue({
      id: 'thread-1',
      subject: 'Hello',
      messages: [
        {
          id: 'message-1',
          from: '"Alice Example" <Alice@Example.com>',
          to: 'founder@example.com',
          date: 'Mon, 1 Jun 2026 10:00:00 +1000',
          bodyHtml: null,
          bodyText: 'Hi',
          attachments: [],
          unread: false,
          labelIds: [],
        },
      ],
    })
    const db = contactsClient({
      inserted: {
        id: 'contact-1',
        founder_id: 'founder-123',
        email: 'alice@example.com',
        first_name: 'Alice',
        last_name: 'Example',
      },
    })
    mocks.createServiceClient.mockReturnValue(db.client)

    const res = await POST(request({
      source: 'gmail',
      threadId: 'thread-1',
      accountEmail: 'founder@example.com',
      company: 'Example Co',
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body).toMatchObject({
      created: true,
      source: 'gmail',
      contact: {
        id: 'contact-1',
        founder_id: 'founder-123',
        email: 'alice@example.com',
      },
    })
    expect(mocks.fetchFullThread).toHaveBeenCalledWith('founder-123', 'founder@example.com', 'thread-1')
    expect(db.calls.from).toHaveBeenCalledWith('contacts')
    expect(db.calls.existingEqFounder).toHaveBeenCalledWith('founder_id', 'founder-123')
    expect(db.calls.existingEqEmail).toHaveBeenCalledWith('email', 'alice@example.com')
    expect(db.calls.insert).toHaveBeenCalledWith(expect.objectContaining({
      founder_id: 'founder-123',
      email: 'alice@example.com',
      first_name: 'Alice',
      last_name: 'Example',
      company: 'Example Co',
      tags: ['gmail_import'],
      metadata: expect.objectContaining({
        source: 'gmail_import',
        importMode: 'live_gmail_thread',
        threadId: 'thread-1',
        accountEmail: 'founder@example.com',
      }),
    }))
  })

  it('maps unauthorised Gmail access to an honest 401', async () => {
    mocks.fetchFullThread.mockRejectedValue(new Error('Gmail threads.get failed: 401'))

    const res = await POST(request({
      source: 'gmail',
      threadId: 'thread-1',
      accountEmail: 'founder@example.com',
    }))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body).toMatchObject({
      code: 'gmail_item_unauthorised',
      source: 'not_connected',
    })
  })

  it('can import from a live Gmail message identifier', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        payload: {
          headers: [
            { name: 'From', value: 'Bob Sender <bob@example.com>' },
          ],
        },
      }),
    } as Response)
    mocks.getAccessTokenForEmail.mockResolvedValue('access-token')
    const db = contactsClient({
      inserted: {
        id: 'contact-2',
        founder_id: 'founder-123',
        email: 'bob@example.com',
      },
    })
    mocks.createServiceClient.mockReturnValue(db.client)

    const res = await POST(request({
      source: 'gmail',
      messageId: 'message-1',
      accountEmail: 'founder@example.com',
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body).toMatchObject({
      created: true,
      source: 'gmail',
      contact: { id: 'contact-2', email: 'bob@example.com' },
    })
    expect(mocks.getAccessTokenForEmail).toHaveBeenCalledWith('founder-123', 'founder@example.com')
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/message-1?format=metadata&metadataHeaders=From',
      { headers: { Authorization: 'Bearer access-token' } }
    )
    expect(db.calls.insert).toHaveBeenCalledWith(expect.objectContaining({
      founder_id: 'founder-123',
      email: 'bob@example.com',
      metadata: expect.objectContaining({
        threadId: null,
        messageId: 'message-1',
        accountEmail: 'founder@example.com',
      }),
    }))

    fetchSpy.mockRestore()
  })
})

describe('parseEmailSender', () => {
  it('parses Gmail From headers with display names', () => {
    expect(parseEmailSender('"Alice Example" <Alice@Example.com>')).toEqual({
      name: 'Alice Example',
      email: 'alice@example.com',
    })
  })

  it('parses bare email senders', () => {
    expect(parseEmailSender('alice@example.com')).toEqual({
      name: null,
      email: 'alice@example.com',
    })
  })
})
