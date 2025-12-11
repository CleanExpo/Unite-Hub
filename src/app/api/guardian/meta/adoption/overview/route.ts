import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  // Load latest adoption scores for all dimensions/subdimensions
  const { data: scores, error } = await supabase
    .from('guardian_adoption_scores')
    .select('*')
    .eq('tenant_id', workspaceId)
    .order('computed_at', { ascending: false })
    .limit(15); // One per subdimension

  if (error) throw error;

  // Group by dimension for response
  const dimensions = new Map<
    string,
    Array<{
      dimension: string;
      sub_dimension: string;
      score: number;
      status: string;
      signals: Record<string, any>;
    }>
  >();

  scores.forEach((score) => {
    const key = score.dimension;
    if (!dimensions.has(key)) {
      dimensions.set(key, []);
    }
    dimensions.get(key)!.push({
      dimension: score.dimension,
      sub_dimension: score.sub_dimension,
      score: score.score,
      status: score.status,
      signals: score.signals || {},
    });
  });

  // Find most recent computed_at timestamp
  const computedAt = scores.length > 0 ? scores[0].computed_at : new Date().toISOString();

  return successResponse({
    computed_at: computedAt,
    dimensions: Array.from(dimensions.entries()).map(([dimension, subdimensions]) => ({
      dimension,
      subdimensions,
    })),
  });
});
