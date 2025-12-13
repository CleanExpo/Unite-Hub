import { NextRequest, NextResponse } from "next/server";
import { requireExecutionContext } from "@/lib/execution-context";

export function jsonError(status: number, error: string, details?: unknown) {
  return NextResponse.json(
    { success: false, error, ...(details !== undefined ? { details } : {}) },
    { status }
  );
}

export async function requireGuardianGtmAdmin(req: NextRequest) {
  const ctxResult = await requireExecutionContext(req, undefined, {
    requireWorkspace: true,
    allowWorkspaceFromHeader: true,
    allowWorkspaceFromBody: false,
    allowWorkspaceFromRouteParam: false,
    allowDefaultWorkspace: false,
  });

  if (!ctxResult.ok) {
return { ok: false as const, response: ctxResult.response };
}

  const { user, workspace, supabase } = ctxResult.ctx;
  const role = workspace?.role || "";

  if (role !== "owner" && role !== "admin") {
    return { ok: false as const, response: jsonError(403, "Admin access required") };
  }

  return {
    ok: true as const,
    ctx: {
      user,
      workspace: workspace!,
      supabase,
    },
  };
}

export function mapServiceError(error: unknown) {
  const message = String((error as any)?.message || error || "Unknown error");

  if (message === "Invalid tier") {
return jsonError(400, message);
}
  if (message === "Invalid notes") {
return jsonError(400, message);
}
  if (message.toLowerCase().includes("row-level security")) {
return jsonError(403, "Permission denied");
}
  if (message.toLowerCase().includes("permission denied")) {
return jsonError(403, "Permission denied");
}

  return jsonError(500, "Internal server error");
}

