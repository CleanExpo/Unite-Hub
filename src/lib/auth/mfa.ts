/**
 * Multi-Factor Authentication (MFA) Utilities
 *
 * Provides TOTP-based MFA using Supabase's built-in MFA support.
 * Supports enrollment, verification, recovery codes, and unenrollment.
 *
 * @see https://supabase.com/docs/guides/auth/auth-mfa
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * MFA enrollment status
 */
export interface MFAStatus {
  enabled: boolean;
  enrolledFactors: Array<{
    id: string;
    type: 'totp';
    status: 'verified' | 'unverified';
    friendlyName?: string;
  }>;
}

/**
 * MFA enrollment result
 */
export interface MFAEnrollmentResult {
  success: boolean;
  qrCodeUrl?: string;
  secret?: string;
  factorId?: string;
  error?: string;
}

/**
 * MFA verification result
 */
export interface MFAVerificationResult {
  success: boolean;
  recoveryCodes?: string[];
  error?: string;
}

/**
 * Recovery codes result
 */
export interface RecoveryCodesResult {
  success: boolean;
  codes?: string[];
  error?: string;
}

// =====================================================
// CLIENT-SIDE MFA OPERATIONS
// =====================================================

/**
 * Start MFA enrollment (client-side)
 * Returns QR code URL and secret for authenticator app setup
 */
export async function enrollMFA(
  friendlyName = 'Authenticator App'
): Promise<MFAEnrollmentResult> {
  try {
    const supabase = createBrowserClient();

    // Ensure user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Enroll a new TOTP factor
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Failed to enroll MFA factor',
      };
    }

    return {
      success: true,
      qrCodeUrl: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify MFA enrollment with TOTP code (client-side)
 * Must be called after enrollMFA to complete setup
 */
export async function verifyMFAEnrollment(
  factorId: string,
  code: string
): Promise<MFAVerificationResult> {
  try {
    const supabase = createBrowserClient();

    // Challenge and verify the factor
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId,
      });

    if (challengeError || !challengeData) {
      return {
        success: false,
        error: challengeError?.message || 'Failed to create challenge',
      };
    }

    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Generate recovery codes after successful enrollment
    const recoveryResult = await generateRecoveryCodes();

    return {
      success: true,
      recoveryCodes: recoveryResult.codes,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify MFA challenge during login (client-side)
 * Used when user logs in with MFA enabled
 */
export async function verifyMFAChallenge(
  factorId: string,
  code: string
): Promise<MFAVerificationResult> {
  try {
    const supabase = createBrowserClient();

    // Create a challenge
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId,
      });

    if (challengeError || !challengeData) {
      return {
        success: false,
        error: challengeError?.message || 'Failed to create challenge',
      };
    }

    // Verify the code
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unenroll MFA factor (client-side)
 * Disables MFA for the user
 */
export async function unenrollMFA(factorId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createBrowserClient();

    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get MFA status for current user (client-side)
 */
export async function getMFAStatus(): Promise<MFAStatus> {
  try {
    const supabase = createBrowserClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        enabled: false,
        enrolledFactors: [],
      };
    }

    // Get all enrolled factors
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      console.error('Error fetching MFA status:', error);
      return {
        enabled: false,
        enrolledFactors: [],
      };
    }

    const totpFactors = (data?.totp || []).map((factor) => ({
      id: factor.id,
      type: 'totp' as const,
      status: factor.status as 'verified' | 'unverified',
      friendlyName: factor.friendly_name,
    }));

    return {
      enabled: totpFactors.some((f) => f.status === 'verified'),
      enrolledFactors: totpFactors,
    };
  } catch (error) {
    console.error('Error in getMFAStatus:', error);
    return {
      enabled: false,
      enrolledFactors: [],
    };
  }
}

/**
 * Generate recovery codes (client-side)
 * Recovery codes are one-time use backup codes
 *
 * NOTE: Supabase doesn't have built-in recovery code generation.
 * This is a placeholder implementation. In production, you would:
 * 1. Generate codes server-side
 * 2. Store hashed versions in database
 * 3. Display unhashed codes to user once
 */
export async function generateRecoveryCodes(): Promise<RecoveryCodesResult> {
  try {
    const supabase = createBrowserClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Call API route to generate recovery codes
    const response = await fetch('/api/auth/mfa/recovery-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to generate recovery codes',
      };
    }

    const data = await response.json();

    return {
      success: true,
      codes: data.codes,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify recovery code (client-side)
 * Used to bypass MFA when user loses access to authenticator app
 */
export async function verifyRecoveryCode(code: string): Promise<MFAVerificationResult> {
  try {
    // Call API route to verify recovery code
    const response = await fetch('/api/auth/mfa/verify-recovery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Invalid recovery code',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// SERVER-SIDE MFA OPERATIONS
// =====================================================

/**
 * Get MFA status for user (server-side)
 * Used in API routes and Server Components
 */
export async function getMFAStatusServer(userId: string): Promise<MFAStatus> {
  try {
    const supabase = await createServerClient();

    // Get user's MFA factors from auth.mfa_factors table
    const { data, error } = await supabase
      .from('auth.mfa_factors')
      .select('*')
      .eq('user_id', userId)
      .eq('factor_type', 'totp');

    if (error) {
      console.error('Error fetching MFA status:', error);
      return {
        enabled: false,
        enrolledFactors: [],
      };
    }

    const factors = (data || []).map((factor: any) => ({
      id: factor.id,
      type: 'totp' as const,
      status: factor.status as 'verified' | 'unverified',
      friendlyName: factor.friendly_name,
    }));

    return {
      enabled: factors.some((f) => f.status === 'verified'),
      enrolledFactors: factors,
    };
  } catch (error) {
    console.error('Error in getMFAStatusServer:', error);
    return {
      enabled: false,
      enrolledFactors: [],
    };
  }
}

/**
 * Check if user has MFA enabled (server-side helper)
 */
export async function hasMFAEnabled(userId: string): Promise<boolean> {
  const status = await getMFAStatusServer(userId);
  return status.enabled;
}
