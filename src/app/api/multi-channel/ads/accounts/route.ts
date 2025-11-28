import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * Multi-Channel - Ads Accounts
 * Manages connected advertising accounts (Google Ads, Meta Ads)
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

    // Fetch ads accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("ads_accounts")
      .select("*")
      .eq("founder_business_id", founder_business_id)
      .order("created_at", { ascending: false });

    if (accountsError) {
      console.error("Ads accounts fetch error:", accountsError);
      return NextResponse.json(
        { error: "Failed to fetch ads accounts" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      accounts: accounts,
    });
  } catch (error) {
    console.error("Ads accounts fetch error:", error);
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
      platform,
      account_id_external,
      account_name,
      access_token,
      refresh_token,
      account_metadata,
    } = body;

    if (!founder_business_id || !platform || !account_id_external || !account_name) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: founder_business_id, platform, account_id_external, account_name",
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

    // Check if account already connected
    const { data: existing } = await supabase
      .from("ads_accounts")
      .select("id")
      .eq("founder_business_id", founder_business_id)
      .eq("platform", platform)
      .eq("account_id_external", account_id_external)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This ads account is already connected" },
        { status: 400 }
      );
    }

    // Create ads account
    const { data: account, error: accountError } = await supabase
      .from("ads_accounts")
      .insert({
        founder_business_id,
        platform,
        account_id_external,
        account_name,
        access_token,
        refresh_token,
        account_metadata: account_metadata || {},
        connected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (accountError) {
      console.error("Ads account creation error:", accountError);
      return NextResponse.json(
        { error: "Failed to connect ads account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      account: account,
      message: "Ads account connected successfully",
    });
  } catch (error) {
    console.error("Ads account connection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
