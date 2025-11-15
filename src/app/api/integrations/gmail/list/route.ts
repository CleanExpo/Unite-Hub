import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/integrations/gmail/list?workspaceId=xxx
 * List all Gmail integrations for a workspace
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Missing workspaceId" },
        { status: 400 }
      );
    }

    const integrations = await db.emailIntegrations.getByWorkspace(workspaceId);

    // Remove sensitive data before sending to client
    const sanitizedIntegrations = integrations.map((integration) => ({
      id: integration.id,
      email_address: integration.email_address,
      account_label: integration.account_label,
      provider: integration.provider,
      is_primary: integration.is_primary,
      sync_enabled: integration.sync_enabled,
      is_active: integration.is_active,
      last_sync_at: integration.last_sync_at,
      sync_error: integration.sync_error,
      created_at: integration.created_at,
    }));

    return NextResponse.json({ integrations: sanitizedIntegrations });
  } catch (error) {
    console.error("List integrations error:", error);
    return NextResponse.json(
      { error: "Failed to list integrations" },
      { status: 500 }
    );
  }
}
