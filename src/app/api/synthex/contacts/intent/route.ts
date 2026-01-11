/**
 * Synthex Contact Intent & Sentiment API
 *
 * GET - List intents, signals, patterns, responses, history, stats
 * POST - Analyze text, resolve intents, manage signals/patterns/responses
 *
 * Phase: D23 - Contact Intent + Sentiment AI Engine
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as intentService from "@/lib/synthex/contactIntentService";

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
        const stats = await intentService.getIntentStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "intents": {
        const filters: intentService.IntentFilters = {
          contact_id: searchParams.get("contact_id") || undefined,
          intent: searchParams.get("intent") || undefined,
          intent_category: searchParams.get("intent_category") as intentService.IntentCategory | undefined,
          sentiment: searchParams.get("sentiment") as intentService.Sentiment | undefined,
          source: searchParams.get("source") as intentService.IntentSource | undefined,
          urgency_level: searchParams.get("urgency_level") as intentService.UrgencyLevel | undefined,
          is_resolved:
            searchParams.get("is_resolved") === "true"
              ? true
              : searchParams.get("is_resolved") === "false"
                ? false
                : undefined,
          requires_response:
            searchParams.get("requires_response") === "true"
              ? true
              : searchParams.get("requires_response") === "false"
                ? false
                : undefined,
          from_date: searchParams.get("from_date") || undefined,
          to_date: searchParams.get("to_date") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const intents = await intentService.listIntents(tenantId, filters);
        return NextResponse.json({ success: true, intents });
      }

      case "intent": {
        const intentId = searchParams.get("intentId");
        if (!intentId) {
          return NextResponse.json(
            { error: "intentId is required" },
            { status: 400 }
          );
        }
        const intent = await intentService.getIntent(tenantId, intentId);
        return NextResponse.json({ success: true, intent });
      }

      case "signals": {
        const filters: intentService.SignalFilters = {
          contact_id: searchParams.get("contact_id") || undefined,
          signal_type: searchParams.get("signal_type") as intentService.SignalType | undefined,
          is_active:
            searchParams.get("is_active") === "true"
              ? true
              : searchParams.get("is_active") === "false"
                ? false
                : undefined,
          min_strength: searchParams.get("min_strength")
            ? parseFloat(searchParams.get("min_strength")!)
            : undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const signals = await intentService.listSignals(tenantId, filters);
        return NextResponse.json({ success: true, signals });
      }

      case "patterns": {
        const includeSystem = searchParams.get("include_system") !== "false";
        const patterns = await intentService.listPatterns(tenantId, includeSystem);
        return NextResponse.json({ success: true, patterns });
      }

      case "responses": {
        const intent = searchParams.get("intent") || undefined;
        const responses = await intentService.listResponses(tenantId, intent);
        return NextResponse.json({ success: true, responses });
      }

      case "sentiment_history": {
        const contactId = searchParams.get("contact_id");
        if (!contactId) {
          return NextResponse.json(
            { error: "contact_id is required" },
            { status: 400 }
          );
        }
        const periodType = searchParams.get("period_type") as
          | "day"
          | "week"
          | "month"
          | "quarter"
          | undefined;
        const history = await intentService.getContactSentimentHistory(
          tenantId,
          contactId,
          periodType
        );
        return NextResponse.json({ success: true, history });
      }

      case "sentiment_summary": {
        const contactId = searchParams.get("contact_id");
        if (!contactId) {
          return NextResponse.json(
            { error: "contact_id is required" },
            { status: 400 }
          );
        }
        const summary = await intentService.getContactSentimentSummary(
          tenantId,
          contactId
        );
        return NextResponse.json({ success: true, summary });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[contact intent GET] Error:", error);
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
      case "analyze": {
        if (!data.contact_id || !data.text || !data.source) {
          return NextResponse.json(
            { error: "contact_id, text, and source are required" },
            { status: 400 }
          );
        }
        const result = await intentService.analyzeIntent(tenantId, {
          contact_id: data.contact_id,
          lead_id: data.lead_id,
          customer_id: data.customer_id,
          text: data.text,
          source: data.source,
          source_id: data.source_id,
          source_channel: data.source_channel,
          conversation_id: data.conversation_id,
          interaction_sequence: data.interaction_sequence,
          previous_intent_id: data.previous_intent_id,
          meta: data.meta,
          tags: data.tags,
        });
        return NextResponse.json({ success: true, ...result });
      }

      case "resolve_intent": {
        if (!data.intent_id) {
          return NextResponse.json(
            { error: "intent_id is required" },
            { status: 400 }
          );
        }
        const intent = await intentService.resolveIntent(
          data.intent_id,
          data.resolution_notes,
          data.action_taken,
          user.id
        );
        return NextResponse.json({ success: true, intent });
      }

      case "acknowledge_signal": {
        if (!data.signal_id) {
          return NextResponse.json(
            { error: "signal_id is required" },
            { status: 400 }
          );
        }
        const signal = await intentService.acknowledgeSignal(data.signal_id, user.id);
        return NextResponse.json({ success: true, signal });
      }

      case "dismiss_signal": {
        if (!data.signal_id) {
          return NextResponse.json(
            { error: "signal_id is required" },
            { status: 400 }
          );
        }
        const signal = await intentService.dismissSignal(data.signal_id);
        return NextResponse.json({ success: true, signal });
      }

      case "create_pattern": {
        if (!data.pattern_name || !data.intent || !data.intent_category) {
          return NextResponse.json(
            { error: "pattern_name, intent, and intent_category are required" },
            { status: 400 }
          );
        }
        const pattern = await intentService.createPattern(tenantId, {
          pattern_name: data.pattern_name,
          description: data.description,
          intent: data.intent,
          intent_category: data.intent_category,
          keywords: data.keywords,
          phrases: data.phrases,
          regex_patterns: data.regex_patterns,
          keyword_weight: data.keyword_weight,
          phrase_weight: data.phrase_weight,
          semantic_weight: data.semantic_weight,
        });
        return NextResponse.json({ success: true, pattern });
      }

      case "create_response": {
        if (!data.intent || !data.response_name || !data.response_type || !data.response_content) {
          return NextResponse.json(
            { error: "intent, response_name, response_type, and response_content are required" },
            { status: 400 }
          );
        }
        const response = await intentService.createResponse(tenantId, {
          intent: data.intent,
          intent_category: data.intent_category,
          sentiment_range_min: data.sentiment_range_min,
          sentiment_range_max: data.sentiment_range_max,
          urgency_levels: data.urgency_levels,
          response_name: data.response_name,
          response_type: data.response_type,
          response_content: data.response_content,
          personalization_tokens: data.personalization_tokens,
          auto_trigger: data.auto_trigger,
          approval_required: data.approval_required,
          delay_minutes: data.delay_minutes,
          priority_order: data.priority_order,
        });
        return NextResponse.json({ success: true, response });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[contact intent POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
