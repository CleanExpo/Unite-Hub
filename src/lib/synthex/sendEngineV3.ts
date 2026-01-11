/**
 * Synthex Multi-Channel Send Engine v3
 *
 * Phase: D31 - Email + SMS + Social + Push
 *
 * Unified multi-channel message delivery with rate
 * limiting, retry logic, and delivery tracking
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// =====================================================
// LAZY ANTHROPIC CLIENT
// =====================================================

let anthropicClient: Anthropic | null = null;
let clientCreatedAt: number = 0;
const CLIENT_TTL_MS = 60_000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - clientCreatedAt > CLIENT_TTL_MS) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
    clientCreatedAt = now;
  }
  return anthropicClient;
}

// =====================================================
// TYPES
// =====================================================

export type ChannelType =
  | "email"
  | "sms"
  | "push"
  | "whatsapp"
  | "slack"
  | "discord"
  | "telegram"
  | "facebook_messenger"
  | "instagram_dm"
  | "twitter_dm"
  | "linkedin_message"
  | "in_app"
  | "webhook"
  | "custom";

export type ProviderType =
  | "sendgrid"
  | "mailgun"
  | "ses"
  | "postmark"
  | "twilio"
  | "messagebird"
  | "vonage"
  | "firebase"
  | "onesignal"
  | "pusher"
  | "meta"
  | "slack_api"
  | "discord_api"
  | "telegram_api"
  | "custom";

export type SendStatus =
  | "pending"
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "failed"
  | "bounced"
  | "rejected"
  | "spam"
  | "unsubscribed"
  | "cancelled";

export type SendPriority = "critical" | "high" | "normal" | "low" | "bulk";

export type TemplateType =
  | "transactional"
  | "marketing"
  | "notification"
  | "reminder"
  | "alert"
  | "welcome"
  | "onboarding"
  | "re_engagement"
  | "custom";

export interface SendChannel {
  id: string;
  tenant_id: string;
  channel_name: string;
  channel_type: ChannelType;
  provider?: ProviderType;
  credentials: Record<string, unknown>;
  settings: Record<string, unknown>;
  rate_limit_per_second: number;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  current_second_count: number;
  current_minute_count: number;
  current_hour_count: number;
  current_day_count: number;
  success_rate: number;
  avg_delivery_time_ms: number;
  last_error?: string;
  last_error_at?: string;
  status: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SendTemplate {
  id: string;
  tenant_id: string;
  template_name: string;
  template_key: string;
  template_type: TemplateType;
  channel_type: ChannelType;
  subject?: string;
  body_text?: string;
  body_html?: string;
  body_json?: Record<string, unknown>;
  variables: unknown[];
  default_values: Record<string, unknown>;
  personalization_rules: unknown[];
  conditional_blocks: unknown[];
  variants: unknown[];
  variant_weights: Record<string, number>;
  tags: string[];
  category?: string;
  is_active: boolean;
  send_count: number;
  open_count: number;
  click_count: number;
  conversion_count: number;
  created_at: string;
  updated_at: string;
}

export interface QueuedMessage {
  id: string;
  tenant_id: string;
  channel_id: string;
  template_id?: string;
  recipient_id?: string;
  recipient_type: string;
  recipient_address: string;
  recipient_name?: string;
  recipient_metadata: Record<string, unknown>;
  channel_type: ChannelType;
  subject?: string;
  body?: string;
  payload: Record<string, unknown>;
  attachments: unknown[];
  merge_fields: Record<string, unknown>;
  priority: SendPriority;
  scheduled_at: string;
  expires_at?: string;
  status: SendStatus;
  status_message?: string;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string;
  retry_delay_seconds: number;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  failed_at?: string;
  provider_message_id?: string;
  provider_response: Record<string, unknown>;
  campaign_id?: string;
  sequence_id?: string;
  journey_id?: string;
  trigger_type?: string;
  trigger_id?: string;
  estimated_cost: number;
  actual_cost: number;
  created_at: string;
  updated_at: string;
}

export interface SendEvent {
  id: string;
  tenant_id: string;
  queue_id: string;
  event_type: string;
  event_timestamp: string;
  event_data: Record<string, unknown>;
  user_agent?: string;
  ip_address?: string;
  geo_data: Record<string, unknown>;
  link_url?: string;
  link_id?: string;
  created_at: string;
}

export interface SendStats {
  total_channels: number;
  active_channels: number;
  total_templates: number;
  pending_messages: number;
  sent_today: number;
  failed_today: number;
  delivery_rate: number;
}

// =====================================================
// CHANNEL FUNCTIONS
// =====================================================

export async function createChannel(
  tenantId: string,
  data: {
    channel_name: string;
    channel_type: ChannelType;
    provider?: ProviderType;
    credentials?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    rate_limit_per_second?: number;
    rate_limit_per_minute?: number;
    rate_limit_per_hour?: number;
    rate_limit_per_day?: number;
    is_default?: boolean;
  },
  userId?: string
): Promise<SendChannel> {
  const supabase = await createClient();

  const { data: channel, error } = await supabase
    .from("synthex_send_channels")
    .insert({
      tenant_id: tenantId,
      channel_name: data.channel_name,
      channel_type: data.channel_type,
      provider: data.provider,
      credentials: data.credentials || {},
      settings: data.settings || {},
      rate_limit_per_second: data.rate_limit_per_second || 10,
      rate_limit_per_minute: data.rate_limit_per_minute || 500,
      rate_limit_per_hour: data.rate_limit_per_hour || 10000,
      rate_limit_per_day: data.rate_limit_per_day || 100000,
      is_default: data.is_default || false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create channel: ${error.message}`);
}
  return channel as SendChannel;
}

export async function updateChannel(
  channelId: string,
  updates: Partial<Omit<SendChannel, "id" | "tenant_id" | "created_at">>
): Promise<SendChannel> {
  const supabase = await createClient();

  const { data: channel, error } = await supabase
    .from("synthex_send_channels")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", channelId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update channel: ${error.message}`);
}
  return channel as SendChannel;
}

export async function listChannels(
  tenantId: string,
  filters?: {
    channel_type?: ChannelType;
    provider?: ProviderType;
    status?: string;
    limit?: number;
  }
): Promise<SendChannel[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_send_channels")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.channel_type) {
    query = query.eq("channel_type", filters.channel_type);
  }
  if (filters?.provider) {
    query = query.eq("provider", filters.provider);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: channels, error } = await query;

  if (error) {
throw new Error(`Failed to list channels: ${error.message}`);
}
  return (channels || []) as SendChannel[];
}

export async function getDefaultChannel(
  tenantId: string,
  channelType: ChannelType
): Promise<SendChannel | null> {
  const supabase = await createClient();

  const { data: channel, error } = await supabase
    .from("synthex_send_channels")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("channel_type", channelType)
    .eq("is_default", true)
    .eq("status", "active")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get default channel: ${error.message}`);
  }
  return channel as SendChannel;
}

// =====================================================
// TEMPLATE FUNCTIONS
// =====================================================

export async function createTemplate(
  tenantId: string,
  data: {
    template_name: string;
    template_key: string;
    template_type: TemplateType;
    channel_type: ChannelType;
    subject?: string;
    body_text?: string;
    body_html?: string;
    body_json?: Record<string, unknown>;
    variables?: unknown[];
    default_values?: Record<string, unknown>;
    tags?: string[];
    category?: string;
  },
  userId?: string
): Promise<SendTemplate> {
  const supabase = await createClient();

  const { data: template, error } = await supabase
    .from("synthex_send_templates")
    .insert({
      tenant_id: tenantId,
      template_name: data.template_name,
      template_key: data.template_key,
      template_type: data.template_type,
      channel_type: data.channel_type,
      subject: data.subject,
      body_text: data.body_text,
      body_html: data.body_html,
      body_json: data.body_json,
      variables: data.variables || [],
      default_values: data.default_values || {},
      tags: data.tags || [],
      category: data.category,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create template: ${error.message}`);
}
  return template as SendTemplate;
}

export async function getTemplate(templateId: string): Promise<SendTemplate | null> {
  const supabase = await createClient();

  const { data: template, error } = await supabase
    .from("synthex_send_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get template: ${error.message}`);
  }
  return template as SendTemplate;
}

export async function getTemplateByKey(
  tenantId: string,
  templateKey: string
): Promise<SendTemplate | null> {
  const supabase = await createClient();

  const { data: template, error } = await supabase
    .from("synthex_send_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("template_key", templateKey)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get template: ${error.message}`);
  }
  return template as SendTemplate;
}

export async function listTemplates(
  tenantId: string,
  filters?: {
    template_type?: TemplateType;
    channel_type?: ChannelType;
    is_active?: boolean;
    category?: string;
    limit?: number;
  }
): Promise<SendTemplate[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_send_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.template_type) {
    query = query.eq("template_type", filters.template_type);
  }
  if (filters?.channel_type) {
    query = query.eq("channel_type", filters.channel_type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: templates, error } = await query;

  if (error) {
throw new Error(`Failed to list templates: ${error.message}`);
}
  return (templates || []) as SendTemplate[];
}

// =====================================================
// QUEUE FUNCTIONS
// =====================================================

export async function queueMessage(
  tenantId: string,
  data: {
    channel_id: string;
    template_id?: string;
    recipient_address: string;
    recipient_id?: string;
    recipient_type?: string;
    recipient_name?: string;
    recipient_metadata?: Record<string, unknown>;
    channel_type: ChannelType;
    subject?: string;
    body?: string;
    payload?: Record<string, unknown>;
    attachments?: unknown[];
    merge_fields?: Record<string, unknown>;
    priority?: SendPriority;
    scheduled_at?: string;
    expires_at?: string;
    campaign_id?: string;
    sequence_id?: string;
    journey_id?: string;
    trigger_type?: string;
    trigger_id?: string;
  },
  userId?: string
): Promise<QueuedMessage> {
  const supabase = await createClient();

  const { data: message, error } = await supabase
    .from("synthex_send_queue_v3")
    .insert({
      tenant_id: tenantId,
      channel_id: data.channel_id,
      template_id: data.template_id,
      recipient_address: data.recipient_address,
      recipient_id: data.recipient_id,
      recipient_type: data.recipient_type || "contact",
      recipient_name: data.recipient_name,
      recipient_metadata: data.recipient_metadata || {},
      channel_type: data.channel_type,
      subject: data.subject,
      body: data.body,
      payload: data.payload || {},
      attachments: data.attachments || [],
      merge_fields: data.merge_fields || {},
      priority: data.priority || "normal",
      scheduled_at: data.scheduled_at || new Date().toISOString(),
      expires_at: data.expires_at,
      campaign_id: data.campaign_id,
      sequence_id: data.sequence_id,
      journey_id: data.journey_id,
      trigger_type: data.trigger_type,
      trigger_id: data.trigger_id,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to queue message: ${error.message}`);
}
  return message as QueuedMessage;
}

export async function queueBulkMessages(
  tenantId: string,
  messages: Array<{
    channel_id: string;
    recipient_address: string;
    channel_type: ChannelType;
    subject?: string;
    body?: string;
    payload?: Record<string, unknown>;
    merge_fields?: Record<string, unknown>;
    priority?: SendPriority;
  }>
): Promise<{ queued: number; errors: string[] }> {
  const supabase = await createClient();

  const insertData = messages.map((msg) => ({
    tenant_id: tenantId,
    channel_id: msg.channel_id,
    recipient_address: msg.recipient_address,
    channel_type: msg.channel_type,
    subject: msg.subject,
    body: msg.body,
    payload: msg.payload || {},
    merge_fields: msg.merge_fields || {},
    priority: msg.priority || "bulk",
  }));

  const { data: queued, error } = await supabase
    .from("synthex_send_queue_v3")
    .insert(insertData)
    .select();

  if (error) {
    return { queued: 0, errors: [error.message] };
  }

  return { queued: queued?.length || 0, errors: [] };
}

export async function getPendingMessages(
  tenantId: string,
  limit: number = 100
): Promise<QueuedMessage[]> {
  const supabase = await createClient();

  const { data: messages, error } = await supabase.rpc("get_pending_messages", {
    p_tenant_id: tenantId,
    p_limit: limit,
  });

  if (error) {
throw new Error(`Failed to get pending messages: ${error.message}`);
}
  return (messages || []) as QueuedMessage[];
}

export async function updateMessageStatus(
  messageId: string,
  status: SendStatus,
  data?: {
    status_message?: string;
    provider_message_id?: string;
    provider_response?: Record<string, unknown>;
    actual_cost?: number;
  }
): Promise<QueuedMessage> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (data?.status_message) {
updateData.status_message = data.status_message;
}
  if (data?.provider_message_id) {
updateData.provider_message_id = data.provider_message_id;
}
  if (data?.provider_response) {
updateData.provider_response = data.provider_response;
}
  if (data?.actual_cost) {
updateData.actual_cost = data.actual_cost;
}

  // Set timestamp based on status
  if (status === "sent" || status === "sending") {
    updateData.sent_at = new Date().toISOString();
  } else if (status === "delivered") {
    updateData.delivered_at = new Date().toISOString();
  } else if (status === "failed" || status === "bounced" || status === "rejected") {
    updateData.failed_at = new Date().toISOString();
  }

  const { data: message, error } = await supabase
    .from("synthex_send_queue_v3")
    .update(updateData)
    .eq("id", messageId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update message status: ${error.message}`);
}
  return message as QueuedMessage;
}

export async function retryMessage(messageId: string): Promise<QueuedMessage> {
  const supabase = await createClient();

  // Get current message
  const { data: currentMessage } = await supabase
    .from("synthex_send_queue_v3")
    .select("*")
    .eq("id", messageId)
    .single();

  if (!currentMessage) {
    throw new Error("Message not found");
  }

  const retryDelay = currentMessage.retry_delay_seconds * Math.pow(2, currentMessage.attempts);
  const nextAttempt = new Date(Date.now() + retryDelay * 1000).toISOString();

  const { data: message, error } = await supabase
    .from("synthex_send_queue_v3")
    .update({
      status: "pending",
      attempts: currentMessage.attempts + 1,
      next_attempt_at: nextAttempt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to retry message: ${error.message}`);
}
  return message as QueuedMessage;
}

export async function listQueuedMessages(
  tenantId: string,
  filters?: {
    status?: SendStatus;
    channel_type?: ChannelType;
    priority?: SendPriority;
    campaign_id?: string;
    limit?: number;
  }
): Promise<QueuedMessage[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_send_queue_v3")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.channel_type) {
    query = query.eq("channel_type", filters.channel_type);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters?.campaign_id) {
    query = query.eq("campaign_id", filters.campaign_id);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: messages, error } = await query;

  if (error) {
throw new Error(`Failed to list queued messages: ${error.message}`);
}
  return (messages || []) as QueuedMessage[];
}

// =====================================================
// EVENT FUNCTIONS
// =====================================================

export async function recordEvent(
  tenantId: string,
  queueId: string,
  data: {
    event_type: string;
    event_data?: Record<string, unknown>;
    user_agent?: string;
    ip_address?: string;
    geo_data?: Record<string, unknown>;
    link_url?: string;
    link_id?: string;
  }
): Promise<SendEvent> {
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("synthex_send_events")
    .insert({
      tenant_id: tenantId,
      queue_id: queueId,
      event_type: data.event_type,
      event_data: data.event_data || {},
      user_agent: data.user_agent,
      ip_address: data.ip_address,
      geo_data: data.geo_data || {},
      link_url: data.link_url,
      link_id: data.link_id,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to record event: ${error.message}`);
}

  // Update message status based on event
  if (data.event_type === "opened") {
    await supabase
      .from("synthex_send_queue_v3")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", queueId);
  } else if (data.event_type === "clicked") {
    await supabase
      .from("synthex_send_queue_v3")
      .update({ clicked_at: new Date().toISOString() })
      .eq("id", queueId);
  }

  return event as SendEvent;
}

export async function listEvents(
  tenantId: string,
  filters?: {
    queue_id?: string;
    event_type?: string;
    limit?: number;
  }
): Promise<SendEvent[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_send_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("event_timestamp", { ascending: false });

  if (filters?.queue_id) {
    query = query.eq("queue_id", filters.queue_id);
  }
  if (filters?.event_type) {
    query = query.eq("event_type", filters.event_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: events, error } = await query;

  if (error) {
throw new Error(`Failed to list events: ${error.message}`);
}
  return (events || []) as SendEvent[];
}

// =====================================================
// AI FUNCTIONS
// =====================================================

export async function generatePersonalizedContent(
  tenantId: string,
  data: {
    template: SendTemplate;
    recipient: {
      name?: string;
      email?: string;
      metadata?: Record<string, unknown>;
    };
    context?: Record<string, unknown>;
  }
): Promise<{
  subject?: string;
  body: string;
  reasoning: string;
}> {
  const anthropic = getAnthropicClient();

  const systemPrompt = `You are an expert at personalizing marketing and transactional messages.
Given a template and recipient information, generate personalized content that:
1. Uses the recipient's name and relevant metadata naturally
2. Maintains the template's tone and intent
3. Feels authentic and not overly automated
4. Is appropriate for the channel type: ${data.template.channel_type}

Return JSON with:
- subject: personalized subject line (if applicable)
- body: personalized message body
- reasoning: brief explanation of personalization choices`;

  const userPrompt = `Template:
${data.template.body_text || data.template.body_html || JSON.stringify(data.template.body_json)}

Recipient:
${JSON.stringify(data.recipient, null, 2)}

Context:
${JSON.stringify(data.context || {}, null, 2)}

Generate personalized content.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const textContent = response.content.find((c) => c.type === "text");
    const responseText = textContent?.type === "text" ? textContent.text : "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        body: data.template.body_text || "",
        reasoning: "Failed to parse AI response",
      };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("[sendEngineV3] AI personalization error:", error);
    return {
      body: data.template.body_text || "",
      reasoning: `AI personalization failed: ${error}`,
    };
  }
}

export async function optimizeSendTime(
  tenantId: string,
  recipientId: string
): Promise<{
  recommended_time: string;
  confidence: number;
  reasoning: string;
}> {
  const supabase = await createClient();

  // Get recipient's engagement history
  const { data: events } = await supabase
    .from("synthex_send_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .ilike("event_data->>recipient_id", recipientId)
    .order("event_timestamp", { ascending: false })
    .limit(100);

  if (!events || events.length < 5) {
    // Not enough data, return default
    return {
      recommended_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      confidence: 0.3,
      reasoning: "Insufficient engagement history for optimization",
    };
  }

  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze this engagement history and recommend the best send time:

${JSON.stringify(events.slice(0, 20), null, 2)}

Return JSON with:
- recommended_time: ISO timestamp for best send time
- confidence: 0-1 confidence score
- reasoning: explanation`,
      },
    ],
    system: "You are an expert at analyzing email engagement patterns to optimize send times.",
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent?.type === "text" ? textContent.text : "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fallback
  }

  return {
    recommended_time: new Date(Date.now() + 3600000).toISOString(),
    confidence: 0.5,
    reasoning: "Analysis completed with moderate confidence",
  };
}

// =====================================================
// STATS FUNCTIONS
// =====================================================

export async function getSendStats(tenantId: string): Promise<SendStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_send_engine_stats", {
    p_tenant_id: tenantId,
  });

  if (error) {
throw new Error(`Failed to get send stats: ${error.message}`);
}
  return data as SendStats;
}

export async function getChannelPerformance(
  tenantId: string,
  channelId: string,
  period: "day" | "week" | "month" = "week"
): Promise<{
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
}> {
  const supabase = await createClient();

  const periodStart = new Date();
  if (period === "day") {
periodStart.setDate(periodStart.getDate() - 1);
} else if (period === "week") {
periodStart.setDate(periodStart.getDate() - 7);
} else {
periodStart.setMonth(periodStart.getMonth() - 1);
}

  const { data: messages } = await supabase
    .from("synthex_send_queue_v3")
    .select("status, opened_at, clicked_at")
    .eq("tenant_id", tenantId)
    .eq("channel_id", channelId)
    .gte("created_at", periodStart.toISOString());

  const stats = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    failed: 0,
    delivery_rate: 0,
    open_rate: 0,
    click_rate: 0,
  };

  if (messages) {
    for (const msg of messages) {
      if (msg.status === "sent" || msg.status === "delivered") {
        stats.sent++;
        if (msg.status === "delivered") {
stats.delivered++;
}
        if (msg.opened_at) {
stats.opened++;
}
        if (msg.clicked_at) {
stats.clicked++;
}
      } else if (["failed", "bounced", "rejected"].includes(msg.status)) {
        stats.failed++;
      }
    }

    if (stats.sent > 0) {
      stats.delivery_rate = stats.delivered / stats.sent;
      stats.open_rate = stats.opened / stats.sent;
      stats.click_rate = stats.clicked / stats.sent;
    }
  }

  return stats;
}
