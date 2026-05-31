import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ getUser: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))
vi.mock('@/lib/integrations/sendgrid', () => ({ sendCampaignEmail: vi.fn() }))

import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendCampaignEmail } from '@/lib/integrations/sendgrid'
import { makeServiceChain, everyUpdateFounderScoped } from '@/test/founder-scope-chain'
import { POST } from '../route'

function ctx() {
  return { params: Promise.resolve({ id: 'ec-1' }) }
}
function req() {
  return new Request('http://localhost/send', { method: 'POST' })
}
function guard(recipients: Array<{ email: string }>) {
  return {
    data: {
      id: 'ec-1',
      status: 'draft',
      recipient_list: recipients,
      business_key: 'synthex',
      subject: 's',
      body_html: '<p>x</p>',
      body_text: null,
      categories: null,
    },
    error: null,
  }
}

describe('POST /api/email/campaigns/[id]/send', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
  })

  it('founder-scopes the sending + sent UPDATE chains on the success path', async () => {
    const chain = makeServiceChain([guard([{ email: 'a@b.com' }])])
    vi.mocked(createServiceClient).mockReturnValue(chain as never)
    vi.mocked(sendCampaignEmail).mockResolvedValue({ sent: 1, failed: 0 } as never)

    const res = await POST(req(), ctx())

    expect(res.status).toBe(200)
    expect(everyUpdateFounderScoped(chain, 'user-123')).toBe(true)
  })

  it('founder-scopes the revert UPDATE on the catch path', async () => {
    const chain = makeServiceChain([guard([{ email: 'a@b.com' }])])
    vi.mocked(createServiceClient).mockReturnValue(chain as never)
    vi.mocked(sendCampaignEmail).mockRejectedValue(new Error('sendgrid boom'))

    const res = await POST(req(), ctx())

    expect(res.status).toBe(500)
    expect(everyUpdateFounderScoped(chain, 'user-123')).toBe(true)
  })

  it('founder-scopes the revert UPDATE on the empty-recipients path', async () => {
    const chain = makeServiceChain([guard([])])
    vi.mocked(createServiceClient).mockReturnValue(chain as never)

    const res = await POST(req(), ctx())

    expect(res.status).toBe(400)
    expect(everyUpdateFounderScoped(chain, 'user-123')).toBe(true)
  })
})
