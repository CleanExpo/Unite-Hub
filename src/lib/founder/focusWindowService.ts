/**
 * Founder Focus Window Service (F24)
 * Predicts optimal founder focus periods based on energy, load, and momentum
 */

if (typeof window !== "undefined") {
  throw new Error("focusWindowService must only run on server");
}

import { supabaseAdmin } from "@/lib/supabase/admin";

export type FocusWindowLabel = 'peak-focus' | 'high-focus' | 'medium-focus' | 'low-focus' | 'recovery' | 'avoid';

export type FocusWindow = {
  id: string;
  window_label: FocusWindowLabel;
  start_time: string;
  end_time: string;
  certainty: number;
  confidence_score: number | null;
  contributing_metrics: Record<string, any>;
  energy_forecast: number | null;
  load_forecast: number | null;
  momentum_forecast: number | null;
  recommended_activities: string[] | null;
  activities_to_avoid: string[] | null;
  optimal_duration_minutes: number | null;
  created_at: string;
};

export type FocusWindowsSummary = {
  avg_certainty: number;
  peak_focus_count: number;
  high_focus_count: number;
  next_peak_window: {
    start_time: string;
    end_time: string;
    certainty: number;
  } | null;
  prediction_hours: number;
};

export async function calculateFocusWindows(args: {
  tenantId: string;
  predictionHours?: number;
}): Promise<string[]> {
  const { data, error } = await supabaseAdmin.rpc("calculate_focus_windows", {
    p_tenant_id: args.tenantId,
    p_prediction_hours: args.predictionHours || 48,
  });

  if (error) {
    throw new Error(`Failed to calculate focus windows: ${error.message}`);
  }

  return data || [];
}

export async function listFocusWindows(
  tenantId: string,
  filters?: {
    windowLabel?: FocusWindowLabel;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<FocusWindow[]> {
  const { data, error } = await supabaseAdmin.rpc("list_focus_windows", {
    p_tenant_id: tenantId,
    p_window_label: filters?.windowLabel || null,
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_limit: filters?.limit || 100,
  });

  if (error) {
    throw new Error(`Failed to list focus windows: ${error.message}`);
  }

  return data || [];
}

export async function getFocusWindowsSummary(
  tenantId: string,
  hours: number = 48
): Promise<FocusWindowsSummary> {
  const { data, error } = await supabaseAdmin.rpc("get_focus_windows_summary", {
    p_tenant_id: tenantId,
    p_hours: hours,
  });

  if (error) {
    throw new Error(`Failed to get focus windows summary: ${error.message}`);
  }

  return data || null;
}
