/**
 * @fileoverview F07 Time-Block Orchestrator Service
 * Server-side only service for time block management
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("timeBlockService must only run on server");
}

export type TimeBlockCategory =
  | "deep_work"
  | "meetings"
  | "admin"
  | "strategic"
  | "learning"
  | "breaks"
  | "family"
  | "health"
  | "other";

export type TimeBlockAdherence =
  | "perfect"
  | "mostly_adhered"
  | "partially_adhered"
  | "not_adhered"
  | "rescheduled";

/**
 * Record time block
 */
export async function recordTimeBlock(args: {
  tenantId: string;
  label: string;
  plannedStart: Date;
  plannedEnd: Date;
  category?: TimeBlockCategory;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_time_block", {
    p_tenant_id: args.tenantId,
    p_label: args.label,
    p_planned_start: args.plannedStart.toISOString(),
    p_planned_end: args.plannedEnd.toISOString(),
    p_category: args.category || "other",
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record time block: ${error.message}`);
  return data;
}

/**
 * Complete time block
 */
export async function completeTimeBlock(args: {
  blockId: string;
  actualStart: Date;
  actualEnd: Date;
  adherence?: TimeBlockAdherence;
  outcomeQuality?: number;
  energyLevel?: number;
  notes?: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.rpc("complete_time_block", {
    p_block_id: args.blockId,
    p_actual_start: args.actualStart.toISOString(),
    p_actual_end: args.actualEnd.toISOString(),
    p_adherence: args.adherence || null,
    p_outcome_quality: args.outcomeQuality ?? null,
    p_energy_level: args.energyLevel ?? null,
    p_notes: args.notes || null,
  });

  if (error) throw new Error(`Failed to complete time block: ${error.message}`);
}

/**
 * List time blocks
 */
export async function listTimeBlocks(
  tenantId: string,
  filters?: {
    category?: TimeBlockCategory;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_time_blocks", {
    p_tenant_id: tenantId,
    p_category: filters?.category || null,
    p_start_date: filters?.startDate?.toISOString() || null,
    p_end_date: filters?.endDate?.toISOString() || null,
    p_limit: filters?.limit || 200,
  });

  if (error) throw new Error(`Failed to list time blocks: ${error.message}`);
  return data || [];
}

/**
 * Get time block summary
 */
export async function getTimeBlockSummary(tenantId: string, days: number = 7): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_time_block_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get time block summary: ${error.message}`);
  return data || {};
}
