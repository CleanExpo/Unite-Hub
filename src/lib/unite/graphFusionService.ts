/**
 * Graph Fusion Service
 * Phase: D73 - Unite Cross-System Graph Fusion
 *
 * Merge graph data from multiple sources with schema validation.
 * Track fusion operations and detect conflicts.
 * CRITICAL: Must validate schema consistency before merging.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';
import {
  createEntity,
  createRelationship,
  listEntities,
  listRelationships,
  type Entity,
  type Relationship,
} from './knowledgeGraphService';

// ============================================================================
// TYPES
// ============================================================================

export interface GraphSource {
  id: string;
  source: string;
  config?: {
    endpoint?: string;
    auth?: Record<string, unknown>;
    entity_mapping?: Record<string, string>;
    sync_interval?: number;
  };
  enabled: boolean;
  tenant_id?: string;
  created_at: string;
}

export interface FusionLog {
  id: string;
  source: string;
  operation: 'merge' | 'conflict' | 'rollback' | 'validate';
  diff?: {
    entities_added: number;
    relationships_added: number;
    conflicts: Array<{
      type: string;
      entity_id?: string;
      message: string;
    }>;
    schema_changes: string[];
  };
  tenant_id?: string;
  executed_at: string;
}

export interface FusionResult {
  success: boolean;
  entities_merged: number;
  relationships_merged: number;
  conflicts: Array<{
    type: string;
    entity_id?: string;
    message: string;
    suggested_resolution?: string;
  }>;
  log_id: string;
}

// ============================================================================
// SOURCE MANAGEMENT
// ============================================================================

export async function createGraphSource(
  input: Omit<GraphSource, 'id' | 'created_at'>
): Promise<GraphSource> {
  const { data, error } = await supabaseAdmin
    .from('unite_graph_sources')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create graph source: ${error.message}`);
  return data as GraphSource;
}

export async function listGraphSources(filters?: {
  tenant_id?: string;
  source?: string;
  enabled?: boolean;
  limit?: number;
}): Promise<GraphSource[]> {
  let query = supabaseAdmin
    .from('unite_graph_sources')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.source) query = query.eq('source', filters.source);
  if (filters?.enabled !== undefined) query = query.eq('enabled', filters.enabled);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list graph sources: ${error.message}`);
  return data as GraphSource[];
}

export async function getGraphSource(sourceId: string): Promise<GraphSource | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_graph_sources')
    .select('*')
    .eq('id', sourceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get graph source: ${error.message}`);
  }

  return data as GraphSource;
}

export async function updateGraphSource(
  sourceId: string,
  updates: Partial<Omit<GraphSource, 'id' | 'created_at'>>
): Promise<GraphSource> {
  const { data, error } = await supabaseAdmin
    .from('unite_graph_sources')
    .update(updates)
    .eq('id', sourceId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update graph source: ${error.message}`);
  return data as GraphSource;
}

export async function deleteGraphSource(sourceId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_graph_sources')
    .delete()
    .eq('id', sourceId);

  if (error) throw new Error(`Failed to delete graph source: ${error.message}`);
}

// ============================================================================
// FUSION OPERATIONS
// ============================================================================

export async function fuseGraphData(
  sourceId: string,
  data: {
    entities: Array<Omit<Entity, 'id' | 'created_at' | 'updated_at'>>;
    relationships: Array<Omit<Relationship, 'id' | 'created_at'>>;
  },
  tenantId: string | null
): Promise<FusionResult> {
  // Get source configuration
  const source = await getGraphSource(sourceId);
  if (!source) {
    throw new Error('Graph source not found');
  }

  if (!source.enabled) {
    throw new Error('Graph source is disabled');
  }

  // Validate schema consistency
  const validationResult = await validateSchemaConsistency(data.entities, tenantId);

  if (!validationResult.valid) {
    // Log validation failure
    await logFusionOperation(source.source, 'validate', {
      entities_added: 0,
      relationships_added: 0,
      conflicts: validationResult.conflicts,
      schema_changes: validationResult.schema_changes,
    }, tenantId);

    return {
      success: false,
      entities_merged: 0,
      relationships_merged: 0,
      conflicts: validationResult.conflicts,
      log_id: '',
    };
  }

  // Detect conflicts with existing graph data
  const conflicts = await detectConflicts(data.entities, data.relationships, tenantId);

  // Use AI to suggest conflict resolution if needed
  if (conflicts.length > 0) {
    const resolutions = await aiSuggestConflictResolution(conflicts);
    conflicts.forEach((conflict, i) => {
      conflict.suggested_resolution = resolutions[i];
    });
  }

  // Merge entities
  let entitiesMerged = 0;
  for (const entity of data.entities) {
    try {
      await createEntity(entity);
      entitiesMerged++;
    } catch (error) {
      console.error(`Failed to merge entity:`, error);
    }
  }

  // Merge relationships
  let relationshipsMerged = 0;
  for (const relationship of data.relationships) {
    try {
      await createRelationship(relationship);
      relationshipsMerged++;
    } catch (error) {
      console.error(`Failed to merge relationship:`, error);
    }
  }

  // Log fusion operation
  const { data: log } = await supabaseAdmin
    .from('unite_graph_fusion_log')
    .insert({
      source: source.source,
      operation: 'merge',
      diff: {
        entities_added: entitiesMerged,
        relationships_added: relationshipsMerged,
        conflicts,
        schema_changes: validationResult.schema_changes,
      },
      tenant_id: tenantId,
    })
    .select()
    .single();

  return {
    success: true,
    entities_merged: entitiesMerged,
    relationships_merged: relationshipsMerged,
    conflicts,
    log_id: log?.id || '',
  };
}

export async function listFusionLogs(filters?: {
  tenant_id?: string;
  source?: string;
  operation?: string;
  limit?: number;
}): Promise<FusionLog[]> {
  let query = supabaseAdmin
    .from('unite_graph_fusion_log')
    .select('*')
    .order('executed_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.source) query = query.eq('source', filters.source);
  if (filters?.operation) query = query.eq('operation', filters.operation);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list fusion logs: ${error.message}`);
  return data as FusionLog[];
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

async function validateSchemaConsistency(
  entities: Array<Omit<Entity, 'id' | 'created_at' | 'updated_at'>>,
  tenantId: string | null
): Promise<{
  valid: boolean;
  conflicts: Array<{ type: string; message: string }>;
  schema_changes: string[];
}> {
  const conflicts: Array<{ type: string; message: string }> = [];
  const schemaChanges: string[] = [];

  // Get existing entity types
  const existingEntities = await listEntities({ tenant_id: tenantId || undefined, limit: 1000 });
  const existingTypes = new Set(existingEntities.map((e) => e.type));

  // Check for new entity types
  const newTypes = new Set<string>();
  entities.forEach((entity) => {
    if (!existingTypes.has(entity.type)) {
      newTypes.add(entity.type);
      schemaChanges.push(`New entity type: ${entity.type}`);
    }
  });

  // Validate property schemas for existing types
  for (const entity of entities) {
    if (existingTypes.has(entity.type)) {
      const existingOfType = existingEntities.filter((e) => e.type === entity.type);
      if (existingOfType.length > 0) {
        const existingProps = existingOfType[0].properties || {};
        const newProps = entity.properties || {};

        // Check for property type mismatches
        for (const [key, value] of Object.entries(newProps)) {
          if (key in existingProps) {
            const existingType = typeof existingProps[key];
            const newType = typeof value;
            if (existingType !== newType) {
              conflicts.push({
                type: 'schema_mismatch',
                message: `Property "${key}" type mismatch in entity type "${entity.type}": expected ${existingType}, got ${newType}`,
              });
            }
          }
        }
      }
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    schema_changes: schemaChanges,
  };
}

async function detectConflicts(
  entities: Array<Omit<Entity, 'id' | 'created_at' | 'updated_at'>>,
  relationships: Array<Omit<Relationship, 'id' | 'created_at'>>,
  tenantId: string | null
): Promise<Array<{ type: string; entity_id?: string; message: string }>> {
  const conflicts: Array<{ type: string; entity_id?: string; message: string }> = [];

  // Get existing entities
  const existingEntities = await listEntities({ tenant_id: tenantId || undefined, limit: 1000 });

  // Check for duplicate entities (same type + name)
  for (const entity of entities) {
    const duplicate = existingEntities.find(
      (e) => e.type === entity.type && e.name === entity.name
    );

    if (duplicate) {
      conflicts.push({
        type: 'duplicate_entity',
        entity_id: duplicate.id,
        message: `Entity "${entity.name}" of type "${entity.type}" already exists`,
      });
    }
  }

  // Get existing relationships
  const existingRelationships = await listRelationships({
    tenant_id: tenantId || undefined,
    limit: 1000,
  });

  // Check for duplicate relationships
  for (const rel of relationships) {
    const duplicate = existingRelationships.find(
      (r) =>
        r.source_id === rel.source_id &&
        r.target_id === rel.target_id &&
        r.type === rel.type
    );

    if (duplicate) {
      conflicts.push({
        type: 'duplicate_relationship',
        message: `Relationship "${rel.type}" from ${rel.source_id} to ${rel.target_id} already exists`,
      });
    }
  }

  return conflicts;
}

async function aiSuggestConflictResolution(
  conflicts: Array<{ type: string; entity_id?: string; message: string }>
): Promise<string[]> {
  if (conflicts.length === 0) {
    return [];
  }

  try {
    const anthropic = getAnthropicClient();

    const prompt = `Suggest resolution strategies for these graph fusion conflicts:

Conflicts:
${conflicts.map((c, i) => `${i + 1}. [${c.type}] ${c.message}`).join('\n')}

For each conflict, provide a brief resolution suggestion (1 sentence).
Return as JSON array of strings.

Example:
["Use merge strategy with latest timestamp", "Skip duplicate and log warning", "Update existing entity with new properties"]`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const suggestions = JSON.parse(content.text);
    return suggestions;
  } catch (error) {
    console.error('[Graph Fusion] AI resolution suggestion failed:', error);
    return conflicts.map(() => 'Manual review required');
  }
}

async function logFusionOperation(
  source: string,
  operation: FusionLog['operation'],
  diff: FusionLog['diff'],
  tenantId: string | null
): Promise<void> {
  await supabaseAdmin.from('unite_graph_fusion_log').insert({
    source,
    operation,
    diff,
    tenant_id: tenantId,
  });
}
