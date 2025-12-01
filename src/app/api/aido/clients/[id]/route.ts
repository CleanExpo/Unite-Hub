/**
 * AIDO Client Profile by ID API
 * GET /api/aido/clients/[id] - Get single client profile
 * PATCH /api/aido/clients/[id] - Update client profile
 * DELETE /api/aido/clients/[id] - Delete client profile
 */

 
import { NextRequest } from 'next/server';
import { withErrorBoundary, successResponse } from '@/lib/errors/boundaries';
import { checkTierRateLimit } from '@/lib/rate-limit-tiers';
import { AuthenticationError, ValidationError } from '@/core/errors/app-error';
import { supabaseBrowser } from '@/lib/supabase';
import {
  getClientProfile,
  updateClientProfile,
  deleteClientProfile,
} from '@/lib/aido/database/client-profiles';

/**
 * GET /api/aido/clients/[id]
 * Get a single client profile
 */
export const GET = withErrorBoundary(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  // Authentication
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new AuthenticationError();
  }

  const { data, error } = await supabaseBrowser.auth.getUser(token);

  if (error || !data.user) {
    throw new AuthenticationError();
  }

  // Rate limiting
  const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'api');
  if (!rateLimitResult.allowed) {
    throw new ValidationError([{ field: 'rate_limit', message: 'Rate limit exceeded' }]);
  }

  // Workspace validation
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    throw new ValidationError([{ field: 'workspaceId', message: 'workspaceId parameter is required' }]);
  }

  // Fetch client profile
  const profile = await getClientProfile(id, workspaceId);

  return successResponse({ profile });
});

/**
 * PATCH /api/aido/clients/[id]
 * Update a client profile
 */
export const PATCH = withErrorBoundary(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  // Authentication
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new AuthenticationError();
  }

  const { data, error } = await supabaseBrowser.auth.getUser(token);

  if (error || !data.user) {
    throw new AuthenticationError();
  }

  // Rate limiting
  const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'api');
  if (!rateLimitResult.allowed) {
    throw new ValidationError([{ field: 'rate_limit', message: 'Rate limit exceeded' }]);
  }

  // Workspace validation
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    throw new ValidationError([{ field: 'workspaceId', message: 'workspaceId parameter is required' }]);
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
  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
updates.name = name;
}
  if (primaryDomain !== undefined) {
updates.primaryDomain = primaryDomain;
}
  if (niches !== undefined) {
updates.niches = niches;
}
  if (locations !== undefined) {
updates.locations = locations;
}
  if (brandTone !== undefined) {
updates.brandTone = brandTone;
}
  if (expertiseTags !== undefined) {
updates.expertiseTags = expertiseTags;
}
  if (valueProps !== undefined) {
updates.valueProps = valueProps;
}
  if (gmbListingIds !== undefined) {
updates.gmbListingIds = gmbListingIds;
}
  if (socialChannels !== undefined) {
updates.socialChannels = socialChannels;
}

  // Update client profile
  const profile = await updateClientProfile(id, workspaceId, updates);

  return successResponse({ profile }, undefined, 'Client profile updated successfully');
});

/**
 * DELETE /api/aido/clients/[id]
 * Delete a client profile (cascades to all related data)
 */
export const DELETE = withErrorBoundary(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  // Authentication
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new AuthenticationError();
  }

  const { data, error } = await supabaseBrowser.auth.getUser(token);

  if (error || !data.user) {
    throw new AuthenticationError();
  }

  // Rate limiting
  const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'api');
  if (!rateLimitResult.allowed) {
    throw new ValidationError([{ field: 'rate_limit', message: 'Rate limit exceeded' }]);
  }

  // Workspace validation
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    throw new ValidationError([{ field: 'workspaceId', message: 'workspaceId parameter is required' }]);
  }

  // Delete client profile
  await deleteClientProfile(id, workspaceId);

  return successResponse(undefined, undefined, 'Client profile deleted successfully', 200);
});
