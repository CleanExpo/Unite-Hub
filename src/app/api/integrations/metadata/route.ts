/**
 * Integration Metadata API
 * GET /api/integrations/metadata
 * Returns integration priority, requirements, and recommendations
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { withErrorBoundary, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const businessType = req.nextUrl.searchParams.get('businessType') || 'small_business';

  const supabase = getSupabaseServer();

  // Fetch all active integrations
  const { data: integrations, error } = await supabase
    .from('integration_metadata')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    return errorResponse(`Failed to fetch integrations: ${error.message}`, 500);
  }

  // Filter recommendations by business type
  const recommendations = integrations.filter(
    (integration) =>
      integration.recommended_for_business_types?.includes(businessType) ||
      integration.priority === 'required'
  );

  return successResponse({
    all: integrations,
    recommendations,
    byCategory: groupByCategory(integrations),
    byPriority: groupByPriority(integrations),
  });
});

function groupByCategory(integrations: any[]) {
  const grouped: Record<string, any[]> = {};

  integrations.forEach((integration) => {
    const category = integration.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(integration);
  });

  return grouped;
}

function groupByPriority(integrations: any[]) {
  return {
    required: integrations.filter(i => i.priority === 'required'),
    recommended: integrations.filter(i => i.priority === 'recommended'),
    optional: integrations.filter(i => i.priority === 'optional'),
  };
}
