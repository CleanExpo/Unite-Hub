import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * SEO Leak Engine - Gap Analysis
 * Identifies keyword, content, and backlink gaps vs competitors
 */

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const supabase = await getSupabaseServer();
    const body = await req.json();
    const {
      founder_business_id,
      your_domain,
      competitor_domains,
      analysis_type,
    } = body;

    if (!founder_business_id || !your_domain || !competitor_domains || !analysis_type) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: founder_business_id, your_domain, competitor_domains, analysis_type",
        },
        { status: 400 }
      );
    }

    // Verify user owns this business
    const { data: business, error: businessError } = await supabase
      .from("founder_businesses")
      .select("id")
      .eq("id", founder_business_id)
      .eq("owner_user_id", userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found or access denied" },
        { status: 403 }
      );
    }

    // TODO: Implement gap analysis using DataForSEO
    // This would analyze:
    // - keyword: Keywords competitors rank for that you don't
    // - content: Content topics and formats competitors cover
    // - backlink: Backlink sources and strategies

    const mockGapAnalysis = {
      founder_business_id,
      your_domain,
      competitor_domains,
      analysis_type,
      keyword_gaps:
        analysis_type === "keyword" || analysis_type === "full"
          ? [
              {
                keyword: "affordable web design",
                competitors_ranking: ["competitor1.com", "competitor2.com"],
                search_volume: 2400,
                difficulty: 42,
                opportunity_score: 78,
              },
              {
                keyword: "custom ecommerce solutions",
                competitors_ranking: ["competitor1.com"],
                search_volume: 880,
                difficulty: 55,
                opportunity_score: 65,
              },
            ]
          : null,
      content_gaps:
        analysis_type === "content" || analysis_type === "full"
          ? [
              {
                topic: "Web Design Process",
                competitors_covering: ["competitor1.com", "competitor2.com"],
                content_type: "blog_post",
                avg_word_count: 2500,
                avg_images: 8,
                opportunity_score: 82,
              },
              {
                topic: "E-commerce Platform Comparison",
                competitors_covering: ["competitor1.com"],
                content_type: "comparison_guide",
                avg_word_count: 3200,
                avg_images: 12,
                opportunity_score: 75,
              },
            ]
          : null,
      backlink_gaps:
        analysis_type === "backlink" || analysis_type === "full"
          ? [
              {
                referring_domain: "webdesignmag.com",
                linking_to: ["competitor1.com", "competitor2.com"],
                domain_authority: 68,
                opportunity_score: 85,
              },
              {
                referring_domain: "designnews.io",
                linking_to: ["competitor1.com"],
                domain_authority: 55,
                opportunity_score: 72,
              },
            ]
          : null,
      overall_opportunity_score: 76.5,
      recommendations: [
        "Target 'affordable web design' keyword with dedicated service page",
        "Create comprehensive web design process guide",
        "Reach out to webdesignmag.com for potential backlink",
      ],
    };

    const { data: gapAnalysis, error: analysisError } = await supabase
      .from("seo_leak_gap_analyses")
      .insert(mockGapAnalysis)
      .select()
      .single();

    if (analysisError) {
      console.error("Gap analysis creation error:", analysisError);
      return NextResponse.json(
        { error: "Failed to create gap analysis" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      gap_analysis: gapAnalysis,
      message: "Gap analysis complete",
    });
  } catch (error) {
    console.error("Gap analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const supabase = await getSupabaseServer();
    const { searchParams } = req.nextUrl;
    const founder_business_id = searchParams.get("founder_business_id");

    if (!founder_business_id) {
      return NextResponse.json(
        { error: "Missing founder_business_id parameter" },
        { status: 400 }
      );
    }

    // Verify user owns this business
    const { data: business, error: businessError } = await supabase
      .from("founder_businesses")
      .select("id")
      .eq("id", founder_business_id)
      .eq("owner_user_id", userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found or access denied" },
        { status: 403 }
      );
    }

    // Fetch gap analyses
    const { data: gapAnalyses, error: analysesError } = await supabase
      .from("seo_leak_gap_analyses")
      .select("*")
      .eq("founder_business_id", founder_business_id)
      .order("created_at", { ascending: false });

    if (analysesError) {
      console.error("Gap analyses fetch error:", analysesError);
      return NextResponse.json(
        { error: "Failed to fetch gap analyses" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      gap_analyses: gapAnalyses,
    });
  } catch (error) {
    console.error("Gap analyses fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
