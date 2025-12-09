/**
 * Synthex Segments API
 *
 * GET - List segments, get segment details, members, rules, snapshots
 * POST - Create/update segments, manage members, refresh, analyze
 *
 * Phase: B10 - Synthex Audience Intelligence
 * Phase: D21 - Behaviour-Based Dynamic Segmentation
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listSegments as listAudienceSegments } from "@/lib/synthex/audienceService";
import * as dynamicSegmentService from "@/lib/synthex/dynamicSegmentationService";

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
    const type = searchParams.get("type") || "list";

    if (!tenantId) {
      return NextResponse.json(
        { error: "Missing required param: tenantId" },
        { status: 400 }
      );
    }

    switch (type) {
      // Legacy audience segments
      case "audience": {
        const audienceId = searchParams.get("audienceId");
        const result = await listAudienceSegments(tenantId, {
          audienceId: audienceId || undefined,
        });
        if (result.error) {
throw result.error;
}
        return NextResponse.json({
          status: "ok",
          segments: result.data || [],
        });
      }

      // D21: Dynamic Segmentation
      case "stats": {
        const stats = await dynamicSegmentService.getSegmentStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "list": {
        const filters = {
          segment_type: searchParams.get("segment_type") as dynamicSegmentService.SegmentType | undefined,
          is_active:
            searchParams.get("is_active") === "true"
              ? true
              : searchParams.get("is_active") === "false"
                ? false
                : undefined,
          is_archived:
            searchParams.get("is_archived") === "true"
              ? true
              : searchParams.get("is_archived") === "false"
                ? false
                : undefined,
          has_tag: searchParams.get("has_tag") || undefined,
          min_members: searchParams.get("min_members")
            ? parseInt(searchParams.get("min_members")!)
            : undefined,
          search: searchParams.get("search") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const segments = await dynamicSegmentService.listSegments(tenantId, filters);
        return NextResponse.json({ success: true, segments });
      }

      case "segment": {
        const segmentId = searchParams.get("segmentId");
        if (!segmentId) {
          return NextResponse.json(
            { error: "segmentId is required" },
            { status: 400 }
          );
        }
        const segment = await dynamicSegmentService.getSegment(tenantId, segmentId);
        return NextResponse.json({ success: true, segment });
      }

      case "members": {
        const segmentId = searchParams.get("segmentId");
        if (!segmentId) {
          return NextResponse.json(
            { error: "segmentId is required" },
            { status: 400 }
          );
        }
        const filters = {
          membership_status: searchParams.get("membership_status") as dynamicSegmentService.MembershipStatus | undefined,
          min_match_score: searchParams.get("min_match_score")
            ? parseFloat(searchParams.get("min_match_score")!)
            : undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const members = await dynamicSegmentService.listMembers(tenantId, segmentId, filters);
        return NextResponse.json({ success: true, members });
      }

      case "member_segments": {
        const options = {
          contact_id: searchParams.get("contact_id") || undefined,
          lead_id: searchParams.get("lead_id") || undefined,
          customer_id: searchParams.get("customer_id") || undefined,
        };
        if (!options.contact_id && !options.lead_id && !options.customer_id) {
          return NextResponse.json(
            { error: "contact_id, lead_id, or customer_id is required" },
            { status: 400 }
          );
        }
        const segments = await dynamicSegmentService.getMemberSegments(tenantId, options);
        return NextResponse.json({ success: true, segments });
      }

      case "rules": {
        const filters = {
          category: searchParams.get("category") || undefined,
          is_template:
            searchParams.get("is_template") === "true"
              ? true
              : searchParams.get("is_template") === "false"
                ? false
                : undefined,
          is_active:
            searchParams.get("is_active") === "true"
              ? true
              : searchParams.get("is_active") === "false"
                ? false
                : undefined,
        };
        const rules = await dynamicSegmentService.listRules(tenantId, filters);
        return NextResponse.json({ success: true, rules });
      }

      case "snapshots": {
        const segmentId = searchParams.get("segmentId");
        if (!segmentId) {
          return NextResponse.json(
            { error: "segmentId is required" },
            { status: 400 }
          );
        }
        const limit = searchParams.get("limit")
          ? parseInt(searchParams.get("limit")!)
          : 10;
        const snapshots = await dynamicSegmentService.getSnapshots(tenantId, segmentId, limit);
        return NextResponse.json({ success: true, snapshots });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[segments GET] Error:", error);
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
      case "create_segment": {
        const segment = await dynamicSegmentService.createSegment(
          tenantId,
          {
            segment_name: data.segment_name,
            description: data.description,
            segment_type: data.segment_type,
            criteria: data.criteria,
            criteria_logic: data.criteria_logic,
            use_ai_refinement: data.use_ai_refinement,
            ai_confidence_threshold: data.ai_confidence_threshold,
            auto_refresh: data.auto_refresh,
            refresh_interval_hours: data.refresh_interval_hours,
            color: data.color,
            icon: data.icon,
            exclusion_segment_ids: data.exclusion_segment_ids,
            actions_on_enter: data.actions_on_enter,
            actions_on_exit: data.actions_on_exit,
            notify_on_size_change_percent: data.notify_on_size_change_percent,
            tags: data.tags,
            meta: data.meta,
          },
          user.id
        );
        return NextResponse.json({ success: true, segment });
      }

      case "update_segment": {
        const segment = await dynamicSegmentService.updateSegment(
          data.segment_id,
          data.updates
        );
        return NextResponse.json({ success: true, segment });
      }

      case "delete_segment": {
        await dynamicSegmentService.deleteSegment(data.segment_id);
        return NextResponse.json({ success: true });
      }

      case "archive_segment": {
        const segment = await dynamicSegmentService.archiveSegment(data.segment_id);
        return NextResponse.json({ success: true, segment });
      }

      case "add_member": {
        const membership = await dynamicSegmentService.addMember(
          tenantId,
          data.segment_id,
          {
            contact_id: data.contact_id,
            lead_id: data.lead_id,
            customer_id: data.customer_id,
            match_score: data.match_score,
            matched_criteria: data.matched_criteria,
            unmatched_criteria: data.unmatched_criteria,
            ai_confidence: data.ai_confidence,
            ai_reasoning: data.ai_reasoning,
            predicted_value: data.predicted_value,
            meta: data.meta,
          }
        );
        return NextResponse.json({ success: true, membership });
      }

      case "remove_member": {
        const membership = await dynamicSegmentService.removeMember(data.segment_id, {
          contact_id: data.contact_id,
          lead_id: data.lead_id,
          customer_id: data.customer_id,
          reason: data.reason,
        });
        return NextResponse.json({ success: true, membership });
      }

      case "evaluate": {
        const result = await dynamicSegmentService.evaluateEntity(
          tenantId,
          data.segment_id,
          data.entity
        );
        return NextResponse.json({ success: true, ...result });
      }

      case "refresh": {
        const result = await dynamicSegmentService.refreshSegment(tenantId, data.segment_id);
        return NextResponse.json({ success: true, ...result });
      }

      case "create_rule": {
        const rule = await dynamicSegmentService.createRule(tenantId, {
          rule_name: data.rule_name,
          description: data.description,
          category: data.category,
          field: data.field,
          field_source: data.field_source,
          operator: data.operator,
          value: data.value,
          value_type: data.value_type,
          relative_period: data.relative_period,
          weight: data.weight,
          is_required: data.is_required,
          is_template: data.is_template,
          template_name: data.template_name,
        });
        return NextResponse.json({ success: true, rule });
      }

      case "create_snapshot": {
        const snapshot = await dynamicSegmentService.createSnapshot(
          tenantId,
          data.segment_id,
          data.snapshot_type
        );
        return NextResponse.json({ success: true, snapshot });
      }

      case "calculate_overlap": {
        const overlap = await dynamicSegmentService.calculateOverlap(
          tenantId,
          data.segment_a_id,
          data.segment_b_id
        );
        return NextResponse.json({ success: true, overlap });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[segments POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
