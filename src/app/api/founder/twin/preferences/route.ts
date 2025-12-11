/**
 * Founder Twin Preferences API
 * Phase D01: Founder Cognitive Twin Kernel
 *
 * GET - List preferences
 * POST - Create or update preference (upsert by key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listPreferences,
  upsertPreference,
  getPreferencesByKeys,
  type PreferenceCategory,
} from '@/lib/founder/founderTwinService';

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
    const category = searchParams.get('category') as PreferenceCategory | null;
    const keys = searchParams.get('keys'); // Comma-separated list of keys

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // If specific keys requested, return just those values
    if (keys) {
      const keyList = keys.split(',').map((k) => k.trim());
      const values = await getPreferencesByKeys(tenantId, keyList);
      return NextResponse.json({ values });
    }

    // Otherwise return full preference objects
    const preferences = await listPreferences(tenantId, {
      category: category || undefined,
    });

    return NextResponse.json({
      preferences,
      count: preferences.length,
    });
  } catch (error) {
    console.error('Error in preferences GET:', error);
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
    const { tenantId, ...preferenceData } = body;

    if (!tenantId || !preferenceData.key || preferenceData.value === undefined) {
      return NextResponse.json(
        { error: 'tenantId, key, and value are required' },
        { status: 400 }
      );
    }

    const preference = await upsertPreference(tenantId, preferenceData, user.id);

    return NextResponse.json({ preference }, { status: 201 });
  } catch (error) {
    console.error('Error in preferences POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
