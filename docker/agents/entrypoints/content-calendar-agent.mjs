#!/usr/bin/env node

/**
 * CONTENT CALENDAR AGENT
 *
 * Purpose: Generate 90-day content calendars from marketing strategies
 *
 * Task Types:
 * - calendar_generation: Create complete 90-day calendar
 * - calendar_optimization: Optimize existing calendar based on engagement
 *
 * Database Tables:
 * - calendar_posts (write): Scheduled content calendar
 * - marketing_strategies (read): Strategy and content pillars
 * - generated_content (read): AI-generated content
 * - contacts (read): Contact information
 *
 * AI Model: Claude Opus 4 with Extended Thinking (10000 tokens)
 * Concurrency: 1 (resource-intensive planning)
 */

import * as amqp from 'amqplib';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// =====================================================
// CONFIGURATION
// =====================================================

const AGENT_NAME = 'content-calendar-agent';
const QUEUE_NAME = 'content_calendar_queue';
const PREFETCH_COUNT = 1; // Heavy processing, low concurrency
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
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate total posts based on strategy and duration
 */
function calculateTotalPosts(strategy, durationDays) {
  // Default: ~7 posts per week (LinkedIn B2B focus)
  const weeksCount = Math.ceil(durationDays / 7);
  const postsPerWeek = strategy.posting_frequency || 7;
  return weeksCount * postsPerWeek;
}

/**
 * Calculate distribution counts by field
 */
function calculateDistribution(posts, field) {
  const distribution = {};
  posts.forEach(post => {
    const value = post[field];
    distribution[value] = (distribution[value] || 0) + 1;
  });
  return distribution;
}

/**
 * Add days to date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format date for AEST timezone
 */
function formatAEST(date) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

// =====================================================
// CORE AGENT FUNCTIONS
// =====================================================

/**
 * Generate 90-day content calendar
 */
async function generateCalendar(payload) {
  const {
    contact_id,
    workspace_id,
    strategy_id,
    start_date = new Date(),
    duration_days = 90
  } = payload;

  console.log(`📅 Generating ${duration_days}-day calendar for strategy ${strategy_id}`);

  // 1. Fetch strategy
  const { data: strategy, error: strategyError } = await supabase
    .from('marketing_strategies')
    .select('*')
    .eq('id', strategy_id)
    .eq('workspace_id', workspace_id)
    .single();

  if (strategyError || !strategy) {
    throw new Error(`Strategy not found: ${strategyError?.message}`);
  }

  // 2. Calculate posting frequency
  const totalPosts = calculateTotalPosts(strategy, duration_days);
  const postsPerWeek = Math.ceil(totalPosts / (duration_days / 7));

  console.log(`📊 Planning ${totalPosts} posts (${postsPerWeek} posts/week)`);

  // 3. Platform distribution (B2B focus)
  const platformDistribution = {
    linkedin: Math.ceil(totalPosts * 0.35), // 35% LinkedIn (B2B)
    facebook: Math.ceil(totalPosts * 0.20), // 20% Facebook
    instagram: Math.ceil(totalPosts * 0.20), // 20% Instagram
    twitter: Math.ceil(totalPosts * 0.15),   // 15% Twitter
    tiktok: Math.ceil(totalPosts * 0.10)     // 10% TikTok
  };

  // 4. Content pillar distribution
  const contentPillars = strategy.content_pillars || [];
  const pillarDistribution = contentPillars.map(pillar => ({
    pillar: pillar.name || pillar,
    count: Math.ceil(totalPosts * ((pillar.percentage_allocation || 25) / 100))
  }));

  // 5. Generate calendar via Claude Opus with Extended Thinking
  const prompt = `Generate a ${duration_days}-day content calendar for a marketing strategy.

STRATEGY OVERVIEW:
- Campaign: ${strategy.strategy_name || 'Marketing Campaign'}
- Target Platforms: ${strategy.target_platforms?.join(', ') || 'LinkedIn, Facebook, Instagram, Twitter, TikTok'}
- Content Pillars: ${contentPillars.map(p => `${p.name || p} (${p.percentage_allocation || 25}%)`).join(', ')}

POSTING FREQUENCY:
- Total Posts: ${totalPosts}
- Posts per Week: ${postsPerWeek}
- Platform Distribution: ${JSON.stringify(platformDistribution, null, 2)}

CALENDAR PHASES:
${(strategy.campaign_calendar?.phases || []).map(phase => `
Phase: ${phase.phase_name} (${phase.start_date} - ${phase.end_date})
Objectives: ${phase.objectives?.join(', ') || 'Awareness, Engagement, Conversion'}
Content Focus: ${phase.content_focus?.join(', ') || 'Educational, Promotional, Engagement'}
`).join('\n')}

REQUIREMENTS:
1. Distribute posts evenly across ${duration_days} days starting ${formatAEST(new Date(start_date))}
2. Respect platform distribution percentages (±10% acceptable)
3. Balance content pillars according to allocation (±15% acceptable)
4. Optimal posting times for Australian audience (AEST):
   - LinkedIn: 9-11am Tuesday-Thursday
   - Facebook: 1-3pm Wednesday-Friday
   - Instagram: 7-9pm Monday-Wednesday
   - Twitter: 8-10am Monday-Friday
   - TikTok: 6-9pm Tuesday-Thursday
5. Mix post types: 70% regular posts, 20% video, 10% stories/reels
6. For each post, provide:
   - scheduled_date: ISO 8601 datetime in AEST
   - platform: linkedin | facebook | instagram | twitter | tiktok
   - post_type: post | story | reel | carousel | video | article
   - content_pillar: One of the defined pillars
   - suggested_copy: 50-150 words, platform-appropriate
   - suggested_hashtags: Array of 3-10 hashtags (no # symbol)
   - suggested_image_prompt: DALL-E prompt for visual (1-2 sentences)
   - ai_reasoning: Why this topic on this day (1-2 sentences)
   - best_time_to_post: HH:MM AEST
   - target_audience: Primary audience segment (1-2 words)
   - call_to_action: Clear CTA (1 sentence)

Return ONLY a valid JSON array of post objects. No markdown, no explanation, just the JSON array.

Example post structure:
[
  {
    "scheduled_date": "2025-11-19T09:30:00+11:00",
    "platform": "linkedin",
    "post_type": "article",
    "content_pillar": "Thought Leadership",
    "suggested_copy": "Transform your customer relationships with AI-powered insights...",
    "suggested_hashtags": ["B2BSaaS", "MarketingAutomation", "AIforBusiness"],
    "suggested_image_prompt": "Modern office workspace with AI dashboard on screen, professional lighting",
    "ai_reasoning": "Tuesday morning on LinkedIn reaches decision-makers at peak engagement time",
    "best_time_to_post": "09:30 AEST",
    "target_audience": "B2B Marketing Managers",
    "call_to_action": "Book a demo to see how AI can transform your CRM."
  }
]`;

  console.log('🤖 Generating calendar with Claude Opus 4 (Extended Thinking)...');

  const startTime = Date.now();

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 16384, // Large output for 90 posts
    temperature: 0.6,
    thinking: {
      type: 'enabled',
      budget_tokens: 10000 // Strategic planning
    },
    messages: [{ role: 'user', content: prompt }]
  });

  const duration = Date.now() - startTime;
  console.log(`⏱️  Calendar generated in ${(duration / 1000).toFixed(2)}s`);

  // Extract JSON from response
  const responseText = message.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  // Parse calendar posts
  let posts;
  try {
    // Try to extract JSON array from markdown code blocks or raw response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }
    posts = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('❌ Failed to parse calendar:', parseError.message);
    console.error('Response:', responseText.substring(0, 500));
    throw new Error('Failed to parse calendar response');
  }

  console.log(`✅ Parsed ${posts.length} posts from response`);

  // 6. Validate distribution
  const actualPlatformDist = calculateDistribution(posts, 'platform');
  const actualPillarDist = calculateDistribution(posts, 'content_pillar');

  console.log('📊 Platform Distribution:', actualPlatformDist);
  console.log('📊 Pillar Distribution:', actualPillarDist);

  // 7. Save posts to database
  const postsToInsert = posts.map(post => ({
    contact_id,
    workspace_id,
    strategy_id,
    scheduled_date: post.scheduled_date,
    platform: post.platform,
    post_type: post.post_type,
    content_pillar: post.content_pillar,
    suggested_copy: post.suggested_copy,
    suggested_hashtags: post.suggested_hashtags,
    suggested_image_prompt: post.suggested_image_prompt,
    ai_reasoning: post.ai_reasoning,
    best_time_to_post: post.best_time_to_post,
    target_audience: post.target_audience,
    call_to_action: post.call_to_action,
    status: 'draft'
  }));

  const { data: insertedPosts, error: insertError } = await supabase
    .from('calendar_posts')
    .insert(postsToInsert)
    .select();

  if (insertError) {
    throw new Error(`Failed to save posts: ${insertError.message}`);
  }

  console.log(`✅ Saved ${insertedPosts.length} posts to database`);

  // 8. Calculate cost estimate
  const inputTokens = message.usage.input_tokens;
  const outputTokens = message.usage.output_tokens;
  const thinkingTokens = message.usage.cache_read_input_tokens || 0;

  // Opus 4 pricing: $15/MTok input, $75/MTok output, $112.50/MTok thinking
  const costEstimate = (
    (inputTokens / 1000000) * 15 +
    (outputTokens / 1000000) * 75 +
    (thinkingTokens / 1000000) * 112.50
  );

  // 9. Return calendar summary
  return {
    success: true,
    calendar_id: insertedPosts[0].id,
    posts_created: insertedPosts.length,
    calendar: {
      start_date: new Date(start_date),
      end_date: addDays(new Date(start_date), duration_days),
      total_posts: insertedPosts.length,
      posts_by_platform: actualPlatformDist,
      posts_by_pillar: actualPillarDist
    },
    performance: {
      duration_ms: duration,
      tokens_input: inputTokens,
      tokens_output: outputTokens,
      tokens_thinking: thinkingTokens,
      cost_estimate_usd: costEstimate
    }
  };
}

/**
 * Get calendar with filtering
 */
async function getCalendar(payload) {
  const {
    workspace_id,
    contact_id,
    strategy_id,
    date_range,
    platform,
    status
  } = payload;

  let query = supabase
    .from('calendar_posts')
    .select('*')
    .eq('workspace_id', workspace_id);

  if (contact_id) query = query.eq('contact_id', contact_id);
  if (strategy_id) query = query.eq('strategy_id', strategy_id);
  if (date_range) {
    query = query
      .gte('scheduled_date', date_range.start)
      .lte('scheduled_date', date_range.end);
  }
  if (platform) query = query.eq('platform', platform);
  if (status) query = query.eq('status', status);

  query = query.order('scheduled_date', { ascending: true });

  const { data: posts, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch calendar: ${error.message}`);
  }

  const now = new Date();
  const summary = {
    total_posts: posts.length,
    drafts: posts.filter(p => p.status === 'draft').length,
    approved: posts.filter(p => p.status === 'approved').length,
    published: posts.filter(p => p.status === 'published').length,
    upcoming: posts.filter(p => new Date(p.scheduled_date) > now).length,
    overdue: posts.filter(p => new Date(p.scheduled_date) < now && p.status !== 'published').length
  };

  return { success: true, posts, summary };
}

// =====================================================
// TASK PROCESSING
// =====================================================

async function processTask(task) {
  const { task_type, payload } = task;

  console.log(`\n🔄 Processing task: ${task_type}`);

  let result;

  switch (task_type) {
    case 'calendar_generation':
      result = await generateCalendar(payload);
      break;

    case 'calendar_retrieval':
      result = await getCalendar(payload);
      break;

    default:
      throw new Error(`Unknown task type: ${task_type}`);
  }

  // Update task status in database
  await supabase.rpc('update_task_status', {
    task_id: task.id,
    new_status: 'completed',
    result_data: result
  });

  // Record execution
  await supabase.from('agent_executions').insert({
    task_id: task.id,
    agent_name: AGENT_NAME,
    model_used: 'claude-opus-4-5-20251101',
    tokens_input: result.performance?.tokens_input,
    tokens_output: result.performance?.tokens_output,
    cost_estimate_usd: result.performance?.cost_estimate_usd,
    duration_ms: result.performance?.duration_ms,
    status: 'success'
  });

  console.log(`✅ Task ${task.id} completed successfully`);

  return result;
}

// =====================================================
// AGENT LIFECYCLE
// =====================================================

async function start() {
  try {
    console.log(`🚀 Starting ${AGENT_NAME}...`);

    // Connect to RabbitMQ
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    console.log(`✅ ${AGENT_NAME} connected to RabbitMQ`);

    // Assert queue
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-message-ttl': 3600000, // 1 hour
        'x-max-priority': 10
      }
    });

    console.log(`📥 Listening on queue: ${QUEUE_NAME}`);
    console.log(`⚙️  Concurrency: ${PREFETCH_COUNT}`);

    // Set prefetch
    await channel.prefetch(PREFETCH_COUNT);

    // Start health heartbeat
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

    // Consume messages
    await channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) return;

      try {
        const task = JSON.parse(msg.content.toString());
        await processTask(task);
        channel.ack(msg);
      } catch (error) {
        console.error('❌ Task processing failed:', error.message);

        // Nack and requeue if retries remaining
        const task = JSON.parse(msg.content.toString());
        if (task.retry_count < (task.max_retries || 3)) {
          console.log(`🔄 Requeuing task (retry ${task.retry_count + 1})`);
          task.retry_count++;
          channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(task)), {
            persistent: true
          });
        } else {
          console.log('❌ Max retries exceeded, marking as failed');
          await supabase.rpc('update_task_status', {
            task_id: task.id,
            new_status: 'failed',
            result_data: { error: error.message }
          });
        }

        channel.ack(msg);
      }
    });

    console.log(`✅ ${AGENT_NAME} is running\n`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n⚠️  Received SIGTERM, shutting down gracefully...');
      clearInterval(heartbeatInterval);
      await channel.close();
      await connection.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('\n⚠️  Received SIGINT, shutting down gracefully...');
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

// Start the agent
start();
