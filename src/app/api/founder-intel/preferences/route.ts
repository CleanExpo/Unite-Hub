/**
 * Founder Intel Preferences API
 * Phase 80: Get and update founder preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  getPreferencesForUser,
  upsertPreferences,
} from '@/lib/founderIntel/founderIntelPreferenceService';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await getPreferencesForUser(user.id);

    if (!preferences) {
      return NextResponse.json(
        { error: 'Failed to get preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Preferences fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Auth check
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { risk_thresholds, opportunity_preferences, briefing_schedule, mute_rules } = body;

    const preferences = await upsertPreferences(user.id, {
      risk_thresholds,
      opportunity_preferences,
      briefing_schedule,
      mute_rules,
    });

    if (!preferences) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
