import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getSandboxOperatorJobsClient, requestControlledLocalOperatorExecution } from '@/lib/operator-gateway/jobs'

export const dynamic = 'force-dynamic'

// POST — founder/session guarded controlled real-local foundation request.
// It validates local-only policy, updates sandbox status/event, and performs NO external dispatch.
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: unknown
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
        laneId: String(form.get('laneId') ?? ''),
        taskType: String(form.get('taskType') ?? ''),
        requestedCommand: String(form.get('requestedCommand') ?? ''),
        localOnly: form.get('localOnly') === 'true',
        externalActionRequested: form.get('externalActionRequested') === 'true',
        productionActionRequested: form.get('productionActionRequested') === 'true',
        apiKeyRequested: form.get('apiKeyRequested') === 'true',
        browserAutomationRequested: form.get('browserAutomationRequested') === 'true',
        computerUseRequested: form.get('computerUseRequested') === 'true',
      }
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        source: 'validation_failed',
        error: 'Invalid request body.',
        reasons: ['request body must be JSON or form data'],
        localExecutionFoundation: 'policy_refused',
        liveExecution: false,
        externalExecutionEnabled: false,
        productionConnected: false,
        dispatchPerformed: false,
        eventAppended: false,
        jobStatusUpdated: false,
      },
      { status: 400 },
    )
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      {
        ok: false,
        source: 'validation_failed',
        error: 'Invalid request body.',
        reasons: ['request body must be a JSON object or form data'],
        localExecutionFoundation: 'policy_refused',
        liveExecution: false,
        externalExecutionEnabled: false,
        productionConnected: false,
        dispatchPerformed: false,
        eventAppended: false,
        jobStatusUpdated: false,
      },
      { status: 400 },
    )
  }

  const requestBody = body as Record<string, unknown>

  const result = await requestControlledLocalOperatorExecution({
    founderId: user.id,
    client: getSandboxOperatorJobsClient(),
    jobId: typeof requestBody.jobId === 'string' ? requestBody.jobId : undefined,
    laneId: typeof requestBody.laneId === 'string' ? requestBody.laneId : undefined,
    taskType: typeof requestBody.taskType === 'string' ? requestBody.taskType : undefined,
    localOnly: requestBody.localOnly === true,
    requestedCommand: typeof requestBody.requestedCommand === 'string' ? requestBody.requestedCommand : undefined,
    externalActionRequested: requestBody.externalActionRequested === true,
    productionActionRequested: requestBody.productionActionRequested === true,
    apiKeyRequested: requestBody.apiKeyRequested === true,
    browserAutomationRequested: requestBody.browserAutomationRequested === true,
    computerUseRequested: requestBody.computerUseRequested === true,
  })

  if (formSubmission && result.ok) {
    return NextResponse.redirect(new URL('/founder/command-centre/operator-gateway', request.url), { status: 303 })
  }

  if (!result.ok && result.status !== 400 && result.status !== 404) {
    return NextResponse.json(
      {
        ok: false,
        source: result.source,
        error: 'Controlled real-local execution request is currently unavailable.',
        localExecutionFoundation: 'sandbox_rejected',
        liveExecution: false,
        externalExecutionEnabled: false,
        productionConnected: false,
        dispatchPerformed: false,
        eventAppended: false,
        jobStatusUpdated: false,
      },
      { status: result.status },
    )
  }

  return NextResponse.json(result, { status: result.status })
}
