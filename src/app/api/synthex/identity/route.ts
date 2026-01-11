/**
 * Synthex Omni-Channel Identity Graph API
 *
 * GET - Nodes, edges, profiles, resolution logs, rules, stats
 * POST - Create/update nodes, edges, resolve identities, create rules
 *
 * Phase: D34 - Omni-Channel Identity Graph
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as identityService from "@/lib/synthex/identityGraphService";

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
        const stats = await identityService.getGraphStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "nodes": {
        const filters = {
          channel: searchParams.get("channel") as identityService.IdentityChannel | undefined,
          status: searchParams.get("status") as identityService.IdentityStatus | undefined,
          min_confidence: searchParams.get("min_confidence")
            ? parseFloat(searchParams.get("min_confidence")!)
            : undefined,
          search: searchParams.get("search") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const nodes = await identityService.listNodes(tenantId, filters);
        return NextResponse.json({ success: true, nodes });
      }

      case "node": {
        const nodeId = searchParams.get("nodeId");
        if (!nodeId) {
          return NextResponse.json({ error: "nodeId is required" }, { status: 400 });
        }
        const node = await identityService.getNode(nodeId);
        return NextResponse.json({ success: true, node });
      }

      case "node_by_identifier": {
        const channel = searchParams.get("channel") as identityService.IdentityChannel;
        const identifier = searchParams.get("identifier");
        if (!channel || !identifier) {
          return NextResponse.json(
            { error: "channel and identifier are required" },
            { status: 400 }
          );
        }
        const node = await identityService.findNodeByIdentifier(tenantId, channel, identifier);
        return NextResponse.json({ success: true, node });
      }

      case "edges": {
        const filters = {
          source_node_id: searchParams.get("source_node_id") || undefined,
          target_node_id: searchParams.get("target_node_id") || undefined,
          relationship: searchParams.get("relationship") as identityService.IdentityRelationship | undefined,
          min_confidence: searchParams.get("min_confidence")
            ? parseFloat(searchParams.get("min_confidence")!)
            : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const edges = await identityService.listEdges(tenantId, filters);
        return NextResponse.json({ success: true, edges });
      }

      case "connected_nodes": {
        const nodeId = searchParams.get("nodeId");
        if (!nodeId) {
          return NextResponse.json({ error: "nodeId is required" }, { status: 400 });
        }
        const maxDepth = searchParams.get("maxDepth") ? parseInt(searchParams.get("maxDepth")!) : 2;
        const connected = await identityService.getConnectedNodes(nodeId, maxDepth);
        return NextResponse.json({ success: true, connected });
      }

      case "profiles": {
        const filters = {
          min_confidence: searchParams.get("min_confidence")
            ? parseFloat(searchParams.get("min_confidence")!)
            : undefined,
          min_completeness: searchParams.get("min_completeness")
            ? parseFloat(searchParams.get("min_completeness")!)
            : undefined,
          has_email: searchParams.get("has_email") === "true" ? true : undefined,
          segment: searchParams.get("segment") || undefined,
          search: searchParams.get("search") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const profiles = await identityService.listUnifiedProfiles(tenantId, filters);
        return NextResponse.json({ success: true, profiles });
      }

      case "profile": {
        const profileId = searchParams.get("profileId");
        if (!profileId) {
          return NextResponse.json({ error: "profileId is required" }, { status: 400 });
        }
        const profile = await identityService.getUnifiedProfile(profileId);
        return NextResponse.json({ success: true, profile });
      }

      case "resolution_logs": {
        const filters = {
          resolution_method: searchParams.get("resolution_method") as identityService.ResolutionMethod | undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const logs = await identityService.listResolutionLogs(tenantId, filters);
        return NextResponse.json({ success: true, logs });
      }

      case "matching_rules": {
        const filters = {
          rule_type: searchParams.get("rule_type") || undefined,
          is_active: searchParams.get("is_active") === "true" ? true : searchParams.get("is_active") === "false" ? false : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const rules = await identityService.listMatchingRules(tenantId, filters);
        return NextResponse.json({ success: true, rules });
      }

      case "merge_suggestions": {
        const suggestions = await identityService.suggestMerges(tenantId);
        return NextResponse.json({ success: true, suggestions });
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }
  } catch (error) {
    console.error("[identity GET] Error:", error);
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
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    switch (action) {
      // =====================================================
      // Node Actions
      // =====================================================
      case "create_node": {
        if (!data.channel || !data.channel_identifier) {
          return NextResponse.json(
            { error: "channel and channel_identifier are required" },
            { status: 400 }
          );
        }
        const node = await identityService.createNode(tenantId, {
          channel: data.channel,
          channel_identifier: data.channel_identifier,
          external_id: data.external_id,
          first_name: data.first_name,
          last_name: data.last_name,
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          attributes: data.attributes,
          confidence_score: data.confidence_score,
          source_system: data.source_system,
          source_id: data.source_id,
          tags: data.tags,
        });
        return NextResponse.json({ success: true, node });
      }

      case "update_node": {
        if (!data.node_id) {
          return NextResponse.json({ error: "node_id is required" }, { status: 400 });
        }
        const node = await identityService.updateNode(data.node_id, data.updates);
        return NextResponse.json({ success: true, node });
      }

      // =====================================================
      // Edge Actions
      // =====================================================
      case "create_edge": {
        if (!data.source_node_id || !data.target_node_id || !data.relationship) {
          return NextResponse.json(
            { error: "source_node_id, target_node_id, and relationship are required" },
            { status: 400 }
          );
        }
        const edge = await identityService.createEdge(tenantId, {
          source_node_id: data.source_node_id,
          target_node_id: data.target_node_id,
          relationship: data.relationship,
          relationship_label: data.relationship_label,
          weight: data.weight,
          confidence: data.confidence,
          is_bidirectional: data.is_bidirectional,
          resolution_method: data.resolution_method,
          resolution_reasoning: data.resolution_reasoning,
          resolution_signals: data.resolution_signals,
        });
        return NextResponse.json({ success: true, edge });
      }

      // =====================================================
      // Profile Actions
      // =====================================================
      case "update_profile": {
        if (!data.profile_id) {
          return NextResponse.json({ error: "profile_id is required" }, { status: 400 });
        }
        const profile = await identityService.updateUnifiedProfile(data.profile_id, data.updates);
        return NextResponse.json({ success: true, profile });
      }

      // =====================================================
      // Resolution Actions
      // =====================================================
      case "resolve": {
        if (!data.channel || !data.identifier) {
          return NextResponse.json(
            { error: "channel and identifier are required" },
            { status: 400 }
          );
        }
        const profileId = await identityService.resolveIdentity(
          tenantId,
          data.channel,
          data.identifier,
          data.attributes
        );
        return NextResponse.json({ success: true, profile_id: profileId });
      }

      case "ai_resolve": {
        if (!data.identifiers || !Array.isArray(data.identifiers)) {
          return NextResponse.json({ error: "identifiers array is required" }, { status: 400 });
        }
        const result = await identityService.aiResolveIdentity(tenantId, {
          identifiers: data.identifiers,
          context: data.context,
        });
        return NextResponse.json({ success: true, ...result });
      }

      // =====================================================
      // Rule Actions
      // =====================================================
      case "create_rule": {
        if (!data.rule_name) {
          return NextResponse.json({ error: "rule_name is required" }, { status: 400 });
        }
        const rule = await identityService.createMatchingRule(
          tenantId,
          {
            rule_name: data.rule_name,
            rule_description: data.rule_description,
            rule_type: data.rule_type,
            source_channel: data.source_channel,
            target_channel: data.target_channel,
            match_fields: data.match_fields,
            match_conditions: data.match_conditions,
            base_confidence: data.base_confidence,
            confidence_adjustments: data.confidence_adjustments,
            priority: data.priority,
          },
          user.id
        );
        return NextResponse.json({ success: true, rule });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("[identity POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
