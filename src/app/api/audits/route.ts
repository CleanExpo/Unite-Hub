/**
 * Website Audits API Route
 * Phase 15-17 New Feature
 *
 * Endpoints:
 * - GET: List audits for workspace
 * - POST: Create new audit
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, authErrorResponse } from "@/lib/auth/middleware";
import {
  createAudit,
  listAudits,
  AuditType,
} from "@/lib/audit/website-audit";

export async function GET(req: NextRequest) {
  // Authenticate request
  const auth = await authenticateRequest(req, { requireWorkspace: true });
  if (!auth.success) {
    return authErrorResponse(auth);
  }

  try {
    const limit = req.nextUrl.searchParams.get("limit");
    const status = req.nextUrl.searchParams.get("status");

    const audits = await listAudits(auth.workspaceId!, {
      limit: limit ? parseInt(limit, 10) : undefined,
      status: status || undefined,
    });

    return NextResponse.json({
      success: true,
      audits,
      count: audits.length,
    });
  } catch (error) {
    console.error("List audits error:", error);
    return NextResponse.json(
      { error: "Failed to list audits" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Authenticate request
  const auth = await authenticateRequest(req, { requireWorkspace: true });
  if (!auth.success) {
    return authErrorResponse(auth);
  }

  try {
    const body = await req.json();
    const { url, auditTypes, depth, includeScreenshots } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Validate audit types
    const validTypes: AuditType[] = ["seo", "technical", "geo", "content", "full"];
    const types: AuditType[] = auditTypes || ["seo", "technical"];

    for (const type of types) {
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid audit type: ${type}` },
          { status: 400 }
        );
      }
    }

    // Create audit
    const audit = await createAudit({
      url,
      workspaceId: auth.workspaceId!,
      auditTypes: types,
      depth: depth || 10,
      includeScreenshots: includeScreenshots || false,
    });

    return NextResponse.json({
      success: true,
      audit,
      message: "Audit created successfully. Processing will begin shortly.",
    });
  } catch (error) {
    console.error("Create audit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create audit" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
