import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getCommandCentreOperatorSurfaceView } from '@/lib/operator-gateway/command-centre'

export const dynamic = 'force-dynamic'

// GET — Unite-Group Nexus Command Centre operator execution surface.
// Founder/session guarded, read-only, DB-free. Returns lane visibility, safe disabled
// job-submission state, blocked gates, daily ops pointers, and Senior PM queue.
// No API keys, no web-session scraping, no external execution, no DB writes.
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  return NextResponse.json(getCommandCentreOperatorSurfaceView())
}
