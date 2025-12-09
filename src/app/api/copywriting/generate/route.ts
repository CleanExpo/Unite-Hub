/**
 * Copy Generation API Routes
 * GET: Get generated copy
 * POST: Generate new page copy
 * PATCH: Update copy status
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generatePageCopy,
  getGeneratedCopy,
  getGeneratedCopyList,
  updateCopyStatus,
  createCopyVersion,
  deleteGeneratedCopy,
  type CopyGenerationInput,
} from "@/lib/copywriting/conversion-copywriting-engine";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const clientId = searchParams.get("clientId") || undefined;
    const copyId = searchParams.get("copyId");
    const status = searchParams.get("status") || undefined;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // Get specific copy
    if (copyId) {
      const copy = await getGeneratedCopy(copyId, workspaceId);
      if (!copy) {
        return NextResponse.json({ error: "Copy not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: copy });
    }

    // Get list of generated copy
    const copyList = await getGeneratedCopyList(workspaceId, clientId, status);
    return NextResponse.json({ success: true, data: copyList });

  } catch (error) {
     
    console.error("Generate Copy GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch generated copy" },
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
      pageType,
      businessName,
      industry,
      targetAudience,
      primaryOffer,
      uniqueSellingPoints,
      toneVoice,
      customGuidelines,
      useVOCQuotes,
      useCompetitorInsights,
    } = body;

    if (!workspaceId || !pageType || !businessName || !industry || !targetAudience || !primaryOffer) {
      return NextResponse.json(
        { error: "workspaceId, pageType, businessName, industry, targetAudience, and primaryOffer are required" },
        { status: 400 }
      );
    }

    const input: CopyGenerationInput = {
      workspaceId,
      clientId,
      pageType,
      businessName,
      industry,
      targetAudience,
      primaryOffer,
      uniqueSellingPoints: uniqueSellingPoints || [],
      toneVoice,
      customGuidelines,
      useVOCQuotes,
      useCompetitorInsights,
    };

    const result = await generatePageCopy(input);

    // Return verification details for transparency
    return NextResponse.json({
      success: result.success,
      data: {
        copyId: result.copyId,
        generatedCopy: result.generatedCopy,
        verification: result.verificationReport,
      },
      error: result.error,
    });

  } catch (error) {
     
    console.error("Generate Copy POST error:", error);
    return NextResponse.json(
      { error: "Failed to generate copy" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      workspaceId,
      copyId,
      action, // 'status', 'version', 'delete'
      status,
      revisionNotes,
      newSections,
    } = body;

    if (!workspaceId || !copyId || !action) {
      return NextResponse.json(
        { error: "workspaceId, copyId, and action are required" },
        { status: 400 }
      );
    }

    switch (action) {
      case 'status': {
        if (!status) {
          return NextResponse.json({ error: "status required" }, { status: 400 });
        }
        const statusUpdated = await updateCopyStatus(
          copyId,
          workspaceId,
          status,
          status === 'approved' ? user.id : undefined,
          revisionNotes
        );
        return NextResponse.json({ success: statusUpdated });
      }

      case 'version': {
        if (!newSections) {
          return NextResponse.json({ error: "newSections required" }, { status: 400 });
        }
        const newVersionId = await createCopyVersion(copyId, workspaceId, newSections);
        return NextResponse.json({ success: !!newVersionId, data: { newVersionId } });
      }

      case 'delete': {
        const deleted = await deleteGeneratedCopy(copyId, workspaceId);
        return NextResponse.json({ success: deleted });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
     
    console.error("Generate Copy PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update copy" },
      { status: 500 }
    );
  }
}
