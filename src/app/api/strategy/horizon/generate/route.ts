/**
 * POST /api/strategy/horizon/generate
 * Generate a new horizon plan with steps and dependencies
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseBrowser, getSupabaseServer } from '@/lib/supabase';
import { longHorizonPlannerService, HorizonType } from '@/lib/strategy/longHorizonPlannerService';

const generateSchema = z.object({
  organization_id: z.string().uuid(),
  horizon_type: z.enum(['SHORT', 'MEDIUM', 'LONG', 'QUARTERLY', 'CUSTOM']),
  name: z.string().optional(),
  description: z.string().optional(),
  config: z.object({
    priorityDomains: z.array(z.string()).optional(),
    baselineKPIs: z.record(z.record(z.number())).optional(),
    targetKPIs: z.record(z.record(z.number())).optional(),
    maxParallelSteps: z.number().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const validation = generateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { organization_id, horizon_type, name, description, config } = validation.data;

    // Verify user has access to organization
    const supabase = await getSupabaseServer();
    const { data: membership, error: membershipError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', organization_id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate the plan
    const result = await longHorizonPlannerService.generatePlan(
      organization_id,
      horizon_type as HorizonType,
      config
    );

    // Update name/description if provided
    if (name || description) {
      await supabase
        .from('horizon_plans')
        .update({
          name: name || result.plan.name,
          description: description || result.plan.description,
        })
        .eq('id', result.plan.id);

      result.plan.name = name || result.plan.name;
      result.plan.description = description || result.plan.description;
    }

    return NextResponse.json({
      success: true,
      plan: result.plan,
      steps: result.steps,
      dependencies: result.dependencies,
      summary: {
        total_steps: result.steps.length,
        total_days: result.plan.days_total,
        domains: [...new Set(result.steps.map(s => s.domain))],
      },
    });
  } catch (error) {
    console.error('Horizon generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate horizon plan' },
      { status: 500 }
    );
  }
}
