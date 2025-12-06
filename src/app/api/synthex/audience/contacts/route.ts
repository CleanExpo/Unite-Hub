/**
 * GET /api/synthex/audience/contacts
 * POST /api/synthex/audience/contacts
 *
 * Manage contacts within an audience.
 *
 * GET: List contacts in audience
 * Query params:
 * - audienceId: string (required)
 * - limit?: number
 * - offset?: number
 *
 * POST: Add contact(s) to audience
 * {
 *   tenantId: string (required)
 *   audienceId: string (required)
 *   contact?: { email?, phone?, firstName?, lastName?, attributes?, tags? }
 *   contacts?: Array<contact> (for bulk add)
 * }
 *
 * Phase: B10 - Synthex Audience Intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { addContact, addContacts, listContacts, getAudience } from '@/lib/synthex/audienceService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const audienceId = searchParams.get('audienceId');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!audienceId) {
      return NextResponse.json(
        { error: 'Missing required param: audienceId' },
        { status: 400 }
      );
    }

    // Get audience to validate access
    const audienceResult = await getAudience(audienceId);
    if (!audienceResult.data) {
      return NextResponse.json({ error: 'Audience not found' }, { status: 404 });
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', audienceResult.data.tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await listContacts(audienceId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      contacts: result.data || [],
    }, { status: 200 });
  } catch (error) {
    console.error('[audience/contacts GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, audienceId, contact, contacts } = body;

    if (!tenantId || !audienceId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, audienceId' },
        { status: 400 }
      );
    }

    if (!contact && !contacts) {
      return NextResponse.json(
        { error: 'Missing required field: contact or contacts' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Bulk add or single add
    if (contacts && Array.isArray(contacts)) {
      const result = await addContacts(tenantId, audienceId, contacts);

      if (result.error) {
        throw result.error;
      }

      return NextResponse.json({
        status: 'ok',
        contacts: result.data || [],
        count: result.data?.length || 0,
      }, { status: 201 });
    } else {
      const result = await addContact(tenantId, audienceId, contact);

      if (result.error) {
        throw result.error;
      }

      return NextResponse.json({
        status: 'ok',
        contact: result.data,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('[audience/contacts POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
