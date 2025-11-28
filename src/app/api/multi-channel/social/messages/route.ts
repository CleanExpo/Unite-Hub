import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * Multi-Channel - Social Messages
 * Unified inbox for social media messages across platforms
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
    const platform = searchParams.get("platform");
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
      .from("social_inbox_messages")
      .select(
        `
        *,
        social_inbox_accounts!inner(
          platform,
          account_handle
        )
      `
      )
      .eq("social_inbox_accounts.founder_business_id", founder_business_id);

    if (platform) {
      query = query.eq("social_inbox_accounts.platform", platform);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: messages, error: messagesError } = await query.order(
      "received_at",
      { ascending: false }
    );

    if (messagesError) {
      console.error("Messages fetch error:", messagesError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: messages,
    });
  } catch (error) {
    console.error("Messages fetch error:", error);
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
    const { account_id, message_text, in_reply_to_id } = body;

    if (!account_id || !message_text) {
      return NextResponse.json(
        { error: "Missing required fields: account_id, message_text" },
        { status: 400 }
      );
    }

    // Verify user owns this account's business
    const { data: account, error: accountError } = await supabase
      .from("social_inbox_accounts")
      .select("founder_business_id, platform, account_handle, founder_businesses!inner(owner_user_id)")
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

    // HUMAN_GOVERNED: Create approval request for outgoing message
    const { data: approval, error: approvalError } = await supabase
      .from("human_governed_approvals")
      .insert({
        founder_business_id: account.founder_business_id,
        approval_type: "social_message",
        resource_type: "social_inbox_messages",
        proposed_action: {
          action: "send_message",
          account_id,
          platform: account.platform,
          account_handle: account.account_handle,
          message_text,
          in_reply_to_id,
        },
        ai_rationale: "User composed social media message",
        status: "pending",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (approvalError) {
      console.error("Approval creation error:", approvalError);
      return NextResponse.json(
        { error: "Failed to create approval request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      approval: approval,
      message:
        "Message submitted for approval. It will be sent after review.",
      requires_approval: true,
    });
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
