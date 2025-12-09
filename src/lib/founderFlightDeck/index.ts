/**
 * Founder Flight Deck v2
 * Phase 108: Unified executive cockpit
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface WidgetConfig {
  id: string;
  type: string;
  position: { x: number; y: number; w: number; h: number };
  settings: Record<string, unknown>;
}

export interface FlightDeckLayout {
  id: string;
  tenantId: string | null;
  userId: string;
  layoutConfig: {
    columns: number;
    rows: number;
    widgets: WidgetConfig[];
  };
  widgetStates: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export async function getLayout(userId: string, tenantId?: string): Promise<FlightDeckLayout | null> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('flight_deck_layouts')
    .select('*')
    .eq('user_id', userId);

  if (tenantId) {
query = query.eq('tenant_id', tenantId);
}

  const { data } = await query.single();

  if (!data) {
return null;
}

  return {
    id: data.id,
    tenantId: data.tenant_id,
    userId: data.user_id,
    layoutConfig: data.layout_config,
    widgetStates: data.widget_states,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function saveLayout(
  userId: string,
  layoutConfig: FlightDeckLayout['layoutConfig'],
  tenantId?: string
): Promise<FlightDeckLayout | null> {
  const supabase = await getSupabaseServer();

  const { data: existing } = await supabase
    .from('flight_deck_layouts')
    .select('id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId || null)
    .single();

  let data;
  let error;

  if (existing) {
    const result = await supabase
      .from('flight_deck_layouts')
      .update({
        layout_config: layoutConfig,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
    data = result.data;
    error = result.error;
  } else {
    const result = await supabase
      .from('flight_deck_layouts')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        layout_config: layoutConfig,
        widget_states: {},
      })
      .select()
      .single();
    data = result.data;
    error = result.error;
  }

  if (error || !data) {
return null;
}

  return {
    id: data.id,
    tenantId: data.tenant_id,
    userId: data.user_id,
    layoutConfig: data.layout_config,
    widgetStates: data.widget_states,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export function getDefaultLayout(): FlightDeckLayout['layoutConfig'] {
  return {
    columns: 12,
    rows: 8,
    widgets: [
      { id: 'navigator', type: 'navigator', position: { x: 0, y: 0, w: 6, h: 3 }, settings: {} },
      { id: 'alignment', type: 'alignment', position: { x: 6, y: 0, w: 6, h: 3 }, settings: {} },
      { id: 'opportunities', type: 'opportunities', position: { x: 0, y: 3, w: 4, h: 3 }, settings: {} },
      { id: 'load', type: 'load', position: { x: 4, y: 3, w: 4, h: 3 }, settings: {} },
      { id: 'market', type: 'market', position: { x: 8, y: 3, w: 4, h: 3 }, settings: {} },
    ],
  };
}
