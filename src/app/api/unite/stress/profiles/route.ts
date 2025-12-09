/**
 * Stress Test Profiles API
 * Phase: D71 - Unite System Stress-Test Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createStressProfile,
  listStressProfiles,
  getStressProfile,
  updateStressProfile,
  deleteStressProfile,
  type StressProfile,
} from '@/lib/unite/stressTestService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user_organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const profileId = request.nextUrl.searchParams.get('profile_id');

    // Get single profile
    if (profileId) {
      const profile = await getStressProfile(profileId);
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      // Verify tenant access
      if (profile.tenant_id && profile.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ profile });
    }

    // List profiles with filters
    const filters = {
      tenant_id: tenantId,
      target_system: request.nextUrl.searchParams.get('target_system') || undefined,
      is_active: request.nextUrl.searchParams.get('is_active') === 'true' || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const profiles = await listStressProfiles(filters);
    return NextResponse.json({ profiles });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user_organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const body = await request.json();
    const {
      action,
      profile_id,
      name,
      description,
      target_system,
      load_pattern,
      duration_seconds,
      concurrent_users,
      ramp_up_seconds,
      is_active,
    } = body;

    // Create profile
    if (action === 'create') {
      if (!name || !target_system || !load_pattern || !duration_seconds || !concurrent_users) {
        return NextResponse.json(
          {
            error:
              'name, target_system, load_pattern, duration_seconds, and concurrent_users are required',
          },
          { status: 400 }
        );
      }

      const profile = await createStressProfile({
        name,
        description,
        target_system,
        load_pattern,
        duration_seconds,
        concurrent_users,
        ramp_up_seconds,
        tenant_id: tenantId,
        is_active: is_active !== undefined ? is_active : true,
      });

      return NextResponse.json({ profile }, { status: 201 });
    }

    // Update profile
    if (action === 'update') {
      if (!profile_id) {
        return NextResponse.json(
          { error: 'profile_id is required for update' },
          { status: 400 }
        );
      }

      // Verify tenant access
      const existing = await getStressProfile(profile_id);
      if (!existing) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      if (existing.tenant_id && existing.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updates: Partial<Omit<StressProfile, 'id' | 'created_at' | 'updated_at'>> = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (target_system) updates.target_system = target_system;
      if (load_pattern) updates.load_pattern = load_pattern;
      if (duration_seconds) updates.duration_seconds = duration_seconds;
      if (concurrent_users) updates.concurrent_users = concurrent_users;
      if (ramp_up_seconds !== undefined) updates.ramp_up_seconds = ramp_up_seconds;
      if (is_active !== undefined) updates.is_active = is_active;

      const profile = await updateStressProfile(profile_id, updates);
      return NextResponse.json({ profile });
    }

    // Delete profile
    if (action === 'delete') {
      if (!profile_id) {
        return NextResponse.json(
          { error: 'profile_id is required for delete' },
          { status: 400 }
        );
      }

      // Verify tenant access
      const existing = await getStressProfile(profile_id);
      if (!existing) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      if (existing.tenant_id && existing.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await deleteStressProfile(profile_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process profile operation' },
      { status: 500 }
    );
  }
}
