/**
 * Scaling Mode Config API
 * Phase 86: Get and update scaling mode configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getConfig,
  updateConfig,
  setCurrentMode,
  setAutoModeEnabled,
} from '@/lib/scalingMode';
import { logEvent } from '@/lib/scalingMode/scalingHistoryService';

export async function GET(req: NextRequest) {
  try {
    const environment = req.nextUrl.searchParams.get('environment') || 'production';

    const config = await getConfig(environment);

    if (!config) {
      return NextResponse.json(
        { error: 'Config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: config });
  } catch (error) {
    console.error('Scaling config API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { environment = 'production', action, ...updates } = body;

    // Handle specific actions
    if (action === 'set_mode') {
      const config = await setCurrentMode(environment, updates.mode);

      await logEvent(
        environment,
        'mode_change',
        `Mode manually changed to ${updates.mode}`,
        'founder',
        undefined,
        { old_mode: body.old_mode, new_mode: updates.mode }
      );

      return NextResponse.json({
        data: config,
        message: `Mode changed to ${updates.mode}`,
      });
    }

    if (action === 'set_auto_mode') {
      const config = await setAutoModeEnabled(environment, updates.enabled);

      await logEvent(
        environment,
        'config_update',
        `Auto mode ${updates.enabled ? 'enabled' : 'disabled'}`,
        'founder'
      );

      return NextResponse.json({
        data: config,
        message: `Auto mode ${updates.enabled ? 'enabled' : 'disabled'}`,
      });
    }

    // General update
    const config = await updateConfig(environment, updates);

    await logEvent(
      environment,
      'config_update',
      'Configuration updated',
      'founder'
    );

    return NextResponse.json({
      data: config,
      message: 'Configuration updated',
    });
  } catch (error) {
    console.error('Scaling config API error:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}
