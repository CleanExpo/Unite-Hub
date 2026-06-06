import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import {
  createSandboxOperatorJob,
  getOperatorJobsView,
  getSandboxOperatorJobsClient,
} from '@/lib/operator-gateway/jobs'

export const dynamic = 'force-dynamic'

// GET — founder/session guarded, sandbox SELECT only. No writes, no execution.
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const view = await getOperatorJobsView({ founderId: user.id, client: getSandboxOperatorJobsClient() })
  return NextResponse.json(view)
}

// POST — founder/session guarded, sandbox-only job creation.
// Persists planned operator_jobs rows and a matching created event; never dispatches or executes jobs.
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let proposal: unknown
  let formSubmission = false
  try {
    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType || contentType.includes('application/json') || contentType.includes('text/plain')) {
      proposal = await request.json()
    } else {
      formSubmission = true
      const form = await request.formData()
      proposal = {
        laneId: String(form.get('laneId') ?? ''),
        title: String(form.get('title') ?? ''),
        taskType: String(form.get('taskType') ?? ''),
        externalActionRequested: form.get('externalActionRequested') === 'true',
        productionActionRequested: form.get('productionActionRequested') === 'true',
        apiKeyRequested: form.get('apiKeyRequested') === 'true',
      }
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        source: 'validation_failed',
        error: 'Invalid request body.',
        reasons: ['request body must be JSON or form data'],
        liveExecution: false,
        externalExecutionEnabled: false,
        productionConnected: false,
        jobCreation: 'sandbox_rejected',
      },
      { status: 400 },
    )
  }

  const result = await createSandboxOperatorJob({
    founderId: user.id,
    client: getSandboxOperatorJobsClient(),
    proposal: proposal as never,
  })

  if (formSubmission && result.ok) {
    return NextResponse.redirect(new URL('/founder/command-centre/operator-gateway', request.url), { status: 303 })
  }

  if (!result.ok && result.status !== 400) {
    return NextResponse.json(
      {
        ok: false,
        source: 'sandbox_insert_failed',
        error: 'Sandbox job creation is currently unavailable.',
        liveExecution: false,
        externalExecutionEnabled: false,
        productionConnected: false,
        jobCreation: 'sandbox_rejected',
      },
      { status: result.status },
    )
  }

  return NextResponse.json(result, { status: result.status })
}
