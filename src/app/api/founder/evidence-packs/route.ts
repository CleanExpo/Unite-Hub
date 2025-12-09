/**
 * /api/founder/evidence-packs
 * Evidence Pack Builder API (Phase E32)
 * GET: List packs, pack items, or get summary
 * POST: Create pack, add item, update status
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { hasPermission } from "@/lib/core/permissionService";
import * as evidencePackService from "@/lib/founder/evidencePackService";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");
    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    if (!action || action === "list") {
      const status = searchParams.get("status") as evidencePackService.EvidencePackStatus | null;
      const purpose = searchParams.get("purpose");
      const packs = await evidencePackService.listEvidencePacks(workspaceId, status || undefined, purpose || undefined);
      return NextResponse.json({ packs });
    }

    if (action === "get-summary") {
      const packId = searchParams.get("packId");
      if (!packId) return NextResponse.json({ error: "packId required" }, { status: 400 });
      const summary = await evidencePackService.getPackSummary(packId);
      return NextResponse.json({ summary });
    }

    if (action === "list-items") {
      const packId = searchParams.get("packId");
      if (!packId) return NextResponse.json({ error: "packId required" }, { status: 400 });
      const items = await evidencePackService.listPackItems(packId);
      return NextResponse.json({ items });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API] /founder/evidence-packs GET error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, workspaceId } = body;
    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    if (action === "create-pack") {
      const { name, description, purpose, periodStart, periodEnd, metadata } = body;
      if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
      const packId = await evidencePackService.createEvidencePack({
        tenantId: workspaceId, name, description, purpose, createdBy: user.id, periodStart, periodEnd, metadata,
      });
      return NextResponse.json({ packId });
    }

    if (action === "add-item") {
      const { packId, itemType, itemId, itemTitle, itemSummary, itemData, attachedFileUrl, itemOrder } = body;
      if (!packId || !itemType || !itemTitle) {
        return NextResponse.json({ error: "packId, itemType, and itemTitle required" }, { status: 400 });
      }
      const itemId_ = await evidencePackService.addPackItem({
        packId, itemType, itemId, itemTitle, itemSummary, itemData, attachedFileUrl, itemOrder,
      });
      return NextResponse.json({ itemId: itemId_ });
    }

    if (action === "update-status") {
      const { packId, status, reviewedBy, exportFormat, exportUrl } = body;
      if (!packId || !status) return NextResponse.json({ error: "packId and status required" }, { status: 400 });
      await evidencePackService.updatePackStatus(packId, status, reviewedBy, exportFormat, exportUrl);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API] /founder/evidence-packs POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
