/**
 * GET  /api/founder/vault  — list credential metadata for authenticated owner
 * POST /api/founder/vault  — create a new encrypted credential
 *
 * Query params (GET): ?business=X&category=Y
 * Body (POST): { business_id, category, label, url?, notes?, secret }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createVaultItem, listVaultItems, type VaultCategory } from '@/lib/security/founder-vault';

// ─── GET — list items (metadata only) ────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const business = searchParams.get('business') ?? undefined;
    const category = (searchParams.get('category') ?? undefined) as VaultCategory | undefined;

    const items = await listVaultItems(user.id, business, category);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('[vault] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vault items' },
      { status: 500 }
    );
  }
}

// ─── POST — create new credential ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { business_id, category, label, url, notes, secret, agent_accessible } = body;

    // Validate required fields
    if (!business_id || !category || !label || !secret) {
      return NextResponse.json(
        { success: false, error: 'business_id, category, label, and secret are required' },
        { status: 400 }
      );
    }

    const validCategories: VaultCategory[] = ['login', 'api-key', 'banking', 'licence', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const item = await createVaultItem({
      ownerId: user.id,
      businessId: business_id,
      category,
      label,
      url: url ?? undefined,
      notes: notes ?? undefined,
      secret,
      agentAccessible: agent_accessible ?? false,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error('[vault] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vault item' },
      { status: 500 }
    );
  }
}
