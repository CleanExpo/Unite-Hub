 
import type { NextRequest } from "next/server";
import {
  analyzeContactIntelligence,
  analyzeWorkspaceContacts,
  getHotLeads,
} from "@/lib/agents/contact-intelligence";
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { ContactIntelligenceRequestSchema, formatZodError } from "@/lib/validation/schemas";
import { withErrorBoundary, ValidationError } from "@/lib/errors/boundaries";
import { successResponse } from "@/lib/errors/boundaries";

export const POST = withErrorBoundary(async (req: NextRequest) => {
  // Apply rate limiting (20 requests per 15 minutes for AI endpoints)
  const rateLimitResult = await aiAgentRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  const body = await req.json();

  // Validate request body
  const validationResult = ContactIntelligenceRequestSchema.safeParse({
    action: body.action,
    contact_id: body.contactId,
    workspace_id: body.workspaceId,
    limit: body.limit,
  });

  if (!validationResult.success) {
    throw new ValidationError("Invalid input", formatZodError(validationResult.error));
  }

  const { action, contact_id: contactId, workspace_id: workspaceId } = validationResult.data;

  // Validate authentication and workspace access (SECURE - no service role bypass)
  const { validateUserAuth, validateWorkspaceAccess } = await import("@/lib/workspace-validation");

  const user = await validateUserAuth(req);

  // Validate workspaceId if provided
  if (workspaceId) {
    await validateWorkspaceAccess(workspaceId, user.orgId);
  }

  if (action === "analyze_contact" && contactId) {
    const intelligence = await analyzeContactIntelligence(
      contactId,
      workspaceId
    );
    return successResponse({ intelligence }, undefined, "Contact analysis complete", 200);
  }

  if (action === "analyze_workspace" && workspaceId) {
    const result = await analyzeWorkspaceContacts(workspaceId);
    return successResponse({ result }, undefined, "Workspace analysis complete", 200);
  }

  if (action === "get_hot_leads" && workspaceId) {
    const hotLeads = await getHotLeads(workspaceId);
    return successResponse({ hotLeads }, undefined, "Hot leads retrieved", 200);
  }

  throw new ValidationError("Invalid action", { action: "Action must be analyze_contact, analyze_workspace, or get_hot_leads" });
});
