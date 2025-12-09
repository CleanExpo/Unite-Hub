/**
 * Knowledge Graph + Playbook Service
 *
 * Phase: D53 - Knowledge Graph + SOP/Playbook Engine
 * Tables: unite_knowledge_nodes, unite_knowledge_edges, unite_playbooks,
 *         unite_playbook_steps, unite_playbook_executions
 *
 * Features:
 * - Knowledge graph node and edge management
 * - SOP/Playbook template creation and management
 * - Playbook execution tracking
 * - AI-powered playbook generation and recommendations
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type NodeType = 'concept' | 'document' | 'process' | 'person' | 'tool' | 'metric' | 'insight';
export type EdgeType = 'depends_on' | 'relates_to' | 'contains' | 'owned_by' | 'uses' | 'produces' | 'influences';
export type PlaybookStatus = 'draft' | 'active' | 'archived' | 'deprecated';
export type StepType = 'action' | 'decision' | 'approval' | 'notification' | 'data_entry' | 'review';
export type ExecutionStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface KnowledgeNode {
  id: string;
  tenant_id: string;
  name: string;
  node_type: NodeType;
  description?: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEdge {
  id: string;
  tenant_id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: EdgeType;
  weight: number;
  properties?: Record<string, unknown>;
  created_at: string;
}

export interface Playbook {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  category?: string;
  status: PlaybookStatus;
  version: number;
  tags?: string[];
  estimated_duration_minutes?: number;
  difficulty?: string;
  ai_generated: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaybookStep {
  id: string;
  playbook_id: string;
  step_order: number;
  name: string;
  description?: string;
  step_type: StepType;
  config?: Record<string, unknown>;
  dependencies?: Record<string, unknown>;
  created_at: string;
}

export interface PlaybookExecution {
  id: string;
  tenant_id: string;
  playbook_id: string;
  status: ExecutionStatus;
  started_at?: string;
  completed_at?: string;
  executed_by?: string;
  context?: Record<string, unknown>;
  current_step_id?: string;
  step_results?: Record<string, unknown>;
  outcome?: string;
  ai_feedback?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateNodeInput {
  name: string;
  node_type: NodeType;
  description?: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  parent_id?: string;
}

export interface CreateEdgeInput {
  from_node_id: string;
  to_node_id: string;
  edge_type: EdgeType;
  weight?: number;
  properties?: Record<string, unknown>;
}

export interface CreatePlaybookInput {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  estimated_duration_minutes?: number;
  difficulty?: string;
  created_by?: string;
}

export interface CreateStepInput {
  playbook_id: string;
  step_order: number;
  name: string;
  description?: string;
  step_type: StepType;
  config?: Record<string, unknown>;
  dependencies?: Record<string, unknown>;
}

export interface CreateExecutionInput {
  playbook_id: string;
  executed_by?: string;
  context?: Record<string, unknown>;
}

// =============================================================================
// Lazy Anthropic Client (60s TTL)
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// Knowledge Graph - Nodes
// =============================================================================

/**
 * Create a knowledge node
 */
export async function createKnowledgeNode(
  tenantId: string,
  input: CreateNodeInput
): Promise<KnowledgeNode> {
  const { data, error } = await supabaseAdmin
    .from('unite_knowledge_nodes')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      node_type: input.node_type,
      description: input.description,
      content: input.content || {},
      metadata: input.metadata || {},
      parent_id: input.parent_id,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create node: ${error.message}`);
  return data as KnowledgeNode;
}

/**
 * Get knowledge node by ID
 */
export async function getKnowledgeNode(
  tenantId: string,
  nodeId: string
): Promise<KnowledgeNode | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_knowledge_nodes')
    .select('*')
    .eq('id', nodeId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get node: ${error.message}`);
  return data as KnowledgeNode | null;
}

/**
 * List knowledge nodes
 */
export async function listKnowledgeNodes(
  tenantId: string,
  filters?: {
    nodeType?: NodeType;
    parentId?: string;
    limit?: number;
  }
): Promise<KnowledgeNode[]> {
  let query = supabaseAdmin
    .from('unite_knowledge_nodes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.nodeType) {
    query = query.eq('node_type', filters.nodeType);
  }

  if (filters?.parentId) {
    query = query.eq('parent_id', filters.parentId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list nodes: ${error.message}`);
  return data as KnowledgeNode[];
}

/**
 * Update knowledge node
 */
export async function updateKnowledgeNode(
  tenantId: string,
  nodeId: string,
  updates: Partial<Omit<KnowledgeNode, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<KnowledgeNode> {
  const { data, error } = await supabaseAdmin
    .from('unite_knowledge_nodes')
    .update(updates)
    .eq('id', nodeId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update node: ${error.message}`);
  return data as KnowledgeNode;
}

/**
 * Delete knowledge node
 */
export async function deleteKnowledgeNode(
  tenantId: string,
  nodeId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_knowledge_nodes')
    .delete()
    .eq('id', nodeId)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(`Failed to delete node: ${error.message}`);
}

// =============================================================================
// Knowledge Graph - Edges
// =============================================================================

/**
 * Create knowledge edge
 */
export async function createKnowledgeEdge(
  tenantId: string,
  input: CreateEdgeInput
): Promise<KnowledgeEdge> {
  const { data, error } = await supabaseAdmin
    .from('unite_knowledge_edges')
    .insert({
      tenant_id: tenantId,
      from_node_id: input.from_node_id,
      to_node_id: input.to_node_id,
      edge_type: input.edge_type,
      weight: input.weight ?? 1.0,
      properties: input.properties || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create edge: ${error.message}`);
  return data as KnowledgeEdge;
}

/**
 * Get node neighbors
 */
export async function getNodeNeighbors(
  nodeId: string,
  direction: 'outgoing' | 'incoming' | 'both' = 'both'
): Promise<Array<{
  neighbor_id: string;
  neighbor_name: string;
  neighbor_type: NodeType;
  edge_type: EdgeType;
  edge_weight: number;
  direction: string;
}>> {
  const { data, error } = await supabaseAdmin.rpc('unite_get_node_neighbors', {
    p_node_id: nodeId,
    p_direction: direction,
  });

  if (error) throw new Error(`Failed to get neighbors: ${error.message}`);
  return data || [];
}

/**
 * Delete knowledge edge
 */
export async function deleteKnowledgeEdge(
  tenantId: string,
  edgeId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_knowledge_edges')
    .delete()
    .eq('id', edgeId)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(`Failed to delete edge: ${error.message}`);
}

// =============================================================================
// Playbooks
// =============================================================================

/**
 * Create playbook
 */
export async function createPlaybook(
  tenantId: string,
  input: CreatePlaybookInput
): Promise<Playbook> {
  const { data, error } = await supabaseAdmin
    .from('unite_playbooks')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      description: input.description,
      category: input.category,
      tags: input.tags || [],
      estimated_duration_minutes: input.estimated_duration_minutes,
      difficulty: input.difficulty,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create playbook: ${error.message}`);
  return data as Playbook;
}

/**
 * Get playbook by ID
 */
export async function getPlaybook(
  tenantId: string,
  playbookId: string
): Promise<Playbook | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_playbooks')
    .select('*')
    .eq('id', playbookId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get playbook: ${error.message}`);
  return data as Playbook | null;
}

/**
 * List playbooks
 */
export async function listPlaybooks(
  tenantId: string,
  filters?: {
    status?: PlaybookStatus;
    category?: string;
    limit?: number;
  }
): Promise<Playbook[]> {
  let query = supabaseAdmin
    .from('unite_playbooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list playbooks: ${error.message}`);
  return data as Playbook[];
}

/**
 * Update playbook
 */
export async function updatePlaybook(
  tenantId: string,
  playbookId: string,
  updates: Partial<Omit<Playbook, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<Playbook> {
  const { data, error } = await supabaseAdmin
    .from('unite_playbooks')
    .update(updates)
    .eq('id', playbookId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update playbook: ${error.message}`);
  return data as Playbook;
}

/**
 * Delete playbook
 */
export async function deletePlaybook(
  tenantId: string,
  playbookId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_playbooks')
    .delete()
    .eq('id', playbookId)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(`Failed to delete playbook: ${error.message}`);
}

// =============================================================================
// Playbook Steps
// =============================================================================

/**
 * Create playbook step
 */
export async function createPlaybookStep(
  input: CreateStepInput
): Promise<PlaybookStep> {
  const { data, error } = await supabaseAdmin
    .from('unite_playbook_steps')
    .insert({
      playbook_id: input.playbook_id,
      step_order: input.step_order,
      name: input.name,
      description: input.description,
      step_type: input.step_type,
      config: input.config || {},
      dependencies: input.dependencies || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create step: ${error.message}`);
  return data as PlaybookStep;
}

/**
 * List playbook steps
 */
export async function listPlaybookSteps(
  playbookId: string
): Promise<PlaybookStep[]> {
  const { data, error } = await supabaseAdmin
    .from('unite_playbook_steps')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('step_order', { ascending: true });

  if (error) throw new Error(`Failed to list steps: ${error.message}`);
  return data as PlaybookStep[];
}

/**
 * Delete playbook step
 */
export async function deletePlaybookStep(stepId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_playbook_steps')
    .delete()
    .eq('id', stepId);

  if (error) throw new Error(`Failed to delete step: ${error.message}`);
}

// =============================================================================
// Playbook Executions
// =============================================================================

/**
 * Start playbook execution
 */
export async function startPlaybookExecution(
  tenantId: string,
  input: CreateExecutionInput
): Promise<PlaybookExecution> {
  const { data, error } = await supabaseAdmin
    .from('unite_playbook_executions')
    .insert({
      tenant_id: tenantId,
      playbook_id: input.playbook_id,
      executed_by: input.executed_by,
      context: input.context || {},
      status: 'in_progress',
      started_at: new Date().toISOString(),
      step_results: {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to start execution: ${error.message}`);
  return data as PlaybookExecution;
}

/**
 * Update playbook execution
 */
export async function updatePlaybookExecution(
  tenantId: string,
  executionId: string,
  updates: Partial<PlaybookExecution>
): Promise<PlaybookExecution> {
  const { data, error } = await supabaseAdmin
    .from('unite_playbook_executions')
    .update(updates)
    .eq('id', executionId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update execution: ${error.message}`);
  return data as PlaybookExecution;
}

/**
 * Get next step in execution
 */
export async function getNextPlaybookStep(
  executionId: string
): Promise<PlaybookStep | null> {
  const { data, error } = await supabaseAdmin.rpc('unite_get_next_playbook_step', {
    p_execution_id: executionId,
  });

  if (error) throw new Error(`Failed to get next step: ${error.message}`);
  if (!data || data.length === 0) return null;

  const step = data[0];
  return {
    id: step.step_id,
    playbook_id: '', // Not returned by function
    step_order: step.step_order,
    name: step.step_name,
    description: step.step_description,
    step_type: step.step_type,
    config: step.step_config,
    created_at: '',
  };
}

/**
 * Get execution summary for playbook
 */
export async function getPlaybookExecutionSummary(
  playbookId: string
): Promise<{
  total_executions: number;
  completed_executions: number;
  failed_executions: number;
  avg_duration_minutes: number;
  success_rate: number;
}> {
  const { data, error } = await supabaseAdmin.rpc('unite_get_playbook_execution_summary', {
    p_playbook_id: playbookId,
  });

  if (error) throw new Error(`Failed to get execution summary: ${error.message}`);

  if (!data || data.length === 0) {
    return {
      total_executions: 0,
      completed_executions: 0,
      failed_executions: 0,
      avg_duration_minutes: 0,
      success_rate: 0,
    };
  }

  return data[0];
}

// =============================================================================
// AI-Powered Features
// =============================================================================

/**
 * AI-generate playbook from description
 */
export async function aiGeneratePlaybook(
  description: string,
  category?: string
): Promise<{
  name: string;
  description: string;
  steps: Array<{
    step_order: number;
    name: string;
    description: string;
    step_type: StepType;
  }>;
  estimated_duration_minutes: number;
  difficulty: string;
}> {
  const client = getAnthropicClient();

  const prompt = `Generate a detailed SOP playbook based on this description: "${description}"

Category: ${category || 'general'}

Provide the playbook in JSON format:
{
  "name": "Playbook Name",
  "description": "Detailed description",
  "steps": [
    {
      "step_order": 1,
      "name": "Step Name",
      "description": "What to do in this step",
      "step_type": "action|decision|approval|notification|data_entry|review"
    }
  ],
  "estimated_duration_minutes": 60,
  "difficulty": "easy|medium|hard"
}

Make steps specific, actionable, and ordered logically. Include 5-10 steps.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    throw new Error('Failed to parse AI playbook response');
  }
}

/**
 * AI-analyze execution and provide feedback
 */
export async function aiAnalyzeExecution(
  execution: PlaybookExecution,
  playbook: Playbook,
  steps: PlaybookStep[]
): Promise<{
  insights: string[];
  recommendations: string[];
  bottlenecks: Array<{ step_order: number; reason: string }>;
  optimization_suggestions: string[];
}> {
  const client = getAnthropicClient();

  const prompt = `Analyze this playbook execution and provide insights.

**Playbook**: ${playbook.name}
**Description**: ${playbook.description || 'N/A'}
**Status**: ${execution.status}
**Duration**: ${execution.started_at} to ${execution.completed_at || 'ongoing'}
**Outcome**: ${execution.outcome || 'N/A'}

**Steps**:
${steps.map((s) => `${s.step_order}. ${s.name} (${s.step_type})`).join('\n')}

**Step Results**:
${JSON.stringify(execution.step_results, null, 2)}

Provide analysis in JSON format:
{
  "insights": [
    "Key insight about the execution"
  ],
  "recommendations": [
    "Recommendation for improvement"
  ],
  "bottlenecks": [
    {
      "step_order": 3,
      "reason": "Why this step was a bottleneck"
    }
  ],
  "optimization_suggestions": [
    "How to optimize the playbook"
  ]
}

Focus on efficiency, completeness, and areas for improvement.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  try {
    const result = JSON.parse(textContent.text);

    // Update execution with AI feedback
    await supabaseAdmin
      .from('unite_playbook_executions')
      .update({ ai_feedback: result })
      .eq('id', execution.id);

    return result;
  } catch {
    return {
      insights: ['Unable to parse AI response'],
      recommendations: [],
      bottlenecks: [],
      optimization_suggestions: [],
    };
  }
}
