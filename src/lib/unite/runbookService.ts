/**
 * Runbook Service
 * Phase: D60
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

export interface Runbook {
  id: string;
  tenant_id?: string;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  status: string;
  tags?: string[];
  ai_profile?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RunbookStep {
  id: string;
  runbook_id: string;
  order_index: number;
  title: string;
  instructions?: string;
  action_type?: string;
  action_config?: Record<string, unknown>;
  ai_prompt?: string;
  created_at: string;
}

export interface RunbookExecution {
  id: string;
  tenant_id?: string;
  runbook_id: string;
  trigger_type: string;
  trigger_ref?: string;
  status: string;
  current_step_index: number;
  logs?: Record<string, unknown>;
  ai_summary?: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
}

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

export async function createRunbook(
  tenantId: string | null,
  input: Omit<Runbook, 'id' | 'created_at' | 'updated_at'>
): Promise<Runbook> {
  const { data, error } = await supabaseAdmin.from('unite_runbooks').insert({ tenant_id: tenantId, ...input }).select().single();
  if (error) throw new Error(`Failed to create runbook: ${error.message}`);
  return data as Runbook;
}

export async function listRunbooks(tenantId: string | null, filters?: { category?: string; status?: string; limit?: number }): Promise<Runbook[]> {
  let query = supabaseAdmin.from('unite_runbooks').select('*').order('created_at', { ascending: false });
  if (tenantId) query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.limit) query = query.limit(filters.limit);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list runbooks: ${error.message}`);
  return data as Runbook[];
}

export async function createStep(input: Omit<RunbookStep, 'id' | 'created_at'>): Promise<RunbookStep> {
  const { data, error } = await supabaseAdmin.from('unite_runbook_steps').insert(input).select().single();
  if (error) throw new Error(`Failed to create step: ${error.message}`);
  return data as RunbookStep;
}

export async function executeRunbook(tenantId: string | null, runbookId: string, triggerType: string): Promise<RunbookExecution> {
  const { data, error } = await supabaseAdmin
    .from('unite_runbook_executions')
    .insert({ tenant_id: tenantId, runbook_id: runbookId, trigger_type: triggerType })
    .select()
    .single();
  if (error) throw new Error(`Failed to execute runbook: ${error.message}`);
  return data as RunbookExecution;
}

export async function aiGenerateRunbook(
  description: string,
  category: string
): Promise<{ name: string; description: string; steps: Array<{ title: string; instructions: string; action_type: string }> }> {
  const client = getAnthropicClient();
  const prompt = `Generate an operational runbook based on this description:

**Description**: ${description}
**Category**: ${category}

Provide runbook structure in JSON:
{
  "name": "Runbook Name",
  "description": "Clear description",
  "steps": [
    {
      "title": "Step 1: ...",
      "instructions": "Detailed instructions",
      "action_type": "manual|api|notification"
    }
  ]
}

Include 3-6 actionable steps with clear instructions.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') throw new Error('No AI response');
  return JSON.parse(textContent.text);
}
