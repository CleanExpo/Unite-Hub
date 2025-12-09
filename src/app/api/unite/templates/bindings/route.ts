/**
 * Template Bindings API
 *
 * Phase: D57 - Multi-Brand Template Library & Provisioning
 *
 * Routes:
 * - GET /api/unite/templates/bindings - List bindings
 * - POST /api/unite/templates/bindings - Create binding
 *
 * Query Params:
 * - action=delete&id=<binding-id> - Delete binding
 * - template_id=<template-id> - Filter by template
 * - target_type=<type> - Filter by target type
 * - target_id=<target-id> - Filter by target ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createBinding,
  listBindings,
  deleteBinding,
  CreateBindingInput,
} from '@/lib/unite/templateService';

// =============================================================================
// GET - List bindings
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

    const templateId = request.nextUrl.searchParams.get('template_id');
    const targetType = request.nextUrl.searchParams.get('target_type');
    const targetId = request.nextUrl.searchParams.get('target_id');

    const bindings = await listBindings(tenantId, {
      templateId: templateId || undefined,
      targetType: targetType || undefined,
      targetId: targetId || undefined,
    });

    return NextResponse.json({ bindings });
  } catch (error: unknown) {
    console.error('GET /api/unite/templates/bindings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch bindings' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create or delete binding
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

    // Delete binding
    if (action === 'delete') {
      const bindingId = request.nextUrl.searchParams.get('id') || body.binding_id;
      if (!bindingId) {
        return NextResponse.json({ error: 'binding_id is required' }, { status: 400 });
      }

      await deleteBinding(bindingId);
      return NextResponse.json({ success: true });
    }

    // Create binding
    const input: CreateBindingInput = {
      template_id: body.template_id,
      target_type: body.target_type,
      target_id: body.target_id,
      config: body.config,
    };

    if (!input.template_id || !input.target_type) {
      return NextResponse.json(
        { error: 'template_id and target_type are required' },
        { status: 400 }
      );
    }

    const binding = await createBinding(tenantId, input);
    return NextResponse.json({ binding }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/unite/templates/bindings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage bindings' },
      { status: 500 }
    );
  }
}
