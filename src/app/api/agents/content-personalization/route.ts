 
import type { NextRequest } from "next/server";
import {
  generatePersonalizedContent,
  generateBulkContent,
  getPersonalizationMetrics,
} from "@/lib/agents/content-personalization";
import { getHotLeads } from "@/lib/agents/contact-intelligence";
import { getSupabaseServer } from "@/lib/supabase";
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { ContentGenerationRequestSchema, formatZodError } from "@/lib/validation/schemas";
import { withErrorBoundary, ValidationError, AuthenticationError, AuthorizationError } from "@/lib/errors/boundaries";
import { successResponse } from "@/lib/errors/boundaries";

export const POST = withErrorBoundary(async (req: NextRequest) => {
  // Apply rate limiting (20 requests per 15 minutes for AI endpoints)
  const rateLimitResult = await aiAgentRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Authentication check
  const supabase = await getSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError("Authentication required");
  }

  // Get user's organization
  const { data: userOrg, error: orgError } = await supabase
    .from("user_organizations")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (orgError || !userOrg) {
    throw new AuthorizationError("No active organization found");
  }

  const body = await req.json();

  // Validate request body (only for generate action)
  if (body.action === "generate") {
    const validationResult = ContentGenerationRequestSchema.safeParse({
      contact_id: body.contactId,
      content_type: body.contentType,
      workspace_id: body.workspaceId,
    });

    if (!validationResult.success) {
      throw new ValidationError("Invalid input", formatZodError(validationResult.error));
    }
  }

  const { action, contactId, contentType, workspaceId } = body;

  // Validate workspaceId if provided
  if (workspaceId) {
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("org_id", userOrg.org_id)
      .single();

    if (workspaceError || !workspace) {
      throw new AuthorizationError("Invalid workspace or access denied");
    }
  }

  if (action === "generate" && contactId && contentType) {
    const content = await generatePersonalizedContent(
      contactId,
      contentType
    );
    return successResponse({ content }, undefined, "Content generated successfully", 200);
  }

  if (action === "generate_bulk" && workspaceId && contentType) {
    const hotLeads = await getHotLeads(workspaceId);
    const result = await generateBulkContent(hotLeads, contentType);
    return successResponse({ result }, undefined, "Bulk content generated successfully", 200);
  }

  if (action === "metrics" && workspaceId) {
    const metrics = await getPersonalizationMetrics(workspaceId);
    return successResponse({ metrics }, undefined, "Metrics retrieved successfully", 200);
  }

  throw new ValidationError("Invalid action", { action: "Action must be generate, generate_bulk, or metrics" });
});
