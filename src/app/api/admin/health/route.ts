import { NextRequest, NextResponse } from "next/server"
import { requireExecutionContext } from "@/lib/execution-context"
import { hasPermission } from "@/lib/core/permissionService"

// Health service functions - temporarily stubbed
const getHealthSummary = async (workspaceId: string) => ({ status: 'ok', timestamp: new Date() })
const getLatestResults = async (workspaceId: string) => ({ checks: [] })
const runTenantChecks = async (workspaceId?: string) => ({ checks: [] })

/**
 * GET /api/admin/health
 *
 * Supported actions:
 * - action=checks   → auth required, NO workspace
 * - action=summary  → auth + workspace required
 * - action=results  → auth + workspace required
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")

  // Only "checks" is allowed without workspace
  const requireWorkspace = action !== "checks"

  const ctxResult = await requireExecutionContext(req, undefined, {
    requireWorkspace,
    allowWorkspaceFromHeader: true,
  })

  if (!ctxResult.ok) {
return ctxResult.response
}

  const { user, workspace } = ctxResult.ctx

  // ---- NO-WORKSPACE CHECKS ----
  if (action === "checks") {
    const results = await runTenantChecks(undefined)
    return NextResponse.json({ success: true, results })
  }

  // ---- WORKSPACE-REQUIRED ACTIONS ----
  if (!workspace) {
    return NextResponse.json(
      { success: false, error: "workspace required" },
      { status: 400 }
    )
  }

  const workspaceId = workspace.id

  const canView = await hasPermission(
    user.id,
    workspaceId,
    "admin",
    "read"
  )

  if (!canView) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    )
  }

  if (action === "results") {
    const results = await getLatestResults(workspaceId)
    return NextResponse.json({ success: true, results })
  }

  // default = summary
  const summary = await getHealthSummary(workspaceId)
  return NextResponse.json({ success: true, summary })
}

/**
 * POST /api/admin/health
 *
 * Always requires:
 * - authenticated user
 * - workspace (via x-workspace-id)
 */
export async function POST(req: NextRequest) {
  const ctxResult = await requireExecutionContext(req, undefined, {
    requireWorkspace: true,
    allowWorkspaceFromHeader: true,
  })

  if (!ctxResult.ok) {
return ctxResult.response
}

  const { user, workspace } = ctxResult.ctx

  const workspaceId = workspace.id

  const canWrite = await hasPermission(
    user.id,
    workspaceId,
    "admin",
    "write"
  )

  if (!canWrite) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    )
  }

  const results = await runTenantChecks(workspaceId)
  const summary = await getHealthSummary(workspaceId)

  return NextResponse.json({
    success: true,
    results,
    summary,
  })
}
