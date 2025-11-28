import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * Multi-Channel - Social Inbox Accounts
 * Manages connected social media accounts for unified inbox
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

    // Fetch social accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("social_inbox_accounts")
      .select("*")
      .eq("founder_business_id", founder_business_id)
      .order("created_at", { ascending: false });

    if (accountsError) {
      console.error("Social accounts fetch error:", accountsError);
      return NextResponse.json(
        { error: "Failed to fetch social accounts" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      accounts: accounts,
    });
  } catch (error) {
    console.error("Social accounts fetch error:", error);
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
      account_handle,
      access_token,
      refresh_token,
      account_metadata,
    } = body;

    if (!founder_business_id || !platform || !account_handle) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: founder_business_id, platform, account_handle",
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
      .from("social_inbox_accounts")
      .select("id")
      .eq("founder_business_id", founder_business_id)
      .eq("platform", platform)
      .eq("account_handle", account_handle)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This account is already connected" },
        { status: 400 }
      );
    }

    // Create social account
    const { data: account, error: accountError } = await supabase
      .from("social_inbox_accounts")
      .insert({
        founder_business_id,
        platform,
        account_handle,
        access_token,
        refresh_token,
        account_metadata: account_metadata || {},
        connected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (accountError) {
      console.error("Social account creation error:", accountError);
      return NextResponse.json(
        { error: "Failed to connect social account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      account: account,
      message: "Social account connected successfully",
    });
  } catch (error) {
    console.error("Social account connection error:", error);
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
    const account_id = searchParams.get("account_id");

    if (!account_id) {
      return NextResponse.json(
        { error: "Missing account_id parameter" },
        { status: 400 }
      );
    }

    // Verify user owns this account's business
    const { data: account, error: accountError } = await supabase
      .from("social_inbox_accounts")
      .select("founder_business_id, founder_businesses!inner(owner_user_id)")
      .eq("id", account_id)
      .single();

    if (
      accountError ||
      !account ||
      (account.founder_businesses as any)?.owner_user_id !== userId
    ) {
      return NextResponse.json(
        { error: "Account not found or access denied" },
        { status: 403 }
      );
    }

    // Delete account
    const { error: deleteError } = await supabase
      .from("social_inbox_accounts")
      .delete()
      .eq("id", account_id);

    if (deleteError) {
      console.error("Account deletion error:", deleteError);
      return NextResponse.json(
        { error: "Failed to disconnect account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Social account disconnected successfully",
    });
  } catch (error) {
    console.error("Account disconnection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
