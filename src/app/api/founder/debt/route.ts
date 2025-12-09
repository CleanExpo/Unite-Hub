/**
 * E34: Operational Debt API
 * GET: List operational debt items
 * POST: Create new debt item or add update
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listOperationalDebt,
  createOperationalDebt,
  updateDebtStatus,
  addDebtUpdate,
  getDebtSummary,
  getDebtDetails,
} from "@/src/lib/founder/debtService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");
    const debtId = searchParams.get("debtId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // Get debt summary
    if (action === "summary") {
      const summary = await getDebtSummary(workspaceId);
      return NextResponse.json({ summary });
    }

    // Get single debt with details
    if (action === "details" && debtId) {
      const details = await getDebtDetails(debtId);
      return NextResponse.json(details);
    }

    // List operational debt
    const status = searchParams.get("status") as any;
    const severity = searchParams.get("severity") as any;
    const category = searchParams.get("category") as any;

    const items = await listOperationalDebt(workspaceId, {
      status,
      severity,
      category,
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[debt] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    // Update debt status
    if (action === "update-status") {
      const { debtId, status } = body;
      if (!debtId || !status) {
        return NextResponse.json(
          { error: "debtId and status required" },
          { status: 400 }
        );
      }
      await updateDebtStatus(debtId, status);
      return NextResponse.json({ success: true });
    }

    // Add debt update
    if (action === "add-update") {
      const { debtId, message, author } = body;
      if (!debtId || !message) {
        return NextResponse.json(
          { error: "debtId and message required" },
          { status: 400 }
        );
      }
      const updateId = await addDebtUpdate(debtId, message, author);
      return NextResponse.json({ updateId });
    }

    // Create new debt item
    const { title, category, severity, description, owner } = body;
    if (!title || !category || !severity) {
      return NextResponse.json(
        { error: "title, category, and severity required" },
        { status: 400 }
      );
    }

    const debtId = await createOperationalDebt({
      tenantId: workspaceId,
      title,
      category,
      severity,
      description,
      owner,
    });

    return NextResponse.json({ debtId });
  } catch (error: any) {
    console.error("[debt] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
