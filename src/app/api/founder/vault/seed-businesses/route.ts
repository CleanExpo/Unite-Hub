/**
 * POST /api/founder/vault/seed-businesses
 * Creates initial vault placeholder entries for all 6 businesses
 * Skips businesses that already have vault items
 */
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createVaultItem } from '@/lib/security/founder-vault';

const BUSINESSES = [
  { id: 'disaster-recovery', label: 'Disaster Recovery' },
  { id: 'restore-assist', label: 'RestoreAssist' },
  { id: 'ato', label: 'ATO Compliance' },
  { id: 'nrpg', label: 'NRPG' },
  { id: 'unite-group', label: 'Unite-Group' },
  { id: 'carsi', label: 'CARSI' },
];

const CREDENTIAL_TEMPLATES: { category: 'login' | 'api-key' | 'banking' | 'licence' | 'other'; label: string }[] = [
  { category: 'other', label: 'ABN' },
  { category: 'banking', label: 'Business Bank Account' },
  { category: 'api-key', label: 'Google Analytics ID' },
  { category: 'login', label: 'Social Media — Facebook' },
  { category: 'login', label: 'Social Media — Instagram' },
  { category: 'login', label: 'Social Media — LinkedIn' },
  { category: 'login', label: 'Domain registrar login' },
  { category: 'login', label: 'Hosting credentials' },
];

export async function POST() {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 });
    }

    // Check existing items per business
    const { data: existingItems, error: fetchError } = await supabase
      .from('founder_vault_items')
      .select('business_id')
      .eq('owner_id', user.id);

    if (fetchError) throw fetchError;

    const existingBusinesses = new Set(
      (existingItems ?? []).map((item: { business_id: string }) => item.business_id),
    );

    let created = 0;
    const skipped: string[] = [];

    for (const business of BUSINESSES) {
      if (existingBusinesses.has(business.id)) {
        skipped.push(business.label);
        continue;
      }

      for (const template of CREDENTIAL_TEMPLATES) {
        await createVaultItem({
          ownerId: user.id,
          businessId: business.id,
          category: template.category,
          label: `${business.label} — ${template.label}`,
          secret: 'TO_BE_SET',
          notes: `Placeholder — update with actual ${template.label} for ${business.label}`,
          agentAccessible: false,
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      message: `Created ${created} placeholder credentials. ${skipped.length > 0 ? `Skipped (already seeded): ${skipped.join(', ')}` : ''}`,
    });
  } catch (error) {
    console.error('[vault/seed-businesses] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed business vault' },
      { status: 500 },
    );
  }
}
