import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withWorkspace } from "@/core/auth";
import { handleErrors, AppError } from "@/core/errors";
import { createWorkspaceScopedClient } from "@/core/database";

// Tier limits for campaigns
const TIER_LIMITS = {
  FREE: 5,
  STARTER: 25,
  PROFESSIONAL: 100,
  ENTERPRISE: 999999, // Unlimited
} as const;

// Validation schemas
const listCampaignsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["draft", "active", "paused", "completed"]).optional(),
  search: z.string().optional(),
});

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["drip", "broadcast", "automation"]),
  status: z.enum(["draft", "active", "paused"]).default("draft"),
  settings: z
    .object({
      send_time: z.string().optional(),
      timezone: z.string().optional(),
      throttle_rate: z.number().int().positive().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/v1/campaigns
 *
 * List campaigns with workspace filtering and pagination
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status
 * - search: Search by name or description
 */
export const GET = handleErrors(
  withWorkspace(async (req: NextRequest, context) => {
    const { workspaceId } = context;
    const { searchParams } = new URL(req.url);

    // Validate query parameters
    const params = listCampaignsSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
      search: searchParams.get("search"),
    });

    const offset = (params.page - 1) * params.limit;

    // Create workspace-scoped database client
    const db = await createWorkspaceScopedClient(workspaceId);

    // Build query
    let query = db
      .from("campaigns")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + params.limit - 1);

    // Apply filters
    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.search) {
      query = query.or(
        `name.ilike.%${params.search}%,description.ilike.%${params.search}%`
      );
    }

    const { data: campaigns, error, count } = await query;

    if (error) {
      throw new AppError("Failed to fetch campaigns", 500, "DATABASE_ERROR");
    }

    return NextResponse.json({
      campaigns: campaigns || [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / params.limit),
      },
    });
  })
);

/**
 * POST /api/v1/campaigns
 *
 * Create a new campaign
 * Checks tier limits for Synthex clients
 */
export const POST = handleErrors(
  withWorkspace(async (req: NextRequest, context) => {
    const { workspaceId, workspace } = context;

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createCampaignSchema.parse(body);

    // Create workspace-scoped database client
    const db = await createWorkspaceScopedClient(workspaceId);

    // Check tier limits
    const { data: existingCampaigns, error: countError } = await db
      .from("campaigns")
      .select("id", { count: "exact", head: true });

    if (countError) {
      throw new AppError(
        "Failed to check campaign count",
        500,
        "DATABASE_ERROR"
      );
    }

    const currentCount = existingCampaigns?.length || 0;
    const tier = workspace.tier as keyof typeof TIER_LIMITS;
    const limit = TIER_LIMITS[tier] || TIER_LIMITS.FREE;

    if (currentCount >= limit) {
      throw new AppError(
        `Campaign limit reached for ${tier} tier. Current: ${currentCount}, Limit: ${limit}`,
        403,
        "TIER_LIMIT_EXCEEDED",
        { current: currentCount, limit, tier }
      );
    }

    // Create campaign
    const { data: campaign, error: createError } = await db
      .from("campaigns")
      .insert({
        workspace_id: workspaceId,
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        status: validatedData.status,
        settings: validatedData.settings || {},
        tags: validatedData.tags || [],
        created_by: context.user.id,
      })
      .select()
      .single();

    if (createError) {
      throw new AppError("Failed to create campaign", 500, "DATABASE_ERROR");
    }

    return NextResponse.json(
      {
        campaign,
        message: "Campaign created successfully",
      },
      { status: 201 }
    );
  })
);
