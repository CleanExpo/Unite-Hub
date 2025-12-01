/* eslint-disable @typescript-eslint/no-explicit-any, no-undef */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { strictRateLimit } from '@/lib/rate-limit'
import { withErrorBoundary } from '@/lib/errors/boundaries'
import { AuthenticationError, DatabaseError, successResponse } from '@/lib/errors/boundaries'

/**
 * User Initialization API - Evaluator-Optimizer Pattern
 *
 * This endpoint follows the "Building Effective Agents" principles:
 * 1. Simple, composable functions (not complex frameworks)
 * 2. Ground truth verification at each step
 * 3. Idempotent (can be called multiple times safely)
 * 4. Returns detailed status of what was created/verified
 */

interface InitializationResult {
  success: boolean;
  created: {
    profile: boolean;
    organization: boolean;
    userOrganization: boolean;
    workspace: boolean;
  };
  data?: {
    userId: string;
    orgId?: string;
    workspaceId?: string;
  };
  error?: string;
  details?: any;
}

export const POST = withErrorBoundary(async (request: NextRequest) => {
  // Apply strict rate limiting (10 requests per 15 minutes for auth endpoints)
  const rateLimitResult = await strictRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Check for Authorization header (implicit OAuth flow)
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  let supabase;
  let user;

  if (token) {
    // Use browser client approach for implicit OAuth tokens
    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      throw new AuthenticationError('Invalid or expired authentication token');
    }

    user = data.user;

    // CRITICAL FIX: Use service role to bypass RLS for initialization
    // User-authenticated clients are blocked by RLS policies during INSERT
    const { getSupabaseAdmin } = await import('@/lib/supabase');
    supabase = getSupabaseAdmin();
  } else {
    // Fallback to cookie-based auth (PKCE flow)
    const cookieStore = await cookies();

    const cookieClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user: cookieUser }, error: userError } = await cookieClient.auth.getUser();

    if (userError || !cookieUser) {
      throw new AuthenticationError('Authentication required');
    }

    user = cookieUser;

    // CRITICAL FIX: Use service role to bypass RLS for initialization
    const { getSupabaseAdmin } = await import('@/lib/supabase');
    supabase = getSupabaseAdmin();
  }

  // Track what we create for ground truth verification
  const result: InitializationResult = {
    success: false,
    created: {
      profile: false,
      organization: false,
      userOrganization: false,
      workspace: false,
    },
    data: {
      userId: user.id,
    },
  };

  // STEP 1: Verify/Create Profile (idempotent)
  const { data: existingProfile } = await (supabase
    .from('user_profiles') as any)
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!existingProfile) {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User';

    const { error: profileError } = await (supabase
      .from('user_profiles') as any)
      .insert({
        id: user.id,
        email: user.email!,
        full_name: fullName,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      });

    if (profileError) {
      throw new DatabaseError('Failed to create user profile');
    }

    result.created.profile = true;
  }

  // STEP 1b: Verify/Create Profiles record for role-based routing (idempotent)
  // The 'profiles' table is used by middleware for RBAC (separate from user_profiles)
  const { data: existingRoleProfile } = await (supabase
    .from('profiles') as any)
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!existingRoleProfile) {
    const { error: roleProfileError } = await (supabase
      .from('profiles') as any)
      .insert({
        id: user.id,
        email: user.email!,
        role: 'CLIENT', // Default role for new users
      });

    if (roleProfileError) {
      // Non-blocking: role profile creation is best-effort
      // Middleware will handle missing profiles gracefully
    }
  }

  // STEP 2: Verify/Create Organization (idempotent)
  const { data: existingOrgs } = await (supabase
    .from('user_organizations') as any)
    .select('org_id, organizations(id, name)')
    .eq('user_id', user.id)
    .limit(1);

  let orgId: string;

  if (!existingOrgs || existingOrgs.length === 0) {
    // Create organization
    const { data: newOrg, error: orgError } = await (supabase
      .from('organizations') as any)
      .insert({
        name: `${user.user_metadata?.full_name || user.email?.split('@')[0]}'s Organization`,
        email: user.email!,
        plan: 'starter',
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single();

    if (orgError || !newOrg) {
      throw new DatabaseError('Failed to create organization');
    }

    orgId = newOrg.id;
    result.created.organization = true;

    // Link user to organization
    const { error: userOrgError } = await (supabase
      .from('user_organizations') as any)
      .insert({
        user_id: user.id,
        org_id: orgId,
        role: 'owner',
        is_active: true,
      });

    if (userOrgError) {
      throw new DatabaseError('Failed to link user to organization');
    }

    result.created.userOrganization = true;
  } else {
    orgId = existingOrgs[0].org_id;
  }

  result.data!.orgId = orgId;

  // STEP 3: Verify/Create Workspace (idempotent) - CRITICAL FIX
  const { data: existingWorkspaces } = await (supabase
    .from('workspaces') as any)
    .select('id, name')
    .eq('org_id', orgId)
    .limit(1);

  let workspaceId: string;

  if (!existingWorkspaces || existingWorkspaces.length === 0) {
    // Create workspace
    const { data: newWorkspace, error: workspaceError } = await (supabase
      .from('workspaces') as any)
      .insert({
        org_id: orgId,
        name: 'Default Workspace',
      })
      .select('id')
      .single();

    if (workspaceError || !newWorkspace) {
      throw new DatabaseError('Failed to create workspace');
    }

    workspaceId = newWorkspace.id;
    result.created.workspace = true;
  } else {
    workspaceId = existingWorkspaces[0].id;
  }

  result.data!.workspaceId = workspaceId;

  // STEP 4: Create Trial Profile for new organizations (idempotent)
  if (result.created.organization) {
    // Check if trial profile already exists
    const { data: existingTrialProfile } = await (supabase
      .from('trial_profiles') as any)
      .select('id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (!existingTrialProfile) {
      const trialStartedAt = new Date().toISOString();
      const trialExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const { error: trialError } = await (supabase
        .from('trial_profiles') as any)
        .insert({
          workspace_id: workspaceId,
          is_trial: true,
          trial_started_at: trialStartedAt,
          trial_expires_at: trialExpiresAt,
          trial_ended_at: null,
          trial_converted_at: null,
          ai_tokens_cap: 50000,
          ai_tokens_used: 0,
          vif_generations_cap: 10,
          vif_generations_used: 0,
          blueprints_cap: 5,
          blueprints_created: 0,
          production_jobs_cap: 0,
          production_jobs_created: 0,
          enabled_modules: [
            'website_audit',
            'brand_persona',
            'initial_roadmap',
            'analytics_readonly',
            'topic_relevance',
          ],
          limited_modules: ['blueprinter', 'founder_ops', 'content_generation'],
          disabled_modules: [
            'high_volume_campaigns',
            'automated_weekly',
            'cross_brand_orchestration',
            'timestamped_production',
            'living_intelligence',
          ],
          upgrade_prompt_shown_count: 0,
          upgrade_prompt_dismissed_count: 0,
          last_upgrade_prompt_at: null,
        });

      if (trialError) {
        throw new DatabaseError('Failed to create trial profile');
      }
    }
  }

  // GROUND TRUTH VERIFICATION: Verify all entities exist
  const verification = await Promise.all([
    (supabase.from('user_profiles') as any).select('id').eq('id', user.id).single(),
    (supabase.from('user_organizations') as any).select('org_id').eq('user_id', user.id).eq('org_id', orgId).single(),
    (supabase.from('workspaces') as any).select('id').eq('id', workspaceId).eq('org_id', orgId).single(),
  ]);

  const [profileCheck, userOrgCheck, workspaceCheck] = verification;

  if (profileCheck.error || userOrgCheck.error || workspaceCheck.error) {
    throw new DatabaseError('Initialization completed but verification failed');
  }

  result.success = true;

  return successResponse(result, 200);
});
