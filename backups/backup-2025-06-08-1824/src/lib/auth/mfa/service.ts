import { generateSecret, validateTOTP } from './totp';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Number of backup codes to generate
const BACKUP_CODES_COUNT = 10;

/**
 * Types for MFA functionality
 */
export interface MFAUser {
  id: string;
  email: string;
  mfa_secret?: string | null;
  mfa_enabled?: boolean;
  mfa_verified?: boolean;
  mfa_backup_codes?: string[] | null;
  last_mfa_login?: string | null;
}

export interface MFASetupResult {
  secret: string;
  qrCodeUrl: string;
  success: boolean;
  message?: string;
}

export interface MFAVerifyResult {
  success: boolean;
  message?: string;
}

export interface MFABackupCodes {
  codes: string[];
}

/**
 * Generate a new MFA setup for a user
 * @param userId User ID
 * @param userEmail User email for QR code setup
 * @returns Setup information including secret and QR code URL
 */
export async function generateMFASetup(userId: string, userEmail: string): Promise<MFASetupResult> {
  try {
    // Check if user already has MFA enabled
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('mfa_enabled, mfa_secret')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }

    // If MFA is already enabled, don't allow regenerating
    if (user && user.mfa_enabled) {
      return {
        secret: '',
        qrCodeUrl: '',
        success: false,
        message: 'MFA is already enabled for this user. Disable it first to set up again.'
      };
    }

    // Generate a new secret
    const secret = generateSecret();
    
    // Generate QR code URL
    const qrCodeUrl = `otpauth://totp/UNITE%20Group:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=UNITE%20Group&algorithm=SHA1&digits=6&period=30`;

    return {
      secret,
      qrCodeUrl,
      success: true
    };
  } catch (error: any) {
    console.error('Error generating MFA setup:', error);
    return {
      secret: '',
      qrCodeUrl: '',
      success: false,
      message: `Error generating MFA setup: ${error.message}`
    };
  }
}

/**
 * Enable MFA for a user after they've verified their setup
 * @param userId User ID
 * @param secret TOTP secret
 * @param token Verification token from authenticator app
 * @returns Result of enabling MFA
 */
export async function enableMFA(userId: string, secret: string, token: string): Promise<MFAVerifyResult> {
  try {
    // Verify the token first
    const isValid = validateTOTP(token, secret);
    
    if (!isValid) {
      return {
        success: false,
        message: 'Invalid verification code. Please try again.'
      };
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    
    // Store the hashed backup codes
    const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

    // Update the user record
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        mfa_secret: secret,
        mfa_enabled: true,
        mfa_verified: true,
        mfa_backup_codes: hashedBackupCodes
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to enable MFA: ${error.message}`);
    }

    // Log the security event
    await logSecurityEvent(userId, 'mfa_enabled', {
      method: 'totp'
    });

    return {
      success: true,
      message: 'MFA has been enabled successfully.'
    };
  } catch (error: any) {
    console.error('Error enabling MFA:', error);
    return {
      success: false,
      message: `Error enabling MFA: ${error.message}`
    };
  }
}

/**
 * Verify MFA during login
 * @param userId User ID
 * @param token TOTP token or backup code
 * @returns Result of verification
 */
export async function verifyMFA(userId: string, token: string): Promise<MFAVerifyResult> {
  try {
    // Get the user's MFA information
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('mfa_secret, mfa_enabled, mfa_backup_codes')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }

    if (!user || !user.mfa_enabled || !user.mfa_secret) {
      return {
        success: false,
        message: 'MFA is not enabled for this user.'
      };
    }

    // First, try TOTP validation
    const isValidTOTP = validateTOTP(token, user.mfa_secret);
    
    // If TOTP validation fails, try backup code
    let usedBackupCode = false;
    let isValidBackupCode = false;
    
    if (!isValidTOTP && user.mfa_backup_codes && Array.isArray(user.mfa_backup_codes)) {
      const hashedToken = hashBackupCode(token);
      const backupCodes = user.mfa_backup_codes as string[];
      
      const backupCodeIndex = backupCodes.indexOf(hashedToken);
      isValidBackupCode = backupCodeIndex !== -1;
      
      // If a valid backup code was used, remove it
      if (isValidBackupCode) {
        usedBackupCode = true;
        const updatedBackupCodes = [...backupCodes];
        updatedBackupCodes.splice(backupCodeIndex, 1);
        
        // Update backup codes in the database
        await supabaseAdmin
          .from('users')
          .update({
            mfa_backup_codes: updatedBackupCodes
          })
          .eq('id', userId);
      }
    }

    if (!isValidTOTP && !isValidBackupCode) {
      // Log failed verification
      await logSecurityEvent(userId, 'mfa_verification_failed', {
        method: 'totp'
      });
      
      return {
        success: false,
        message: 'Invalid verification code or backup code.'
      };
    }

    // Update last MFA login timestamp
    await supabaseAdmin
      .from('users')
      .update({
        last_mfa_login: new Date().toISOString()
      })
      .eq('id', userId);

    // Log the successful verification
    await logSecurityEvent(userId, 'mfa_verification_success', {
      method: usedBackupCode ? 'backup_code' : 'totp'
    });

    return {
      success: true,
      message: usedBackupCode 
        ? 'Backup code verification successful. This code has been used and is no longer valid.'
        : 'Verification successful.'
    };
  } catch (error: any) {
    console.error('Error verifying MFA:', error);
    return {
      success: false,
      message: `Error verifying MFA: ${error.message}`
    };
  }
}

/**
 * Disable MFA for a user
 * @param userId User ID
 * @returns Result of disabling MFA
 */
export async function disableMFA(userId: string): Promise<MFAVerifyResult> {
  try {
    // Update the user record
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        mfa_secret: null,
        mfa_enabled: false,
        mfa_verified: false,
        mfa_backup_codes: null
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to disable MFA: ${error.message}`);
    }

    // Log the security event
    await logSecurityEvent(userId, 'mfa_disabled', {});

    return {
      success: true,
      message: 'MFA has been disabled successfully.'
    };
  } catch (error: any) {
    console.error('Error disabling MFA:', error);
    return {
      success: false,
      message: `Error disabling MFA: ${error.message}`
    };
  }
}

/**
 * Generate new backup codes for a user
 * @param userId User ID
 * @returns New backup codes
 */
export async function generateNewBackupCodes(userId: string): Promise<MFABackupCodes | null> {
  try {
    // Check if user has MFA enabled
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('mfa_enabled')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }

    if (!user || !user.mfa_enabled) {
      return null;
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    
    // Store the hashed backup codes
    const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

    // Update the user record
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        mfa_backup_codes: hashedBackupCodes
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update backup codes: ${error.message}`);
    }

    // Log the security event
    await logSecurityEvent(userId, 'backup_codes_regenerated', {});

    return { codes: backupCodes };
  } catch (error: any) {
    console.error('Error generating backup codes:', error);
    return null;
  }
}

/**
 * Generate random backup codes
 * @returns Array of backup codes
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    // Generate an 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex');
    codes.push(code);
  }
  
  return codes;
}

/**
 * Hash a backup code for secure storage
 * @param code Backup code
 * @returns Hashed backup code
 */
function hashBackupCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code.trim().toLowerCase())
    .digest('hex');
}

/**
 * Log a security event
 * @param userId User ID
 * @param action Security action
 * @param details Additional details
 */
async function logSecurityEvent(
  userId: string,
  action: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    await supabaseAdmin
      .from('security_audit_log')
      .insert({
        user_id: userId,
        action,
        details,
        // IP and user agent would normally come from the request
        // but we're keeping this simple for now
        ip_address: 'system',
        user_agent: 'system'
      });
  } catch (error) {
    console.error('Error logging security event:', error);
    // Don't throw - we don't want to fail the operation due to logging issues
  }
}
