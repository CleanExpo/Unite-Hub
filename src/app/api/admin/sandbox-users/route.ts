/**
 * Sandbox Users API
 * Phase 30.1: Admin management of sandbox billing users
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { success, errors } from "@/lib/api/response";

// Admin emails that can manage sandbox users
const ADMIN_EMAILS = [
  "admin@unite-group.in",
  "contact@unite-group.in",
  "phill.mcgurk@gmail.com",
];

// Valid roles
const VALID_ROLES = ["founder", "staff_admin", "admin", "engineering", "support"];

/**
 * GET - List all sandbox users
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return errors.unauthorized("Admin access required");
    }

    const { data, error } = await supabase
      .from("sandbox_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sandbox users:", error);
      return errors.internal("Failed to fetch sandbox users");
    }

    return success(data);
  } catch (error) {
    console.error("Sandbox users GET error:", error);
    return errors.internal("Internal server error");
  }
}

/**
 * POST - Add new sandbox user
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return errors.unauthorized("Admin access required");
    }

    const body = await req.json();
    const { email, name, role, notes } = body;

    // Validate required fields
    if (!email || !name || !role) {
      return errors.validationError("Email, name, and role are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errors.validationError("Invalid email format");
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return errors.validationError(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);
    }

    // Insert new user
    const { data, error } = await supabase
      .from("sandbox_users")
      .insert({
        email: email.toLowerCase(),
        name,
        role,
        notes,
        sandbox_enabled: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return errors.validationError("Email already exists in sandbox registry");
      }
      console.error("Error adding sandbox user:", error);
      return errors.internal("Failed to add sandbox user");
    }

    // Log audit event
    await supabase.from("sandbox_audit_log").insert({
      action: "sandbox_user_added",
      target_email: email.toLowerCase(),
      performed_by: user.id,
      new_value: { email, name, role, notes },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Sandbox users POST error:", error);
    return errors.internal("Internal server error");
  }
}

/**
 * PATCH - Update sandbox user
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return errors.unauthorized("Admin access required");
    }

    const body = await req.json();
    const { id, role, sandbox_enabled } = body;

    if (!id) {
      return errors.validationError("User ID is required");
    }

    // Get current user data for audit
    const { data: currentUser } = await supabase
      .from("sandbox_users")
      .select("*")
      .eq("id", id)
      .single();

    if (!currentUser) {
      return errors.notFound("Sandbox user");
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return errors.validationError(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);
      }
      updates.role = role;
    }
    if (sandbox_enabled !== undefined) {
      updates.sandbox_enabled = sandbox_enabled;
    }

    // Update user
    const { data, error } = await supabase
      .from("sandbox_users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating sandbox user:", error);
      return errors.internal("Failed to update sandbox user");
    }

    // Log audit event
    const action = role !== undefined ? "sandbox_role_changed" : "sandbox_mode_toggled";
    await supabase.from("sandbox_audit_log").insert({
      action,
      target_email: currentUser.email,
      performed_by: user.id,
      old_value: { role: currentUser.role, sandbox_enabled: currentUser.sandbox_enabled },
      new_value: updates,
    });

    return success(data);
  } catch (error) {
    console.error("Sandbox users PATCH error:", error);
    return errors.internal("Internal server error");
  }
}

/**
 * DELETE - Remove sandbox user
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return errors.unauthorized("Admin access required");
    }

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return errors.validationError("User ID is required");
    }

    // Get user for audit
    const { data: targetUser } = await supabase
      .from("sandbox_users")
      .select("*")
      .eq("id", id)
      .single();

    if (!targetUser) {
      return errors.notFound("Sandbox user");
    }

    // Delete user
    const { error } = await supabase
      .from("sandbox_users")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting sandbox user:", error);
      return errors.internal("Failed to delete sandbox user");
    }

    // Log audit event
    await supabase.from("sandbox_audit_log").insert({
      action: "sandbox_user_removed",
      target_email: targetUser.email,
      performed_by: user.id,
      old_value: targetUser,
    });

    return success({ deleted: true });
  } catch (error) {
    console.error("Sandbox users DELETE error:", error);
    return errors.internal("Internal server error");
  }
}
