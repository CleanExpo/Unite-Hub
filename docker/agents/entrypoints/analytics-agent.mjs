#!/usr/bin/env node

/**
 * ANALYTICS AGENT
 *
 * Purpose: Dashboard metrics, KPI calculations, campaign analytics
 *
 * Task Types:
 * - analytics_campaign: Campaign performance metrics
 * - analytics_contacts: Contact lifecycle analytics
 * - analytics_email: Email performance metrics
 *
 * Database Tables:
 * - campaigns, drip_campaigns, campaign_enrollments (read)
 * - sent_emails, email_opens, email_clicks (read)
 * - contacts, interactions (read)
 *
 * AI Model: Claude Sonnet 4.5 (for insights generation)
 * Concurrency: 2 (low volume, heavy queries)
 */

import * as amqp from 'amqplib';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// =====================================================
// CONFIGURATION
// =====================================================

const AGENT_NAME = 'analytics-agent';
const QUEUE_NAME = 'analytics_queue';
const PREFETCH_COUNT = 2; // Low concurrency (heavy queries)
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://unite_hub:unite_hub_pass@localhost:5672';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

// =====================================================
// VALIDATION
// =====================================================

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!anthropicKey) {
  console.error('❌ Missing Anthropic API key');
  process.exit(1);
}

// =====================================================
// CLIENTS
// =====================================================

const supabase = createClient(supabaseUrl, supabaseKey);
const anthropic = new Anthropic({ apiKey: anthropicKey });

let connection = null;
let channel = null;

// =====================================================
// ANALYTICS FUNCTIONS
// =====================================================

/**
 * Get campaign performance metrics
 */
async function getCampaignMetrics(campaignId, workspaceId) {
  console.log(`📊 Calculating campaign metrics for: ${campaignId}`);

  // Fetch campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('drip_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('workspace_id', workspaceId)
    .single();

  if (campaignError || !campaign) {
    throw new Error(`Campaign not found: ${campaignError?.message}`);
  }

  // Fetch enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('campaign_enrollments')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('workspace_id', workspaceId);

  if (enrollmentsError) {
    throw new Error(`Failed to fetch enrollments: ${enrollmentsError.message}`);
  }

  // Calculate enrollment metrics
  const totalEnrollments = enrollments.length;
  const activeEnrollments = enrollments.filter((e) => e.status === 'active').length;
  const completedEnrollments = enrollments.filter((e) => e.status === 'completed').length;
  const unsubscribedEnrollments = enrollments.filter((e) => e.status === 'unsubscribed').length;

  // Fetch execution logs
  const { data: execLogs, error: logsError } = await supabase
    .from('campaign_execution_logs')
    .select('*')
    .in(
      'enrollment_id',
      enrollments.map((e) => e.id)
    );

  if (logsError) {
    throw new Error(`Failed to fetch execution logs: ${logsError.message}`);
  }

  // Calculate email metrics
  const totalSent = execLogs.filter((log) => log.action === 'email_sent' && log.status === 'success').length;
  const totalBounced = execLogs.filter((log) => log.action === 'email_bounced').length;
  const totalDelivered = totalSent - totalBounced;
  const totalOpened = execLogs.filter((log) => log.action === 'email_opened').length;
  const totalClicked = execLogs.filter((log) => log.action === 'email_clicked').length;

  // Calculate rates
  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(2) : 0;
  const openRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(2) : 0;
  const clickRate = totalDelivered > 0 ? ((totalClicked / totalDelivered) * 100).toFixed(2) : 0;
  const clickToOpenRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(2) : 0;
  const conversionRate = totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(2) : 0;

  // Calculate average completion time
  const completedEnrollmentsWithTime = enrollments.filter(
    (e) => e.status === 'completed' && e.started_at && e.completed_at
  );

  let avgCompletionTimeHours = 0;
  if (completedEnrollmentsWithTime.length > 0) {
    const totalHours = completedEnrollmentsWithTime.reduce((sum, e) => {
      const hours = (new Date(e.completed_at) - new Date(e.started_at)) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    avgCompletionTimeHours = (totalHours / completedEnrollmentsWithTime.length).toFixed(2);
  }

  const metrics = {
    campaign_id: campaignId,
    campaign_name: campaign.name,
    campaign_type: 'drip',
    total_enrollments: totalEnrollments,
    active_enrollments: activeEnrollments,
    completed_enrollments: completedEnrollments,
    unsubscribed_enrollments: unsubscribedEnrollments,
    total_sent: totalSent,
    total_delivered: totalDelivered,
    total_bounced: totalBounced,
    total_opened: totalOpened,
    total_clicked: totalClicked,
    delivery_rate: parseFloat(deliveryRate),
    open_rate: parseFloat(openRate),
    click_rate: parseFloat(clickRate),
    click_to_open_rate: parseFloat(clickToOpenRate),
    conversion_rate: parseFloat(conversionRate),
    avg_completion_time_hours: parseFloat(avgCompletionTimeHours),
    start_date: campaign.created_at,
  };

  console.log(`✅ Campaign metrics calculated:`);
  console.log(`   Enrollments: ${totalEnrollments} (${completedEnrollments} completed)`);
  console.log(`   Emails sent: ${totalSent} (${deliveryRate}% delivered)`);
  console.log(`   Open rate: ${openRate}%`);
  console.log(`   Click rate: ${clickRate}%`);

  return metrics;
}

/**
 * Get contact lifecycle analytics
 */
async function getContactLifecycleMetrics(workspaceId, timePeriod) {
  console.log(`📊 Calculating contact lifecycle metrics for workspace: ${workspaceId}`);

  const { start, end } = timePeriod;

  // Total contacts by status
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('status, ai_score, created_at, last_interaction')
    .eq('workspace_id', workspaceId);

  if (contactsError) {
    throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
  }

  const totalContacts = contacts.length;
  const prospects = contacts.filter((c) => c.status === 'prospect').length;
  const leads = contacts.filter((c) => c.status === 'lead').length;
  const customers = contacts.filter((c) => c.status === 'customer').length;

  // New contacts in time period
  const newContacts = contacts.filter((c) => {
    const createdAt = new Date(c.created_at);
    return createdAt >= new Date(start) && createdAt <= new Date(end);
  }).length;

  // Engagement distribution (by ai_score)
  const coldContacts = contacts.filter((c) => (c.ai_score || 0) < 0.4).length;
  const warmContacts = contacts.filter((c) => (c.ai_score || 0) >= 0.4 && (c.ai_score || 0) < 0.7).length;
  const hotContacts = contacts.filter((c) => (c.ai_score || 0) >= 0.7).length;

  const avgContactScore = contacts.length > 0
    ? (contacts.reduce((sum, c) => sum + (c.ai_score || 0), 0) / contacts.length).toFixed(3)
    : 0;

  // Inactive contacts (no interaction in 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const inactiveContacts = contacts.filter((c) => {
    if (!c.last_interaction) return true;
    return new Date(c.last_interaction) < ninetyDaysAgo;
  }).length;

  const metrics = {
    workspace_id: workspaceId,
    time_period: { start, end },
    total_contacts: totalContacts,
    prospects,
    leads,
    customers,
    new_contacts: newContacts,
    cold_contacts: coldContacts,
    warm_contacts: warmContacts,
    hot_contacts: hotContacts,
    avg_contact_score: parseFloat(avgContactScore),
    inactive_contacts: inactiveContacts,
  };

  console.log(`✅ Contact lifecycle metrics:`);
  console.log(`   Total contacts: ${totalContacts}`);
  console.log(`   New contacts: ${newContacts}`);
  console.log(`   Hot leads: ${hotContacts}`);
  console.log(`   Inactive: ${inactiveContacts}`);

  return metrics;
}

/**
 * Get email performance metrics
 */
async function getEmailPerformanceMetrics(workspaceId, timePeriod) {
  console.log(`📊 Calculating email performance metrics for workspace: ${workspaceId}`);

  const { start, end } = timePeriod;

  // Fetch sent emails
  const { data: sentEmails, error: sentError } = await supabase
    .from('sent_emails')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('sent_at', start)
    .lte('sent_at', end);

  if (sentError) {
    throw new Error(`Failed to fetch sent emails: ${sentError.message}`);
  }

  const emailsSent = sentEmails.length;
  const emailsDelivered = sentEmails.filter((e) => e.status === 'delivered').length;
  const emailsBounced = sentEmails.filter((e) => e.status === 'bounced').length;

  // Fetch email opens
  const { data: opens, error: opensError } = await supabase
    .from('email_opens')
    .select('email_id')
    .in(
      'email_id',
      sentEmails.map((e) => e.id)
    );

  const emailsOpened = opens ? new Set(opens.map((o) => o.email_id)).size : 0;

  // Fetch email clicks
  const { data: clicks, error: clicksError } = await supabase
    .from('email_clicks')
    .select('email_id')
    .in(
      'email_id',
      sentEmails.map((e) => e.id)
    );

  const emailsClicked = clicks ? new Set(clicks.map((c) => c.email_id)).size : 0;

  // Calculate rates
  const deliveryRate = emailsSent > 0 ? ((emailsDelivered / emailsSent) * 100).toFixed(2) : 0;
  const bounceRate = emailsSent > 0 ? ((emailsBounced / emailsSent) * 100).toFixed(2) : 0;
  const openRate = emailsDelivered > 0 ? ((emailsOpened / emailsDelivered) * 100).toFixed(2) : 0;
  const clickRate = emailsDelivered > 0 ? ((emailsClicked / emailsDelivered) * 100).toFixed(2) : 0;

  const metrics = {
    workspace_id: workspaceId,
    time_period: { start, end },
    emails_sent: emailsSent,
    emails_delivered: emailsDelivered,
    emails_bounced: emailsBounced,
    emails_opened: emailsOpened,
    emails_clicked: emailsClicked,
    delivery_rate: parseFloat(deliveryRate),
    bounce_rate: parseFloat(bounceRate),
    open_rate: parseFloat(openRate),
    click_rate: parseFloat(clickRate),
  };

  console.log(`✅ Email performance metrics:`);
  console.log(`   Sent: ${emailsSent}`);
  console.log(`   Delivered: ${emailsDelivered} (${deliveryRate}%)`);
  console.log(`   Open rate: ${openRate}%`);
  console.log(`   Click rate: ${clickRate}%`);

  return metrics;
}

/**
 * Generate AI insights from metrics
 */
async function generateInsights(metrics, metricType) {
  console.log(`🤖 Generating AI insights for ${metricType}`);

  const prompt = `Analyze the following ${metricType} metrics and provide 3 actionable insights and 3 recommendations:

${JSON.stringify(metrics, null, 2)}

Provide insights in this format:
INSIGHTS:
1. [First insight]
2. [Second insight]
3. [Third insight]

RECOMMENDATIONS:
1. [First recommendation]
2. [Second recommendation]
3. [Third recommendation]`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].text;

    // Parse insights and recommendations
    const insightsMatch = responseText.match(/INSIGHTS:([\s\S]*?)RECOMMENDATIONS:/);
    const recommendationsMatch = responseText.match(/RECOMMENDATIONS:([\s\S]*?)$/);

    const insights = insightsMatch
      ? insightsMatch[1]
          .trim()
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      : [];

    const recommendations = recommendationsMatch
      ? recommendationsMatch[1]
          .trim()
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      : [];

    console.log(`✅ Generated ${insights.length} insights and ${recommendations.length} recommendations`);

    return { insights, recommendations };
  } catch (error) {
    console.error('❌ Failed to generate insights:', error.message);
    return { insights: [], recommendations: [] };
  }
}

// =====================================================
// TASK PROCESSING
// =====================================================

async function processTask(task) {
  const { task_type, payload } = task;

  console.log(`\n🔄 Processing task: ${task_type}`);

  let result;
  const startTime = Date.now();

  try {
    let metrics;

    switch (task_type) {
      case 'analytics_campaign':
        metrics = await getCampaignMetrics(payload.campaign_id, payload.workspace_id);
        const campaignInsights = await generateInsights(metrics, 'campaign performance');
        result = { ...metrics, ...campaignInsights };
        break;

      case 'analytics_contacts':
        metrics = await getContactLifecycleMetrics(payload.workspace_id, payload.time_period);
        const contactInsights = await generateInsights(metrics, 'contact lifecycle');
        result = { ...metrics, ...contactInsights };
        break;

      case 'analytics_email':
        metrics = await getEmailPerformanceMetrics(payload.workspace_id, payload.time_period);
        const emailInsights = await generateInsights(metrics, 'email performance');
        result = { ...metrics, ...emailInsights };
        break;

      default:
        throw new Error(`Unknown task type: ${task_type}`);
    }

    const duration = Date.now() - startTime;

    // Update task status
    if (task.id) {
      await supabase.rpc('update_task_status', {
        task_id: task.id,
        new_status: 'completed',
        result_data: result,
      });
    }

    // Record execution
    await supabase.from('agent_executions').insert({
      task_id: task.id,
      agent_name: AGENT_NAME,
      model_used: 'claude-sonnet-4-5-20250929',
      duration_ms: duration,
      status: 'success',
      input_data: payload,
      output_data: result,
    });

    console.log(`✅ Task ${task.id} completed in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Update task status to failed
    if (task.id) {
      await supabase.rpc('update_task_status', {
        task_id: task.id,
        new_status: 'failed',
        result_data: { error: error.message },
      });
    }

    // Record failed execution
    await supabase.from('agent_executions').insert({
      task_id: task.id,
      agent_name: AGENT_NAME,
      model_used: 'claude-sonnet-4-5-20250929',
      duration_ms: duration,
      status: 'failed',
      input_data: payload,
      error_message: error.message,
    });

    throw error;
  }
}

// =====================================================
// AGENT LIFECYCLE
// =====================================================

async function start() {
  try {
    console.log(`🚀 Starting ${AGENT_NAME}...`);

    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    console.log(`✅ ${AGENT_NAME} connected to RabbitMQ`);

    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-message-ttl': 3600000, // 1 hour
        'x-max-priority': 10,
      },
    });

    console.log(`📥 Listening on queue: ${QUEUE_NAME}`);
    console.log(`⚙️  Concurrency: ${PREFETCH_COUNT}`);

    await channel.prefetch(PREFETCH_COUNT);

    // Health heartbeat
    const heartbeatInterval = setInterval(async () => {
      try {
        await supabase.rpc('record_agent_heartbeat', {
          agent_name: AGENT_NAME,
          current_status: 'healthy',
          metadata: { version: '1.0.0', queue: QUEUE_NAME },
        });
      } catch (err) {
        console.error('⚠️  Heartbeat failed:', err.message);
      }
    }, HEARTBEAT_INTERVAL);

    console.log(`⏰ Health heartbeat: every ${HEARTBEAT_INTERVAL / 1000}s`);

    // Consume messages
    await channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) return;

      try {
        const task = JSON.parse(msg.content.toString());
        await processTask(task);
        channel.ack(msg);
      } catch (error) {
        console.error('❌ Task processing failed:', error.message);

        const task = JSON.parse(msg.content.toString());
        if (task.retry_count < (task.max_retries || 3)) {
          console.log(`🔄 Requeuing task (retry ${task.retry_count + 1})`);
          task.retry_count++;
          channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(task)), {
            persistent: true,
          });
        }

        channel.ack(msg);
      }
    });

    console.log(`✅ ${AGENT_NAME} is running\n`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n⚠️  Received SIGTERM, shutting down...');
      clearInterval(heartbeatInterval);
      await channel.close();
      await connection.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('\n⚠️  Received SIGINT, shutting down...');
      clearInterval(heartbeatInterval);
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start agent:', error.message);
    process.exit(1);
  }
}

start();
