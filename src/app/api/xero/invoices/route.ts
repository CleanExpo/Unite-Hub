import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import {
  fetchInvoices,
  createInvoice,
  isXeroConfigured,
  type XeroCreateInvoiceInput,
} from '@/lib/integrations/xero/client'

export const dynamic = 'force-dynamic'

function xeroError(err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : 'Unknown error'
  if (message.includes('No Xero tokens found')) {
    return NextResponse.json(
      { error: 'Xero not connected for this business. Connect via Settings → Xero.' },
      { status: 503 }
    )
  }
  console.error(`[xero/invoices]`, message)
  return NextResponse.json({ error: 'Xero request failed' }, { status: 500 })
}

// ── GET — list invoices ───────────────────────────────────────────────────────

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isXeroConfigured()) return NextResponse.json({ error: 'Xero not configured' }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const business = searchParams.get('business') ?? 'dr'
  const type = searchParams.get('type') as 'ACCREC' | 'ACCPAY' | undefined

  try {
    const result = await fetchInvoices(user.id, business, { type })
    return NextResponse.json(result)
  } catch (err) {
    return xeroError(err)
  }
}

// ── POST — create draft invoice ───────────────────────────────────────────────

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isXeroConfigured()) return NextResponse.json({ error: 'Xero not configured' }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const business = searchParams.get('business') ?? 'dr'

  let input: XeroCreateInvoiceInput
  try {
    input = await request.json() as XeroCreateInvoiceInput
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!input.contactName?.trim()) {
    return NextResponse.json({ error: 'contactName is required' }, { status: 400 })
  }
  if (!input.dueDate) {
    return NextResponse.json({ error: 'dueDate is required' }, { status: 400 })
  }
  if (!input.lineItems?.length) {
    return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })
  }

  try {
    const invoice = await createInvoice(user.id, business, input)
    return NextResponse.json({ invoice }, { status: 201 })
  } catch (err) {
    return xeroError(err)
  }
}
