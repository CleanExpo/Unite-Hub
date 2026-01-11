import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { generateMultiPlatformSchema, type Platform } from '@/lib/schema/multi-platform-generator';
import { generateAuthorProfile, calculateE2EATScores } from '@/lib/schema/author-attribution';
import { publishContribution } from '@/lib/services/client-contribution';

/**
 * GET /api/client/contributions/[id]/schema?workspaceId={id}&platforms={platforms}
 *
 * Get generated schemas for a contribution
 *
 * Query parameters:
 *   - platforms: comma-separated list of platforms (google, chatgpt, perplexity, bing, claude, gemini)
 *                if not specified, returns all platforms
 *
 * Response: { success: true, schemas: Record<Platform, GeneratedSchema> }
 */
export const GET = withErrorBoundary(async (req: NextRequest, context: any) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const platformsParam = req.nextUrl.searchParams.get('platforms');

  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  // Validate user and workspace
  const { user } = await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  // Get contribution with schema
  const { data: contribution, error } = await supabase
    .from('client_contributions')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !contribution) {
    return errorResponse('Contribution not found', 404);
  }

  // Verify ownership
  if (contribution.client_user_id !== user.id) {
    return errorResponse('Unauthorized: You do not own this contribution', 403);
  }

  // Parse requested platforms
  let requestedPlatforms: Platform[] = ['google', 'chatgpt', 'perplexity', 'bing', 'claude', 'gemini'];
  if (platformsParam) {
    requestedPlatforms = platformsParam
      .split(',')
      .map((p) => p.trim() as Platform)
      .filter((p) => ['google', 'chatgpt', 'perplexity', 'bing', 'claude', 'gemini'].includes(p));
  }

  // If schema already generated, return it
  if (contribution.schema_generated && Object.keys(contribution.schema_generated).length > 0) {
    const schemas = Object.fromEntries(
      Object.entries(contribution.schema_generated).filter(([platform]) =>
        requestedPlatforms.includes(platform as Platform)
      )
    );

    return successResponse({
      schemas,
      cached: true,
      generatedAt: contribution.updated_at,
    });
  }

  return errorResponse('No schemas generated yet. Call POST to generate.', 404);
});

/**
 * POST /api/client/contributions/[id]/schema?workspaceId={id}
 *
 * Generate and save schemas for a contribution
 *
 * Request body (optional):
 *   - businessContext: Custom business information
 *   - platforms: Array of platform strings to generate
 *
 * Response: { success: true, schemas: Record<Platform, GeneratedSchema>, published: boolean }
 */
export const POST = withErrorBoundary(async (req: NextRequest, context: any) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  // Validate user and workspace
  const { user } = await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  // Get contribution
  const { data: contribution, error } = await supabase
    .from('client_contributions')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !contribution) {
    return errorResponse('Contribution not found', 404);
  }

  // Verify ownership
  if (contribution.client_user_id !== user.id) {
    return errorResponse('Unauthorized: You do not own this contribution', 403);
  }

  // Get client user info for author attribution
  const { data: clientUser } = await supabase
    .from('client_users')
    .select('*')
    .eq('id', contribution.client_user_id)
    .single();

  // Get workspace for business context
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();

  // Parse request body
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    // No body is OK
  }

  // Generate schemas
  try {
    const schemas = await generateMultiPlatformSchema({
      platform: 'google', // Will generate for all platforms
      contentType: mapContributionTypeToContentType(contribution.contribution_type),
      clientMedia: {
        id: contribution.id,
        workspace_id: workspaceId,
        contribution_type: contribution.contribution_type,
        content_text: contribution.content_text,
        media_file_id: contribution.media_file_id,
        public_url: contribution.published_url,
        transcript: contribution.content_text, // Simplified - would come from Whisper in real implementation
        analysis: body.analysis,
      },
      businessContext: body.businessContext || {
        businessName: workspace?.name || 'Business',
        industry: 'Service',
        serviceCategory: 'Professional Services',
        location: 'USA',
        ownerName: clientUser?.user_metadata?.name || 'Owner',
        ownerTitle: 'Business Owner',
        businessUrl: 'https://example.com',
      },
      timestamp: new Date().toISOString(),
    });

    // Save schemas to database
    const { data: updated, error: updateError } = await supabase
      .from('client_contributions')
      .update({
        schema_generated: schemas,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Generate author profile with E.E.A.T. scores
    const authorProfile = generateAuthorProfile({
      name: clientUser?.user_metadata?.name || 'Customer',
      type: 'customer',
      businessName: workspace?.name || 'Business',
      yearsOfExperience: 1,
      mediaType: contribution.contribution_type,
    });

    const e2eatScores = calculateE2EATScores({
      name: clientUser?.user_metadata?.name || 'Customer',
      type: 'customer',
      businessName: workspace?.name || 'Business',
      mediaType: contribution.contribution_type,
    });

    return successResponse({
      contribution: updated,
      schemas,
      authorProfile,
      e2eatScores,
      message: `Schemas generated for ${Object.keys(schemas).length} platforms`,
    });
  } catch (error) {
    console.error('Schema generation failed:', error);
    return errorResponse(
      `Failed to generate schemas: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
});

/**
 * Helper: Map contribution type to schema content type
 */
function mapContributionTypeToContentType(
  contributionType: string
): 'review' | 'video' | 'image' | 'faq' | 'local-business' | 'person' {
  const map: Record<string, any> = {
    video: 'video',
    photo: 'image',
    voice: 'review',
    text: 'review',
    review: 'review',
    faq: 'faq',
  };
  return map[contributionType] || 'review';
}
