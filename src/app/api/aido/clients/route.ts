/**
 * AIDO Client Profiles API
 * POST /api/aido/clients - Create new client profile
 * GET /api/aido/clients - List all client profiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkTierRateLimit } from '@/lib/rate-limit-tiers';
import {
  successResponse,
  errorResponse,
  validationError,
} from '@/lib/api-helpers';
import {
  createClientProfile,
  getClientProfiles,
  type ClientProfileInput,
} from '@/lib/aido/database/client-profiles';

/**
 * POST /api/aido/clients
 * Create a new client profile for AIDO system
 */
export async function POST(req: NextRequest) {
  try {
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

    // Rate limiting (AI endpoint)
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
      orgId,
      niches,
      locations,
      brandTone,
      expertiseTags,
      valueProps,
      gmbListingIds,
      socialChannels,
    } = body;

    // Validation
    const requiredErrors = {
      ...(!name && { name: 'name is required' }),
      ...(!primaryDomain && { primaryDomain: 'primaryDomain is required' }),
      ...(!orgId && { orgId: 'orgId is required' }),
    };

    if (Object.keys(requiredErrors).length > 0) {
      return validationError(requiredErrors);
    }

    // Create client profile
    const profile = await createClientProfile({
      workspaceId,
      orgId,
      name,
      primaryDomain,
      niches,
      locations,
      brandTone,
      expertiseTags,
      valueProps,
      gmbListingIds,
      socialChannels,
    });

    return successResponse(
      { profile },
      undefined,
      'Client profile created successfully',
      201
    );
  } catch (error) {
    console.error('[AIDO] Error creating client profile:', error);
    if (error instanceof Error) {
      return errorResponse(error.message, 500);
    }
    return errorResponse('Internal server error', 500);
  }
}

/**
 * GET /api/aido/clients
 * List all client profiles for a workspace
 */
export async function GET(req: NextRequest) {
  try {
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

    // Fetch client profiles
    const profiles = await getClientProfiles(workspaceId);

    return successResponse(
      { profiles },
      { count: profiles.length, total: profiles.length }
    );
  } catch (error) {
    console.error('[AIDO] Error fetching client profiles:', error);
    if (error instanceof Error) {
      return errorResponse(error.message, 500);
    }
    return errorResponse('Internal server error', 500);
  }
}
