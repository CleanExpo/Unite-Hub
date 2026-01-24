/**
 * CRM Pipeline API
 *
 * Fetches contacts grouped by pipeline stage for Kanban visualization.
 * Maps contact status to pipeline stages.
 */

import type { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import { successResponse } from "@/lib/api-helpers";
import { withErrorBoundary, ValidationError, DatabaseError } from "@/lib/errors/boundaries";
import { apiRateLimit } from "@/lib/rate-limit";

// Pipeline stage configuration
const PIPELINE_STAGES = [
  { id: 'prospect', label: 'Contacted', statusMap: ['prospect'] },
  { id: 'lead', label: 'Negotiation', statusMap: ['lead'] },
  { id: 'contact', label: 'Offer Sent', statusMap: ['contact'] },
  { id: 'customer', label: 'Deal Closed', statusMap: ['customer'] },
] as const;

export interface PipelineDeal {
  id: string;
  company: string;
  name: string;
  email: string;
  description: string;
  dueDate: string | null;
  stage: string;
  aiScore: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  label: string;
  count: number;
  deals: PipelineDeal[];
}

export interface PipelineStats {
  totalDeals: number;
  newThisWeek: number;
  conversionRate: number;
  avgAiScore: number;
}

/**
 * GET /api/crm/pipeline
 *
 * Returns contacts grouped by pipeline stage for Kanban board.
 *
 * Query Parameters:
 * - workspaceId (required): Workspace ID
 * - search: Search term for company/name/email
 * - limit: Max deals per stage (default: 50)
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
return rateLimitResult;
}

  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  const search = req.nextUrl.searchParams.get("search") || "";
  const limitPerStage = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);

  if (!workspaceId) {
    throw new ValidationError("workspaceId parameter is required");
  }

  await validateUserAndWorkspace(req, workspaceId);

  const supabase = await getSupabaseServer();

  // Fetch all contacts for the workspace
  let query = supabase
    .from("contacts")
    .select("id, name, email, company, job_title, phone, status, ai_score, tags, created_at, updated_at, last_interaction")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  // Apply search filter if provided
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
  }

  const { data: contacts, error } = await query;

  if (error) {
    throw new DatabaseError("Failed to fetch pipeline data");
  }

  // Group contacts by stage
  const stageMap = new Map<string, PipelineDeal[]>();
  PIPELINE_STAGES.forEach(stage => stageMap.set(stage.id, []));

  let totalAiScore = 0;
  let aiScoreCount = 0;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  let newThisWeek = 0;

  (contacts || []).forEach(contact => {
    const stage = contact.status || 'prospect';
    const deals = stageMap.get(stage) || [];

    // Only add up to limit per stage
    if (deals.length < limitPerStage) {
      deals.push({
        id: contact.id,
        company: contact.company || 'Unknown Company',
        name: contact.name,
        email: contact.email,
        description: contact.job_title || 'No description',
        dueDate: contact.last_interaction,
        stage,
        aiScore: contact.ai_score || 0,
        tags: contact.tags || [],
        createdAt: contact.created_at,
        updatedAt: contact.updated_at,
      });
    }

    stageMap.set(stage, deals);

    // Calculate stats
    if (contact.ai_score) {
      totalAiScore += contact.ai_score;
      aiScoreCount++;
    }

    if (new Date(contact.created_at) > oneWeekAgo) {
      newThisWeek++;
    }
  });

  // Build response with stages
  const stages: PipelineStage[] = PIPELINE_STAGES.map(stageConfig => ({
    id: stageConfig.id,
    label: stageConfig.label,
    count: stageMap.get(stageConfig.id)?.length || 0,
    deals: stageMap.get(stageConfig.id) || [],
  }));

  // Calculate stats
  const totalDeals = contacts?.length || 0;
  const closedDeals = stageMap.get('customer')?.length || 0;
  const conversionRate = totalDeals > 0 ? Math.round((closedDeals / totalDeals) * 100) : 0;
  const avgAiScore = aiScoreCount > 0 ? Math.round((totalAiScore / aiScoreCount) * 100) : 0;

  const stats: PipelineStats = {
    totalDeals,
    newThisWeek,
    conversionRate,
    avgAiScore,
  };

  return successResponse({
    stages,
    stats,
    stageConfig: PIPELINE_STAGES.map(s => ({ id: s.id, label: s.label })),
  });
});

/**
 * PATCH /api/crm/pipeline
 *
 * Update a contact's pipeline stage (drag-drop in Kanban).
 *
 * Body:
 * - contactId: Contact ID to update
 * - newStage: New pipeline stage (prospect, lead, contact, customer)
 * - workspaceId: Workspace ID
 */
export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
return rateLimitResult;
}

  const body = await req.json();
  const { contactId, newStage, workspaceId } = body;

  if (!workspaceId) {
    throw new ValidationError("workspaceId is required");
  }

  if (!contactId) {
    throw new ValidationError("contactId is required");
  }

  if (!newStage || !['prospect', 'lead', 'contact', 'customer'].includes(newStage)) {
    throw new ValidationError("newStage must be one of: prospect, lead, contact, customer");
  }

  await validateUserAndWorkspace(req, workspaceId);

  const supabase = await getSupabaseServer();

  // Update the contact's status
  const { data, error } = await supabase
    .from("contacts")
    .update({
      status: newStage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contactId)
    .eq("workspace_id", workspaceId)
    .select("id, status")
    .single();

  if (error) {
    throw new DatabaseError("Failed to update pipeline stage");
  }

  return successResponse({
    message: "Pipeline stage updated",
    contact: data,
  });
});
