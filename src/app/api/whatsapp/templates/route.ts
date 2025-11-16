/**
 * WhatsApp Templates API
 * Manage WhatsApp message templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { db } from '@/lib/db';
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * GET - List WhatsApp templates
 */
export async function GET(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const supabase = await getSupabaseServer();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status') || undefined;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const templates = await db.whatsappTemplates.listByWorkspace(workspaceId, status);

    return NextResponse.json({
      success: true,
      templates
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new WhatsApp template
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      workspaceId,
      templateName,
      category,
      language = 'en',
      headerType = 'none',
      headerContent,
      bodyContent,
      footerContent,
      variables = []
    } = body;

    // Validate required fields
    if (!workspaceId || !templateName || !category || !bodyContent) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, templateName, category, bodyContent' },
        { status: 400 }
      );
    }

    // Create template
    const template = await db.whatsappTemplates.create({
      workspace_id: workspaceId,
      template_name: templateName,
      category,
      language,
      header_type: headerType,
      header_content: headerContent,
      body_content: bodyContent,
      footer_content: footerContent,
      variables,
      status: 'pending'
    });

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
