import { NextRequest, NextResponse } from "next/server";
import { gmailClient } from "@/lib/gmail";
import { getSupabaseServer } from "@/lib/supabase";
import { strictRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";
import { GmailOAuthCallbackSchema, formatZodError } from "@/lib/validation/schemas";

/**
 * GET /api/email/oauth/callback
 * Gmail OAuth callback handler
 */

export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting (OAuth callbacks should be limited)
    const rateLimitResult = await strictRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const supabase = await getSupabaseServer();
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    // Handle OAuth error
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=${error}`
      );
    }

    // Validate callback parameters
    const validationResult = GmailOAuthCallbackSchema.safeParse({ code, state });
    if (!validationResult.success) {
      console.error("Invalid OAuth callback params:", formatZodError(validationResult.error));
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=invalid_callback`
      );
    }

    // Exchange code for tokens
    const credentials = await gmailClient.getTokensFromCode(code!);

    // Get user's Gmail profile
    const profile = await gmailClient.getUserProfile(credentials);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/login?error=unauthorized&redirectTo=/settings/integrations`
      );
    }

    // Parse state (contains workspace_id or other metadata)
    const stateData = state ? JSON.parse(decodeURIComponent(state)) : {};
    const workspaceId = stateData.workspaceId || stateData.workspace_id;

    // Get user's workspace if not in state
    let targetWorkspaceId = workspaceId;
    if (!targetWorkspaceId) {
      const { data: userOrg } = await supabase
        .from("user_organizations")
        .select("org_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (userOrg) {
        const { data: workspace } = await supabase
          .from("workspaces")
          .select("id")
          .eq("org_id", userOrg.org_id)
          .limit(1)
          .single();

        targetWorkspaceId = workspace?.id;
      }
    }

    if (!targetWorkspaceId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=no_workspace`
      );
    }

    // Store integration in email_integrations table
    const { data: integration, error: integrationError } = await supabase
      .from("email_integrations")
      .upsert({
        workspace_id: targetWorkspaceId,
        provider: "gmail",
        email_address: profile.emailAddress,
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        token_expiry: credentials.expiryDate ? new Date(credentials.expiryDate).toISOString() : null,
        is_active: true,
        metadata: {
          messagesTotal: profile.messagesTotal,
          threadsTotal: profile.threadsTotal,
          connectedAt: new Date().toISOString()
        }
      }, {
        onConflict: "workspace_id,email_address"
      })
      .select()
      .single();

    if (integrationError) {
      console.error("Failed to store integration:", integrationError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=storage_failed`
      );
    }

    console.log("Gmail OAuth successful:", {
      email: profile.emailAddress,
      workspaceId: targetWorkspaceId,
      integrationId: integration.id
    });

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/settings/integrations?success=true&email=${profile.emailAddress}`
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=oauth_failed`
    );
  }
}
