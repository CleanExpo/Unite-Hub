import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * Multi-Channel - Ads Opportunities
 * AI-detected advertising opportunities and recommendations
 */

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
    const status = searchParams.get("status");

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

    // Build query
    let query = supabase
      .from("ads_opportunities")
      .select("*")
      .eq("founder_business_id", founder_business_id);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: opportunities, error: opportunitiesError } = await query.order(
      "opportunity_score",
      { ascending: false }
    );

    if (opportunitiesError) {
      console.error("Opportunities fetch error:", opportunitiesError);
      return NextResponse.json(
        { error: "Failed to fetch opportunities" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      opportunities: opportunities,
    });
  } catch (error) {
    console.error("Opportunities fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
      opportunity_type,
      platform,
      keywords,
      estimated_impact,
      ai_suggestion,
    } = body;

    if (!founder_business_id || !opportunity_type || !platform) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: founder_business_id, opportunity_type, platform",
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

    // Calculate opportunity score (mock implementation)
    const opportunityScore =
      (estimated_impact?.clicks || 0) * 0.4 +
      (estimated_impact?.conversions || 0) * 60 +
      (keywords?.length || 0) * 2;

    // Create opportunity
    const { data: opportunity, error: opportunityError } = await supabase
      .from("ads_opportunities")
      .insert({
        founder_business_id,
        opportunity_type,
        platform,
        keywords: keywords || [],
        estimated_impact: estimated_impact || {},
        ai_suggestion: ai_suggestion || "AI-detected opportunity",
        opportunity_score: Math.min(100, opportunityScore),
        status: "active",
        detected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (opportunityError) {
      console.error("Opportunity creation error:", opportunityError);
      return NextResponse.json(
        { error: "Failed to create opportunity" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      opportunity: opportunity,
      message: "Ads opportunity created successfully",
    });
  } catch (error) {
    console.error("Opportunity creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
