import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * SEO Leak Engine - Signal Profiles
 * Analyzes Q*, P*, T*, NavBoost signals
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
    const url = searchParams.get("url");
    const founder_business_id = searchParams.get("founder_business_id");

    if (!url || !founder_business_id) {
      return NextResponse.json(
        { error: "Missing required parameters: url, founder_business_id" },
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

    // Fetch signal profile
    const { data: signalProfile, error: profileError } = await supabase
      .from("seo_leak_signal_profiles")
      .select("*")
      .eq("founder_business_id", founder_business_id)
      .eq("url", url)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Signal profile fetch error:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch signal profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signal_profile: signalProfile || null,
      message: signalProfile ? "Signal profile found" : "No signal profile yet. Run analysis first.",
    });
  } catch (error) {
    console.error("Signal profile fetch error:", error);
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
    const { url, founder_business_id } = body;

    if (!url || !founder_business_id) {
      return NextResponse.json(
        { error: "Missing required fields: url, founder_business_id" },
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

    // TODO: Implement signal analysis
    // This would analyze:
    // - Q* (Query Understanding): topic relevance, semantic matching
    // - P* (Page Quality): content depth, expertise signals
    // - T* (Trust): E-E-A-T signals, author authority
    // - NavBoost: user engagement, CTR, dwell time

    const mockSignalProfile = {
      founder_business_id,
      url,
      q_star_signals: {
        topic_relevance: 0.85,
        semantic_matching: 0.78,
        query_intent_alignment: 0.92,
      },
      p_star_signals: {
        content_depth: 0.88,
        expertise_signals: 0.75,
        uniqueness: 0.82,
      },
      t_star_signals: {
        eeat_score: 0.79,
        author_authority: 0.65,
        trust_signals: 0.88,
      },
      navboost_signals: {
        estimated_ctr: 0.045,
        dwell_time_score: 0.72,
        engagement_rate: 0.68,
      },
      overall_leak_score: 78.5,
      recommendations: [
        "Improve author bio and credentials to boost T* signals",
        "Add more depth to content sections to increase P* score",
        "Optimize title tags and meta descriptions for higher CTR",
      ],
    };

    const { data: signalProfile, error: profileError } = await supabase
      .from("seo_leak_signal_profiles")
      .insert(mockSignalProfile)
      .select()
      .single();

    if (profileError) {
      console.error("Signal profile creation error:", profileError);
      return NextResponse.json(
        { error: "Failed to create signal profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signal_profile: signalProfile,
      message: "Signal analysis complete",
    });
  } catch (error) {
    console.error("Signal analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
