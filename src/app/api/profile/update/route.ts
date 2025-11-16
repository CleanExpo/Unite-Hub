import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { UpdateProfileSchema, formatZodError } from "@/lib/validation/schemas";

function sanitizePhone(phone: string): string {
  return phone.replace(/[^\+\d]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    console.log('[profile/update] POST request received');

    // Apply rate limiting (100 requests per 15 minutes for API endpoints)
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      console.log('[profile/update] Rate limit exceeded');
      return rateLimitResult;
    }
    // Try to get token from Authorization header (client-side requests with implicit OAuth)
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    console.log('[profile/update] Auth header present:', !!token);

    let userId: string;

    if (token) {
      // Use browser client with token for implicit OAuth flow
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        console.error("Token validation error:", error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      // Try server-side cookies (PKCE flow or server-side auth)
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        console.error("Cookie auth error:", authError);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Get Supabase admin instance for database operations (bypasses RLS)
    const { supabaseAdmin } = await import("@/lib/supabase");
    const supabase = supabaseAdmin;

    // Parse and validate request body
    const body = await req.json();
    console.log('[profile/update] Request body fields:', Object.keys(body));

    // Validate using Zod schema
    const validationResult = UpdateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('[profile/update] Validation failed:', validationResult.error);
      return NextResponse.json(
        {
          error: "Invalid input",
          details: formatZodError(validationResult.error),
        },
        { status: 400 }
      );
    }

    console.log('[profile/update] Validation passed, updating profile for user:', userId);

    const {
      username,
      full_name,
      business_name,
      phone,
      bio,
      website,
      timezone,
      notification_preferences,
    } = validationResult.data;

    // Additional check: username uniqueness (only if username is not empty)
    if (username !== undefined && username !== '' && username !== null) {
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("username", username)
        .neq("id", userId)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    // Build update object (only include fields that were provided)
    const updateData: Record<string, any> = {};

    if (username !== undefined) updateData.username = username || null;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (business_name !== undefined) updateData.business_name = business_name || null;
    if (phone !== undefined) updateData.phone = phone ? sanitizePhone(phone) : null;
    if (bio !== undefined) updateData.bio = bio || null;
    if (website !== undefined) updateData.website = website || null;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (notification_preferences !== undefined)
      updateData.notification_preferences = notification_preferences;

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("[profile/update] Database update error:", updateError);
      console.error("[profile/update] Error code:", updateError.code);
      console.error("[profile/update] Error details:", updateError.details);
      console.error("[profile/update] Error hint:", updateError.hint);
      return NextResponse.json(
        { error: "Failed to update profile", details: updateError.message, code: updateError.code },
        { status: 500 }
      );
    }

    console.log('[profile/update] Profile updated successfully');

    // Log audit trail
    await supabase.from("auditLogs").insert({
      user_id: userId,
      action: "profile_updated",
      entity_type: "user_profile",
      entity_id: userId,
      metadata: {
        updated_fields: Object.keys(updateData),
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("[profile/update] Unexpected error:", error);
    console.error("[profile/update] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current profile
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Fetch profile
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
