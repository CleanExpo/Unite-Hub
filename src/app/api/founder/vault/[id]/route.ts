/**
 * GET    /api/founder/vault/[id]  — fetch item metadata (no secret)
 * PUT    /api/founder/vault/[id]  — update metadata and/or secret
 * DELETE /api/founder/vault/[id]  — delete item and vault secret
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  listVaultItems,
  updateVaultItem,
  deleteVaultItem,
  type VaultCategory,
} from '@/lib/security/founder-vault';

type RouteParams = { params: Promise<{ id: string }> };

// ─── GET — fetch metadata for a single item ───────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 });
    }

    // listVaultItems with a single-item filter is the cleanest read-only path
    const items = await listVaultItems(user.id);
    const item = items.find((i) => i.id === id);

    if (!item) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('[vault/[id]] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vault item' },
      { status: 500 }
    );
  }
}

// ─── PUT — update metadata and/or secret ─────────────────────────────────────

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { label, url, notes, category, business_id, secret } = body;

    const validCategories: VaultCategory[] = ['login', 'api-key', 'banking', 'licence', 'other'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const updatedItem = await updateVaultItem(id, user.id, {
      label,
      url,
      notes,
      category,
      businessId: business_id,
      secret,
    });

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('[vault/[id]] PUT error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update vault item';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── DELETE — remove item and vault secret ────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 });
    }

    await deleteVaultItem(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[vault/[id]] DELETE error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete vault item';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
