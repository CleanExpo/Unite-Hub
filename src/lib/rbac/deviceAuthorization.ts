import { getSupabaseServer } from '@/lib/supabase';
import { createHash } from 'crypto';

/**
 * Generate device fingerprint based on user agent and IP
 */
export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  const combined = `${userAgent}:${ip}`;
  return createHash('sha256').update(combined).digest('hex');
}

/**
 * Check if device is trusted for admin access
 */
export async function isDeviceTrusted(
  userId: string,
  deviceFingerprint: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { data: device } = await supabase
      .from('admin_trusted_devices')
      .select('id, is_trusted, expires_at')
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceFingerprint)
      .single();

    if (!device) {
      return false;
    }

    // Check if device trust hasn't expired
    const expiresAt = new Date(device.expires_at);
    if (expiresAt < new Date()) {
      return false;
    }

    return device.is_trusted;
  } catch (error) {
    console.error('Error checking device trust:', error);
    return false;
  }
}

/**
 * Check if admin has a valid approval for this session
 */
export async function hasValidApproval(userId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { data: approval } = await supabase
      .from('admin_approvals')
      .select('id, approved, expires_at')
      .eq('user_id', userId)
      .eq('approved', true)
      .gte('expires_at', new Date().toISOString())
      .order('approved_at', { ascending: false })
      .limit(1)
      .single();

    return !!approval;
  } catch (error) {
    console.error('Error checking approval:', error);
    return false;
  }
}

/**
 * Create an approval request for admin access
 * Generates a token and returns the request details
 */
export async function createApprovalRequest(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<{
  approvalId: string;
  approvalToken: string;
  expiresAt: Date;
}> {
  try {
    const supabase = await getSupabaseServer();

    // Use database function to create approval
    const { data, error } = await supabase.rpc('request_admin_approval', {
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    if (error) {
      throw error;
    }

    const approvalId = data; // Function returns the approval ID

    // Get the full approval record to return the token
    const { data: approval, error: fetchError } = await supabase
      .from('admin_approvals')
      .select('id, approval_token, expires_at')
      .eq('id', approvalId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    return {
      approvalId: approval.id,
      approvalToken: approval.approval_token,
      expiresAt: new Date(approval.expires_at)
    };
  } catch (error) {
    console.error('Error creating approval request:', error);
    throw error;
  }
}

/**
 * Approve admin access from Phill's device
 * This is called when Phill clicks the approval link in email
 */
export async function approveAdminAccess(
  approvalId: string,
  approverId: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    // Check that approver is Phill
    const { data: approver } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', approverId)
      .single();

    if (approver?.email !== 'phill.mcgurk@gmail.com') {
      console.error('Only Phill can approve admin access');
      return false;
    }

    // Use database function to approve
    const { error } = await supabase.rpc('approve_admin_access', {
      approval_id: approvalId,
      approver_id: approverId
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error approving admin access:', error);
    return false;
  }
}

/**
 * Trust an admin device for future logins
 * Called after approval, remembers this device for 90 days
 */
export async function trustAdminDevice(
  userId: string,
  deviceFingerprint: string,
  ipAddress: string,
  userAgent: string,
  approverId: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase.rpc('trust_admin_device', {
      user_id: userId,
      device_fingerprint: deviceFingerprint,
      ip_address: ipAddress,
      user_agent: userAgent,
      approver_id: approverId
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error trusting device:', error);
    return false;
  }
}

/**
 * Log admin access attempt
 */
export async function logAdminAccess(
  userId: string,
  action: string,
  ipAddress: string,
  userAgent: string,
  deviceFingerprint: string,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = await getSupabaseServer();

    await supabase.rpc('log_admin_access', {
      user_id: userId,
      action,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_fingerprint: deviceFingerprint,
      success,
      error_message: errorMessage || null
    });
  } catch (error) {
    console.error('Error logging admin access:', error);
    // Don't throw, just log the error
  }
}

/**
 * Get all pending approval requests for Phill
 */
export async function getPendingApprovals() {
  try {
    const supabase = await getSupabaseServer();

    const { data: approvals, error } = await supabase
      .from('admin_approvals')
      .select(`
        id,
        user_id,
        profiles:user_id(email),
        ip_address,
        user_agent,
        approved,
        requested_at,
        expires_at
      `)
      .eq('approved', false)
      .gte('expires_at', new Date().toISOString())
      .order('requested_at', { ascending: false });

    if (error) {
      throw error;
    }

    return approvals || [];
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    return [];
  }
}

/**
 * Get all trusted devices for a user
 */
export async function getUserTrustedDevices(userId: string) {
  try {
    const supabase = await getSupabaseServer();

    const { data: devices, error } = await supabase
      .from('admin_trusted_devices')
      .select('id, ip_address, user_agent, last_used, expires_at, created_at')
      .eq('user_id', userId)
      .eq('is_trusted', true)
      .gte('expires_at', new Date().toISOString())
      .order('last_used', { ascending: false });

    if (error) {
      throw error;
    }

    return devices || [];
  } catch (error) {
    console.error('Error getting trusted devices:', error);
    return [];
  }
}

/**
 * Revoke trust for a device
 */
export async function revokeTrustedDevice(deviceId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('admin_trusted_devices')
      .update({ is_trusted: false })
      .eq('id', deviceId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error revoking device:', error);
    return false;
  }
}
