// src/app/api/linear/kpi/route.ts
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { fetchIssueCountByBusiness } from '@/lib/integrations/linear'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!process.env.LINEAR_API_KEY) {
    return NextResponse.json({ activeCount: 0, configured: false })
  }

  const { searchParams } = new URL(request.url)
  const business = searchParams.get('business') ?? ''

  try {
    const counts = await fetchIssueCountByBusiness()
    return NextResponse.json({ activeCount: counts[business] ?? 0, configured: true })
  } catch {
    return NextResponse.json({ activeCount: 0, configured: false })
  }
}
