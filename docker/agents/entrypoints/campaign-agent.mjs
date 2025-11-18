#!/usr/bin/env node

/**
 * Campaign Optimization Agent
 * Analyzes and optimizes campaign performance
 */

import { BaseAgent } from '../../../src/lib/agents/base-agent.js';
import { routeToModel } from '../../../src/lib/agents/model-router.js';

class CampaignOptimizationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'campaign-agent',
      queueName: 'campaign_optimization_queue',
      concurrency: 3
    });
  }

  async processTask(task) {
    const { payload } = task;
    const { campaign_id } = payload;

    console.log(`📊 Analyzing campaign ${campaign_id}`);

    // Fetch campaign data
    const { data: campaign, error } = await this.supabase
      .from('campaigns')
      .select(`
        *,
        campaign_enrollments(
          count,
          status
        ),
        email_opens(count),
        email_clicks(count)
      `)
      .eq('id', campaign_id)
      .single();

    if (error || !campaign) {
      throw new Error(`Campaign not found: ${campaign_id}`);
    }

    // Analyze performance using AI
    const result = await routeToModel({
      task: 'generate_strategy',
      prompt: `Analyze this campaign performance and provide optimization recommendations.

Campaign Data: ${JSON.stringify(campaign, null, 2)}

Return JSON with:
{
  "performance_score": 0-100,
  "insights": ["insight 1", "insight 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "predicted_roi_improvement": "X%"
}`,
    });

    const analysis = JSON.parse(result.response);

    // Save analysis
    await this.supabase
      .from('campaign_analytics')
      .insert({
        campaign_id,
        workspace_id: task.workspace_id,
        ...analysis,
        analyzed_at: new Date().toISOString()
      });

    console.log(`✅ Campaign analysis complete (Score: ${analysis.performance_score})`);

    return {
      campaign_id,
      ...analysis,
      cost_usd: result.costEstimate
    };
  }
}

// Start agent
const agent = new CampaignOptimizationAgent();

agent.start().catch((error) => {
  console.error('❌ Campaign agent failed:', error);
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
