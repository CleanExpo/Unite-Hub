/**
 * Schema Drift Service
 * Phase: D77 - Unite Schema Drift & Auto-Migration Engine
 *
 * Schema snapshot + drift detection. No auto-apply.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';

// ============================================================================
// TYPES
// ============================================================================

export interface SchemaSnapshot {
  id: string;
  snapshot: {
    tables: Record<
      string,
      {
        columns: Record<string, { type: string; nullable: boolean; default?: string }>;
        indexes: string[];
        constraints: string[];
      }
    >;
    relationships: Array<{
      source_table: string;
      source_column: string;
      target_table: string;
      target_column: string;
      type: 'foreign_key';
    }>;
  };
  tenant_id?: string;
  captured_at: string;
}

export interface SchemaDriftReport {
  id: string;
  differences: {
    added_tables?: string[];
    removed_tables?: string[];
    modified_columns?: Array<{
      table: string;
      column: string;
      old_type: string;
      new_type: string;
    }>;
    index_changes?: Array<{ table: string; change: 'added' | 'removed'; index: string }>;
  };
  recommended_actions?: {
    sql_statements: string[];
    risk_level: 'low' | 'medium' | 'high';
    rollback_plan: string[];
  };
  ai_reasoning?: {
    impact_assessment: string;
    breaking_changes: boolean;
    migration_strategy: string;
  };
  tenant_id?: string;
  generated_at: string;
}

// ============================================================================
// SNAPSHOT MANAGEMENT
// ============================================================================

export async function captureSchemaSnapshot(
  tenantId?: string | null
): Promise<SchemaSnapshot | null> {
  try {
    // Query information_schema for current schema
    // Simplified - real impl would query pg_catalog
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc('get_schema_info');

    if (tablesError) {
      // Fallback: create minimal snapshot
      const snapshot = {
        tables: {},
        relationships: [],
      };

      const { data, error } = await supabaseAdmin
        .from('unite_schema_snapshots')
        .insert({
          snapshot,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SchemaSnapshot;
    }

    const { data, error } = await supabaseAdmin
      .from('unite_schema_snapshots')
      .insert({
        snapshot: tables,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SchemaSnapshot;
  } catch (error) {
    console.error('[SchemaDrift] Snapshot capture failed:', error);
    return null;
  }
}

export async function listSnapshots(filters?: {
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<SchemaSnapshot[]> {
  let query = supabaseAdmin
    .from('unite_schema_snapshots')
    .select('*')
    .order('captured_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.start_date) query = query.gte('captured_at', filters.start_date);
  if (filters?.end_date) query = query.lte('captured_at', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`List snapshots failed: ${error.message}`);
  return data as SchemaSnapshot[];
}

export async function getLatestSnapshot(tenantId?: string | null): Promise<SchemaSnapshot | null> {
  let query = supabaseAdmin
    .from('unite_schema_snapshots')
    .select('*')
    .order('captured_at', { ascending: false })
    .limit(1);

  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Get latest snapshot failed: ${error.message}`);
  }

  return data as SchemaSnapshot;
}

// ============================================================================
// DRIFT DETECTION
// ============================================================================

function detectSchemaDrift(
  oldSnapshot: SchemaSnapshot['snapshot'],
  newSnapshot: SchemaSnapshot['snapshot']
): SchemaDriftReport['differences'] {
  const differences: SchemaDriftReport['differences'] = {};

  const oldTables = Object.keys(oldSnapshot.tables);
  const newTables = Object.keys(newSnapshot.tables);

  // Detect added tables
  const addedTables = newTables.filter((t) => !oldTables.includes(t));
  if (addedTables.length > 0) differences.added_tables = addedTables;

  // Detect removed tables
  const removedTables = oldTables.filter((t) => !newTables.includes(t));
  if (removedTables.length > 0) differences.removed_tables = removedTables;

  // Detect column changes
  const modifiedColumns: SchemaDriftReport['differences']['modified_columns'] = [];
  const commonTables = oldTables.filter((t) => newTables.includes(t));

  commonTables.forEach((table) => {
    const oldCols = oldSnapshot.tables[table].columns;
    const newCols = newSnapshot.tables[table].columns;

    Object.keys(oldCols).forEach((col) => {
      if (newCols[col] && oldCols[col].type !== newCols[col].type) {
        modifiedColumns.push({
          table,
          column: col,
          old_type: oldCols[col].type,
          new_type: newCols[col].type,
        });
      }
    });
  });

  if (modifiedColumns.length > 0) differences.modified_columns = modifiedColumns;

  // Index changes (simplified)
  const indexChanges: SchemaDriftReport['differences']['index_changes'] = [];
  commonTables.forEach((table) => {
    const oldIndexes = oldSnapshot.tables[table].indexes;
    const newIndexes = newSnapshot.tables[table].indexes;

    newIndexes.forEach((idx) => {
      if (!oldIndexes.includes(idx)) {
        indexChanges.push({ table, change: 'added', index: idx });
      }
    });

    oldIndexes.forEach((idx) => {
      if (!newIndexes.includes(idx)) {
        indexChanges.push({ table, change: 'removed', index: idx });
      }
    });
  });

  if (indexChanges.length > 0) differences.index_changes = indexChanges;

  return differences;
}

async function aiAnalyzeDrift(
  differences: SchemaDriftReport['differences']
): Promise<{
  recommended_actions: SchemaDriftReport['recommended_actions'];
  ai_reasoning: SchemaDriftReport['ai_reasoning'];
}> {
  const client = getAnthropicClient();

  const prompt = `Analyze schema drift and recommend migration strategy:

**Detected Differences:**
- Added tables: ${differences.added_tables?.join(', ') || 'none'}
- Removed tables: ${differences.removed_tables?.join(', ') || 'none'}
- Modified columns: ${JSON.stringify(differences.modified_columns, null, 2)}
- Index changes: ${JSON.stringify(differences.index_changes, null, 2)}

**Analysis Required:**
1. Assess impact on existing data + code
2. Identify breaking changes
3. Recommend migration strategy (SQL statements)
4. Provide rollback plan
5. Risk level: low | medium | high

Respond in JSON:
{
  "recommended_actions": {
    "sql_statements": ["statement1", "statement2"],
    "risk_level": "low|medium|high",
    "rollback_plan": ["step1", "step2"]
  },
  "ai_reasoning": {
    "impact_assessment": "string",
    "breaking_changes": boolean,
    "migration_strategy": "string"
  }
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  const responseText = content.type === 'text' ? content.text : '';

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const result = jsonMatch
    ? JSON.parse(jsonMatch[0])
    : {
        recommended_actions: {
          sql_statements: [],
          risk_level: 'high',
          rollback_plan: ['Manual rollback required'],
        },
        ai_reasoning: {
          impact_assessment: 'Unable to parse AI response',
          breaking_changes: true,
          migration_strategy: 'Manual review required',
        },
      };

  return result;
}

export async function detectAndReportDrift(
  baseSnapshotId: string,
  compareSnapshotId: string,
  tenantId?: string | null
): Promise<SchemaDriftReport | null> {
  try {
    // Get snapshots
    const { data: baseSnapshot, error: baseError } = await supabaseAdmin
      .from('unite_schema_snapshots')
      .select('*')
      .eq('id', baseSnapshotId)
      .single();

    const { data: compareSnapshot, error: compareError } = await supabaseAdmin
      .from('unite_schema_snapshots')
      .select('*')
      .eq('id', compareSnapshotId)
      .single();

    if (baseError || compareError) {
      throw new Error('Snapshots not found');
    }

    // Detect drift
    const differences = detectSchemaDrift(
      baseSnapshot.snapshot,
      compareSnapshot.snapshot
    );

    // AI analysis
    const { recommended_actions, ai_reasoning } = await aiAnalyzeDrift(differences);

    // Create report
    const { data, error } = await supabaseAdmin
      .from('unite_schema_drift_reports')
      .insert({
        differences,
        recommended_actions,
        ai_reasoning,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SchemaDriftReport;
  } catch (error) {
    console.error('[SchemaDrift] Detection failed:', error);
    return null;
  }
}

export async function listDriftReports(filters?: {
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<SchemaDriftReport[]> {
  let query = supabaseAdmin
    .from('unite_schema_drift_reports')
    .select('*')
    .order('generated_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.start_date) query = query.gte('generated_at', filters.start_date);
  if (filters?.end_date) query = query.lte('generated_at', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`List drift reports failed: ${error.message}`);
  return data as SchemaDriftReport[];
}
