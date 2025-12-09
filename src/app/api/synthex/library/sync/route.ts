/**
 * Synthex Template Sync API
 * GET - Get synced versions
 * POST - Sync template to channels
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getTemplateSyncs,
  getSyncGroup,
  syncTemplateToChannels,
  updateSyncStatus,
  updateSyncContent,
  getSyncStats,
  getChannelAnalytics,
  Channel,
} from "@/lib/synthex/crossChannelService";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const templateId = searchParams.get("templateId");
    const syncGroupId = searchParams.get("syncGroupId");
    const includeStats = searchParams.get("includeStats") === "true";
    const includeAnalytics = searchParams.get("includeAnalytics") === "true";

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Get stats only
    if (includeStats && !templateId && !syncGroupId) {
      const stats = await getSyncStats(tenantId);
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Get analytics only
    if (includeAnalytics) {
      const analytics = await getChannelAnalytics(tenantId, {
        syncGroupId: syncGroupId || undefined,
        channel: searchParams.get("channel") as Channel | undefined,
      });
      return NextResponse.json({
        success: true,
        analytics,
      });
    }

    // Get syncs for a sync group
    if (syncGroupId) {
      const syncs = await getSyncGroup(syncGroupId);
      return NextResponse.json({
        success: true,
        syncs,
      });
    }

    // Get syncs for a template
    if (templateId) {
      const syncs = await getTemplateSyncs(templateId);
      return NextResponse.json({
        success: true,
        syncs,
      });
    }

    return NextResponse.json(
      { error: "templateId or syncGroupId is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Sync API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get syncs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, templateId, sourceChannel, targetChannels, action, syncId, ...options } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Update sync status
    if (action === "updateStatus" && syncId) {
      const sync = await updateSyncStatus(syncId, options.status, user.id);
      return NextResponse.json({
        success: true,
        sync,
      });
    }

    // Update sync content
    if (action === "updateContent" && syncId) {
      const sync = await updateSyncContent(syncId, options);
      return NextResponse.json({
        success: true,
        sync,
      });
    }

    // Sync template to channels
    if (!templateId || !sourceChannel || !targetChannels) {
      return NextResponse.json(
        { error: "templateId, sourceChannel, and targetChannels are required" },
        { status: 400 }
      );
    }

    const syncs = await syncTemplateToChannels(
      tenantId,
      templateId,
      sourceChannel,
      targetChannels,
      options
    );

    return NextResponse.json({
      success: true,
      syncs,
      message: `Synced to ${syncs.length} channel(s)`,
    });
  } catch (error) {
    console.error("[Sync API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync template" },
      { status: 500 }
    );
  }
}
