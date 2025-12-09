/**
 * Synthex Multi-Channel Send Engine v3 API
 *
 * GET - Channels, templates, queue, events, stats
 * POST - Create channels, templates, queue messages, run sends
 *
 * Phase: D31 - Multi-Channel Send Engine v3
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as sendEngine from "@/lib/synthex/sendEngineV3";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    const type = searchParams.get("type") || "stats";

    if (!tenantId) {
      return NextResponse.json(
        { error: "Missing required param: tenantId" },
        { status: 400 }
      );
    }

    switch (type) {
      case "stats": {
        const stats = await sendEngine.getSendStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "channels": {
        const filters = {
          channel_type: searchParams.get("channel_type") as sendEngine.ChannelType | undefined,
          provider: searchParams.get("provider") as sendEngine.ProviderType | undefined,
          status: searchParams.get("status") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const channels = await sendEngine.listChannels(tenantId, filters);
        return NextResponse.json({ success: true, channels });
      }

      case "default_channel": {
        const channelType = searchParams.get("channel_type") as sendEngine.ChannelType;
        if (!channelType) {
          return NextResponse.json(
            { error: "channel_type is required" },
            { status: 400 }
          );
        }
        const channel = await sendEngine.getDefaultChannel(tenantId, channelType);
        return NextResponse.json({ success: true, channel });
      }

      case "templates": {
        const filters = {
          template_type: searchParams.get("template_type") as sendEngine.TemplateType | undefined,
          channel_type: searchParams.get("channel_type") as sendEngine.ChannelType | undefined,
          is_active: searchParams.get("is_active") === "true" ? true : searchParams.get("is_active") === "false" ? false : undefined,
          category: searchParams.get("category") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const templates = await sendEngine.listTemplates(tenantId, filters);
        return NextResponse.json({ success: true, templates });
      }

      case "template": {
        const templateId = searchParams.get("templateId");
        const templateKey = searchParams.get("templateKey");

        if (templateId) {
          const template = await sendEngine.getTemplate(templateId);
          return NextResponse.json({ success: true, template });
        } else if (templateKey) {
          const template = await sendEngine.getTemplateByKey(tenantId, templateKey);
          return NextResponse.json({ success: true, template });
        }

        return NextResponse.json(
          { error: "templateId or templateKey is required" },
          { status: 400 }
        );
      }

      case "queue": {
        const filters = {
          status: searchParams.get("status") as sendEngine.SendStatus | undefined,
          channel_type: searchParams.get("channel_type") as sendEngine.ChannelType | undefined,
          priority: searchParams.get("priority") as sendEngine.SendPriority | undefined,
          campaign_id: searchParams.get("campaign_id") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const messages = await sendEngine.listQueuedMessages(tenantId, filters);
        return NextResponse.json({ success: true, messages });
      }

      case "pending": {
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100;
        const messages = await sendEngine.getPendingMessages(tenantId, limit);
        return NextResponse.json({ success: true, messages });
      }

      case "events": {
        const filters = {
          queue_id: searchParams.get("queue_id") || undefined,
          event_type: searchParams.get("event_type") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const events = await sendEngine.listEvents(tenantId, filters);
        return NextResponse.json({ success: true, events });
      }

      case "channel_performance": {
        const channelId = searchParams.get("channel_id");
        if (!channelId) {
          return NextResponse.json(
            { error: "channel_id is required" },
            { status: 400 }
          );
        }
        const period = (searchParams.get("period") as "day" | "week" | "month") || "week";
        const performance = await sendEngine.getChannelPerformance(tenantId, channelId, period);
        return NextResponse.json({ success: true, performance });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[send GET] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, action, ...data } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      // =====================================================
      // Channel Actions
      // =====================================================
      case "create_channel": {
        if (!data.channel_name || !data.channel_type) {
          return NextResponse.json(
            { error: "channel_name and channel_type are required" },
            { status: 400 }
          );
        }
        const channel = await sendEngine.createChannel(
          tenantId,
          {
            channel_name: data.channel_name,
            channel_type: data.channel_type,
            provider: data.provider,
            credentials: data.credentials,
            settings: data.settings,
            rate_limit_per_second: data.rate_limit_per_second,
            rate_limit_per_minute: data.rate_limit_per_minute,
            rate_limit_per_hour: data.rate_limit_per_hour,
            rate_limit_per_day: data.rate_limit_per_day,
            is_default: data.is_default,
          },
          user.id
        );
        return NextResponse.json({ success: true, channel });
      }

      case "update_channel": {
        if (!data.channel_id) {
          return NextResponse.json(
            { error: "channel_id is required" },
            { status: 400 }
          );
        }
        const channel = await sendEngine.updateChannel(data.channel_id, data.updates);
        return NextResponse.json({ success: true, channel });
      }

      // =====================================================
      // Template Actions
      // =====================================================
      case "create_template": {
        if (!data.template_name || !data.template_key || !data.channel_type) {
          return NextResponse.json(
            { error: "template_name, template_key, and channel_type are required" },
            { status: 400 }
          );
        }
        const template = await sendEngine.createTemplate(
          tenantId,
          {
            template_name: data.template_name,
            template_key: data.template_key,
            template_type: data.template_type || "custom",
            channel_type: data.channel_type,
            subject: data.subject,
            body_text: data.body_text,
            body_html: data.body_html,
            body_json: data.body_json,
            variables: data.variables,
            default_values: data.default_values,
            tags: data.tags,
            category: data.category,
          },
          user.id
        );
        return NextResponse.json({ success: true, template });
      }

      // =====================================================
      // Queue Actions
      // =====================================================
      case "queue_message": {
        if (!data.channel_id || !data.recipient_address || !data.channel_type) {
          return NextResponse.json(
            { error: "channel_id, recipient_address, and channel_type are required" },
            { status: 400 }
          );
        }
        const message = await sendEngine.queueMessage(
          tenantId,
          {
            channel_id: data.channel_id,
            template_id: data.template_id,
            recipient_address: data.recipient_address,
            recipient_id: data.recipient_id,
            recipient_type: data.recipient_type,
            recipient_name: data.recipient_name,
            recipient_metadata: data.recipient_metadata,
            channel_type: data.channel_type,
            subject: data.subject,
            body: data.body,
            payload: data.payload,
            attachments: data.attachments,
            merge_fields: data.merge_fields,
            priority: data.priority,
            scheduled_at: data.scheduled_at,
            expires_at: data.expires_at,
            campaign_id: data.campaign_id,
            sequence_id: data.sequence_id,
            journey_id: data.journey_id,
            trigger_type: data.trigger_type,
            trigger_id: data.trigger_id,
          },
          user.id
        );
        return NextResponse.json({ success: true, message });
      }

      case "queue_bulk": {
        if (!data.messages || !Array.isArray(data.messages)) {
          return NextResponse.json(
            { error: "messages array is required" },
            { status: 400 }
          );
        }
        const result = await sendEngine.queueBulkMessages(tenantId, data.messages);
        return NextResponse.json({ success: true, ...result });
      }

      case "update_status": {
        if (!data.message_id || !data.status) {
          return NextResponse.json(
            { error: "message_id and status are required" },
            { status: 400 }
          );
        }
        const message = await sendEngine.updateMessageStatus(
          data.message_id,
          data.status,
          {
            status_message: data.status_message,
            provider_message_id: data.provider_message_id,
            provider_response: data.provider_response,
            actual_cost: data.actual_cost,
          }
        );
        return NextResponse.json({ success: true, message });
      }

      case "retry": {
        if (!data.message_id) {
          return NextResponse.json(
            { error: "message_id is required" },
            { status: 400 }
          );
        }
        const message = await sendEngine.retryMessage(data.message_id);
        return NextResponse.json({ success: true, message });
      }

      // =====================================================
      // Event Actions
      // =====================================================
      case "record_event": {
        if (!data.queue_id || !data.event_type) {
          return NextResponse.json(
            { error: "queue_id and event_type are required" },
            { status: 400 }
          );
        }
        const event = await sendEngine.recordEvent(tenantId, data.queue_id, {
          event_type: data.event_type,
          event_data: data.event_data,
          user_agent: data.user_agent,
          ip_address: data.ip_address,
          geo_data: data.geo_data,
          link_url: data.link_url,
          link_id: data.link_id,
        });
        return NextResponse.json({ success: true, event });
      }

      // =====================================================
      // AI Actions
      // =====================================================
      case "personalize": {
        if (!data.template_id || !data.recipient) {
          return NextResponse.json(
            { error: "template_id and recipient are required" },
            { status: 400 }
          );
        }
        const template = await sendEngine.getTemplate(data.template_id);
        if (!template) {
          return NextResponse.json(
            { error: "Template not found" },
            { status: 404 }
          );
        }
        const result = await sendEngine.generatePersonalizedContent(tenantId, {
          template,
          recipient: data.recipient,
          context: data.context,
        });
        return NextResponse.json({ success: true, ...result });
      }

      case "optimize_send_time": {
        if (!data.recipient_id) {
          return NextResponse.json(
            { error: "recipient_id is required" },
            { status: 400 }
          );
        }
        const result = await sendEngine.optimizeSendTime(tenantId, data.recipient_id);
        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[send POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
