/**
 * VOC Research API Routes
 * GET: Get VOC quotes (with filters)
 * POST: Run VOC research
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  runVOCResearch,
  getQuotesByCategory,
  getGoldQuotes,
  getVOCSummary,
  searchQuotes,
  type VOCCategory,
  type VOCResearchInput,
} from "@/lib/agents/voc-research-agent";

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
    const category = searchParams.get("category") as VOCCategory | null;
    const goldOnly = searchParams.get("goldOnly") === "true";
    const search = searchParams.get("search");
    const summary = searchParams.get("summary") === "true";

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // Get summary view
    if (summary) {
      const summaryData = await getVOCSummary(workspaceId, clientId);
      return NextResponse.json({ success: true, data: summaryData });
    }

    // Search quotes
    if (search) {
      const quotes = await searchQuotes(workspaceId, search, 50);
      return NextResponse.json({ success: true, data: quotes });
    }

    // Get gold quotes only
    if (goldOnly) {
      const quotes = await getGoldQuotes(workspaceId, clientId);
      return NextResponse.json({ success: true, data: quotes });
    }

    // Get quotes by category
    if (category) {
      const quotes = await getQuotesByCategory(workspaceId, category, 50);
      return NextResponse.json({ success: true, data: quotes });
    }

    // Default: get all categories summary
    const summaryData = await getVOCSummary(workspaceId, clientId);
    return NextResponse.json({ success: true, data: summaryData });

  } catch (error) {
     
    console.error("VOC Research GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch VOC data" },
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
      industry,
      productService,
      targetAudience,
      sourceUrls,
      searchTerms,
    } = body;

    if (!workspaceId || !industry || !productService || !targetAudience) {
      return NextResponse.json(
        { error: "workspaceId, industry, productService, and targetAudience are required" },
        { status: 400 }
      );
    }

    const input: VOCResearchInput = {
      workspaceId,
      clientId,
      industry,
      productService,
      targetAudience,
      sourceUrls,
      searchTerms,
    };

    const result = await runVOCResearch(input);

    return NextResponse.json({
      success: result.success,
      data: result,
    });

  } catch (error) {
     
    console.error("VOC Research POST error:", error);
    return NextResponse.json(
      { error: "Failed to run VOC research" },
      { status: 500 }
    );
  }
}
