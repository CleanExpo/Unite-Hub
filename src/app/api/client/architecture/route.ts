import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  generateInformationArchitecture,
  generateArchitectureDocumentation,
  generateBreadcrumbListSchema,
  generateServiceSchema,
  type ArchitectureConfig,
  type ServiceCategory,
} from '@/lib/schema/information-architecture';

/**
 * POST /api/client/architecture?workspaceId={id}
 *
 * Generate optimal information architecture for a service business
 *
 * Request body:
 *   - businessName: string
 *   - serviceCategory: ServiceCategory
 *   - primaryServices: string[]
 *   - locations: string[]
 *   - contentDepth: 'basic' | 'intermediate' | 'advanced'
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const {
    businessName,
    serviceCategory,
    primaryServices = [],
    locations = [],
    contentDepth = 'intermediate',
  } = body;

  // Validate required fields
  if (!businessName || !serviceCategory) {
    return errorResponse('businessName and serviceCategory are required', 400);
  }

  // Validate serviceCategory
  const validCategories = [
    'plumbing',
    'electrical',
    'hvac',
    'roofing',
    'cleaning',
    'landscaping',
    'dental',
    'medical',
    'legal',
    'automotive',
    'general',
  ];

  if (!validCategories.includes(serviceCategory)) {
    return errorResponse(
      `Invalid serviceCategory. Valid options: ${validCategories.join(', ')}`,
      400
    );
  }

  // Validate contentDepth
  if (!['basic', 'intermediate', 'advanced'].includes(contentDepth)) {
    return errorResponse('contentDepth must be basic, intermediate, or advanced', 400);
  }

  try {
    const config: ArchitectureConfig = {
      businessName,
      serviceCategory: serviceCategory as ServiceCategory,
      primaryServices,
      locations,
      contentDepth,
    };

    const architecture = generateInformationArchitecture(config);
    const documentation = generateArchitectureDocumentation(architecture);

    // Generate breadcrumb schema for hub page
    const breadcrumbSchema = generateBreadcrumbListSchema(architecture.breadcrumbStructure);

    // Generate service schema for hub page
    const serviceSchema = generateServiceSchema({
      serviceName: `${businessName} ${serviceCategory}`,
      description: `Professional ${serviceCategory} services provided by ${businessName}`,
      businessName,
      url: architecture.hubUrl,
      areaServed: locations.length > 0 ? locations : undefined,
    });

    // Store architecture recommendation in database
    const supabase = getSupabaseServer();
    const { data: stored, error: storeError } = await supabase
      .from('architecture_recommendations')
      .insert({
        workspace_id: workspaceId,
        business_name: businessName,
        service_category: serviceCategory,
        architecture_data: architecture,
        documentation,
        breadcrumb_schema: breadcrumbSchema,
        service_schema: serviceSchema,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (storeError) {
      console.error('Failed to store architecture recommendation:', storeError);
      // Don't fail - still return the generated architecture
    }

    return successResponse({
      architecture,
      documentation,
      schemas: {
        breadcrumbList: breadcrumbSchema,
        service: serviceSchema,
      },
      implementation: {
        totalEstimatedPages: architecture.estimatedTotalPages,
        primaryFolders: architecture.spokes
          .filter((s) => s.path.includes('{service}') || s.path.startsWith('/services'))
          .map((s) => s.path)
          .slice(0, 6),
        internalLinkingRules: architecture.internalLinkingStrategy,
      },
      contentDepthScore: architecture.contentDepthScore,
      message: `Generated ${architecture.estimatedTotalPages}-page information architecture`,
    });
  } catch (error) {
    console.error('Failed to generate architecture:', error);
    return errorResponse(
      `Failed to generate architecture: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
});

/**
 * GET /api/client/architecture?workspaceId={id}
 *
 * Fetch stored architecture recommendations
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();
  const { data: recommendations, error } = await supabase
    .from('architecture_recommendations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    return errorResponse(`Failed to fetch recommendations: ${error.message}`, 500);
  }

  return successResponse({
    recommendations: recommendations || [],
    count: recommendations?.length || 0,
  });
});
