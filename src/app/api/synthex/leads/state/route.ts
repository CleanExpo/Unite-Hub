/**
 * Synthex Lead State Machine API
 * Phase D19: Lead Lifecycle Management
 *
 * GET - Get states, transitions, rules, alerts, metrics
 * POST - Create states, transition, predict, evaluate rules
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as stateMachineService from "@/lib/synthex/leadStateMachineService";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const type = searchParams.get("type") || "stats";

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    switch (type) {
      case "stats": {
        const stats = await stateMachineService.getStateMachineStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "states": {
        const filters = {
          current_state: searchParams.get("current_state") as stateMachineService.LeadStateKey | undefined,
          engagement_level: searchParams.get("engagement_level") as stateMachineService.EngagementLevel | undefined,
          min_value: searchParams.get("min_value")
            ? parseFloat(searchParams.get("min_value")!)
            : undefined,
          has_prediction: searchParams.get("has_prediction") === "true",
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const states = await stateMachineService.listLeadStates(tenantId, filters);
        return NextResponse.json({ success: true, states });
      }

      case "state": {
        const leadId = searchParams.get("leadId");
        if (!leadId) {
          return NextResponse.json(
            { error: "leadId is required" },
            { status: 400 }
          );
        }
        const state = await stateMachineService.getLeadState(tenantId, leadId);
        return NextResponse.json({ success: true, state });
      }

      case "transitions": {
        const filters = {
          lead_id: searchParams.get("lead_id") || undefined,
          from_state: searchParams.get("from_state") || undefined,
          to_state: searchParams.get("to_state") || undefined,
          transition_type: searchParams.get("transition_type") as stateMachineService.TransitionType | undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const transitions = await stateMachineService.listTransitions(tenantId, filters);
        return NextResponse.json({ success: true, transitions });
      }

      case "definitions": {
        const definitions = await stateMachineService.listStateDefinitions(tenantId);
        return NextResponse.json({ success: true, definitions });
      }

      case "rules": {
        const filters = {
          from_state: searchParams.get("from_state") || undefined,
          to_state: searchParams.get("to_state") || undefined,
          is_active:
            searchParams.get("is_active") === "true"
              ? true
              : searchParams.get("is_active") === "false"
                ? false
                : undefined,
        };
        const rules = await stateMachineService.listTransitionRules(tenantId, filters);
        return NextResponse.json({ success: true, rules });
      }

      case "alerts": {
        const filters = {
          status: searchParams.get("status") || undefined,
          severity: searchParams.get("severity") || undefined,
          alert_type: searchParams.get("alert_type") || undefined,
          lead_id: searchParams.get("lead_id") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const alerts = await stateMachineService.listAlerts(tenantId, filters);
        return NextResponse.json({ success: true, alerts });
      }

      case "metrics": {
        const filters = {
          period_type: searchParams.get("period_type") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const metrics = await stateMachineService.getStateMetrics(tenantId, filters);
        return NextResponse.json({ success: true, metrics });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Lead State API GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, action, ...data } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "create_state": {
        const state = await stateMachineService.createLeadState(tenantId, {
          lead_id: data.lead_id,
          contact_id: data.contact_id,
          current_state: data.current_state,
          engagement_level: data.engagement_level,
          estimated_value: data.estimated_value,
          currency: data.currency,
          tags: data.tags,
          meta: data.meta,
        });
        return NextResponse.json({ success: true, state });
      }

      case "transition": {
        const result = await stateMachineService.transitionLeadState(
          tenantId,
          data.lead_id,
          data.to_state,
          {
            reason: data.reason,
            transition_type: data.transition_type,
            trigger_event: data.trigger_event,
            trigger_data: data.trigger_data,
            user_id: user.id,
            confidence: data.confidence,
            ai_reasoning: data.ai_reasoning,
          }
        );
        return NextResponse.json({ success: true, ...result });
      }

      case "record_activity": {
        const state = await stateMachineService.recordActivity(
          tenantId,
          data.lead_id,
          data.activity_type
        );
        return NextResponse.json({ success: true, state });
      }

      case "predict": {
        const state = await stateMachineService.predictNextState(
          tenantId,
          data.lead_id
        );
        return NextResponse.json({ success: true, state });
      }

      case "evaluate_rules": {
        const result = await stateMachineService.evaluateTransitionRules(
          tenantId,
          data.lead_id
        );
        return NextResponse.json({ success: true, ...result });
      }

      case "create_definition": {
        const definition = await stateMachineService.createStateDefinition(
          tenantId,
          {
            state_key: data.state_key,
            display_name: data.display_name,
            description: data.description,
            color: data.color,
            icon: data.icon,
            stage_order: data.stage_order,
            stage_group: data.stage_group,
            is_terminal: data.is_terminal,
            required_actions: data.required_actions,
            min_time_in_state_hours: data.min_time_in_state_hours,
            notify_on_enter: data.notify_on_enter,
            notify_on_exit: data.notify_on_exit,
            notification_channels: data.notification_channels,
          }
        );
        return NextResponse.json({ success: true, definition });
      }

      case "create_rule": {
        const rule = await stateMachineService.createTransitionRule(
          tenantId,
          {
            name: data.name,
            description: data.description,
            from_state: data.from_state,
            to_state: data.to_state,
            conditions: data.conditions,
            use_ai_validation: data.use_ai_validation,
            ai_confidence_threshold: data.ai_confidence_threshold,
            priority: data.priority,
            cooldown_hours: data.cooldown_hours,
            actions_on_transition: data.actions_on_transition,
          },
          user.id
        );
        return NextResponse.json({ success: true, rule });
      }

      case "update_rule": {
        const rule = await stateMachineService.updateTransitionRule(
          data.rule_id,
          data.updates
        );
        return NextResponse.json({ success: true, rule });
      }

      case "delete_rule": {
        await stateMachineService.deleteTransitionRule(data.rule_id);
        return NextResponse.json({ success: true });
      }

      case "create_alert": {
        const alert = await stateMachineService.createAlert(tenantId, {
          alert_type: data.alert_type,
          severity: data.severity,
          title: data.title,
          description: data.description,
          lead_id: data.lead_id,
          lead_state_id: data.lead_state_id,
          metric_name: data.metric_name,
          metric_value: data.metric_value,
          threshold_value: data.threshold_value,
        });
        return NextResponse.json({ success: true, alert });
      }

      case "acknowledge_alert": {
        const alert = await stateMachineService.acknowledgeAlert(
          data.alert_id,
          user.id
        );
        return NextResponse.json({ success: true, alert });
      }

      case "resolve_alert": {
        const alert = await stateMachineService.resolveAlert(
          data.alert_id,
          user.id,
          data.resolution_notes
        );
        return NextResponse.json({ success: true, alert });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Lead State API POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
