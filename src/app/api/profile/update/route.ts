import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

// Schema validation helper
function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
}

function validatePhone(phone: string): boolean {
  return /^\+?[1-9]\d{1,14}$/.test(phone);
}

function validateWebsite(website: string): boolean {
  return /^https?:\/\/.+/.test(website);
}

function sanitizePhone(phone: string): string {
  return phone.replace(/[^\+\d]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    // Try to get token from Authorization header (client-side requests with implicit OAuth)
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

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

    // Get Supabase instance for database operations
    const supabase = await getSupabaseServer();

    // Parse request body
    const body = await req.json();
    const {
      username,
      full_name,
      business_name,
      phone,
      bio,
      website,
      timezone,
      notification_preferences,
    } = body;

    // Validation
    const errors: Record<string, string> = {};

    if (username !== undefined) {
      if (!validateUsername(username)) {
        errors.username =
          "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens";
      } else {
        // Check if username is already taken by another user
        const { data: existingUser } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("username", username)
          .neq("id", userId)
          .single();

        if (existingUser) {
          errors.username = "Username is already taken";
        }
      }
    }

    if (phone !== undefined && phone !== "") {
      const sanitized = sanitizePhone(phone);
      if (!validatePhone(sanitized)) {
        errors.phone =
          "Invalid phone number format. Use international format (e.g., +14155552671)";
      }
    }

    if (website !== undefined && website !== "") {
      if (!validateWebsite(website)) {
        errors.website = "Website must be a valid URL starting with http:// or https://";
      }
    }

    if (bio !== undefined && bio.length > 500) {
      errors.bio = "Bio must be 500 characters or less";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Build update object (only include fields that were provided)
    const updateData: Record<string, any> = {};

    if (username !== undefined) updateData.username = username;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (business_name !== undefined) updateData.business_name = business_name;
    if (phone !== undefined) updateData.phone = phone ? sanitizePhone(phone) : null;
    if (bio !== undefined) updateData.bio = bio;
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
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile", details: updateError.message },
        { status: 500 }
      );
    }

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
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
