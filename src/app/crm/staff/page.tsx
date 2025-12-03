'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  UserPlus,
  Check,
  X,
  Shield,
  Clock,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useStaffCheck, StaffUser, StaffRole } from '@/hooks/useStaffCheck';
import { createClient } from '@/lib/supabase/client';

export default function StaffManagementPage() {
  const router = useRouter();
  const { isOwner, loading: authLoading } = useStaffCheck();
  const [staffMembers, setStaffMembers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('developer');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  // Redirect non-owners
  useEffect(() => {
    if (!authLoading && !isOwner) {
      router.push('/crm/dashboard');
    }
  }, [isOwner, authLoading, router]);

  // Fetch staff members
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff_users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        setStaffMembers(data || []);
      } catch (err) {
        console.error('Error fetching staff:', err);
        setError('Failed to load staff members');
      } finally {
        setLoading(false);
      }
    };

    if (isOwner) {
      fetchStaff();
    }
  }, [isOwner, supabase]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setInviting(true);

    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('staff_users')
        .select('id')
        .eq('email', inviteEmail.toLowerCase())
        .maybeSingle();

      if (existing) {
        setError('This email is already registered as staff');
        setInviting(false);
        return;
      }

      // Create pending staff user
      const { error } = await supabase
        .from('staff_users')
        .insert({
          email: inviteEmail.toLowerCase(),
          role: inviteRole,
          status: 'pending',
        });

      if (error) {
        throw error;
      }

      setSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');

      // Refresh staff list
      const { data } = await supabase
        .from('staff_users')
        .select('*')
        .order('created_at', { ascending: false });
      setStaffMembers(data || []);
    } catch (err) {
      console.error('Error inviting staff:', err);
      setError('Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleApprove = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('staff_users')
        .update({
          status: 'active',
          approved_at: new Date().toISOString(),
        })
        .eq('id', staffId);

      if (error) {
        throw error;
      }

      setStaffMembers(prev =>
        prev.map(s => s.id === staffId ? { ...s, status: 'active' as const } : s)
      );
      setSuccess('Staff member approved');
    } catch (err) {
      console.error('Error approving staff:', err);
      setError('Failed to approve staff member');
    }
  };

  const handleReject = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('staff_users')
        .delete()
        .eq('id', staffId);

      if (error) {
        throw error;
      }

      setStaffMembers(prev => prev.filter(s => s.id !== staffId));
      setSuccess('Staff member removed');
    } catch (err) {
      console.error('Error removing staff:', err);
      setError('Failed to remove staff member');
    }
  };

  const handleDisable = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('staff_users')
        .update({ status: 'disabled' })
        .eq('id', staffId);

      if (error) {
        throw error;
      }

      setStaffMembers(prev =>
        prev.map(s => s.id === staffId ? { ...s, status: 'disabled' as const } : s)
      );
      setSuccess('Staff member disabled');
    } catch (err) {
      console.error('Error disabling staff:', err);
      setError('Failed to disable staff member');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  const pendingStaff = staffMembers.filter(s => s.status === 'pending');
  const activeStaff = staffMembers.filter(s => s.status === 'active');
  const disabledStaff = staffMembers.filter(s => s.status === 'disabled');

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Staff Management</h1>
        <p className="text-text-secondary mt-1">
          Manage staff access to the CRM
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-400 text-sm">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invite Form */}
      <Card className="bg-bg-card border-border-subtle p-6 mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Invite New Staff Member
        </h2>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
          <Input
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            className="flex-1"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as StaffRole)}
            className="px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg text-text-primary"
          >
            <option value="developer">Developer</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" disabled={inviting} className="bg-accent-500 hover:bg-accent-600">
            {inviting ? 'Inviting...' : 'Send Invite'}
          </Button>
        </form>
        <p className="text-xs text-text-tertiary mt-2">
          The user will be added with &quot;pending&quot; status and must be approved when they sign up.
        </p>
      </Card>

      {/* Pending Approvals */}
      {pendingStaff.length > 0 && (
        <Card className="bg-bg-card border-border-subtle p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Pending Approvals ({pendingStaff.length})
          </h2>
          <div className="space-y-3">
            {pendingStaff.map((staff) => (
              <div
                key={staff.id}
                className="flex items-center justify-between p-4 bg-bg-surface rounded-lg border border-border-subtle"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-text-primary font-medium">{staff.email}</p>
                    <p className="text-sm text-text-tertiary capitalize">
                      Requested: {staff.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleApprove(staff.id)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(staff.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Staff */}
      <Card className="bg-bg-card border-border-subtle p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-500" />
          Active Staff ({activeStaff.length})
        </h2>
        {activeStaff.length === 0 ? (
          <p className="text-text-secondary text-sm">No active staff members.</p>
        ) : (
          <div className="space-y-3">
            {activeStaff.map((staff) => (
              <div
                key={staff.id}
                className="flex items-center justify-between p-4 bg-bg-surface rounded-lg border border-border-subtle"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    {staff.role === 'owner' ? (
                      <Shield className="w-5 h-5 text-green-500" />
                    ) : (
                      <Users className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-text-primary font-medium">{staff.email}</p>
                    <p className="text-sm text-text-tertiary capitalize flex items-center gap-2">
                      {staff.role}
                      {staff.role === 'owner' && (
                        <span className="text-xs bg-accent-500/20 text-accent-500 px-1.5 py-0.5 rounded">
                          Owner
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {staff.role !== 'owner' && (
                  <Button
                    onClick={() => handleDisable(staff.id)}
                    size="sm"
                    variant="outline"
                    className="text-text-secondary hover:text-red-400"
                  >
                    Disable
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Disabled Staff */}
      {disabledStaff.length > 0 && (
        <Card className="bg-bg-card border-border-subtle p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <X className="w-5 h-5 text-red-500" />
            Disabled Staff ({disabledStaff.length})
          </h2>
          <div className="space-y-3">
            {disabledStaff.map((staff) => (
              <div
                key={staff.id}
                className="flex items-center justify-between p-4 bg-bg-surface rounded-lg border border-border-subtle opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <X className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-text-primary font-medium">{staff.email}</p>
                    <p className="text-sm text-text-tertiary capitalize">{staff.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleApprove(staff.id)}
                    size="sm"
                    variant="outline"
                    className="text-text-secondary"
                  >
                    Re-enable
                  </Button>
                  <Button
                    onClick={() => handleReject(staff.id)}
                    size="sm"
                    variant="outline"
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
