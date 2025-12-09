/**
 * Research Projects API
 * Phase D03: Research Fabric v1
 *
 * GET - List research projects
 * POST - Create new research project
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listProjects,
  createProject,
  type ProjectStatus,
} from '@/lib/research/researchFabricService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status') as ProjectStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const projects = await listProjects(tenantId, {
      status: status || undefined,
      limit,
    });

    return NextResponse.json({
      projects,
      count: projects.length,
    });
  } catch (error) {
    console.error('Error in research projects GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, ...projectData } = body;

    if (!tenantId || !projectData.name) {
      return NextResponse.json(
        { error: 'tenantId and name are required' },
        { status: 400 }
      );
    }

    const project = await createProject(tenantId, projectData, user.id);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error in research projects POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
