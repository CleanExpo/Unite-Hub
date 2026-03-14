import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { fetchIssue, teamKeyToBusiness } from '@/lib/integrations/linear'
import { BUSINESSES } from '@/lib/businesses'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id } = await params

  try {
    const issue = await fetchIssue(id)
    const businessKey = teamKeyToBusiness(issue.team.key)
    const business = BUSINESSES.find((b) => b.key === businessKey)

    return NextResponse.json({
      ...issue,
      businessKey,
      businessColor: business?.color ?? '#6b7280',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch issue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
