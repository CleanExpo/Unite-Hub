import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { fetchInvoices, isXeroConfigured } from '@/lib/integrations/xero/client'

export const dynamic = 'force-dynamic'

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
    const message = err instanceof Error ? err.message : 'Unknown error'
    // No tokens = business not connected to Xero yet (not a server error)
    if (message.includes('No Xero tokens found')) {
      return NextResponse.json(
        { error: `Xero not connected for this business. Connect via Settings → Xero.` },
        { status: 503 }
      )
    }
    console.error(`[xero/invoices] ${message}`)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
