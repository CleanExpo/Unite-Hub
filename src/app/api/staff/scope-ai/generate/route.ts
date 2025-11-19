import { NextRequest, NextResponse } from 'next/server';
import { ScopeAI } from '@/lib/ai/scopeAI';
import { z } from 'zod';
import type { ClientIdea } from '@/lib/projects/scope-planner';

/**
 * AI Scope Generation API
 * Phase 3 Step 3 - AI Scope Engine
 *
 * Generates proposal scopes using hybrid 4-stage AI pipeline:
 * 1. Claude 3.5 Sonnet - Primary draft
 * 2. GPT-4 Turbo - Structural validation
 * 3. Gemini 2.5 Flash - Pricing & estimation
 * 4. Claude 3 Haiku - Final audit
 *
 * Following CLAUDE.md patterns:
 * - Bearer token authentication
 * - Zod validation
 * - Workspace isolation
 * - Cost tracking via CostTracker
 *
 * Request body:
 * {
 *   idea: ClientIdea;
 *   organizationId: string;
 *   workspaceId: string;
 *   clientId: string;
 * }
 *
 * Response:
 * {
 *   success: true;
 *   scope: ProposalScope;
 *   metadata: {
 *     totalCost: number;
 *     totalTokens: number;
 *     pipelineStages: number;
 *   }
 * }
 */

// Request validation schema
const GenerateScopeSchema = z.object({
  idea: z.object({
    id: z.string(),
    organizationId: z.string(),
    clientId: z.string(),
    title: z.string(),
    description: z.string(),
    createdAt: z.string(),
  }),
  organizationId: z.string().uuid('Invalid organization ID'),
  workspaceId: z.string().uuid('Invalid workspace ID'),
  clientId: z.string().uuid('Invalid client ID'),
});

export async function POST(req: NextRequest) {
  try {
    // Authentication: Extract Bearer token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    let userEmail: string | undefined;

    if (token) {
      // Validate token using supabaseBrowser
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        );
      }

      userId = data.user.id;
      userEmail = data.user.email;
    } else {
      // Fallback to server-side auth
      const { getSupabaseServer } = await import('@/lib/supabase');
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please log in' },
          { status: 401 }
        );
      }

      userId = data.user.id;
      userEmail = data.user.email;
    }

    // Parse and validate request body
    const body = await req.json();

    const validationResult = GenerateScopeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { idea, organizationId, workspaceId, clientId } = validationResult.data;

    // Verify OpenRouter API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 }
      );
    }

    // Generate scope using hybrid AI pipeline
    const startTime = Date.now();

    const scope = await ScopeAI.generateHybridScope(idea, {
      organizationId,
      workspaceId,
      clientId,
      userEmail,
    });

    const generationTime = Date.now() - startTime;

    // Return success response with scope and metadata
    return NextResponse.json({
      success: true,
      scope,
      metadata: {
        totalCost: scope.metadata?.totalCost || 0,
        totalTokens: scope.metadata?.totalTokens || 0,
        pipelineStages: scope.metadata?.pipelineStages || 4,
        generationTime,
        aiModel: scope.metadata?.aiModel,
      },
    });
  } catch (error) {
    console.error('AI scope generation error:', error);

    // Return detailed error for debugging
    return NextResponse.json(
      {
        error: 'Failed to generate AI scope',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
