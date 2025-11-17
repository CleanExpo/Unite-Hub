import { NextRequest, NextResponse } from "next/server";
import {
  getOutlookAccounts,
  syncAllOutlookAccounts,
  toggleOutlookAccount,
  setPrimaryOutlookAccount,
  labelOutlookAccount,
} from "@/lib/services/outlook-sync";
import { validateUserAuth } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * GET - List all Outlook accounts for the organization
 */
export async function GET(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(req);

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    // Verify orgId matches user's organization
    if (orgId !== user.orgId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const accounts = await getOutlookAccounts(orgId);

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Get Outlook accounts error:", error);
    return NextResponse.json(
      { error: "Failed to get Outlook accounts" },
      { status: 500 }
    );
  }
}

/**
 * POST - Manage Outlook accounts (sync all, toggle, set primary, label)
 */
export async function POST(req: NextRequest) {
  try {
    // Validate user authentication
    const user = await validateUserAuth(req);

    const { action, orgId, integrationId, isActive, label } = await req.json();

    if (!action || !orgId) {
      return NextResponse.json(
        { error: "Action and orgId required" },
        { status: 400 }
      );
    }

    // Verify orgId matches user's organization
    if (orgId !== user.orgId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    switch (action) {
      case "sync_all": {
        const result = await syncAllOutlookAccounts(orgId);
        return NextResponse.json(result);
      }

      case "toggle": {
        if (!integrationId || typeof isActive !== "boolean") {
          return NextResponse.json(
            { error: "integrationId and isActive required" },
            { status: 400 }
          );
        }
        const result = await toggleOutlookAccount(integrationId, isActive);
        return NextResponse.json(result);
      }

      case "set_primary": {
        if (!integrationId) {
          return NextResponse.json(
            { error: "integrationId required" },
            { status: 400 }
          );
        }
        const result = await setPrimaryOutlookAccount(orgId, integrationId);
        return NextResponse.json(result);
      }

      case "label": {
        if (!integrationId || !label) {
          return NextResponse.json(
            { error: "integrationId and label required" },
            { status: 400 }
          );
        }
        const result = await labelOutlookAccount(integrationId, label);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Manage Outlook accounts error:", error);
    return NextResponse.json(
      { error: "Failed to manage Outlook accounts" },
      { status: 500 }
    );
  }
}
