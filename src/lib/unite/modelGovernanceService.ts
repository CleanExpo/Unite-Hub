/**
 * Model Governance Service
 * Phase: D76 - Unite Model Governance Engine
 *
 * Versioned model schemas w/ change audit + rollback support.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';

// ============================================================================
// TYPES
// ============================================================================

export interface ModelSchema {
  properties: Record<string, { type: string; required?: boolean; description?: string }>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ModelConstraints {
  validations?: Record<string, unknown>;
  relationships?: Array<{ target: string; type: 'one-to-one' | 'one-to-many' | 'many-to-many' }>;
  indexes?: string[];
}

export interface Model {
  id: string;
  name: string;
  version: string;
  schema_def: ModelSchema;
  constraints?: ModelConstraints;
  tenant_id?: string;
  updated_at: string;
}

export interface ModelAudit {
  id: string;
  model_id: string;
  change_set: {
    added?: Record<string, unknown>;
    removed?: Record<string, unknown>;
    modified?: Record<string, unknown>;
    breaking?: boolean;
  };
  ai_interpretation?: {
    impact: string;
    risk_score: number; // 0-100
    rollback_safe: boolean;
    recommendations: string[];
  };
  tenant_id?: string;
  created_at: string;
}

// ============================================================================
// MODEL CRUD
// ============================================================================

export async function createModel(
  name: string,
  version: string,
  schema_def: ModelSchema,
  constraints?: ModelConstraints,
  tenantId?: string | null
): Promise<Model | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('unite_models')
      .insert({
        name,
        version,
        schema_def,
        constraints,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Model;
  } catch (error) {
    console.error('[ModelGovernance] Create failed:', error);
    return null;
  }
}

export async function listModels(filters?: {
  tenant_id?: string;
  name?: string;
  limit?: number;
}): Promise<Model[]> {
  let query = supabaseAdmin
    .from('unite_models')
    .select('*')
    .order('updated_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.name) query = query.eq('name', filters.name);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`List models failed: ${error.message}`);
  return data as Model[];
}

export async function getModel(
  name: string,
  version: string,
  tenantId?: string | null
): Promise<Model | null> {
  let query = supabaseAdmin
    .from('unite_models')
    .select('*')
    .eq('name', name)
    .eq('version', version);

  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Get model failed: ${error.message}`);
  }

  return data as Model;
}

export async function updateModel(
  modelId: string,
  updates: Partial<Pick<Model, 'schema_def' | 'constraints'>>,
  tenantId?: string | null
): Promise<Model | null> {
  try {
    let query = supabaseAdmin
      .from('unite_models')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', modelId);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query.select().single();

    if (error) throw error;
    return data as Model;
  } catch (error) {
    console.error('[ModelGovernance] Update failed:', error);
    return null;
  }
}

export async function deleteModel(modelId: string, tenantId?: string | null): Promise<boolean> {
  try {
    let query = supabaseAdmin.from('unite_models').delete().eq('id', modelId);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[ModelGovernance] Delete failed:', error);
    return false;
  }
}

// ============================================================================
// VERSION MANAGEMENT
// ============================================================================

export async function getModelVersions(
  name: string,
  tenantId?: string | null
): Promise<Model[]> {
  let query = supabaseAdmin
    .from('unite_models')
    .select('*')
    .eq('name', name)
    .order('updated_at', { ascending: false });

  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data, error } = await query;
  if (error) throw new Error(`Get versions failed: ${error.message}`);
  return data as Model[];
}

export async function getLatestVersion(
  name: string,
  tenantId?: string | null
): Promise<Model | null> {
  const versions = await getModelVersions(name, tenantId);
  return versions.length > 0 ? versions[0] : null;
}

// ============================================================================
// CHANGE DETECTION & AUDIT
// ============================================================================

function detectSchemaChanges(oldSchema: ModelSchema, newSchema: ModelSchema) {
  const added: Record<string, unknown> = {};
  const removed: Record<string, unknown> = {};
  const modified: Record<string, unknown> = {};

  // Detect added properties
  Object.keys(newSchema.properties).forEach((key) => {
    if (!oldSchema.properties[key]) {
      added[key] = newSchema.properties[key];
    }
  });

  // Detect removed properties
  Object.keys(oldSchema.properties).forEach((key) => {
    if (!newSchema.properties[key]) {
      removed[key] = oldSchema.properties[key];
    }
  });

  // Detect modified properties
  Object.keys(newSchema.properties).forEach((key) => {
    if (
      oldSchema.properties[key] &&
      newSchema.properties[key] &&
      JSON.stringify(oldSchema.properties[key]) !== JSON.stringify(newSchema.properties[key])
    ) {
      modified[key] = {
        old: oldSchema.properties[key],
        new: newSchema.properties[key],
      };
    }
  });

  // Breaking changes: removed required fields or type changes
  const breaking =
    Object.keys(removed).some((key) => oldSchema.required?.includes(key)) ||
    Object.keys(modified).some(
      (key) =>
        (oldSchema.properties[key] as { type: string }).type !==
        (newSchema.properties[key] as { type: string }).type
    );

  return { added, removed, modified, breaking };
}

async function aiInterpretChanges(changeSet: ModelAudit['change_set']): Promise<
  ModelAudit['ai_interpretation']
> {
  const client = getAnthropicClient();

  const prompt = `Analyze this model schema change and assess impact:

**Changes:**
- Added: ${JSON.stringify(changeSet.added, null, 2)}
- Removed: ${JSON.stringify(changeSet.removed, null, 2)}
- Modified: ${JSON.stringify(changeSet.modified, null, 2)}
- Breaking: ${changeSet.breaking}

**Analysis Required:**
1. Impact on existing data and code
2. Risk score (0-100, where 0 = no risk, 100 = critical risk)
3. Whether rollback is safe
4. Recommended actions

Respond in JSON:
{
  "impact": "string describing impact",
  "risk_score": number,
  "rollback_safe": boolean,
  "recommendations": ["action1", "action2"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  const responseText = content.type === 'text' ? content.text : '';

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const interpretation = jsonMatch
    ? JSON.parse(jsonMatch[0])
    : {
        impact: 'Unable to parse AI response',
        risk_score: 100,
        rollback_safe: false,
        recommendations: ['Manual review required'],
      };

  return interpretation;
}

export async function createModelAudit(
  modelId: string,
  oldSchema: ModelSchema,
  newSchema: ModelSchema,
  tenantId?: string | null
): Promise<ModelAudit | null> {
  try {
    const changeSet = detectSchemaChanges(oldSchema, newSchema);
    const ai_interpretation = await aiInterpretChanges(changeSet);

    const { data, error } = await supabaseAdmin
      .from('unite_model_audits')
      .insert({
        model_id: modelId,
        change_set: changeSet,
        ai_interpretation,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ModelAudit;
  } catch (error) {
    console.error('[ModelGovernance] Audit creation failed:', error);
    return null;
  }
}

export async function listAudits(filters?: {
  tenant_id?: string;
  model_id?: string;
  limit?: number;
}): Promise<ModelAudit[]> {
  let query = supabaseAdmin
    .from('unite_model_audits')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.model_id) query = query.eq('model_id', filters.model_id);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`List audits failed: ${error.message}`);
  return data as ModelAudit[];
}

// ============================================================================
// ROLLBACK
// ============================================================================

export async function rollbackToVersion(
  name: string,
  targetVersion: string,
  tenantId?: string | null
): Promise<{ success: boolean; model?: Model; error?: string }> {
  try {
    // Get target version
    const targetModel = await getModel(name, targetVersion, tenantId);
    if (!targetModel) {
      return { success: false, error: 'Target version not found' };
    }

    // Get current version
    const currentModel = await getLatestVersion(name, tenantId);
    if (!currentModel) {
      return { success: false, error: 'Current version not found' };
    }

    // Check rollback safety
    const changeSet = detectSchemaChanges(currentModel.schema_def, targetModel.schema_def);
    if (changeSet.breaking) {
      return {
        success: false,
        error: 'Rollback contains breaking changes - manual review required',
      };
    }

    // Create audit record
    await createModelAudit(currentModel.id, currentModel.schema_def, targetModel.schema_def, tenantId);

    // Create new version with target schema
    const newVersion = `${targetVersion}-rollback-${Date.now()}`;
    const rolledBackModel = await createModel(
      name,
      newVersion,
      targetModel.schema_def,
      targetModel.constraints,
      tenantId
    );

    if (!rolledBackModel) {
      return { success: false, error: 'Failed to create rollback version' };
    }

    return { success: true, model: rolledBackModel };
  } catch (error) {
    console.error('[ModelGovernance] Rollback failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
