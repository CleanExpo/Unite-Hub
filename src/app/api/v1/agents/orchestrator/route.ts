import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/core/auth";
import { withRateLimit } from "@/core/security";
import { handleErrors, AppError } from "@/core/errors";
import { createClient } from "@/lib/supabase/server";

// Validation schema for orchestrator task submission
const submitTaskSchema = z.object({
  task_type: z.enum([
    "email_processing",
    "content_generation",
    "contact_intelligence",
    "campaign_optimization",
    "seo_analysis",
    "competitor_research",
    "lead_scoring",
    "custom",
  ]),
  description: z.string().min(1).max(2000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  workspace_id: z.string().uuid(),
  input_data: z.record(z.any()).optional(),
  context: z
    .object({
      user_id: z.string().uuid().optional(),
      campaign_id: z.string().uuid().optional(),
      contact_id: z.string().uuid().optional(),
      organization_id: z.string().uuid().optional(),
    })
    .optional(),
  settings: z
    .object({
      model: z
        .enum(["opus-4-5", "sonnet-4-5", "haiku-4-5", "auto"])
        .default("auto"),
      max_tokens: z.number().int().min(100).max(100000).optional(),
      temperature: z.number().min(0).max(1).optional(),
      thinking_budget: z.number().int().min(0).max(20000).optional(),
      timeout_seconds: z.number().int().min(10).max(600).default(120),
      retry_on_failure: z.boolean().default(true),
      max_retries: z.number().int().min(0).max(3).default(1),
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
  callback_url: z.string().url().optional(),
  webhook_url: z.string().url().optional(),
});

// Priority to numeric score mapping for queue ordering
const PRIORITY_SCORES = {
  low: 1,
  normal: 5,
  high: 10,
  urgent: 20,
} as const;

// Model mapping
const MODEL_MAP = {
  "opus-4-5": "claude-opus-4-5-20251101",
  "sonnet-4-5": "claude-sonnet-4-5-20250929",
  "haiku-4-5": "claude-haiku-4-5-20251001",
  auto: "claude-sonnet-4-5-20250929", // Default to Sonnet for balanced performance
} as const;

/**
 * POST /api/v1/agents/orchestrator
 *
 * Submit task to AI orchestrator for async processing
 *
 * - Staff only (FOUNDER, STAFF, ADMIN roles)
 * - Extended rate limits: 20 requests per minute (agent tier)
 * - Returns task_id for status tracking
 *
 * Task types:
 * - email_processing: Process and analyze emails
 * - content_generation: Generate marketing content
 * - contact_intelligence: Score and analyze contacts
 * - campaign_optimization: Optimize campaign performance
 * - seo_analysis: Analyze SEO opportunities
 * - competitor_research: Research competitor strategies
 * - lead_scoring: Score and prioritize leads
 * - custom: Custom agent task
 *
 * Response includes:
 * - task_id: Unique task identifier for polling status
 * - status: Initial status (queued)
 * - estimated_completion: Estimated completion time
 */
export const POST = handleErrors(
  withRateLimit("agent")(
    withAuth(
      withRole(["FOUNDER", "STAFF", "ADMIN"])(
        async (req: NextRequest, context) => {
          const { user } = context;

          // Parse and validate request body
          const body = await req.json();
          const validatedData = submitTaskSchema.parse(body);

          const supabase = await createClient();

          // Verify workspace exists and user has access
          const { data: userOrg, error: orgError } = await supabase
            .from("user_organizations")
            .select(
              `
            id,
            role,
            organization:organizations!inner (
              id,
              org_id,
              name,
              tier
            )
          `
            )
            .eq("user_id", user.id)
            .eq("organization.org_id", validatedData.workspace_id)
            .single();

          if (orgError || !userOrg) {
            throw new AppError(
              "Workspace not found or access denied",
              403,
              "WORKSPACE_ACCESS_DENIED"
            );
          }

          // Determine model to use
          const modelKey =
            validatedData.settings?.model || "auto";
          const model = MODEL_MAP[modelKey];

          // Calculate priority score
          const priorityScore = PRIORITY_SCORES[validatedData.priority];

          // Generate task ID
          const taskId = crypto.randomUUID();

          // Estimate completion time based on task type and priority
          const estimatedMinutes =
            validatedData.priority === "urgent"
              ? 2
              : validatedData.priority === "high"
              ? 5
              : validatedData.priority === "normal"
              ? 10
              : 15;
          const estimatedCompletion = new Date(
            Date.now() + estimatedMinutes * 60 * 1000
          ).toISOString();

          // Create task record
          const { data: task, error: createError } = await supabase
            .from("agent_tasks")
            .insert({
              id: taskId,
              workspace_id: validatedData.workspace_id,
              task_type: validatedData.task_type,
              description: validatedData.description,
              priority: validatedData.priority,
              priority_score: priorityScore,
              status: "queued",
              input_data: validatedData.input_data || {},
              context: {
                ...validatedData.context,
                user_id: user.id,
                user_email: user.email,
                organization_tier: userOrg.organization.tier,
              },
              settings: {
                ...validatedData.settings,
                model,
              },
              metadata: validatedData.metadata || {},
              callback_url: validatedData.callback_url,
              webhook_url: validatedData.webhook_url,
              created_by: user.id,
              estimated_completion: estimatedCompletion,
            })
            .select()
            .single();

          if (createError) {
            throw new AppError("Failed to create task", 500, "DATABASE_ERROR");
          }

          // TODO: Publish task to job queue (Bull, BullMQ, etc.)
          // This would trigger the actual orchestrator agent processing
          // For now, task is queued in database and can be processed by background worker

          // Log task creation
          await supabase.from("auditLogs").insert({
            workspace_id: validatedData.workspace_id,
            user_id: user.id,
            action: "agent_task_created",
            resource_type: "agent_task",
            resource_id: taskId,
            details: {
              task_type: validatedData.task_type,
              priority: validatedData.priority,
              model,
            },
          });

          return NextResponse.json(
            {
              task_id: taskId,
              status: "queued",
              priority: validatedData.priority,
              estimated_completion: estimatedCompletion,
              message: "Task submitted successfully to orchestrator",
              polling_url: `/api/v1/agents/orchestrator/${taskId}`,
            },
            { status: 201 }
          );
        }
      )
    )
  )
);

/**
 * GET /api/v1/agents/orchestrator
 *
 * List orchestrator tasks for the authenticated user's workspaces
 *
 * Query params:
 * - workspace_id: Filter by workspace (required)
 * - status: Filter by status (queued, processing, completed, failed)
 * - task_type: Filter by task type
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export const GET = handleErrors(
  withAuth(
    withRole(["FOUNDER", "STAFF", "ADMIN"])(
      async (req: NextRequest, context) => {
        const { user } = context;
        const { searchParams } = new URL(req.url);

        const workspaceId = searchParams.get("workspace_id");
        const status = searchParams.get("status");
        const taskType = searchParams.get("task_type");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(
          100,
          Math.max(1, parseInt(searchParams.get("limit") || "20"))
        );

        if (!workspaceId) {
          throw new AppError(
            "workspace_id is required",
            400,
            "MISSING_WORKSPACE_ID"
          );
        }

        const supabase = await createClient();

        // Verify workspace access
        const { data: userOrg, error: orgError } = await supabase
          .from("user_organizations")
          .select("id")
          .eq("user_id", user.id)
          .eq("organization.org_id", workspaceId)
          .single();

        if (orgError || !userOrg) {
          throw new AppError(
            "Workspace not found or access denied",
            403,
            "WORKSPACE_ACCESS_DENIED"
          );
        }

        const offset = (page - 1) * limit;

        // Build query
        let query = supabase
          .from("agent_tasks")
          .select("*", { count: "exact" })
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq("status", status);
        }

        if (taskType) {
          query = query.eq("task_type", taskType);
        }

        const { data: tasks, error, count } = await query;

        if (error) {
          throw new AppError("Failed to fetch tasks", 500, "DATABASE_ERROR");
        }

        return NextResponse.json({
          tasks: tasks || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / limit),
          },
        });
      }
    )
  )
);
