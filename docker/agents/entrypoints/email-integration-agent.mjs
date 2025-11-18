#!/usr/bin/env node

/**
 * EMAIL INTEGRATION AGENT
 *
 * Purpose: Gmail/Outlook email synchronization and management
 *
 * Task Types:
 * - email_sync: Sync emails from Gmail/Outlook
 * - email_fetch_thread: Fetch email conversation thread
 *
 * Database Tables:
 * - email_integrations (read/write): OAuth connections
 * - client_emails (write): Stored email messages
 * - contacts (read): Link emails to contacts
 *
 * External APIs: Gmail API, Microsoft Graph API
 * Concurrency: 3 (medium volume processing)
 */

import * as amqp from 'amqplib';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// =====================================================
// CONFIGURATION
// =====================================================

const AGENT_NAME = 'email-integration-agent';
const QUEUE_NAME = 'email_integration_queue';
const PREFETCH_COUNT = 3; // Medium concurrency
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://unite_hub:unite_hub_pass@localhost:5672';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// =====================================================
// VALIDATION
// =====================================================

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!googleClientId || !googleClientSecret) {
  console.error('❌ Missing Google OAuth credentials');
  process.exit(1);
}

// =====================================================
// CLIENTS
// =====================================================

const supabase = createClient(supabaseUrl, supabaseKey);

let connection = null;
let channel = null;

// =====================================================
// GMAIL INTEGRATION
// =====================================================

/**
 * Create Gmail OAuth2 client
 */
function createGmailClient(accessToken, refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    googleClientId,
    googleClientSecret,
    'http://localhost:3008/api/integrations/gmail/callback'
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Fetch emails for a specific contact
 */
async function fetchEmailsForContact(integrationId, contactEmail, workspaceId, maxResults = 500) {
  console.log(`📧 Fetching emails for contact: ${contactEmail}`);

  const startTime = Date.now();

  // 1. Get integration
  const { data: integration, error: integrationError } = await supabase
    .from('email_integrations')
    .select('*')
    .eq('id', integrationId)
    .eq('workspace_id', workspaceId)
    .single();

  if (integrationError || !integration) {
    throw new Error(`EMAIL_INT_005: Integration not found - ${integrationError?.message}`);
  }

  // 2. Create Gmail client
  const gmail = createGmailClient(integration.access_token, integration.refresh_token);

  // 3. Build search query
  const query = `from:${contactEmail} OR to:${contactEmail}`;

  try {
    // 4. Fetch message IDs
    console.log(`🔍 Searching for emails with query: ${query}`);

    const { data: listResponse } = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: maxResults,
    });

    const messageIds = listResponse.messages || [];
    console.log(`📨 Found ${messageIds.length} emails`);

    if (messageIds.length === 0) {
      return {
        success: true,
        total_emails_fetched: 0,
        new_emails_stored: 0,
        duplicate_emails_skipped: 0,
        errors: [],
        processing_time_ms: Date.now() - startTime,
      };
    }

    // 5. Fetch email details
    let newEmailsStored = 0;
    let duplicateEmailsSkipped = 0;
    const errors = [];

    for (const { id: messageId } of messageIds) {
      try {
        // Check if email already exists
        const { data: existingEmail } = await supabase
          .from('client_emails')
          .select('id')
          .eq('provider_message_id', messageId)
          .eq('workspace_id', workspaceId)
          .single();

        if (existingEmail) {
          duplicateEmailsSkipped++;
          continue;
        }

        // Fetch full email details
        const { data: messageData } = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });

        // Parse email
        const emailData = parseGmailMessage(messageData, workspaceId, integration.org_id, integrationId);

        // Store email
        const { error: insertError } = await supabase.from('client_emails').insert(emailData);

        if (insertError) {
          console.error(`❌ Failed to store email ${messageId}:`, insertError.message);
          errors.push({ message_id: messageId, error: insertError.message });
        } else {
          newEmailsStored++;
          console.log(`✅ Stored email ${messageId} from ${emailData.from_email}`);
        }
      } catch (error) {
        console.error(`❌ Failed to fetch email ${messageId}:`, error.message);
        errors.push({ message_id: messageId, error: error.message });
      }
    }

    // 6. Update last sync
    await supabase
      .from('email_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integrationId);

    const processingTime = Date.now() - startTime;

    console.log(`\n✅ Email fetch complete!`);
    console.log(`   Total found: ${messageIds.length}`);
    console.log(`   New stored: ${newEmailsStored}`);
    console.log(`   Duplicates skipped: ${duplicateEmailsSkipped}`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Time: ${processingTime}ms`);

    return {
      success: true,
      total_emails_fetched: messageIds.length,
      new_emails_stored: newEmailsStored,
      duplicate_emails_skipped: duplicateEmailsSkipped,
      errors,
      processing_time_ms: processingTime,
    };
  } catch (error) {
    console.error('❌ Gmail API error:', error.message);

    // Check if token expired
    if (error.code === 401) {
      throw new Error(`EMAIL_INT_006: Integration expired - Token needs refresh`);
    }

    throw new Error(`EMAIL_INT_007: Gmail API error - ${error.message}`);
  }
}

/**
 * Parse Gmail message into our schema
 */
function parseGmailMessage(message, workspaceId, orgId, integrationId) {
  const headers = message.payload?.headers || [];

  // Extract headers
  const getHeader = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || null;

  const fromHeader = getHeader('from') || '';
  const toHeader = getHeader('to') || '';
  const ccHeader = getHeader('cc') || '';
  const subject = getHeader('subject');
  const dateHeader = getHeader('date');

  // Parse "From" header (e.g., "John Doe <john@example.com>")
  const fromMatch = fromHeader.match(/(.*?)\s*<(.+?)>/) || [];
  const fromName = fromMatch[1]?.trim() || null;
  const fromEmail = fromMatch[2]?.trim() || fromHeader.trim();

  // Parse recipient emails
  const parseEmails = (headerValue) => {
    if (!headerValue) return [];
    return headerValue
      .split(',')
      .map((email) => {
        const match = email.match(/<(.+?)>/) || [];
        return match[1] || email.trim();
      })
      .filter((email) => email.includes('@'));
  };

  const toEmails = parseEmails(toHeader);
  const ccEmails = parseEmails(ccHeader);

  // Extract body
  let bodyHtml = null;
  let bodyText = null;

  const extractBody = (part) => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
    }
    if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
    }
    if (part.parts) {
      part.parts.forEach(extractBody);
    }
  };

  extractBody(message.payload);

  // Snippet
  const snippet = message.snippet || null;

  // Direction (inbound if from contact, outbound if from user)
  const direction = message.labelIds?.includes('SENT') ? 'outbound' : 'inbound';

  // Timestamp
  const receivedAt = dateHeader ? new Date(dateHeader).toISOString() : new Date(parseInt(message.internalDate)).toISOString();

  // Labels
  const labels = message.labelIds || [];

  return {
    workspace_id: workspaceId,
    org_id: orgId,
    integration_id: integrationId,
    provider_message_id: message.id,
    provider_thread_id: message.threadId,
    from_email: fromEmail,
    from_name: fromName,
    to_emails: toEmails,
    cc_emails: ccEmails,
    bcc_emails: [],
    subject,
    body_html: bodyHtml,
    body_text: bodyText,
    snippet,
    direction,
    is_read: !message.labelIds?.includes('UNREAD'),
    is_starred: message.labelIds?.includes('STARRED'),
    labels,
    is_analyzed: false,
    received_at: receivedAt,
    sent_at: direction === 'outbound' ? receivedAt : null,
  };
}

/**
 * Fetch email thread
 */
async function fetchEmailThread(integrationId, threadId, workspaceId) {
  console.log(`🧵 Fetching email thread: ${threadId}`);

  // 1. Get integration
  const { data: integration, error: integrationError } = await supabase
    .from('email_integrations')
    .select('*')
    .eq('id', integrationId)
    .eq('workspace_id', workspaceId)
    .single();

  if (integrationError || !integration) {
    throw new Error(`EMAIL_INT_005: Integration not found`);
  }

  // 2. Create Gmail client
  const gmail = createGmailClient(integration.access_token, integration.refresh_token);

  try {
    // 3. Fetch thread
    const { data: threadData } = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    });

    const messages = threadData.messages || [];
    console.log(`📨 Found ${messages.length} messages in thread`);

    const storedEmails = [];

    // 4. Store each message
    for (const message of messages) {
      // Check if already exists
      const { data: existingEmail } = await supabase
        .from('client_emails')
        .select('id')
        .eq('provider_message_id', message.id)
        .eq('workspace_id', workspaceId)
        .single();

      if (existingEmail) {
        storedEmails.push(existingEmail);
        continue;
      }

      // Parse and store
      const emailData = parseGmailMessage(message, workspaceId, integration.org_id, integrationId);

      const { data: newEmail, error: insertError } = await supabase
        .from('client_emails')
        .insert(emailData)
        .select()
        .single();

      if (!insertError && newEmail) {
        storedEmails.push(newEmail);
      }
    }

    // 5. Fetch stored emails ordered by received_at
    const { data: orderedEmails } = await supabase
      .from('client_emails')
      .select('*')
      .eq('provider_thread_id', threadId)
      .eq('workspace_id', workspaceId)
      .order('received_at', { ascending: true });

    console.log(`✅ Thread fetched: ${orderedEmails?.length || 0} emails`);

    return {
      success: true,
      thread_id: threadId,
      emails: orderedEmails || [],
      total_emails: orderedEmails?.length || 0,
    };
  } catch (error) {
    console.error('❌ Failed to fetch thread:', error.message);
    throw new Error(`EMAIL_INT_010: Failed to fetch thread - ${error.message}`);
  }
}

/**
 * Sync new emails (incremental sync)
 */
async function syncNewEmails(integrationId, workspaceId, contactEmail = null) {
  console.log(`🔄 Syncing new emails for integration: ${integrationId}`);

  // 1. Get integration
  const { data: integration, error: integrationError } = await supabase
    .from('email_integrations')
    .select('*')
    .eq('id', integrationId)
    .eq('workspace_id', workspaceId)
    .single();

  if (integrationError || !integration) {
    throw new Error(`EMAIL_INT_005: Integration not found`);
  }

  // 2. Build query
  let query = 'in:inbox OR in:sent';
  if (contactEmail) {
    query += ` (from:${contactEmail} OR to:${contactEmail})`;
  }

  // Only fetch recent emails (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const afterDate = Math.floor(sevenDaysAgo.getTime() / 1000);
  query += ` after:${afterDate}`;

  // 3. Fetch emails
  const gmail = createGmailClient(integration.access_token, integration.refresh_token);

  try {
    const { data: listResponse } = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100,
    });

    const messageIds = listResponse.messages || [];
    let newEmailsStored = 0;

    // 4. Store new emails
    for (const { id: messageId } of messageIds) {
      // Check if exists
      const { data: existingEmail } = await supabase
        .from('client_emails')
        .select('id')
        .eq('provider_message_id', messageId)
        .eq('workspace_id', workspaceId)
        .single();

      if (existingEmail) continue;

      // Fetch and store
      const { data: messageData } = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const emailData = parseGmailMessage(messageData, workspaceId, integration.org_id, integrationId);

      const { error: insertError } = await supabase.from('client_emails').insert(emailData);

      if (!insertError) {
        newEmailsStored++;
      }
    }

    // 5. Update last sync
    const lastSyncAt = new Date().toISOString();
    await supabase.from('email_integrations').update({ last_sync_at: lastSyncAt }).eq('id', integrationId);

    console.log(`✅ Sync complete: ${newEmailsStored} new emails`);

    return {
      success: true,
      new_emails: newEmailsStored,
      last_sync_at: lastSyncAt,
    };
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    throw new Error(`EMAIL_INT_012: Sync failed - ${error.message}`);
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
    switch (task_type) {
      case 'email_sync':
        result = await syncNewEmails(
          payload.integration_id,
          payload.workspace_id,
          payload.contact_email
        );
        break;

      case 'email_fetch_all':
        result = await fetchEmailsForContact(
          payload.integration_id,
          payload.contact_email,
          payload.workspace_id,
          payload.max_results
        );
        break;

      case 'email_fetch_thread':
        result = await fetchEmailThread(
          payload.integration_id,
          payload.thread_id,
          payload.workspace_id
        );
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
      model_used: 'gmail-api',
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
      model_used: 'gmail-api',
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
