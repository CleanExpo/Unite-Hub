/**
 * Business Consistency API Routes
 * GET: Get consistency master and citations
 * POST: Create/update consistency master
 * PUT: Run audit
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  BusinessConsistencyService,
  PLATFORM_TIERS,
  type CreateMasterInput,
} from "@/lib/consistency/business-consistency-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const masterId = searchParams.get("masterId");
    const citations = searchParams.get("citations") === "true";
    const platforms = searchParams.get("platforms") === "true";

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const service = new BusinessConsistencyService();

    // Get platform tiers info
    if (platforms) {
      return NextResponse.json({ success: true, data: PLATFORM_TIERS });
    }

    // Get citations for a master
    if (masterId && citations) {
      const citationList = await service.getCitationListings(masterId);
      return NextResponse.json({ success: true, data: citationList });
    }

    // Get specific master
    if (masterId) {
      const master = await service.getMaster(masterId, workspaceId);
      if (!master) {
        return NextResponse.json({ error: "Master not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: master });
    }

    // Get master for workspace (first one)
    const { data: masters } = await supabase
      .from("business_consistency_master")
      .select("*")
      .eq("workspace_id", workspaceId)
      .limit(1);

    if (!masters?.length) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No consistency master found. Create one to get started.",
      });
    }

    return NextResponse.json({ success: true, data: masters[0] });

  } catch (error) {
     
    console.error("Consistency GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consistency data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      workspaceId,
      clientId,
      masterId, // If updating existing
      ...masterData
    } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const service = new BusinessConsistencyService();

    // Update existing master
    if (masterId) {
      const updated = await service.updateMaster(masterId, workspaceId, masterData);
      return NextResponse.json({ success: true, data: updated });
    }

    // Create new master
    const input: CreateMasterInput = {
      workspaceId,
      clientId,
      ...masterData,
    };

    // Validate required fields
    if (!input.legalBusinessName || !input.streetAddress || !input.suburb ||
        !input.state || !input.postcode || !input.primaryPhone ||
        !input.websiteUrl || !input.emailAddress || !input.primaryCategory) {
      return NextResponse.json(
        {
          error: "Required fields: legalBusinessName, streetAddress, suburb, state, postcode, primaryPhone, websiteUrl, emailAddress, primaryCategory",
        },
        { status: 400 }
      );
    }

    const master = await service.createMaster(input);
    return NextResponse.json({ success: true, data: master });

  } catch (error) {
     
    console.error("Consistency POST error:", error);
    return NextResponse.json(
      { error: "Failed to save consistency data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, masterId, action } = body;

    if (!workspaceId || !masterId) {
      return NextResponse.json(
        { error: "workspaceId and masterId required" },
        { status: 400 }
      );
    }

    const service = new BusinessConsistencyService();

    switch (action) {
      case 'audit': {
        const auditResult = await service.runAudit(masterId, workspaceId);
        return NextResponse.json({ success: true, data: auditResult });
      }

      case 'initCitations': {
        await service.initializeCitationListings(masterId);
        const citations = await service.getCitationListings(masterId);
        return NextResponse.json({ success: true, data: citations });
      }

      case 'generateSchema': {
        const master = await service.getMaster(masterId, workspaceId);
        if (!master) {
          return NextResponse.json({ error: "Master not found" }, { status: 404 });
        }
        return NextResponse.json({
          success: true,
          data: {
            localBusiness: master.schema_local_business,
            organization: master.schema_organization,
          },
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
     
    console.error("Consistency PUT error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
