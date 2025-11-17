/**
 * DELETE /api/contacts/delete
 *
 * Protected API route for deleting contacts.
 * Validates user authentication and workspace access before deletion.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAuth } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * DELETE contact endpoint
 * Validates user authentication and workspace ownership before deletion
 */
export async function DELETE(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get contact ID from request body
    const { contactId } = await req.json();

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Validate user authentication
    const user = await validateUserAuth(req);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Fetch contact to verify workspace ownership
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('id, workspace_id')
      .eq('id', contactId)
      .eq('workspace_id', user.orgId)
      .single();

    if (fetchError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found or access denied' },
        { status: 404 }
      );
    }

    // Delete contact (workspace ownership already verified)
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('workspace_id', user.orgId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete contact' },
        { status: 500 }
      );
    }

    // Log to audit trail
    await supabase.from('auditLogs').insert({
      org_id: user.orgId,
      action: 'contact_deleted',
      resource: 'contact',
      resource_id: contactId,
      agent: 'api',
      status: 'success',
      details: {
        user_id: user.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
