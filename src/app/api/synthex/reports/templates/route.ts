/**
 * Report Templates API
 *
 * Phase: D54 - External Reporting & Investor Pack Engine
 *
 * Routes:
 * - GET /api/synthex/reports/templates - List templates
 * - POST /api/synthex/reports/templates - Create template
 *
 * Query Params:
 * - action=get&id=<template-id> - Get specific template
 * - action=sections&id=<template-id> - List sections
 * - action=create_section - Create section
 * - action=delete_section&section_id=<id> - Delete section
 * - action=update&id=<template-id> - Update template
 * - action=delete&id=<template-id> - Delete template
 * - category=<category> - Filter by category
 * - is_active=<bool> - Filter by active status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createReportTemplate,
  getReportTemplate,
  listReportTemplates,
  updateReportTemplate,
  deleteReportTemplate,
  createReportSection,
  listTemplateSections,
  deleteReportSection,
  CreateTemplateInput,
  CreateSectionInput,
} from '@/lib/synthex/reportingService';

// =============================================================================
// GET - List templates, get template, list sections
// =============================================================================

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

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get('action');
    const id = request.nextUrl.searchParams.get('id');

    // Get specific template
    if (action === 'get' && id) {
      const template = await getReportTemplate(tenantId, id);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    // List sections
    if (action === 'sections' && id) {
      const sections = await listTemplateSections(id);
      return NextResponse.json({ sections });
    }

    // List templates
    const category = request.nextUrl.searchParams.get('category');
    const isActive = request.nextUrl.searchParams.get('is_active');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const templates = await listReportTemplates(tenantId, {
      category: category || undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      limit,
    });

    return NextResponse.json({ templates });
  } catch (error: unknown) {
    console.error('GET /api/synthex/reports/templates error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create, update, delete templates and sections
// =============================================================================

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

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    // Create template
    if (!action || action === 'create') {
      const input: CreateTemplateInput = {
        name: body.name,
        description: body.description,
        category: body.category,
        frequency: body.frequency,
        default_audience: body.default_audience,
        tone: body.tone,
        focus_areas: body.focus_areas,
        created_by: user.id,
      };

      if (!input.name) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
      }

      const template = await createReportTemplate(tenantId, input);
      return NextResponse.json({ template }, { status: 201 });
    }

    // Create section
    if (action === 'create_section') {
      const input: CreateSectionInput = {
        template_id: body.template_id,
        section_type: body.section_type,
        title: body.title,
        section_order: body.section_order,
        data_sources: body.data_sources,
        ai_prompt_template: body.ai_prompt_template,
      };

      if (!input.template_id || !input.section_type || !input.title || input.section_order === undefined) {
        return NextResponse.json(
          { error: 'template_id, section_type, title, and section_order are required' },
          { status: 400 }
        );
      }

      const section = await createReportSection(input);
      return NextResponse.json({ section }, { status: 201 });
    }

    // Delete section
    if (action === 'delete_section') {
      const sectionId = request.nextUrl.searchParams.get('section_id') || body.section_id;
      if (!sectionId) {
        return NextResponse.json({ error: 'section_id is required' }, { status: 400 });
      }

      await deleteReportSection(sectionId);
      return NextResponse.json({ success: true });
    }

    // Update template
    if (action === 'update') {
      const templateId = request.nextUrl.searchParams.get('id') || body.template_id;
      if (!templateId) {
        return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
      }

      const updates = {
        name: body.name,
        description: body.description,
        category: body.category,
        frequency: body.frequency,
        default_audience: body.default_audience,
        tone: body.tone,
        focus_areas: body.focus_areas,
        is_active: body.is_active,
      };

      const template = await updateReportTemplate(tenantId, templateId, updates);
      return NextResponse.json({ template });
    }

    // Delete template
    if (action === 'delete') {
      const templateId = request.nextUrl.searchParams.get('id') || body.template_id;
      if (!templateId) {
        return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
      }

      await deleteReportTemplate(tenantId, templateId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('POST /api/synthex/reports/templates error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage templates' },
      { status: 500 }
    );
  }
}
