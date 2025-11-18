#!/usr/bin/env node

/**
 * Email Intelligence Agent
 * Processes emails and extracts intelligence
 */

import { BaseAgent } from '../../../src/lib/agents/base-agent.js';
import { routeToModel } from '../../../src/lib/agents/model-router.js';

class EmailIntelligenceAgent extends BaseAgent {
  constructor() {
    super({
      name: 'email-agent',
      queueName: 'email_intelligence_queue',
      concurrency: 3
    });
  }

  async processTask(task) {
    const { payload } = task;

    switch (task.task_type) {
      case 'email_intelligence':
        return await this.extractEmailIntelligence(payload);

      case 'contact_scoring':
        return await this.scoreContact(payload);

      default:
        throw new Error(`Unsupported task type: ${task.task_type}`);
    }
  }

  async extractEmailIntelligence(payload) {
    const { email_id, contact_id } = payload;

    // Fetch email from database
    const { data: email, error } = await this.supabase
      .from('client_emails')
      .select('*')
      .eq('id', email_id)
      .single();

    if (error || !email) {
      throw new Error(`Email not found: ${email_id}`);
    }

    // Extract intelligence using AI
    const result = await routeToModel({
      task: 'email_intelligence',
      prompt: `Extract business intelligence from this email.

Return JSON with:
{
  "business_goals": [{"text": "...", "priority": "high|medium|low"}],
  "pain_points": [{"text": "...", "severity": "high|medium|low"}],
  "requirements": [{"text": "...", "category": "technical|budget|timeline"}],
  "decision_readiness": 1-10,
  "sentiment": "positive|neutral|negative"
}

Email Subject: ${email.subject || 'No subject'}
Email Body: ${email.snippet || 'No content'}`,
    });

    const intelligence = JSON.parse(result.response);

    // Save intelligence to database
    await this.supabase
      .from('email_intelligence')
      .insert({
        contact_id,
        email_id,
        ...intelligence,
        analyzed_at: new Date().toISOString()
      });

    // Mark email as analyzed
    await this.supabase
      .from('client_emails')
      .update({ intelligence_analyzed: true, analyzed_at: new Date().toISOString() })
      .eq('id', email_id);

    console.log(`✅ Extracted intelligence from email ${email_id}`);

    return {
      email_id,
      intelligence,
      cost_usd: result.costEstimate
    };
  }

  async scoreContact(payload) {
    const { contact_id } = payload;

    // Fetch contact with related data
    const { data: contact, error } = await this.supabase
      .from('contacts')
      .select(`
        *,
        email_intelligence(*),
        client_emails(count)
      `)
      .eq('id', contact_id)
      .single();

    if (error || !contact) {
      throw new Error(`Contact not found: ${contact_id}`);
    }

    // Calculate AI score using model router
    const result = await routeToModel({
      task: 'contact_scoring',
      prompt: `Calculate lead score (0-100) for this contact. Return ONLY the number.

Contact: ${JSON.stringify(contact, null, 2)}`,
    });

    const score = parseInt(result.response.trim());

    // Update contact score
    await this.supabase
      .from('contacts')
      .update({ ai_score: score })
      .eq('id', contact_id);

    console.log(`✅ Scored contact ${contact_id}: ${score}`);

    return {
      contact_id,
      score,
      cost_usd: result.costEstimate
    };
  }
}

// Start agent
const agent = new EmailIntelligenceAgent();

agent.start().catch((error) => {
  console.error('❌ Email agent failed:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await agent.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await agent.stop();
  process.exit(0);
});
