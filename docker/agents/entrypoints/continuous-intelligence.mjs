#!/usr/bin/env node

/**
 * Continuous Intelligence Update Agent
 * Monitors new emails/media and triggers analysis
 */

import { BaseAgent } from '../../../src/lib/agents/base-agent.js';

class ContinuousIntelligenceAgent extends BaseAgent {
  constructor() {
    super({
      name: 'continuous-intelligence-agent',
      queueName: 'continuous_monitoring_queue',
      concurrency: 1
    });

    this.monitorIntervalSeconds = parseInt(process.env.MONITOR_INTERVAL_SECONDS) || 300;
    this.lookbackMinutes = parseInt(process.env.LOOKBACK_MINUTES) || 5;
  }

  async start() {
    console.log(`🔄 Starting Continuous Intelligence Monitor`);
    console.log(`   Check interval: ${this.monitorIntervalSeconds}s`);
    console.log(`   Lookback window: ${this.lookbackMinutes} minutes`);

    // Start monitoring loop
    this.monitorLoop();
  }

  async monitorLoop() {
    while (true) {
      try {
        await this.monitorNewContent();
      } catch (error) {
        console.error('❌ Monitoring error:', error);
      }

      // Wait for next interval
      await new Promise(resolve => setTimeout(resolve, this.monitorIntervalSeconds * 1000));
    }
  }

  async monitorNewContent() {
    const cutoffTime = new Date(Date.now() - this.lookbackMinutes * 60 * 1000);

    // Check for unanalyzed emails
    const { data: newEmails } = await this.supabase
      .from('client_emails')
      .select('*')
      .eq('intelligence_analyzed', false)
      .gte('received_at', cutoffTime.toISOString());

    console.log(`📧 Found ${newEmails?.length || 0} new emails`);

    // Create tasks for each email
    for (const email of newEmails || []) {
      await this.createTask({
        task_type: 'email_intelligence',
        payload: {
          email_id: email.id,
          contact_id: email.contact_id
        },
        workspace_id: email.workspace_id,
        priority: 7
      });
    }

    // Check for unanalyzed media
    const { data: newMedia } = await this.supabase
      .from('media_files')
      .select('*')
      .eq('intelligence_analyzed', false)
      .eq('status', 'completed')
      .gte('created_at', cutoffTime.toISOString());

    console.log(`🎥 Found ${newMedia?.length || 0} new media files`);

    // Create tasks for each media
    for (const media of newMedia || []) {
      await this.createTask({
        task_type: 'email_intelligence',
        payload: {
          media_id: media.id,
          contact_id: media.contact_id
        },
        workspace_id: media.workspace_id,
        priority: 6
      });
    }

    if ((newEmails?.length || 0) + (newMedia?.length || 0) > 0) {
      console.log(`✅ Created ${(newEmails?.length || 0) + (newMedia?.length || 0)} analysis tasks`);
    }
  }

  async createTask(taskData) {
    const { data, error } = await this.supabase
      .from('agent_tasks')
      .insert({
        ...taskData,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create task:', error);
      return;
    }

    // Send to orchestrator queue
    await this.channel?.sendToQueue(
      'orchestrator_queue',
      Buffer.from(JSON.stringify(data)),
      { persistent: true, priority: data.priority }
    );
  }

  // Continuous agent doesn't process individual tasks
  async processTask(task) {
    return { monitoring: true };
  }
}

// Start agent
const agent = new ContinuousIntelligenceAgent();

agent.start().catch((error) => {
  console.error('❌ Continuous intelligence agent failed:', error);
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
