#!/usr/bin/env node

/**
 * Strategy Generation Agent (Extended Thinking)
 * Creates comprehensive marketing strategies
 */

import { BaseAgent } from '../../../src/lib/agents/base-agent.js';
import { routeToModel } from '../../../src/lib/agents/model-router.js';

class StrategyGenerationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'strategy-agent',
      queueName: 'strategy_generation_queue',
      concurrency: 1 // Extended Thinking is expensive
    });
  }

  async processTask(task) {
    const { payload } = task;
    const { contact_id } = payload;

    console.log(`🧠 Generating strategy for contact ${contact_id}`);

    // Fetch contact with complete intelligence
    const { data: contact } = await this.supabase
      .from('contacts')
      .select(`
        *,
        email_intelligence(*),
        client_emails(*)
      `)
      .eq('id', contact_id)
      .single();

    if (!contact) {
      throw new Error(`Contact not found: ${contact_id}`);
    }

    // Generate strategy using Claude Opus with Extended Thinking
    const result = await routeToModel({
      task: 'generate_strategy',
      assignedModel: 'claude-opus-4',
      thinkingBudget: 10000,
      prompt: `Create a comprehensive 90-day marketing strategy for this B2B client.

Contact: ${JSON.stringify(contact, null, 2)}

Return a detailed JSON strategy with:
{
  "strategy_name": "...",
  "objectives": ["..."],
  "target_audience": {...},
  "content_pillars": [{name: "...", allocation: X}],
  "campaign_calendar": {...},
  "kpis": [...],
  "budget_allocation": {...}
}`,
    });

    const strategy = JSON.parse(result.response);

    // Save strategy
    const { data: savedStrategy, error } = await this.supabase
      .from('marketing_strategies')
      .insert({
        contact_id,
        workspace_id: task.workspace_id,
        ...strategy,
        ai_reasoning: result.reasoning,
        status: 'draft',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Strategy generated (ID: ${savedStrategy.id})`);

    return {
      strategy_id: savedStrategy.id,
      cost_usd: result.costEstimate,
      thinking_tokens: result.tokensUsed.input
    };
  }
}

// Start agent
const agent = new StrategyGenerationAgent();

agent.start().catch((error) => {
  console.error('❌ Strategy agent failed:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await agent.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await agent.stop();
  process.exit(0);
});
