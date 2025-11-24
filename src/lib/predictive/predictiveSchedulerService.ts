/**
 * Predictive Scheduler Service
 * Phase 95: Daily predictive job to refresh all windows
 */

import { getSupabaseServer } from '@/lib/supabase';
import { generateWindow, saveWindow } from './opportunityWindowService';
import type { WindowType, OpportunityContext } from './predictiveTypes';

interface SweepResult {
  tenantId: string;
  windowsGenerated: number;
  errors: string[];
}

/**
 * Run daily predictive sweep for all tenants
 */
export async function runDailyPredictiveSweep(): Promise<{
  totalTenants: number;
  totalWindowsGenerated: number;
  results: SweepResult[];
}> {
  const supabase = await getSupabaseServer();
  const results: SweepResult[] = [];

  // Get all active tenants (agencies)
  const { data: tenants, error: tenantsError } = await supabase
    .from('agencies')
    .select('id')
    .eq('is_active', true)
    .limit(100);

  if (tenantsError || !tenants) {
    console.error('Failed to fetch tenants:', tenantsError);
    return {
      totalTenants: 0,
      totalWindowsGenerated: 0,
      results: [],
    };
  }

  // Expire old windows first
  await supabase.rpc('expire_old_opportunity_windows');

  // Process each tenant
  for (const tenant of tenants) {
    const result = await generateWindowsForTenant(tenant.id);
    results.push(result);
  }

  const totalWindowsGenerated = results.reduce((sum, r) => sum + r.windowsGenerated, 0);

  console.log(`Daily sweep complete: ${totalWindowsGenerated} windows for ${tenants.length} tenants`);

  return {
    totalTenants: tenants.length,
    totalWindowsGenerated,
    results,
  };
}

/**
 * Generate windows for a single tenant
 */
async function generateWindowsForTenant(tenantId: string): Promise<SweepResult> {
  const windowTypes: WindowType[] = ['7_day', '14_day', '30_day'];
  let windowsGenerated = 0;
  const errors: string[] = [];

  for (const windowType of windowTypes) {
    try {
      const context: OpportunityContext = {
        tenantId,
        windowType,
      };

      const windows = await generateWindow(context);

      // Save top 3 opportunities per window type
      const topWindows = windows.slice(0, 3);

      for (const window of topWindows) {
        try {
          await saveWindow(window, context);
          windowsGenerated++;
        } catch (saveError) {
          errors.push(`Failed to save ${windowType} ${window.opportunityCategory}: ${saveError}`);
        }
      }
    } catch (genError) {
      errors.push(`Failed to generate ${windowType} windows: ${genError}`);
    }
  }

  return {
    tenantId,
    windowsGenerated,
    errors,
  };
}

/**
 * Generate windows for a specific region
 */
export async function generateWindowsForRegion(regionId: string): Promise<{
  windowsGenerated: number;
  errors: string[];
}> {
  const windowTypes: WindowType[] = ['7_day', '14_day', '30_day'];
  let windowsGenerated = 0;
  const errors: string[] = [];

  for (const windowType of windowTypes) {
    try {
      const context: OpportunityContext = {
        regionId,
        windowType,
      };

      const windows = await generateWindow(context);
      const topWindows = windows.slice(0, 3);

      for (const window of topWindows) {
        try {
          await saveWindow(window, context);
          windowsGenerated++;
        } catch (saveError) {
          errors.push(`Failed to save ${windowType}: ${saveError}`);
        }
      }
    } catch (genError) {
      errors.push(`Failed to generate ${windowType}: ${genError}`);
    }
  }

  return { windowsGenerated, errors };
}

/**
 * Generate windows for a specific client
 */
export async function generateWindowsForClient(
  clientId: string,
  tenantId: string
): Promise<{
  windowsGenerated: number;
  errors: string[];
}> {
  const windowTypes: WindowType[] = ['7_day', '14_day', '30_day'];
  let windowsGenerated = 0;
  const errors: string[] = [];

  for (const windowType of windowTypes) {
    try {
      const context: OpportunityContext = {
        clientId,
        tenantId,
        windowType,
      };

      const windows = await generateWindow(context);
      const topWindows = windows.slice(0, 2); // Fewer per client

      for (const window of topWindows) {
        try {
          await saveWindow(window, context);
          windowsGenerated++;
        } catch (saveError) {
          errors.push(`Failed to save ${windowType}: ${saveError}`);
        }
      }
    } catch (genError) {
      errors.push(`Failed to generate ${windowType}: ${genError}`);
    }
  }

  return { windowsGenerated, errors };
}

/**
 * Clean up old expired windows
 */
export async function cleanupExpiredWindows(daysOld: number = 90): Promise<number> {
  const supabase = await getSupabaseServer();

  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('opportunity_windows')
    .delete()
    .eq('status', 'expired')
    .lt('created_at', cutoff)
    .select('id');

  if (error) {
    console.error('Failed to cleanup windows:', error);
    return 0;
  }

  return data?.length || 0;
}
