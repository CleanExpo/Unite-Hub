/**
 * Client Proposal Service
 * Phase 3 Step 5 - Client Proposal Selection
 *
 * Service layer for client-side proposal operations.
 * Provides type-safe functions for fetching and selecting proposals.
 *
 * Following CLAUDE.md patterns:
 * - Client-side operations
 * - Bearer token authentication
 * - Full error handling
 * - Typed responses
 *
 * Usage:
 * ```typescript
 * import { getClientProposal, selectProposal } from '@/lib/services/client/proposalService';
 *
 * const result = await getClientProposal('idea-uuid');
 * if (result.success) {
 *   console.log(result.proposal);
 * }
 *
 * const selection = await selectProposal({
 *   ideaId: 'idea-uuid',
 *   tier: 'better',
 *   packageId: 'pkg-uuid',
 * });
 * ```
 */

import { supabase } from '@/lib/supabase';
import type { ProposalScope } from '@/lib/projects/scope-planner';

// Service response types
export interface GetProposalResult {
  success: boolean;
  proposal?: ProposalScope;
  metadata?: {
    proposalId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
  message?: string;
}

export interface SelectProposalResult {
  success: boolean;
  selection?: {
    ideaId: string;
    tier: 'good' | 'better' | 'best';
    packageId: string;
    packageLabel: string;
  };
  nextStep?: 'payment' | 'onboarding' | 'confirmation';
  projectId?: string;
  error?: string;
  message?: string;
}

// Service function input types
export interface SelectProposalParams {
  ideaId: string;
  tier: 'good' | 'better' | 'best';
  packageId: string;
}

/**
 * Get a proposal for a client idea
 *
 * This function:
 * 1. Authenticates the request using Supabase session
 * 2. Calls GET /api/client/proposals/get with Bearer token
 * 3. Returns the proposal scope with metadata
 *
 * @param ideaId - UUID of the client idea
 * @returns Result with proposal or error
 */
export async function getClientProposal(
  ideaId: string
): Promise<GetProposalResult> {
  try {
    // Get Supabase session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Authentication required. Please log in.',
      };
    }

    // Call API endpoint with Bearer token
    const response = await fetch(
      `/api/client/proposals/get?ideaId=${encodeURIComponent(ideaId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to fetch proposal',
      };
    }

    return {
      success: true,
      proposal: data.proposal,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error('Get client proposal service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fetch proposal. Please try again.',
    };
  }
}

/**
 * Select a proposal package
 *
 * This function:
 * 1. Validates the selection parameters
 * 2. Authenticates the request using Supabase session
 * 3. Calls POST /api/client/proposals/select with Bearer token
 * 4. Returns the selection result with next step
 *
 * @param params - Selection parameters (ideaId, tier, packageId)
 * @returns Result with selection confirmation and next step
 */
export async function selectProposal(
  params: SelectProposalParams
): Promise<SelectProposalResult> {
  try {
    const { ideaId, tier, packageId } = params;

    // Validate parameters
    if (!ideaId || !tier || !packageId) {
      return {
        success: false,
        error: 'Missing required parameters',
      };
    }

    if (!['good', 'better', 'best'].includes(tier)) {
      return {
        success: false,
        error: 'Invalid tier. Must be good, better, or best',
      };
    }

    // Get Supabase session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Authentication required. Please log in.',
      };
    }

    // Call API endpoint with Bearer token
    const response = await fetch('/api/client/proposals/select', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        ideaId,
        tier,
        packageId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to select package',
      };
    }

    return {
      success: true,
      selection: data.selection,
      nextStep: data.nextStep,
      projectId: data.projectId,
      message: data.message || 'Package selected successfully',
    };
  } catch (error) {
    console.error('Select proposal service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to select package. Please try again.',
    };
  }
}

/**
 * Get all proposals for the current client
 *
 * This function:
 * 1. Fetches all proposals for the authenticated client's ideas
 * 2. Returns a list of proposals with their status
 *
 * @returns Result with proposals array or error
 */
export async function getClientProposals(): Promise<{
  success: boolean;
  proposals?: Array<{
    ideaId: string;
    ideaTitle: string;
    proposalId: string;
    status: string;
    createdAt: string;
    hasSelection: boolean;
  }>;
  error?: string;
}> {
  try {
    // Get Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Authentication required. Please log in.',
      };
    }

    // Fetch client's ideas with their proposal scopes
    const { data, error } = await supabase
      .from('ideas')
      .select(`
        id,
        title,
        status,
        proposal_scopes (
          id,
          status,
          created_at
        )
      `)
      .eq('status', 'scoped')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client proposals:', error);
      return {
        success: false,
        error: 'Failed to fetch proposals',
      };
    }

    // Transform data
    const proposals = data
      .filter((idea: any) => idea.proposal_scopes && idea.proposal_scopes.length > 0)
      .map((idea: any) => ({
        ideaId: idea.id,
        ideaTitle: idea.title,
        proposalId: idea.proposal_scopes[0].id,
        status: idea.proposal_scopes[0].status,
        createdAt: idea.proposal_scopes[0].created_at,
        hasSelection: idea.status === 'package_selected',
      }));

    return {
      success: true,
      proposals,
    };
  } catch (error) {
    console.error('Get client proposals service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
