// src/app/api/xero/invoices/[id]/approve/route.ts
// POST: Approve a draft invoice — moves it from DRAFT → AUTHORISED in Xero.
// Query param: ?business=dr (required — determines which Xero tenant)

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { updateInvoiceStatus, isXeroConfigured } from '@/lib/integrations/xero/client'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isXeroConfigured()) return NextResponse.json({ error: 'Xero not configured' }, { status: 503 })

  const { id: invoiceId } = await params
  const { searchParams } = new URL(request.url)
  const business = searchParams.get('business') ?? 'dr'

  try {
    const invoice = await updateInvoiceStatus(user.id, business, invoiceId, 'AUTHORISED')
    return NextResponse.json({ invoice })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('No Xero tokens found')) {
      return NextResponse.json({ error: 'Xero not connected for this business.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Failed to approve invoice' }, { status: 500 })
  }
}
