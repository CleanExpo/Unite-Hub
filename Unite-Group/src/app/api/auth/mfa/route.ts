import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { 
  generateMFASetup, 
  enableMFA, 
  verifyMFA, 
  disableMFA, 
  generateNewBackupCodes 
} from '@/lib/auth/mfa/service';

/**
 * POST /api/auth/mfa/setup
 * Generate MFA setup for a user
 */
export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user;
    
    // Generate MFA setup
    const setupResult = await generateMFASetup(user.id, user.email || '');

    if (!setupResult.success) {
      return NextResponse.json(
        { error: setupResult.message || 'Failed to generate MFA setup' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      secret: setupResult.secret,
      qrCodeUrl: setupResult.qrCodeUrl
    });
  } catch (error: any) {
    console.error('MFA setup error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/mfa/enable
 * Enable MFA for a user
 */
export async function PUT(request: NextRequest) {
  try {
    // Get the current session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user;
    
    // Parse request body
    const body = await request.json();
    const { secret, token } = body;

    if (!secret || !token) {
      return NextResponse.json(
        { error: 'Secret and token are required' },
        { status: 400 }
      );
    }

    // Enable MFA
    const result = await enableMFA(user.id, secret, token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to enable MFA' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error: any) {
    console.error('Enable MFA error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/mfa/verify
 * Verify MFA token during login
 */
export async function PATCH(request: NextRequest) {
  try {
    // For verification during login, we need to handle the case
    // where the user is partially authenticated (after password)
    // but before MFA verification
    
    // Parse request body
    const body = await request.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'User ID and token are required' },
        { status: 400 }
      );
    }

    // Verify MFA
    const result = await verifyMFA(userId, token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Invalid verification code' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error: any) {
    console.error('Verify MFA error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/mfa
 * Disable MFA for a user
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the current session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user;
    
    // Disable MFA
    const result = await disableMFA(user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to disable MFA' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error: any) {
    console.error('Disable MFA error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Route handler for generating new backup codes
 * Path: /api/auth/mfa/backup-codes
 */
export const GET = async (request: NextRequest) => {
  try {
    // Get the current session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user;
    
    // Generate new backup codes
    const result = await generateNewBackupCodes(user.id);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate backup codes' },
        { status: 400 }
      );
    }

    return NextResponse.json({ backupCodes: result.codes });
  } catch (error: any) {
    console.error('Generate backup codes error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
};
