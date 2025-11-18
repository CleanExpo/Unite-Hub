#!/usr/bin/env node

/**
 * CONTACT INTELLIGENCE AGENT
 *
 * Purpose: Contact scoring, enrichment, deduplication, and CRM intelligence
 *
 * Task Types:
 * - contact_scoring: Calculate AI lead scores (0-100)
 * - contact_enrichment: Enrich contact data (company, job title, etc.)
 * - contact_deduplication: Find and merge duplicate contacts
 * - contact_segmentation: Create dynamic segments based on criteria
 *
 * Database Tables:
 * - contacts (read/write): Primary contact records
 * - interactions (read): Interaction history for scoring
 * - email_opens (read): Open tracking for engagement scoring
 * - email_clicks (read): Click tracking for engagement scoring
 * - client_emails (read): Email intelligence
 * - email_intelligence (read): Extracted intelligence
 *
 * AI Model: Claude Sonnet 4.5 (standard operations)
 * Concurrency: 3 (medium volume processing)
 */

import * as amqp from 'amqplib';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// =====================================================
// CONFIGURATION
// =====================================================

const AGENT_NAME = 'contact-intelligence-agent';
const QUEUE_NAME = 'contact_intelligence_queue';
const PREFETCH_COUNT = 3; // Medium concurrency
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
// SCORING ALGORITHM
// =====================================================

/**
 * Calculate composite AI lead score (0-100)
 *
 * Scoring components:
 * - Engagement (40%): Email opens, clicks, replies
 * - Behavioral (25%): Website visits, form submissions
 * - Demographic (20%): Job title, company size, industry
 * - Recency (15%): Time since last interaction
 */
async function calculateLeadScore(contactId, workspaceId) {
  console.log(`📊 Calculating score for contact ${contactId}`);

  // Fetch contact data
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('workspace_id', workspaceId)
    .single();

  if (contactError || !contact) {
    throw new Error(`Contact not found: ${contactError?.message}`);
  }

  // Fetch interactions
  const { data: interactions, error: interactionsError } = await supabase
    .from('interactions')
    .select('*')
    .eq('contact_id', contactId)
    .eq('workspace_id', workspaceId)
    .order('interaction_date', { ascending: false });

  if (interactionsError) {
    throw new Error(`Failed to fetch interactions: ${interactionsError.message}`);
  }

  // Fetch email engagement
  const { data: emailOpens, error: opensError } = await supabase
    .from('email_opens')
    .select('*')
    .eq('contact_id', contactId);

  const { data: emailClicks, error: clicksError } = await supabase
    .from('email_clicks')
    .select('*')
    .eq('contact_id', contactId);

  // Fetch email intelligence
  const { data: intelligence, error: intelligenceError } = await supabase
    .from('email_intelligence')
    .select('*')
    .eq('contact_id', contactId)
    .order('analyzed_at', { ascending: false })
    .limit(5);

  // Calculate component scores
  const engagementScore = calculateEngagementScore(interactions || [], emailOpens || [], emailClicks || []);
  const behavioralScore = calculateBehavioralScore(interactions || []);
  const demographicScore = calculateDemographicScore(contact);
  const recencyScore = calculateRecencyScore(contact.last_interaction);
  const intelligenceScore = calculateIntelligenceScore(intelligence || []);

  // Weighted composite score
  const compositeScore = (
    (engagementScore * 0.30) +
    (behavioralScore * 0.20) +
    (demographicScore * 0.20) +
    (recencyScore * 0.15) +
    (intelligenceScore * 0.15)
  );

  // Round to integer (0-100)
  const finalScore = Math.round(Math.max(0, Math.min(100, compositeScore)));

  console.log(`📊 Score breakdown for ${contact.name}:`);
  console.log(`   Engagement: ${engagementScore.toFixed(1)}/100 (30%)`);
  console.log(`   Behavioral: ${behavioralScore.toFixed(1)}/100 (20%)`);
  console.log(`   Demographic: ${demographicScore.toFixed(1)}/100 (20%)`);
  console.log(`   Recency: ${recencyScore.toFixed(1)}/100 (15%)`);
  console.log(`   Intelligence: ${intelligenceScore.toFixed(1)}/100 (15%)`);
  console.log(`   📈 FINAL SCORE: ${finalScore}/100`);

  return {
    contact_id: contactId,
    score: finalScore,
    components: {
      engagement: Math.round(engagementScore),
      behavioral: Math.round(behavioralScore),
      demographic: Math.round(demographicScore),
      recency: Math.round(recencyScore),
      intelligence: Math.round(intelligenceScore)
    }
  };
}

function calculateEngagementScore(interactions, opens, clicks) {
  const emailSent = interactions.filter(i => i.interaction_type === 'email_sent').length;
  const emailReplied = interactions.filter(i => i.interaction_type === 'email_replied').length;

  const openRate = emailSent > 0 ? opens.length / emailSent : 0;
  const clickRate = emailSent > 0 ? clicks.length / emailSent : 0;
  const replyRate = emailSent > 0 ? emailReplied / emailSent : 0;

  // Scoring:
  // 40 points for opens (>50% open rate = full points)
  // 30 points for clicks (>20% click rate = full points)
  // 30 points for replies (>10% reply rate = full points)
  const score = (
    (Math.min(openRate / 0.5, 1) * 40) +
    (Math.min(clickRate / 0.2, 1) * 30) +
    (Math.min(replyRate / 0.1, 1) * 30)
  );

  return score;
}

function calculateBehavioralScore(interactions) {
  const meetings = interactions.filter(i => i.interaction_type === 'meeting').length;
  const formSubmissions = interactions.filter(i => i.interaction_type === 'form_submission').length;
  const websiteVisits = interactions.filter(i => i.interaction_type === 'website_visit').length;
  const demoRequests = interactions.filter(i => i.interaction_type === 'demo_request').length;

  // Scoring:
  // Meetings: 30 points (1+ meetings = full points)
  // Demo requests: 30 points (1+ = full points)
  // Form submissions: 20 points (2+ = full points)
  // Website visits: 20 points (5+ = full points)
  const score = (
    (Math.min(meetings, 1) * 30) +
    (Math.min(demoRequests, 1) * 30) +
    (Math.min(formSubmissions / 2, 1) * 20) +
    (Math.min(websiteVisits / 5, 1) * 20)
  );

  return score;
}

function calculateDemographicScore(contact) {
  let score = 0;

  // Job title scoring (0-40 points)
  const jobTitle = contact.job_title?.toLowerCase() || '';
  if (jobTitle.includes('ceo') || jobTitle.includes('founder') || jobTitle.includes('owner')) {
    score += 40; // Decision maker
  } else if (jobTitle.includes('cto') || jobTitle.includes('cmo') || jobTitle.includes('director')) {
    score += 35; // C-level/Director
  } else if (jobTitle.includes('manager') || jobTitle.includes('head')) {
    score += 25; // Manager
  } else if (jobTitle.includes('lead') || jobTitle.includes('senior')) {
    score += 15; // Senior role
  } else {
    score += 5; // Other
  }

  // Company size (0-30 points) - based on custom_fields
  const companySize = contact.custom_fields?.company_size;
  if (companySize === 'enterprise' || companySize === '1000+') {
    score += 30;
  } else if (companySize === 'large' || companySize === '500-1000') {
    score += 25;
  } else if (companySize === 'medium' || companySize === '100-500') {
    score += 20;
  } else if (companySize === 'small' || companySize === '50-100') {
    score += 10;
  }

  // Industry fit (0-30 points)
  const targetIndustries = ['technology', 'software', 'saas', 'marketing', 'consulting'];
  const industry = contact.industry?.toLowerCase() || '';
  if (targetIndustries.some(target => industry.includes(target))) {
    score += 30; // Target industry
  } else {
    score += 10; // Other industry
  }

  return score;
}

function calculateRecencyScore(lastInteraction) {
  if (!lastInteraction) return 0;

  const daysSinceInteraction = (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24);

  // Scoring:
  // 0-7 days: 100 points
  // 8-30 days: 80 points
  // 31-90 days: 50 points
  // 91-180 days: 20 points
  // 180+ days: 0 points
  if (daysSinceInteraction <= 7) return 100;
  if (daysSinceInteraction <= 30) return 80;
  if (daysSinceInteraction <= 90) return 50;
  if (daysSinceInteraction <= 180) return 20;
  return 0;
}

function calculateIntelligenceScore(intelligence) {
  if (!intelligence || intelligence.length === 0) return 0;

  let score = 0;

  // Analyze recent intelligence (last 5 emails)
  intelligence.forEach(intel => {
    // Business goals mentioned (+20)
    if (intel.business_goals && intel.business_goals.length > 0) {
      score += 20;
    }

    // Pain points identified (+20)
    if (intel.pain_points && intel.pain_points.length > 0) {
      score += 20;
    }

    // Budget/requirements mentioned (+30)
    if (intel.requirements && Object.keys(intel.requirements).length > 0) {
      score += 30;
    }

    // High decision readiness (+30)
    if (intel.decision_readiness === 'high') {
      score += 30;
    } else if (intel.decision_readiness === 'medium') {
      score += 15;
    }
  });

  // Cap at 100 and average across emails
  return Math.min(score / intelligence.length, 100);
}

/**
 * Find duplicate contacts using fuzzy matching
 */
async function findDuplicates(workspaceId) {
  console.log(`🔍 Finding duplicate contacts in workspace ${workspaceId}`);

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, name, email, company')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  const duplicates = [];
  const seen = new Set();

  for (let i = 0; i < contacts.length; i++) {
    const contact1 = contacts[i];
    if (seen.has(contact1.id)) continue;

    const group = [contact1];

    for (let j = i + 1; j < contacts.length; j++) {
      const contact2 = contacts[j];
      if (seen.has(contact2.id)) continue;

      // Exact email match
      if (contact1.email && contact2.email && contact1.email.toLowerCase() === contact2.email.toLowerCase()) {
        group.push(contact2);
        seen.add(contact2.id);
        continue;
      }

      // Fuzzy name + company match
      if (
        contact1.name && contact2.name && contact1.company && contact2.company &&
        similarityScore(contact1.name, contact2.name) > 0.8 &&
        similarityScore(contact1.company, contact2.company) > 0.8
      ) {
        group.push(contact2);
        seen.add(contact2.id);
      }
    }

    if (group.length > 1) {
      duplicates.push(group);
    }
  }

  console.log(`✅ Found ${duplicates.length} duplicate groups`);

  return {
    workspace_id: workspaceId,
    duplicate_groups: duplicates.length,
    duplicates: duplicates.map(group => ({
      count: group.length,
      contacts: group.map(c => ({ id: c.id, name: c.name, email: c.email }))
    }))
  };
}

function similarityScore(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(s1, s2);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Batch score all contacts in workspace
 */
async function batchScoreContacts(workspaceId, batchSize = 50) {
  console.log(`📊 Batch scoring contacts in workspace ${workspaceId}`);

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id')
    .eq('workspace_id', workspaceId)
    .limit(batchSize);

  if (error) {
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  console.log(`📊 Scoring ${contacts.length} contacts...`);

  const results = [];
  let successful = 0;
  let failed = 0;

  for (const contact of contacts) {
    try {
      const scoreResult = await calculateLeadScore(contact.id, workspaceId);

      // Update contact score
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ ai_score: scoreResult.score / 100 }) // Store as 0.0-1.0
        .eq('id', contact.id);

      if (updateError) {
        throw updateError;
      }

      results.push(scoreResult);
      successful++;
    } catch (error) {
      console.error(`❌ Failed to score contact ${contact.id}:`, error.message);
      failed++;
    }
  }

  console.log(`✅ Batch scoring complete: ${successful} successful, ${failed} failed`);

  return {
    workspace_id: workspaceId,
    contacts_scored: successful,
    contacts_failed: failed,
    results
  };
}

// =====================================================
// TASK PROCESSING
// =====================================================

async function processTask(task) {
  const { task_type, payload } = task;

  console.log(`\n🔄 Processing task: ${task_type}`);

  let result;
  const startTime = Date.now();

  switch (task_type) {
    case 'contact_scoring':
      if (payload.contact_id) {
        // Single contact scoring
        result = await calculateLeadScore(payload.contact_id, payload.workspace_id);

        // Update contact score
        await supabase
          .from('contacts')
          .update({ ai_score: result.score / 100 })
          .eq('id', payload.contact_id);
      } else {
        // Batch scoring
        result = await batchScoreContacts(payload.workspace_id, payload.batch_size);
      }
      break;

    case 'contact_deduplication':
      result = await findDuplicates(payload.workspace_id);
      break;

    default:
      throw new Error(`Unknown task type: ${task_type}`);
  }

  const duration = Date.now() - startTime;

  // Update task status
  await supabase.rpc('update_task_status', {
    task_id: task.id,
    new_status: 'completed',
    result_data: result
  });

  // Record execution
  await supabase.from('agent_executions').insert({
    task_id: task.id,
    agent_name: AGENT_NAME,
    model_used: 'algorithm', // No AI model for scoring
    duration_ms: duration,
    status: 'success'
  });

  console.log(`✅ Task ${task.id} completed in ${duration}ms`);

  return result;
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
        'x-message-ttl': 3600000,
        'x-max-priority': 10
      }
    });

    console.log(`📥 Listening on queue: ${QUEUE_NAME}`);
    console.log(`⚙️  Concurrency: ${PREFETCH_COUNT}`);

    await channel.prefetch(PREFETCH_COUNT);

    const heartbeatInterval = setInterval(async () => {
      try {
        await supabase.rpc('record_agent_heartbeat', {
          agent_name: AGENT_NAME,
          current_status: 'healthy',
          metadata: { version: '1.0.0', queue: QUEUE_NAME }
        });
      } catch (err) {
        console.error('⚠️  Heartbeat failed:', err.message);
      }
    }, HEARTBEAT_INTERVAL);

    console.log(`⏰ Health heartbeat: every ${HEARTBEAT_INTERVAL / 1000}s`);

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
            persistent: true
          });
        }

        channel.ack(msg);
      }
    });

    console.log(`✅ ${AGENT_NAME} is running\n`);

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
