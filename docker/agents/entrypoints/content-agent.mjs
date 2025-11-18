#!/usr/bin/env node

/**
 * Content Generation Agent (Extended Thinking)
 * Generates personalized marketing content
 */

import { BaseAgent } from '../../../src/lib/agents/base-agent.js';
import { routeToModel } from '../../../src/lib/agents/model-router.js';

class ContentGenerationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'content-agent',
      queueName: 'content_generation_queue',
      concurrency: 2
    });
  }

  async processTask(task) {
    const { payload } = task;
    const { contact_id, content_type, context } = payload;

    console.log(`✍️  Generating ${content_type} content for contact ${contact_id}`);

    // Fetch contact intelligence
    const { data: intelligence } = await this.supabase
      .from('email_intelligence')
      .select('*')
      .eq('contact_id', contact_id)
      .order('analyzed_at', { ascending: false })
      .limit(3);

    // Generate content using Claude Opus with Extended Thinking
    const result = await routeToModel({
      task: 'generate_content',
      assignedModel: 'claude-opus-4',
      thinkingBudget: 7500,
      prompt: `Generate personalized ${content_type} for this contact.

Intelligence: ${JSON.stringify(intelligence)}
Context: ${JSON.stringify(context)}

Requirements:
- Personalized to their business goals and pain points
- Professional tone
- Clear call-to-action
- Length: ${content_type === 'email' ? '150-250 words' : '500-800 words'}`,
    });

    // Save generated content
    const { data: generatedContent, error } = await this.supabase
      .from('generatedContent')
      .insert({
        contact_id,
        workspace_id: task.workspace_id,
        content_type,
        content: result.response,
        ai_reasoning: result.reasoning,
        status: 'draft',
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Generated ${content_type} content (ID: ${generatedContent.id})`);

    return {
      content_id: generatedContent.id,
      content_length: result.response.length,
      cost_usd: result.costEstimate,
      thinking_used: !!result.reasoning
    };
  }
}

// Start agent
const agent = new ContentGenerationAgent();

agent.start().catch((error) => {
  console.error('❌ Content agent failed:', error);
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
