import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { dryRunSandboxOperatorJob, getSandboxOperatorJobsClient } from '@/lib/operator-gateway/jobs'

export const dynamic = 'force-dynamic'

// POST — founder/session guarded, sandbox dry-run only. No external execution, no live runner, no production DB.
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: Record<string, unknown>
  let formSubmission = false
  try {
    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType || contentType.includes('application/json') || contentType.includes('text/plain')) {
      body = await request.json()
    } else {
      formSubmission = true
      const form = await request.formData()
      body = {
        jobId: String(form.get('jobId') ?? ''),
        dryRunReason: String(form.get('dryRunReason') ?? ''),
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
        dryRunExecution: 'sandbox_rejected',
        liveExecution: false,
        externalExecutionEnabled: false,
        productionConnected: false,
        eventAppended: false,
        jobStatusUpdated: false,
      },
      { status: 400 },
    )
  }

  const result = await dryRunSandboxOperatorJob({
    founderId: user.id,
    client: getSandboxOperatorJobsClient(),
    jobId: typeof body.jobId === 'string' ? body.jobId : undefined,
    dryRunReason: typeof body.dryRunReason === 'string' ? body.dryRunReason : undefined,
    externalActionRequested: body.externalActionRequested === true,
    productionActionRequested: body.productionActionRequested === true,
    apiKeyRequested: body.apiKeyRequested === true,
  })

  if (formSubmission && result.ok) {
    return NextResponse.redirect(new URL('/founder/command-centre/operator-gateway', request.url), { status: 303 })
  }

  if (!result.ok && result.status !== 400 && result.status !== 404) {
    return NextResponse.json(
      {
        ok: false,
        source: result.source,
        error: 'Sandbox dry-run execution is currently unavailable.',
        dryRunExecution: 'sandbox_rejected',
        liveExecution: false,
        externalExecutionEnabled: false,
        productionConnected: false,
        eventAppended: false,
        jobStatusUpdated: false,
      },
      { status: result.status },
    )
  }

  return NextResponse.json(result, { status: result.status })
}
