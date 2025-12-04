// src/app/api/llm/cost-report/route.ts
// Get cost report

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In production, load from database
    // For now, return mock data structure
    const report = {
      daily_spend: 0,
      monthly_spend: 0,
      monthly_budget: parseFloat(process.env.MONTHLY_BUDGET_USD || '500'),
      budget_remaining: parseFloat(process.env.MONTHLY_BUDGET_USD || '500'),
      by_model: {} as Record<string, number>,
      by_task: {} as Record<string, number>,
      last_updated: new Date().toISOString(),
    };

    return NextResponse.json(report);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[API] Cost report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: String(error) },
      { status: 500 }
    );
  }
}
