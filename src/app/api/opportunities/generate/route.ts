/**
 * Opportunities Generate API
 * Phase 95: Force-generate new opportunity windows (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  generateWindow,
  saveWindow,
  runDailyPredictiveSweep,
  generateWindowsForRegion,
  generateWindowsForClient,
} from '@/lib/predictive';
import type { OpportunityContext, WindowType } from '@/lib/predictive';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      tenantId,
      regionId,
      clientId,
      windowType = '7_day',
      runFullSweep = false,
    } = body;

    // Run full sweep for all tenants
    if (runFullSweep) {
      const result = await runDailyPredictiveSweep();
      return NextResponse.json({
        success: true,
        type: 'full_sweep',
        ...result,
      });
    }

    // Generate for specific region
    if (regionId && !tenantId && !clientId) {
      const result = await generateWindowsForRegion(regionId);
      return NextResponse.json({
        success: true,
        type: 'region',
        regionId,
        ...result,
      });
    }

    // Generate for specific client
    if (clientId && tenantId) {
      const result = await generateWindowsForClient(clientId, tenantId);
      return NextResponse.json({
        success: true,
        type: 'client',
        clientId,
        ...result,
      });
    }

    // Generate for tenant with specific window type
    if (tenantId) {
      const context: OpportunityContext = {
        tenantId,
        regionId: regionId || undefined,
        windowType: windowType as WindowType,
      };

      const windows = await generateWindow(context);

      // Save top opportunities
      const savedWindows = [];
      for (const window of windows.slice(0, 5)) {
        const saved = await saveWindow(window, context);
        savedWindows.push(saved);
      }

      return NextResponse.json({
        success: true,
        type: 'tenant',
        tenantId,
        windowType,
        generated: windows.length,
        saved: savedWindows.length,
        windows: savedWindows,
      });
    }

    return NextResponse.json(
      { error: 'tenantId, regionId, or runFullSweep required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to generate opportunities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
