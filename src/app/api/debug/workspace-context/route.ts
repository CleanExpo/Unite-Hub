/**
 * Debug: Workspace Context Resolution
 *
 * Purpose:
 * - Provides hard execution proof that auth + workspace context resolution works
 * - Returns observable JSON containing { userId, orgId, workspaceId }
 *
 * Global build enforcement:
 * - No placeholder output
 * - Fail loudly if required inputs are missing
 *
 * Usage:
 * - GET /api/debug/workspace-context?workspaceId=<uuid>
 * - Include Authorization: Bearer <supabase_access_token>
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspaceIdFromRequest,
  validateUserAndWorkspace,
  WorkspaceErrors,
} from "@/lib/workspace-validation";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceIdFromRequest(req);

    // Validate user + validate workspace belongs to user org
    const ctx = await validateUserAndWorkspace(req, workspaceId);

    // Hard execution proof payload
    return NextResponse.json(
      {
        ok: true,
        resolved: {
          userId: ctx.userId,
          orgId: ctx.orgId,
          workspaceId: ctx.workspaceId,
        },
        evidence: {
          caller: "src/app/api/debug/workspace-context/route.ts",
          authSource: req.headers.get("authorization") ? "bearer" : "cookie",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Normalize common cases
    if (message.toLowerCase().includes("workspaceid is required")) {
      return NextResponse.json(
        { ok: false, error: WorkspaceErrors.BAD_REQUEST },
        { status: 400 }
      );
    }

    if (message.toLowerCase().includes("unauthorized")) {
      return NextResponse.json(
        { ok: false, error: WorkspaceErrors.UNAUTHORIZED, details: message },
        { status: 401 }
      );
    }

    if (message.toLowerCase().includes("forbidden")) {
      return NextResponse.json(
        { ok: false, error: WorkspaceErrors.FORBIDDEN, details: message },
        { status: 403 }
      );
    }

    // Fail loudly for unexpected failures
    return NextResponse.json(
      {
        ok: false,
        error: {
          status: 500,
          error: "Internal Server Error",
          message,
        },
      },
      { status: 500 }
    );
  }
}
