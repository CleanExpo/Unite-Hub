/**
 * Templates API
 *
 * Phase: D57 - Multi-Brand Template Library & Provisioning
 *
 * Routes:
 * - GET /api/unite/templates - List templates
 * - POST /api/unite/templates - Create template
 *
 * Query Params:
 * - action=get&id=<template-id> - Get specific template
 * - action=blocks&id=<template-id> - List blocks for template
 * - action=create_block - Create block
 * - action=update&id=<template-id> - Update template
 * - action=delete&id=<template-id> - Delete template
 * - action=delete_block&id=<block-id> - Delete block
 * - category=<category> - Filter by category
 * - channel=<channel> - Filter by channel
 * - status=<status> - Filter by status
 * - tags=<tag1,tag2> - Filter by tags
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
  createBlock,
  listBlocks,
  deleteBlock,
  CreateTemplateInput,
  CreateBlockInput,
  TemplateStatus,
  BlockKind,
} from '@/lib/unite/templateService';

// =============================================================================
// GET - List templates, get template, get blocks
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

    const tenantId = orgData?.org_id || null;

    const action = request.nextUrl.searchParams.get('action');
    const id = request.nextUrl.searchParams.get('id');

    // Get specific template
    if (action === 'get' && id) {
      const template = await getTemplate(tenantId, id);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    // List blocks for template
    if (action === 'blocks' && id) {
      const blocks = await listBlocks(id);
      return NextResponse.json({ blocks });
    }

    // List templates
    const category = request.nextUrl.searchParams.get('category');
    const channel = request.nextUrl.searchParams.get('channel');
    const status = request.nextUrl.searchParams.get('status') as TemplateStatus | null;
    const tagsParam = request.nextUrl.searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',') : undefined;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const templates = await listTemplates(tenantId, {
      category: category || undefined,
      channel: channel || undefined,
      status: status || undefined,
      tags,
      limit,
    });

    return NextResponse.json({ templates });
  } catch (error: unknown) {
    console.error('GET /api/unite/templates error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create, update, delete template/block
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

    const tenantId = orgData?.org_id || null;

    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

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
        channel: body.channel,
        status: body.status,
        structure: body.structure,
        ai_profile: body.ai_profile,
        tags: body.tags,
      };

      const template = await updateTemplate(tenantId, templateId, updates);
      return NextResponse.json({ template });
    }

    // Delete template
    if (action === 'delete') {
      const templateId = request.nextUrl.searchParams.get('id') || body.template_id;
      if (!templateId) {
        return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
      }

      await deleteTemplate(tenantId, templateId);
      return NextResponse.json({ success: true });
    }

    // Delete block
    if (action === 'delete_block') {
      const blockId = request.nextUrl.searchParams.get('id') || body.block_id;
      if (!blockId) {
        return NextResponse.json({ error: 'block_id is required' }, { status: 400 });
      }

      await deleteBlock(blockId);
      return NextResponse.json({ success: true });
    }

    // Create block
    if (action === 'create_block') {
      const blockInput: CreateBlockInput = {
        template_id: body.template_id,
        kind: body.kind as BlockKind,
        order_index: body.order_index,
        label: body.label,
        payload: body.payload,
      };

      if (!blockInput.template_id || !blockInput.kind || blockInput.order_index == null) {
        return NextResponse.json(
          { error: 'template_id, kind, and order_index are required' },
          { status: 400 }
        );
      }

      const block = await createBlock(blockInput);
      return NextResponse.json({ block }, { status: 201 });
    }

    // Create template
    const input: CreateTemplateInput = {
      scope: body.scope,
      slug: body.slug,
      name: body.name,
      description: body.description,
      category: body.category,
      channel: body.channel,
      tags: body.tags,
    };

    if (!input.scope || !input.slug || !input.name) {
      return NextResponse.json(
        { error: 'scope, slug, and name are required' },
        { status: 400 }
      );
    }

    const template = await createTemplate(tenantId, input);
    return NextResponse.json({ template }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/unite/templates error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage templates' },
      { status: 500 }
    );
  }
}
