import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      // Not authenticated - this is OK, just return early (don't error)
      return NextResponse.json(
        { message: 'Not authenticated, skipping initialization' },
        { status: 200 }
      )
    }

    // Check if user profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      // Extract name from user metadata (Google OAuth provides this)
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'User'

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to create profile', details: profileError },
          { status: 500 }
        )
      }
    }

    // Check if user has any organizations
    const { data: existingOrgs } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (!existingOrgs || existingOrgs.length === 0) {
      // Create a default organization for the user
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: `${user.user_metadata?.full_name || user.email?.split('@')[0]}'s Organization`,
          email: user.email!,
          plan: 'starter',
          status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        })
        .select('id')
        .single()

      if (orgError || !newOrg) {
        console.error('Error creating organization:', orgError)
        return NextResponse.json(
          { error: 'Failed to create organization', details: orgError },
          { status: 500 }
        )
      }

      // Link user to the new organization as owner
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: user.id,
          org_id: newOrg.id,
          role: 'owner',
          is_active: true
        })

      if (userOrgError) {
        console.error('Error linking user to organization:', userOrgError)
        return NextResponse.json(
          { error: 'Failed to link user to organization', details: userOrgError },
          { status: 500 }
        )
      }

      // Create a default workspace for the organization
      const { error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          org_id: newOrg.id,
          name: 'Default Workspace',
          description: 'Your main workspace'
        })

      if (workspaceError) {
        console.error('Error creating workspace:', workspaceError)
        // Don't fail the whole request if workspace creation fails
      }

      // Initialize onboarding for new user
      const { error: onboardingError } = await supabase
        .from('user_onboarding')
        .insert({
          user_id: user.id,
          current_step: 1,
          onboarding_data: {}
        })

      if (onboardingError) {
        console.error('Error creating onboarding record:', onboardingError)
        // Don't fail the whole request if onboarding creation fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in initialize-user:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
