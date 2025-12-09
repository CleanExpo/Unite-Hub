/**
 * Synthex Compliance API
 * GET - Get frameworks, settings, or stats
 * POST - Update settings
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listFrameworks,
  getFramework,
  getSettings,
  upsertSettings,
  getComplianceStats,
  Framework,
} from "@/lib/synthex/complianceService";

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
    const type = searchParams.get("type"); // 'frameworks', 'settings', 'stats'
    const frameworkCode = searchParams.get("framework") as Framework | null;

    // Get specific framework
    if (type === "framework" && frameworkCode) {
      const framework = await getFramework(frameworkCode);
      if (!framework) {
        return NextResponse.json({ error: "Framework not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        framework,
      });
    }

    // List all frameworks
    if (type === "frameworks") {
      const frameworks = await listFrameworks();
      return NextResponse.json({
        success: true,
        frameworks,
      });
    }

    // Tenant-specific data requires tenantId
    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required for settings and stats" },
        { status: 400 }
      );
    }

    // Get settings
    if (type === "settings") {
      const settings = await getSettings(tenantId);
      return NextResponse.json({
        success: true,
        settings: settings || {
          enabled_frameworks: ["can-spam", "gdpr"],
          default_jurisdictions: ["US", "EU"],
        },
      });
    }

    // Get stats
    if (type === "stats") {
      const stats = await getComplianceStats(tenantId);
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Default: return both frameworks and settings
    const frameworks = await listFrameworks();
    const settings = await getSettings(tenantId);
    const stats = await getComplianceStats(tenantId);

    return NextResponse.json({
      success: true,
      frameworks,
      settings: settings || {
        enabled_frameworks: ["can-spam", "gdpr"],
        default_jurisdictions: ["US", "EU"],
      },
      stats,
    });
  } catch (error) {
    console.error("[Compliance API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get compliance data" },
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
    const { tenantId, ...settings } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const updatedSettings = await upsertSettings(tenantId, settings);

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("[Compliance API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}
