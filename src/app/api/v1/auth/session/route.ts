import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/core/auth";
import { handleErrors } from "@/core/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/auth/session
 *
 * Returns current authenticated user session information including:
 * - User identity (id, email)
 * - User profile details
 * - All workspaces user has access to
 * - User roles within each workspace
 *
 * No workspace required - returns user's full workspace context
 */
export const GET = handleErrors(
  withAuth(async (req: NextRequest, context) => {
    const { user } = context;
    const supabase = await createClient();

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    // Fetch all workspaces user has access to
    const { data: userOrgs, error: orgsError } = await supabase
      .from("user_organizations")
      .select(
        `
        id,
        role,
        organization:organizations (
          id,
          name,
          org_id,
          tier
        )
      `
      )
      .eq("user_id", user.id);

    if (orgsError) {
      return NextResponse.json(
        { error: "Failed to fetch user organizations" },
        { status: 500 }
      );
    }

    // Transform to workspace format
    const workspaces = (userOrgs || []).map((uo) => ({
      id: uo.organization.id,
      org_id: uo.organization.org_id,
      name: uo.organization.name,
      tier: uo.organization.tier,
      role: uo.role,
    }));

    // Determine primary workspace (first one, or can be enhanced with user preference)
    const primaryWorkspace = workspaces[0] || null;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_confirmed_at !== null,
      },
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
      },
      workspaces,
      primary_workspace: primaryWorkspace,
      session: {
        authenticated: true,
        expires_at: context.session?.expires_at || null,
      },
    });
  })
);
