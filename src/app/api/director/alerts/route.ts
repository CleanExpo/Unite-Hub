/**
 * Director Alerts API
 * Phase 60: Get active alerts and risks
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIDirectorEngine } from '@/lib/director/aiDirectorEngine';
import { AIDirectorRiskEngine } from '@/lib/director/aiDirectorRiskEngine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');

    const director = new AIDirectorEngine();
    const riskEngine = new AIDirectorRiskEngine();

    // Get all active alerts
    let alerts = await director.getActiveAlerts();

    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter((a) => a.severity === severity);
    }

    // Filter by category if specified
    if (category) {
      alerts = alerts.filter((a) => a.category === category);
    }

    // Group by severity for summary
    const summary = {
      critical: alerts.filter((a) => a.severity === 'critical').length,
      high: alerts.filter((a) => a.severity === 'high').length,
      medium: alerts.filter((a) => a.severity === 'medium').length,
      low: alerts.filter((a) => a.severity === 'low').length,
      total: alerts.length,
    };

    return NextResponse.json({
      data: {
        alerts,
        summary,
      },
      filters: {
        severity: severity || 'all',
        category: category || 'all',
      },
    });
  } catch (error) {
    console.error('Director alerts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client_id, action } = body;

    if (!client_id || !action) {
      return NextResponse.json(
        { error: 'client_id and action required' },
        { status: 400 }
      );
    }

    // Log action taken on alert
    // In production, would store this in database
    console.log(`Director alert action: ${action} for client ${client_id}`);

    return NextResponse.json({
      success: true,
      message: `Action "${action}" recorded for client ${client_id}`,
    });
  } catch (error) {
    console.error('Director alerts POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
