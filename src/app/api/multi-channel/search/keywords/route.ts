import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * Multi-Channel - Keyword Tracking
 * Tracks keyword rankings across search engines
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

    // Fetch tracked keywords with latest rankings
    const { data: keywords, error: keywordsError } = await supabase
      .from("search_keyword_tracking")
      .select("*")
      .eq("founder_business_id", founder_business_id)
      .order("created_at", { ascending: false });

    if (keywordsError) {
      console.error("Keywords fetch error:", keywordsError);
      return NextResponse.json(
        { error: "Failed to fetch keywords" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      keywords: keywords,
    });
  } catch (error) {
    console.error("Keywords fetch error:", error);
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
      keyword,
      search_engine,
      target_url,
      location,
    } = body;

    if (!founder_business_id || !keyword || !search_engine) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: founder_business_id, keyword, search_engine",
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

    // Check if keyword already tracked
    const { data: existing } = await supabase
      .from("search_keyword_tracking")
      .select("id")
      .eq("founder_business_id", founder_business_id)
      .eq("keyword", keyword)
      .eq("search_engine", search_engine)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This keyword is already being tracked" },
        { status: 400 }
      );
    }

    // Add keyword tracking
    const { data: keywordTracking, error: trackingError } = await supabase
      .from("search_keyword_tracking")
      .insert({
        founder_business_id,
        keyword,
        search_engine,
        target_url: target_url || null,
        location: location || "US",
        current_ranking: null,
        previous_ranking: null,
        best_ranking: null,
        ranking_history: [],
        last_checked_at: null,
      })
      .select()
      .single();

    if (trackingError) {
      console.error("Keyword tracking creation error:", trackingError);
      return NextResponse.json(
        { error: "Failed to add keyword tracking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      keyword_tracking: keywordTracking,
      message: "Keyword added to tracking successfully",
    });
  } catch (error) {
    console.error("Keyword tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    const keyword_id = searchParams.get("keyword_id");

    if (!keyword_id) {
      return NextResponse.json(
        { error: "Missing keyword_id parameter" },
        { status: 400 }
      );
    }

    // Verify user owns this keyword's business
    const { data: keyword, error: keywordError } = await supabase
      .from("search_keyword_tracking")
      .select("founder_business_id, founder_businesses!inner(owner_user_id)")
      .eq("id", keyword_id)
      .single();

    if (
      keywordError ||
      !keyword ||
      (keyword.founder_businesses as any)?.owner_user_id !== userId
    ) {
      return NextResponse.json(
        { error: "Keyword not found or access denied" },
        { status: 403 }
      );
    }

    // Delete keyword
    const { error: deleteError } = await supabase
      .from("search_keyword_tracking")
      .delete()
      .eq("id", keyword_id);

    if (deleteError) {
      console.error("Keyword deletion error:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove keyword tracking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Keyword removed from tracking successfully",
    });
  } catch (error) {
    console.error("Keyword removal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
