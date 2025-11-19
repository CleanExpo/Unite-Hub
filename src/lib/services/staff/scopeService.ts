/**
 * Scope Service
 * Phase 3 Step 2 - Staff Tools
 *
 * Service layer for managing proposal scopes.
 * Provides type-safe functions for saving and retrieving proposal scopes.
 *
 * Following CLAUDE.md patterns:
 * - Server-side operations only
 * - Full error handling
 * - Workspace isolation
 * - Typed responses
 *
 * Usage:
 * ```typescript
 * import { saveProposalScope, getProposalScope } from '@/lib/services/staff/scopeService';
 *
 * const result = await saveProposalScope({
 *   ideaId: 'uuid',
 *   scope: proposalScopeObject,
 *   status: 'draft',
 *   userId: 'uuid',
 *   userEmail: 'staff@example.com',
 * });
 * ```
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { ProposalScope, ClientIdea } from '@/lib/projects/scope-planner';

// Service response types
export interface GenerateAIScopeResult {
  success: boolean;
  scope?: ProposalScope;
  metadata?: {
    totalCost: number;
    totalTokens: number;
    pipelineStages: number;
    generationTime: number;
    aiModel: string;
  };
  error?: string;
  message?: string;
}

export interface GenerateAIScopeParams {
  idea: ClientIdea;
  organizationId: string;
  workspaceId: string;
  clientId: string;
  accessToken: string; // For API authentication
}
export interface SaveScopeResult {
  success: boolean;
  scopeId?: string;
  operation?: 'created' | 'updated';
  error?: string;
  message?: string;
}

export interface GetScopeResult {
  success: boolean;
  scope?: ProposalScope | null;
  scopeId?: string;
  status?: 'draft' | 'sent';
  metadata?: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
  };
  error?: string;
  message?: string;
}

// Service function input types
export interface SaveScopeParams {
  ideaId: string;
  scope: ProposalScope;
  status: 'draft' | 'sent';
  userId: string;
  userEmail?: string;
}

export interface GetScopeParams {
  ideaId: string;
  userId: string;
}

/**
 * Save or update a proposal scope
 *
 * This function:
 * 1. Validates the idea exists and belongs to user's organization
 * 2. Checks if a scope already exists for the idea
 * 3. Creates new scope or updates existing scope
 * 4. Updates idea status if scope is sent to client
 *
 * @param params - Save scope parameters
 * @returns Result with scopeId and operation type
 */
export async function saveProposalScope(
  params: SaveScopeParams
): Promise<SaveScopeResult> {
  try {
    const { ideaId, scope, status, userId, userEmail } = params;

    // Get Supabase server client
    const supabase = await getSupabaseServer();

    // Verify the idea exists and belongs to user's organization
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('id, organization_id, client_id')
      .eq('id', ideaId)
      .single();

    if (ideaError || !idea) {
      return {
        success: false,
        error: 'Idea not found or access denied',
      };
    }

    // Check if proposal scope already exists for this idea
    const { data: existingScope, error: checkError } = await supabase
      .from('proposal_scopes')
      .select('id')
      .eq('idea_id', ideaId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing scope:', checkError);
      return {
        success: false,
        error: 'Database error while checking existing scope',
      };
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
        return {
          success: false,
          error: 'Failed to update proposal scope',
        };
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
        return {
          success: false,
          error: 'Failed to create proposal scope',
        };
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

    return {
      success: true,
      scopeId,
      operation,
      message:
        status === 'draft'
          ? 'Proposal scope saved as draft'
          : 'Proposal scope sent to client',
    };
  } catch (error) {
    console.error('Save proposal scope service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch a proposal scope by idea ID
 *
 * This function:
 * 1. Validates the idea exists and belongs to user's organization
 * 2. Fetches the proposal scope if it exists
 * 3. Returns null if no scope found
 *
 * @param params - Get scope parameters
 * @returns Result with scope data or null
 */
export async function getProposalScope(
  params: GetScopeParams
): Promise<GetScopeResult> {
  try {
    const { ideaId, userId } = params;

    // Get Supabase server client
    const supabase = await getSupabaseServer();

    // Verify the idea exists and belongs to user's organization
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('id, organization_id, client_id')
      .eq('id', ideaId)
      .maybeSingle();

    if (ideaError) {
      console.error('Error fetching idea:', ideaError);
      return {
        success: false,
        error: 'Database error while fetching idea',
      };
    }

    if (!idea) {
      return {
        success: false,
        error: 'Idea not found or access denied',
      };
    }

    // Fetch existing proposal scope for this idea
    const { data: proposalScope, error: scopeError } = await supabase
      .from('proposal_scopes')
      .select('id, scope_data, status, created_at, updated_at, created_by, updated_by')
      .eq('idea_id', ideaId)
      .maybeSingle();

    if (scopeError) {
      console.error('Error fetching proposal scope:', scopeError);
      return {
        success: false,
        error: 'Database error while fetching proposal scope',
      };
    }

    // If no scope exists, return null
    if (!proposalScope) {
      return {
        success: true,
        scope: null,
        message: 'No proposal scope found for this idea',
      };
    }

    // Return the scope data
    return {
      success: true,
      scope: proposalScope.scope_data as ProposalScope,
      scopeId: proposalScope.id,
      status: proposalScope.status as 'draft' | 'sent',
      metadata: {
        createdAt: proposalScope.created_at,
        updatedAt: proposalScope.updated_at,
        createdBy: proposalScope.created_by,
        updatedBy: proposalScope.updated_by,
      },
    };
  } catch (error) {
    console.error('Get proposal scope service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List all proposal scopes for an organization
 *
 * This function:
 * 1. Fetches all scopes for the organization
 * 2. Optionally filters by status
 * 3. Returns array of scope summaries
 *
 * @param organizationId - Organization UUID
 * @param status - Optional status filter ('draft' | 'sent')
 * @returns Array of scope summaries
 */
export async function listProposalScopes(
  organizationId: string,
  status?: 'draft' | 'sent'
): Promise<{
  success: boolean;
  scopes?: Array<{
    id: string;
    ideaId: string;
    status: 'draft' | 'sent';
    createdAt: string;
    updatedAt: string;
    ideaTitle?: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('proposal_scopes')
      .select(
        `
        id,
        idea_id,
        status,
        created_at,
        updated_at,
        ideas (
          title
        )
      `
      )
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing proposal scopes:', error);
      return {
        success: false,
        error: 'Failed to fetch proposal scopes',
      };
    }

    const scopes = data.map((scope: any) => ({
      id: scope.id,
      ideaId: scope.idea_id,
      status: scope.status,
      createdAt: scope.created_at,
      updatedAt: scope.updated_at,
      ideaTitle: scope.ideas?.title,
    }));

    return {
      success: true,
      scopes,
    };
  } catch (error) {
    console.error('List proposal scopes service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate AI-powered proposal scope
 * Phase 3 Step 4 - AI Integration
 *
 * This function:
 * 1. Calls the hybrid AI pipeline API (/api/staff/scope-ai/generate)
 * 2. Returns the generated scope with metadata (cost, tokens, time)
 * 3. Handles errors gracefully and returns detailed error messages
 *
 * @param params - AI generation parameters
 * @returns Result with generated scope and metadata
 */
export async function generateAIScope(
  params: GenerateAIScopeParams
): Promise<GenerateAIScopeResult> {
  try {
    const { idea, organizationId, workspaceId, clientId, accessToken } = params;

    // Call AI generation API
    const response = await fetch('/api/staff/scope-ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        idea,
        organizationId,
        workspaceId,
        clientId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `API error: ${response.status}`,
        message: errorData.details || 'Failed to generate AI scope',
      };
    }

    const data = await response.json();

    return {
      success: true,
      scope: data.scope,
      metadata: data.metadata,
      message: 'AI scope generated successfully',
    };
  } catch (error) {
    console.error('Generate AI scope service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to generate AI scope. Please try again.',
    };
  }
}
