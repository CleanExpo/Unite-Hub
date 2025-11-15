/**
 * DELETE /api/contacts/delete
 *
 * Protected API route demonstrating RBAC implementation.
 * Deletes a contact - requires 'contact:delete' permission (owner or admin only).
 *
 * This is an example of how to protect API routes with permission checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireSameOrganization } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase server client
 */
function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * DELETE contact endpoint
 * Requires 'contact:delete' permission (owner or admin only)
 */
export async function DELETE(req: NextRequest) {
  try {
    // Require permission - throws 401/403 if not authorized
    const user = await requirePermission(req, 'contact:delete');

    // Get contact ID from request body
    const { contactId } = await req.json();

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Fetch contact to verify ownership
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('id, workspace_id, workspaces!inner(org_id)')
      .eq('id', contactId)
      .single();

    if (fetchError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Verify contact belongs to user's organization
    const contactOrgId = (contact.workspaces as any).org_id;
    requireSameOrganization(user, contactOrgId);

    // Delete contact
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete contact' },
        { status: 500 }
      );
    }

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      org_id: user.orgId,
      action: 'contact_deleted',
      resource: 'contact',
      resource_id: contactId,
      agent: 'api',
      status: 'success',
      details: {
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    // If error is already a Response (from middleware), return it
    if (error instanceof Response) {
      return error;
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
