// src/app/api/llm/models/route.ts
// Get model registry

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { MODEL_REGISTRY, TASK_ROUTING } = await import('@/lib/llm/orchestrator');

    const models = Object.values(MODEL_REGISTRY).map((model) => ({
      id: model.id,
      label: model.label,
      provider: model.provider,
      family: model.family,
      quality_score: model.quality_score,
      speed_score: model.speed_score,
      value_score: model.value_score,
      cost_tier: model.cost_tier,
      pricing: model.pricing,
      capabilities: model.capabilities,
      recommended_roles: model.recommended_roles,
    }));

    const taskTypes = Object.entries(TASK_ROUTING).map(([id, config]) => ({
      id,
      description: config.description,
      min_quality_score: config.min_quality_score,
      priority_models: config.priority_models,
      cost_ceiling: config.cost_ceiling_per_1k_tokens,
    }));

    return NextResponse.json({
      success: true,
      models,
      task_types: taskTypes,
      total_models: models.length,
    });
  } catch (error) {
     
    console.error('[API] Models error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models', details: String(error) },
      { status: 500 }
    );
  }
}
