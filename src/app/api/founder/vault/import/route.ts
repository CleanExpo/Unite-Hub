/**
 * POST /api/founder/vault/import — batch import credentials from CSV data
 *
 * Body: { items: Array<{ label, secret, category?, business_id?, url?, tags?, agent_accessible? }> }
 * Returns: { imported: number, skipped: number, errors: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createVaultItem, type VaultCategory } from '@/lib/security/founder-vault';

const VALID_CATEGORIES: VaultCategory[] = ['login', 'api-key', 'banking', 'licence', 'other'];

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 });
    }

    if (items.length > 200) {
      return NextResponse.json({ error: 'Maximum 200 items per import' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        const label = item.label?.trim();
        const secret = item.secret?.trim();

        if (!label || !secret) {
          skipped++;
          continue;
        }

        const category: VaultCategory = VALID_CATEGORIES.includes(item.category)
          ? item.category
          : 'login';

        await createVaultItem({
          ownerId: user.id,
          businessId: item.business_id || 'unite-group',
          category,
          label,
          url: item.url || undefined,
          notes: item.notes || undefined,
          secret,
        });

        imported++;
      } catch (err) {
        const label = item.label || 'unknown';
        errors.push(`Failed to import "${label}": ${err instanceof Error ? err.message : 'unknown error'}`);
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/founder/vault/import]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
