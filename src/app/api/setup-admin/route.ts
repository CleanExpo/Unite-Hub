import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function handlePOST(req, userId) (req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // For security, only allow this in development or if specifically enabled
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_SETUP !== 'true') {
      return NextResponse.json({ 
        error: 'Admin setup not allowed in production' 
      }, { status: 403 });
    }

    const { email, password, firstName, lastName } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ 
        error: 'Email, password, firstName and lastName are required' 
      }, { status: 400 });
    }

    // Create the user with admin privileges using service role
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create/update the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Continue even if profile creation fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName,
        lastName
      }
    });

  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export const POST = withApiAuth(handlePOST);