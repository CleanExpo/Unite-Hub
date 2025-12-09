/**
 * Adaptive Strategies API
 * Phase: D72 - Unite Runtime Adaptive Orchestrator
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createAdaptiveStrategy,
  listAdaptiveStrategies,
  getAdaptiveStrategy,
  updateAdaptiveStrategy,
  deleteAdaptiveStrategy,
  type AdaptiveStrategy,
} from '@/lib/unite/runtimeOrchestratorService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user_organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const strategyId = request.nextUrl.searchParams.get('strategy_id');

    // Get single strategy
    if (strategyId) {
      const strategy = await getAdaptiveStrategy(strategyId);
      if (!strategy) {
        return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
      }
      // Verify tenant access
      if (strategy.tenant_id && strategy.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ strategy });
    }

    // List strategies with filters
    const filters = {
      tenant_id: tenantId,
      is_active: request.nextUrl.searchParams.get('is_active') === 'true' || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const strategies = await listAdaptiveStrategies(filters);
    return NextResponse.json({ strategies });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user_organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const body = await request.json();
    const {
      action,
      strategy_id,
      name,
      description,
      trigger_conditions,
      actions,
      evaluation_mode,
      priority,
      is_active,
    } = body;

    // Create strategy
    if (action === 'create') {
      if (!name || !trigger_conditions || !actions) {
        return NextResponse.json(
          { error: 'name, trigger_conditions, and actions are required' },
          { status: 400 }
        );
      }

      const strategy = await createAdaptiveStrategy({
        name,
        description,
        trigger_conditions,
        actions,
        evaluation_mode: evaluation_mode || 'side-effect-free',
        priority: priority || 0,
        is_active: is_active !== undefined ? is_active : true,
        tenant_id: tenantId,
      });

      return NextResponse.json({ strategy }, { status: 201 });
    }

    // Update strategy
    if (action === 'update') {
      if (!strategy_id) {
        return NextResponse.json(
          { error: 'strategy_id is required for update' },
          { status: 400 }
        );
      }

      // Verify tenant access
      const existing = await getAdaptiveStrategy(strategy_id);
      if (!existing) {
        return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
      }
      if (existing.tenant_id && existing.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updates: Partial<Omit<AdaptiveStrategy, 'id' | 'created_at' | 'updated_at'>> = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (trigger_conditions) updates.trigger_conditions = trigger_conditions;
      if (actions) updates.actions = actions;
      if (evaluation_mode) updates.evaluation_mode = evaluation_mode;
      if (priority !== undefined) updates.priority = priority;
      if (is_active !== undefined) updates.is_active = is_active;

      const strategy = await updateAdaptiveStrategy(strategy_id, updates);
      return NextResponse.json({ strategy });
    }

    // Delete strategy
    if (action === 'delete') {
      if (!strategy_id) {
        return NextResponse.json(
          { error: 'strategy_id is required for delete' },
          { status: 400 }
        );
      }

      // Verify tenant access
      const existing = await getAdaptiveStrategy(strategy_id);
      if (!existing) {
        return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
      }
      if (existing.tenant_id && existing.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await deleteAdaptiveStrategy(strategy_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process strategy operation' },
      { status: 500 }
    );
  }
}
