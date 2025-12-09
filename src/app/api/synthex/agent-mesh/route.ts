/**
 * Synthex Multi-Agent Collaboration Mesh (MACM) API
 *
 * GET - Agents, links, tasks, events, workflows, stats
 * POST - Create/update agents, links, tasks, events, workflows, AI operations
 *
 * Phase: D32 - Multi-Agent Collaboration Mesh
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as meshService from "@/lib/synthex/agentMeshService";

// Re-export types for clarity
type MeshEventType = meshService.EventType;

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
        const stats = await meshService.getMeshStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "agents": {
        const filters = {
          status: searchParams.get("status") as meshService.AgentStatus | undefined,
          capability: searchParams.get("capability") as meshService.AgentCapability | undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const agents = await meshService.listAgents(tenantId, filters);
        return NextResponse.json({ success: true, agents });
      }

      case "agent": {
        const agentId = searchParams.get("agentId");
        if (!agentId) {
          return NextResponse.json(
            { error: "agentId is required" },
            { status: 400 }
          );
        }
        const agent = await meshService.getAgent(agentId);
        return NextResponse.json({ success: true, agent });
      }

      case "available_agents": {
        const capability = searchParams.get("capability") as meshService.AgentCapability | undefined;
        const agents = await meshService.getAvailableAgents(tenantId, capability);
        return NextResponse.json({ success: true, agents });
      }

      case "links": {
        const filters = {
          source_agent_id: searchParams.get("source_agent_id") || undefined,
          target_agent_id: searchParams.get("target_agent_id") || undefined,
          relationship: searchParams.get("relationship") as meshService.MeshRelationship | undefined,
          is_active: searchParams.get("is_active") === "true" ? true : searchParams.get("is_active") === "false" ? false : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const links = await meshService.listLinks(tenantId, filters);
        return NextResponse.json({ success: true, links });
      }

      case "agent_connections": {
        const agentId = searchParams.get("agentId");
        if (!agentId) {
          return NextResponse.json(
            { error: "agentId is required" },
            { status: 400 }
          );
        }
        const connections = await meshService.getAgentConnections(agentId);
        return NextResponse.json({ success: true, connections });
      }

      case "tasks": {
        const filters = {
          status: searchParams.get("status") as meshService.TaskStatus | undefined,
          assigned_agent_id: searchParams.get("assigned_agent_id") || undefined,
          task_type: searchParams.get("task_type") || undefined,
          priority: searchParams.get("priority") ? parseInt(searchParams.get("priority")!) : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const tasks = await meshService.listTasks(tenantId, filters);
        return NextResponse.json({ success: true, tasks });
      }

      case "task": {
        const taskId = searchParams.get("taskId");
        if (!taskId) {
          return NextResponse.json(
            { error: "taskId is required" },
            { status: 400 }
          );
        }
        const task = await meshService.getTask(taskId);
        return NextResponse.json({ success: true, task });
      }

      case "events": {
        const filters = {
          agent_id: searchParams.get("agent_id") || undefined,
          task_id: searchParams.get("task_id") || undefined,
          event_type: searchParams.get("event_type") as meshService.MeshEventType | undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const events = await meshService.listEvents(tenantId, filters);
        return NextResponse.json({ success: true, events });
      }

      case "workflows": {
        const filters = {
          status: searchParams.get("status") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const workflows = await meshService.listWorkflows(tenantId, filters);
        return NextResponse.json({ success: true, workflows });
      }

      case "workflow": {
        const workflowId = searchParams.get("workflowId");
        if (!workflowId) {
          return NextResponse.json(
            { error: "workflowId is required" },
            { status: 400 }
          );
        }
        const workflow = await meshService.getWorkflow(workflowId);
        return NextResponse.json({ success: true, workflow });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[agent-mesh GET] Error:", error);
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
      // Agent Actions
      // =====================================================
      case "create_agent": {
        if (!data.agent_name || !data.agent_type) {
          return NextResponse.json(
            { error: "agent_name and agent_type are required" },
            { status: 400 }
          );
        }
        const agent = await meshService.createAgent(
          tenantId,
          {
            agent_name: data.agent_name,
            agent_type: data.agent_type,
            description: data.description,
            capabilities: data.capabilities,
            configuration: data.configuration,
            max_concurrent_tasks: data.max_concurrent_tasks,
            priority_weight: data.priority_weight,
          },
          user.id
        );
        return NextResponse.json({ success: true, agent });
      }

      case "update_agent": {
        if (!data.agent_id) {
          return NextResponse.json(
            { error: "agent_id is required" },
            { status: 400 }
          );
        }
        const agent = await meshService.updateAgent(data.agent_id, data.updates);
        return NextResponse.json({ success: true, agent });
      }

      // =====================================================
      // Link Actions
      // =====================================================
      case "create_link": {
        if (!data.source_agent_id || !data.target_agent_id || !data.relationship) {
          return NextResponse.json(
            { error: "source_agent_id, target_agent_id, and relationship are required" },
            { status: 400 }
          );
        }
        const link = await meshService.createLink(tenantId, {
          source_agent_id: data.source_agent_id,
          target_agent_id: data.target_agent_id,
          relationship: data.relationship,
          relationship_label: data.relationship_label,
          weight: data.weight,
          priority: data.priority,
          is_bidirectional: data.is_bidirectional,
          rules: data.rules,
          trigger_conditions: data.trigger_conditions,
          delegation_policy: data.delegation_policy,
        });
        return NextResponse.json({ success: true, link });
      }

      case "update_link": {
        if (!data.link_id) {
          return NextResponse.json(
            { error: "link_id is required" },
            { status: 400 }
          );
        }
        const link = await meshService.updateLink(data.link_id, data.updates);
        return NextResponse.json({ success: true, link });
      }

      // =====================================================
      // Task Actions
      // =====================================================
      case "create_task": {
        if (!data.task_type || !data.task_name) {
          return NextResponse.json(
            { error: "task_type and task_name are required" },
            { status: 400 }
          );
        }
        const task = await meshService.createTask(tenantId, {
          task_name: data.task_name,
          task_type: data.task_type,
          task_description: data.task_description,
          input_data: data.input_data || {},
          context: data.context,
          priority: data.priority,
          scheduled_at: data.scheduled_at,
          deadline_at: data.deadline_at,
          created_by_agent_id: data.created_by_agent_id,
          requires_human_approval: data.requires_human_approval,
          source_type: data.source_type,
          source_id: data.source_id,
          tags: data.tags,
        });
        return NextResponse.json({ success: true, task });
      }

      case "assign_task": {
        if (!data.task_id || !data.agent_id) {
          return NextResponse.json(
            { error: "task_id and agent_id are required" },
            { status: 400 }
          );
        }
        const task = await meshService.assignTask(data.task_id, data.agent_id);
        return NextResponse.json({ success: true, task });
      }

      case "complete_task": {
        if (!data.task_id) {
          return NextResponse.json(
            { error: "task_id is required" },
            { status: 400 }
          );
        }
        const result = await meshService.completeTask(data.task_id, {
          output_data: data.output_data || {},
          duration_ms: data.duration_ms || 0,
          tokens_used: data.tokens_used || 0,
          cost: data.cost || 0,
        });
        return NextResponse.json({ success: true, completed: result });
      }

      case "fail_task": {
        if (!data.task_id || !data.error_message) {
          return NextResponse.json(
            { error: "task_id and error_message are required" },
            { status: 400 }
          );
        }
        const task = await meshService.failTask(data.task_id, data.error_message);
        return NextResponse.json({ success: true, task });
      }

      // =====================================================
      // Event Actions
      // =====================================================
      case "record_event": {
        if (!data.event_type) {
          return NextResponse.json(
            { error: "event_type is required" },
            { status: 400 }
          );
        }
        const event = await meshService.recordEvent(tenantId, {
          agent_id: data.agent_id,
          task_id: data.task_id,
          event_type: data.event_type,
          event_data: data.event_data,
          severity: data.severity,
        });
        return NextResponse.json({ success: true, event });
      }

      // =====================================================
      // Workflow Actions
      // =====================================================
      case "create_workflow": {
        if (!data.workflow_name || !data.workflow_type) {
          return NextResponse.json(
            { error: "workflow_name and workflow_type are required" },
            { status: 400 }
          );
        }
        const workflow = await meshService.createWorkflow(
          tenantId,
          {
            workflow_name: data.workflow_name,
            workflow_type: data.workflow_type,
            description: data.description,
            steps: data.steps,
            configuration: data.configuration,
          },
          user.id
        );
        return NextResponse.json({ success: true, workflow });
      }

      case "update_workflow": {
        if (!data.workflow_id) {
          return NextResponse.json(
            { error: "workflow_id is required" },
            { status: 400 }
          );
        }
        const workflow = await meshService.updateWorkflow(data.workflow_id, data.updates);
        return NextResponse.json({ success: true, workflow });
      }

      // =====================================================
      // AI Actions
      // =====================================================
      case "auto_assign": {
        if (!data.task_id) {
          return NextResponse.json(
            { error: "task_id is required" },
            { status: 400 }
          );
        }
        const result = await meshService.autoAssignTask(tenantId, data.task_id);
        return NextResponse.json({ success: true, ...result });
      }

      case "suggest_collaborators": {
        if (!data.task_id) {
          return NextResponse.json(
            { error: "task_id is required" },
            { status: 400 }
          );
        }
        const result = await meshService.suggestCollaborators(tenantId, data.task_id);
        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[agent-mesh POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
