'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type StaffRole = 'owner' | 'admin' | 'developer';
export type StaffStatus = 'active' | 'pending' | 'disabled';

export interface StaffUser {
  id: string;
  user_id: string | null;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffCheckResult {
  isStaff: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  isActive: boolean;
  isPending: boolean;
  isDisabled: boolean;
  staffUser: StaffUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to check if the current user is a staff member
 * and get their staff role/status
 */
export function useStaffCheck(): StaffCheckResult {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchStaffStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStaffUser(null);
        setLoading(false);
        return;
      }

      // Check staff_users table
      const { data: staff, error: staffError } = await supabase
        .from('staff_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (staffError) {
        // Table might not exist yet, treat as non-staff
        console.warn('Staff check error:', staffError.message);
        setStaffUser(null);
      } else {
        setStaffUser(staff);
      }
    } catch (err) {
      console.error('Error checking staff status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStaffUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchStaffStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchStaffStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchStaffStatus, supabase.auth]);

  return {
    isStaff: !!staffUser,
    isOwner: staffUser?.role === 'owner',
    isAdmin: staffUser?.role === 'admin',
    isDeveloper: staffUser?.role === 'developer',
    isActive: staffUser?.status === 'active',
    isPending: staffUser?.status === 'pending',
    isDisabled: staffUser?.status === 'disabled',
    staffUser,
    loading,
    error,
    refetch: fetchStaffStatus,
  };
}

/**
 * Permission check helpers
 */
export function canManageStaff(staffUser: StaffUser | null): boolean {
  return staffUser?.role === 'owner' && staffUser?.status === 'active';
}

export function canManageClients(staffUser: StaffUser | null): boolean {
  return staffUser?.status === 'active' &&
         (staffUser?.role === 'owner' || staffUser?.role === 'admin');
}

export function canViewAnalytics(staffUser: StaffUser | null): boolean {
  return staffUser?.status === 'active';
}

export function canDeleteClients(staffUser: StaffUser | null): boolean {
  return staffUser?.status === 'active' &&
         (staffUser?.role === 'owner' || staffUser?.role === 'admin');
}
