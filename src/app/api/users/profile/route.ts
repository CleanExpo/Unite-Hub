import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// REAL USER PROFILE API - NO MOCK DATA
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        role,
        department,
        location,
        timezone,
        bio,
        website,
        phone,
        email_notifications,
        push_notifications,
        sms_notifications,
        two_factor_enabled,
        created_at,
        updated_at
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError.message },
        { status: 500 }
      );
    }

    // Combine auth user data with profile data
    const userProfile = {
      id: user.id,
      name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      email: user.email,
      phone: profile?.phone || user.phone || null,
      avatar: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      role: profile?.role || 'Member',
      department: profile?.department || null,
      location: profile?.location || null,
      timezone: profile?.timezone || 'America/Los_Angeles',
      bio: profile?.bio || null,
      website: profile?.website || null,
      notifications: {
        email: profile?.email_notifications ?? true,
        push: profile?.push_notifications ?? true,
        sms: profile?.sms_notifications ?? false
      },
      twoFactor: profile?.two_factor_enabled ?? false,
      createdAt: profile?.created_at || user.created_at,
      updatedAt: profile?.updated_at || user.updated_at
    };

    return NextResponse.json({
      data: userProfile
    });

  } catch (error) {
    console.error('Unexpected error in user profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Prepare profile update data
    const profileData = {
      full_name: body.name?.trim() || null,
      phone: body.phone?.trim() || null,
      role: body.role?.trim() || null,
      department: body.department?.trim() || null,
      location: body.location?.trim() || null,
      timezone: body.timezone || null,
      bio: body.bio?.trim() || null,
      website: body.website?.trim() || null,
      email_notifications: body.notifications?.email ?? true,
      push_notifications: body.notifications?.push ?? true,
      sms_notifications: body.notifications?.sms ?? false,
      two_factor_enabled: body.twoFactor ?? false,
      updated_at: new Date().toISOString()
    };

    // Update or insert profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert([{ 
        id: user.id, 
        ...profileData 
      }])
      .select()
      .single();

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update user profile', details: profileError.message },
        { status: 500 }
      );
    }

    // Update auth metadata if name changed
    if (body.name && body.name !== user.user_metadata?.full_name) {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: body.name }
      });
      
      if (metadataError) {
        console.warn('Failed to update auth metadata:', metadataError);
      }
    }

    return NextResponse.json({
      data: profile,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error in profile update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
