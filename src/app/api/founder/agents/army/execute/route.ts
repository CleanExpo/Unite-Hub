/**
 * POST /api/founder/agents/army/execute
 *
 * Executes a single agent skill via the Anthropic Claude API.
 * Supports dry-run mode, budget throttling, and result persistence
 * into army_runs + the skill's designated output table.
 *
 * UNI-1446: Commander Revenue execute route
 * UNI-1450: Cost monitoring + auto-throttle integration
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import {
  findSkillById,
  findCommanderBySkillId,
  findCommanderById,
  resolveModel,
  getAllSkills,
} from '@/lib/agents/army';
import { checkBudgetThrottle } from '@/lib/agents/army/cost-monitor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExecuteBody {
  agentId: string;
  commander?: string;
  task: string;
  workspaceId?: string;
  dryRun?: boolean;
}

interface AgentOutputJson {
  summary?: string;
  findings?: string[];
  actions?: string[];
  outputForTable?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the skill prompt for the Claude API call.
 */
function buildPrompt(skillName: string, description: string, task: string): string {
  return `You are ${skillName}, a specialised AI agent for ${description}.
Your task: ${task}
Output format: JSON with keys: { summary, findings[], actions[], outputForTable }
Be specific, actionable, and focused on Australian market context.`;
}

/**
 * Determine whether an agentId is valid — either a commander, orchestrator, or skill.
 */
function validateAgentId(agentId: string): boolean {
  // Commander IDs
  if (findCommanderById(agentId)) return true;

  // Skill IDs
  if (findSkillById(agentId)) return true;

  // Orchestrator IDs
  const allCommanders = getAllSkills(); // just used here for importing — see full check below
  void allCommanders; // suppress unused warning

  // Check orchestrator IDs via commander lookup
  if (findCommanderBySkillId(agentId)) return true;

  return false;
}

/**
 * Map skill output table name to the appropriate insert shape.
 * Returns null when the table is unrecognised.
 */
function buildTableInsert(
  table: string,
  agentId: string,
  workspaceId: string | undefined,
  outputForTable: Record<string, unknown>,
): Record<string, unknown> | null {
  const base = {
    workspace_id: workspaceId || null,
    source_agent: agentId,
    metadata: outputForTable,
  };

  switch (table) {
    case 'army_leads':
      return {
        ...base,
        company:       (outputForTable.company      as string) || null,
        contact_name:  (outputForTable.contactName  as string) || null,
        contact_email: (outputForTable.contactEmail as string) || null,
        industry:      (outputForTable.industry     as string) || null,
        score:         (outputForTable.score        as number) ?? 50,
        status:        'new',
        notes:         (outputForTable.notes        as string) || null,
      };

    case 'army_opportunities':
      return {
        ...base,
        type:              (outputForTable.type             as string) || 'general',
        title:             (outputForTable.title            as string) || 'Agent-generated opportunity',
        description:       (outputForTable.description      as string) || null,
        priority:          (outputForTable.priority         as string) || 'medium',
        status:            'new',
        revenue_potential: (outputForTable.revenuePotential as number) || null,
      };

    case 'army_competitor_updates':
      return {
        ...base,
        competitor_name: (outputForTable.competitorName as string) || null,
        change_type:     (outputForTable.changeType     as string) || 'pricing',
        change_detail:   (outputForTable.changeDetail   as string) || null,
      };

    case 'army_content_queue':
      return {
        ...base,
        title:        (outputForTable.title       as string) || 'Agent-drafted content',
        content_type: (outputForTable.contentType as string) || 'blog',
        body:         (outputForTable.body        as string) || null,
        status:       'draft',
      };

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExecuteBody;
    const { agentId, commander, task, workspaceId, dryRun = false } = body;

    // --- Validation ---
    if (!agentId || !task) {
      return NextResponse.json(
        { error: 'agentId and task are required' },
        { status: 400 },
      );
    }

    // Resolve skill config (may be a commander or skill ID)
    const skill     = findSkillById(agentId);
    const resolved  = skill ?? findCommanderById(agentId);

    if (!resolved) {
      return NextResponse.json(
        { error: `Unknown agentId: ${agentId}` },
        { status: 400 },
      );
    }

    const isCommander = !skill;
    const skillName   = resolved.name;
    const description = 'description' in resolved ? resolved.description : resolved.role;
    const model       = resolveModel(agentId);
    const outputTable = skill?.outputTable ?? null;
    const isUrgent    = skill?.urgent ?? true; // commanders are always urgent

    // --- Dry-run mode ---
    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        agentId,
        model,
        prompt: buildPrompt(skillName, description, task),
        outputTable,
        wouldInsert: true,
      });
    }

    // --- Budget throttle check (skip for urgent agents) ---
    if (!isUrgent) {
      const throttle = await checkBudgetThrottle(supabaseAdmin);
      if (throttle.throttled) {
        return NextResponse.json(
          {
            error:     'budget_throttled',
            reason:    throttle.reason,
            todayCost: throttle.todayCost,
            budget:    throttle.budget,
          },
          { status: 429 },
        );
      }
    }

    // --- Create army_runs record (status: running) ---
    const startedAt = new Date().toISOString();

    const { data: runRow, error: runInsertError } = await supabaseAdmin
      .from('army_runs')
      .insert({
        workspace_id: workspaceId || null,
        agent_id:     agentId,
        commander:    commander || (isCommander ? resolved.id : findCommanderBySkillId(agentId)?.id) || null,
        task,
        status:       'running',
        started_at:   startedAt,
      })
      .select('id')
      .single();

    if (runInsertError || !runRow) {
      console.error('[army/execute] Failed to create run record:', runInsertError?.message);
      return NextResponse.json(
        { error: 'Failed to create run record' },
        { status: 500 },
      );
    }

    const runId = runRow.id as string;

    // --- Call Claude API ---
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    let resultText   = '';
    let totalTokens  = 0;
    let inputTokens  = 0;
    let outputTokens = 0;
    let runStatus    = 'completed';

    try {
      const message = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        messages: [
          {
            role:    'user',
            content: buildPrompt(skillName, description, task),
          },
        ],
      });

      const textBlock = message.content.find((b) => b.type === 'text');
      resultText   = textBlock?.type === 'text' ? textBlock.text : '';
      inputTokens  = message.usage.input_tokens;
      outputTokens = message.usage.output_tokens;
      totalTokens  = inputTokens + outputTokens;

    } catch (claudeError: unknown) {
      const msg = claudeError instanceof Error ? claudeError.message : 'Claude API error';
      console.error(`[army/execute] Claude API error for ${agentId}:`, msg);
      runStatus = 'failed';

      await supabaseAdmin
        .from('army_runs')
        .update({
          status:       'failed',
          result:       { error: msg },
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId);

      return NextResponse.json({ error: msg, runId }, { status: 502 });
    }

    // --- Estimate cost (Haiku: $0.25/$1.25 per M tokens; Sonnet: $3/$15 per M tokens) ---
    const isSonnet   = model.includes('sonnet');
    const inputRate  = isSonnet ? 3.0   : 0.25;
    const outputRate = isSonnet ? 15.0  : 1.25;
    const costUsd    = (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;

    // --- Parse result JSON ---
    let parsed: AgentOutputJson = {};
    try {
      // Extract JSON block from markdown code fences if present
      const jsonMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr   = jsonMatch ? jsonMatch[1] : resultText;
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      // Result was not valid JSON — store raw text as summary
      parsed = { summary: resultText };
    }

    // --- Update army_runs to completed ---
    await supabaseAdmin
      .from('army_runs')
      .update({
        status:       runStatus,
        result:       parsed,
        cost_tokens:  totalTokens,
        cost_usd:     costUsd,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    // --- Persist to output table if agent produced structured output ---
    let outputRowId: string | null = null;

    if (parsed.outputForTable && outputTable) {
      const insertData = buildTableInsert(
        outputTable,
        agentId,
        workspaceId,
        parsed.outputForTable as Record<string, unknown>,
      );

      if (insertData) {
        const { data: outRow, error: outError } = await supabaseAdmin
          .from(outputTable)
          .insert(insertData)
          .select('id')
          .single();

        if (outError) {
          console.error(`[army/execute] Failed to insert into ${outputTable}:`, outError.message);
        } else {
          outputRowId = outRow?.id as string | null;
        }
      }
    }

    return NextResponse.json(
      {
        runId,
        agentId,
        model,
        status:      'completed',
        summary:     parsed.summary   ?? null,
        findings:    parsed.findings  ?? [],
        actions:     parsed.actions   ?? [],
        outputTable,
        outputRowId,
        tokens:      totalTokens,
        costUsd,
        costAud:     costUsd * 1.55,
      },
      { status: 200 },
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/execute POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
