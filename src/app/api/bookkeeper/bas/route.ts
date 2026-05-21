// src/app/api/bookkeeper/bas/route.ts
import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import { generateBASPeriods } from '@/lib/bookkeeper/bas-calculator'
import type { BASResponse, BASQuarterSummary } from '@/lib/bookkeeper/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  const now = new Date()
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  const periods = generateBASPeriods(twelveMonthsAgo, now)

  const quarters: BASQuarterSummary[] = []

  for (const period of periods) {
    const startDate = period.startDate.toISOString().slice(0, 10)
    const endDate = period.endDate.toISOString().slice(0, 10)

    const { data: txns } = await supabase
      .from('bookkeeper_transactions')
      .select('amount_cents, gst_amount_cents, tax_code')
      .eq('founder_id', user.id)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)

    let label1A = 0, label1B = 0, label7 = 0, label9 = 0
    const items = txns ?? []

    for (const t of items) {
      const absAmount = Math.abs(Number(t.amount_cents))
      const gst = Math.abs(Number(t.gst_amount_cents))

      switch (t.tax_code) {
        case 'OUTPUT':
          label1A += absAmount
          label1B += gst
          break
        case 'EXEMPTOUTPUT':
        case 'EXEMPTEXPORT':
          label1A += absAmount
          break
        case 'INPUT':
        case 'GSTONIMPORTS':
          label7 += absAmount
          label9 += gst
          break
        case 'EXEMPTINPUT':
        case 'INPUTTAXED':
          label7 += absAmount
          break
      }
    }

    quarters.push({
      label: period.label,
      startDate,
      endDate,
      label1A_totalSalesCents: label1A,
      label1B_gstOnSalesCents: label1B,
      label7_totalPurchasesCents: label7,
      label9_gstOnPurchasesCents: label9,
      label11_gstPayableCents: label1B - label9,
      transactionCount: items.length,
    })
  }

  const response: BASResponse = { quarters }
  return NextResponse.json(response)
}
