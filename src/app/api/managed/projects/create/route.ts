/**
 * POST /api/managed/projects/create
 *
 * Create a new managed service project with automated setup
 * This endpoint calls ProjectCreationEngine to set up:
 * - Project database record
 * - Timeline phases based on service type
 * - Initial tasks and workflow
 * - Stripe integration and payment tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { createManagedServiceProject, getProjectStatus } from '@/lib/managed/ProjectCreationEngine';

const logger = createApiLogger({ route: '/api/managed/projects/create' });

interface CreateProjectRequest {
  workspaceId: string;
  serviceType: 'seo' | 'content' | 'social' | 'conversion' | 'analytics';
  clientName: string;
  clientEmail: string;
  clientWebsite: string;
  targetKeywords?: string[];
  additionalNotes?: string;
  paymentMethod: 'stripe' | 'manual';
  estimatedBudget?: number;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body: CreateProjectRequest = await req.json();
    const {
      workspaceId,
      serviceType,
      clientName,
      clientEmail,
      clientWebsite,
      targetKeywords,
      additionalNotes,
      paymentMethod,
      estimatedBudget
    } = body;

    // Validate required fields
    if (!workspaceId || !serviceType || !clientName || !clientEmail || !clientWebsite) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, serviceType, clientName, clientEmail, clientWebsite' },
        { status: 400 }
      );
    }

    logger.info('🚀 Creating managed service project', {
      workspaceId,
      serviceType,
      clientName,
      userId: user.id,
    });

    // Call ProjectCreationEngine to set up the project
    const result = await createManagedServiceProject({
      workspaceId,
      userId: user.id,
      serviceType,
      clientName,
      clientEmail,
      clientWebsite,
      targetKeywords: targetKeywords || [],
      additionalNotes: additionalNotes || '',
      paymentMethod,
      estimatedBudget: estimatedBudget || 0,
    });

    if (!result.success) {
      logger.error('❌ Failed to create project', {
        error: result.error,
        clientName,
      });
      return NextResponse.json(
        { error: result.error || 'Failed to create project' },
        { status: 500 }
      );
    }

    logger.info('✅ Project created successfully', {
      projectId: result.projectId,
      clientName,
      serviceType,
    });

    // Get full project status
    const projectStatus = await getProjectStatus(result.projectId);

    return NextResponse.json({
      success: true,
      projectId: result.projectId,
      project: projectStatus,
      message: `Project created for ${clientName}. Timeline initialized and tasks scheduled.`,
    });

  } catch (error) {
    logger.error('❌ Error creating project', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
