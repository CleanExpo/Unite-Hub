import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { strictRateLimit } from '@/lib/rate-limit'

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

export async function POST(request: NextRequest): Promise<NextResponse<InitializationResult>> {
  try {
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
        console.error('Token auth failed:', error);
        return NextResponse.json(
          {
            success: false,
            created: {
              profile: false,
              organization: false,
              userOrganization: false,
              workspace: false,
            },
            error: 'Not authenticated',
          },
          { status: 401 }
        );
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
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
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
        return NextResponse.json(
          {
            success: false,
            created: {
              profile: false,
              organization: false,
              userOrganization: false,
              workspace: false,
            },
            error: 'Not authenticated',
          },
          { status: 401 }
        );
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
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'User';

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        });

      if (profileError) {
        console.error('[initialize-user] Profile creation failed:', profileError);
        return NextResponse.json(
          {
            ...result,
            error: 'Failed to create profile',
            details: profileError,
          },
          { status: 500 }
        );
      }

      result.created.profile = true;
      console.log('[initialize-user] ✅ Profile created:', user.id);
    } else {
      console.log('[initialize-user] ✅ Profile already exists:', user.id);
    }

    // STEP 1b: Verify/Create Profiles record for role-based routing (idempotent)
    // The 'profiles' table is used by middleware for RBAC (separate from user_profiles)
    const { data: existingRoleProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingRoleProfile) {
      const { error: roleProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          role: 'CLIENT', // Default role for new users
        });

      if (roleProfileError) {
        console.error('[initialize-user] Role profile creation failed:', roleProfileError);
        // Non-blocking: log but continue - middleware will handle missing profiles gracefully
        console.warn('[initialize-user] ⚠️ Role profile not created, user will default to CLIENT role');
      } else {
        console.log('[initialize-user] ✅ Role profile created with CLIENT role:', user.id);
      }
    } else {
      console.log('[initialize-user] ✅ Role profile already exists:', user.id);
    }

    // STEP 2: Verify/Create Organization (idempotent)
    const { data: existingOrgs } = await supabase
      .from('user_organizations')
      .select('org_id, organizations(id, name)')
      .eq('user_id', user.id)
      .limit(1);

    let orgId: string;

    if (!existingOrgs || existingOrgs.length === 0) {
      // Create organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
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
        console.error('[initialize-user] Organization creation failed:', orgError);
        return NextResponse.json(
          {
            ...result,
            error: 'Failed to create organization',
            details: orgError,
          },
          { status: 500 }
        );
      }

      orgId = newOrg.id;
      result.created.organization = true;
      console.log('[initialize-user] ✅ Organization created:', orgId);

      // Link user to organization
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: user.id,
          org_id: orgId,
          role: 'owner',
          is_active: true,
        });

      if (userOrgError) {
        console.error('[initialize-user] User-org link failed:', userOrgError);
        return NextResponse.json(
          {
            ...result,
            data: { ...result.data, orgId },
            error: 'Failed to link user to organization',
            details: userOrgError,
          },
          { status: 500 }
        );
      }

      result.created.userOrganization = true;
      console.log('[initialize-user] ✅ User-org link created');
    } else {
      orgId = existingOrgs[0].org_id;
      console.log('[initialize-user] ✅ Organization already exists:', orgId);
    }

    result.data!.orgId = orgId;

    // STEP 3: Verify/Create Workspace (idempotent) - CRITICAL FIX
    const { data: existingWorkspaces } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('org_id', orgId)
      .limit(1);

    let workspaceId: string;

    if (!existingWorkspaces || existingWorkspaces.length === 0) {
      // Create workspace
      const { data: newWorkspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          org_id: orgId,
          name: 'Default Workspace',
        })
        .select('id')
        .single();

      if (workspaceError || !newWorkspace) {
        console.error('[initialize-user] Workspace creation failed:', workspaceError);
        // CRITICAL: Don't silently fail - return error
        return NextResponse.json(
          {
            ...result,
            error: 'Failed to create workspace',
            details: workspaceError,
          },
          { status: 500 }
        );
      }

      workspaceId = newWorkspace.id;
      result.created.workspace = true;
      console.log('[initialize-user] ✅ Workspace created:', workspaceId);
    } else {
      workspaceId = existingWorkspaces[0].id;
      console.log('[initialize-user] ✅ Workspace already exists:', workspaceId);
    }

    result.data!.workspaceId = workspaceId;

    // STEP 4: Create Trial Profile for new organizations (idempotent)
    if (result.created.organization) {
      // Check if trial profile already exists
      const { data: existingTrialProfile } = await supabase
        .from('trial_profiles')
        .select('id')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (!existingTrialProfile) {
        const trialStartedAt = new Date().toISOString();
        const trialExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

        const { error: trialError } = await supabase
          .from('trial_profiles')
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
          console.error('[initialize-user] Trial profile creation failed:', trialError);
          return NextResponse.json(
            {
              ...result,
              error: 'Failed to create trial profile',
              details: trialError,
            },
            { status: 500 }
          );
        }

        console.log('[initialize-user] ✅ Trial profile created for workspace:', workspaceId);
      } else {
        console.log('[initialize-user] ✅ Trial profile already exists for workspace:', workspaceId);
      }
    }

    // GROUND TRUTH VERIFICATION: Verify all entities exist
    const verification = await Promise.all([
      supabase.from('user_profiles').select('id').eq('id', user.id).single(),
      supabase.from('user_organizations').select('org_id').eq('user_id', user.id).eq('org_id', orgId).single(),
      supabase.from('workspaces').select('id').eq('id', workspaceId).eq('org_id', orgId).single(),
    ]);

    const [profileCheck, userOrgCheck, workspaceCheck] = verification;

    if (profileCheck.error || userOrgCheck.error || workspaceCheck.error) {
      console.error('[initialize-user] Verification failed:', {
        profile: profileCheck.error,
        userOrg: userOrgCheck.error,
        workspace: workspaceCheck.error,
      });
      return NextResponse.json(
        {
          ...result,
          error: 'Initialization completed but verification failed',
          details: {
            profileExists: !profileCheck.error,
            userOrgExists: !userOrgCheck.error,
            workspaceExists: !workspaceCheck.error,
          },
        },
        { status: 500 }
      );
    }

    result.success = true;
    console.log('[initialize-user] ✅ All entities verified:', result.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[initialize-user] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        created: {
          profile: false,
          organization: false,
          userOrganization: false,
          workspace: false,
        },
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
