/**
 * AIDO Client Profile by ID API
 * GET /api/aido/clients/[id] - Get single client profile
 * PATCH /api/aido/clients/[id] - Update client profile
 * DELETE /api/aido/clients/[id] - Delete client profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkTierRateLimit } from '@/lib/rate-limit-tiers';
import {
  successResponse,
  errorResponse,
  validationError,
} from '@/lib/api-helpers';
import {
  getClientProfile,
  updateClientProfile,
  deleteClientProfile,
} from '@/lib/aido/database/client-profiles';

/**
 * GET /api/aido/clients/[id]
 * Get a single client profile
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      console.error('[AIDO] Token validation error:', error);
      return errorResponse('Unauthorized', 401);
    }

    // Rate limiting
    const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'api');
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // Workspace validation
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return validationError({ workspaceId: 'workspaceId parameter is required' });
    }

    // Fetch client profile
    const profile = await getClientProfile(id, workspaceId);

    return successResponse({ profile });
  } catch (error) {
    console.error('[AIDO] Error fetching client profile:', error);
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return errorResponse(error.message, 404);
      }
      return errorResponse(error.message, 500);
    }
    return errorResponse('Internal server error', 500);
  }
}

/**
 * PATCH /api/aido/clients/[id]
 * Update a client profile
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      console.error('[AIDO] Token validation error:', error);
      return errorResponse('Unauthorized', 401);
    }

    // Rate limiting
    const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'api');
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // Workspace validation
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return validationError({ workspaceId: 'workspaceId parameter is required' });
    }

    // Parse request body
    const body = await req.json();
    const {
      name,
      primaryDomain,
      niches,
      locations,
      brandTone,
      expertiseTags,
      valueProps,
      gmbListingIds,
      socialChannels,
    } = body;

    // Build updates object (only include provided fields)
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (primaryDomain !== undefined) updates.primaryDomain = primaryDomain;
    if (niches !== undefined) updates.niches = niches;
    if (locations !== undefined) updates.locations = locations;
    if (brandTone !== undefined) updates.brandTone = brandTone;
    if (expertiseTags !== undefined) updates.expertiseTags = expertiseTags;
    if (valueProps !== undefined) updates.valueProps = valueProps;
    if (gmbListingIds !== undefined) updates.gmbListingIds = gmbListingIds;
    if (socialChannels !== undefined) updates.socialChannels = socialChannels;

    // Update client profile
    const profile = await updateClientProfile(id, workspaceId, updates);

    return successResponse({ profile }, undefined, 'Client profile updated successfully');
  } catch (error) {
    console.error('[AIDO] Error updating client profile:', error);
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return errorResponse(error.message, 404);
      }
      return errorResponse(error.message, 500);
    }
    return errorResponse('Internal server error', 500);
  }
}

/**
 * DELETE /api/aido/clients/[id]
 * Delete a client profile (cascades to all related data)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      console.error('[AIDO] Token validation error:', error);
      return errorResponse('Unauthorized', 401);
    }

    // Rate limiting
    const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'api');
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // Workspace validation
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return validationError({ workspaceId: 'workspaceId parameter is required' });
    }

    // Delete client profile
    await deleteClientProfile(id, workspaceId);

    return successResponse(undefined, undefined, 'Client profile deleted successfully', 200);
  } catch (error) {
    console.error('[AIDO] Error deleting client profile:', error);
    if (error instanceof Error) {
      return errorResponse(error.message, 500);
    }
    return errorResponse('Internal server error', 500);
  }
}
