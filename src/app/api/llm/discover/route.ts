// src/app/api/llm/discover/route.ts
// Discover new models

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
    }

    const { runModelScout, MODEL_REGISTRY } = await import('@/lib/llm/orchestrator');

    // Get current prices
    const previousPrices = new Map<string, { input: number; output: number }>();
    for (const model of Object.values(MODEL_REGISTRY)) {
      previousPrices.set(model.openrouter_slug, {
        input: model.pricing.input_per_million,
        output: model.pricing.output_per_million,
      });
    }

    const currentUsage = new Map<string, { task: string; monthly_cost: number }>();

    const report = await runModelScout(apiKey, previousPrices, currentUsage);

    return NextResponse.json({
      success: true,
      new_models: report.new_models,
      price_changes: report.price_changes,
      recommended_swaps: report.recommended_swaps,
      cost_savings_potential: report.cost_savings_potential_monthly,
      timestamp: report.timestamp,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[API] Discovery error:', error);
    return NextResponse.json(
      { error: 'Failed to run discovery', details: String(error) },
      { status: 500 }
    );
  }
}
