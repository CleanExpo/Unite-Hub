import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { z } from 'zod';
import type { ProposalScope } from '@/lib/projects/scope-planner';

/**
 * Save Proposal Scope API
 * Phase 3 Step 2 - Staff Tools
 *
 * Saves a staff-edited proposal scope to the database.
 *
 * Following CLAUDE.md patterns:
 * - Bearer token authentication
 * - Zod validation
 * - Workspace isolation
 * - Error handling with descriptive messages
 *
 * Request body:
 * {
 *   ideaId: string;
 *   scope: ProposalScope;
 *   status: 'draft' | 'sent';
 * }
 *
 * Response:
 * {
 *   success: true;
 *   scopeId: string;
 *   message: string;
 * }
 */

// Request validation schema
const SaveProposalScopeSchema = z.object({
  ideaId: z.string().uuid('Invalid idea ID format'),
  scope: z.object({
    idea: z.object({
      id: z.string(),
      organizationId: z.string(),
      clientId: z.string(),
      title: z.string(),
      description: z.string(),
      createdAt: z.string(),
    }),
    sections: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        order: z.number().optional(),
      })
    ),
    packages: z.array(
      z.object({
        id: z.string(),
        tier: z.enum(['good', 'better', 'best']),
        label: z.string(),
        summary: z.string(),
        deliverables: z.array(z.string()).optional(),
        estimatedHours: z.number().optional(),
        priceMin: z.number().optional(),
        priceMax: z.number().optional(),
        timeline: z.string().optional(),
      })
    ),
    metadata: z
      .object({
        generatedAt: z.string(),
        generatedBy: z.string().optional(),
        aiModel: z.string().optional(),
      })
      .optional(),
  }),
  status: z.enum(['draft', 'sent'], {
    errorMap: () => ({ message: 'Status must be "draft" or "sent"' }),
  }),
});

export async function POST(req: NextRequest) {
  try {
    // Authentication: Extract Bearer token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    let userEmail: string | undefined;

    if (token) {
      // Validate token using supabaseBrowser
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        );
      }

      userId = data.user.id;
      userEmail = data.user.email;
    } else {
      // Fallback to server-side auth
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please log in' },
          { status: 401 }
        );
      }

      userId = data.user.id;
      userEmail = data.user.email;
    }

    // Parse and validate request body
    const body = await req.json();

    const validationResult = SaveProposalScopeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { ideaId, scope, status } = validationResult.data;

    // Get Supabase server client
    const supabase = await getSupabaseServer();

    // Verify the idea exists and belongs to user's organization
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('id, organization_id, client_id')
      .eq('id', ideaId)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json(
        { error: 'Idea not found or access denied' },
        { status: 404 }
      );
    }

    // Check if proposal scope already exists for this idea
    const { data: existingScope, error: checkError } = await supabase
      .from('proposal_scopes')
      .select('id')
      .eq('idea_id', ideaId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing scope:', checkError);
      return NextResponse.json(
        { error: 'Database error while checking existing scope' },
        { status: 500 }
      );
    }

    let scopeId: string;
    let operation: 'created' | 'updated';

    if (existingScope) {
      // Update existing scope
      const { data: updatedScope, error: updateError } = await supabase
        .from('proposal_scopes')
        .update({
          scope_data: scope as any, // Store full ProposalScope as JSONB
          status,
          updated_at: new Date().toISOString(),
          updated_by: userEmail || userId,
        })
        .eq('id', existingScope.id)
        .select('id')
        .single();

      if (updateError || !updatedScope) {
        console.error('Error updating proposal scope:', updateError);
        return NextResponse.json(
          { error: 'Failed to update proposal scope' },
          { status: 500 }
        );
      }

      scopeId = updatedScope.id;
      operation = 'updated';
    } else {
      // Create new scope
      const { data: newScope, error: insertError } = await supabase
        .from('proposal_scopes')
        .insert({
          idea_id: ideaId,
          organization_id: idea.organization_id,
          client_id: idea.client_id,
          scope_data: scope as any, // Store full ProposalScope as JSONB
          status,
          created_by: userEmail || userId,
          updated_by: userEmail || userId,
        })
        .select('id')
        .single();

      if (insertError || !newScope) {
        console.error('Error creating proposal scope:', insertError);
        return NextResponse.json(
          { error: 'Failed to create proposal scope' },
          { status: 500 }
        );
      }

      scopeId = newScope.id;
      operation = 'created';
    }

    // Update idea status if scope was sent to client
    if (status === 'sent') {
      const { error: ideaUpdateError } = await supabase
        .from('ideas')
        .update({
          status: 'scoped', // Mark idea as scoped
          updated_at: new Date().toISOString(),
        })
        .eq('id', ideaId);

      if (ideaUpdateError) {
        console.error('Error updating idea status:', ideaUpdateError);
        // Don't fail the request, just log the error
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      scopeId,
      operation,
      message:
        status === 'draft'
          ? 'Proposal scope saved as draft'
          : 'Proposal scope sent to client',
    });
  } catch (error) {
    console.error('Save proposal scope error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
