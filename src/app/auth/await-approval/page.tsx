'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffCheck } from '@/hooks/useStaffCheck';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AwaitApprovalPage() {
  const router = useRouter();
  const { signOut, user, loading: authLoading } = useAuth();
  const { staffUser, isActive, isPending, refetch, loading: staffLoading } = useStaffCheck();
  const [refreshing, setRefreshing] = useState(false);

  const loading = authLoading || staffLoading;

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // If user becomes active, redirect to CRM
  useEffect(() => {
    if (!loading && isActive) {
      router.push('/crm/dashboard');
    }
  }, [isActive, loading, router]);

  // If user is not a pending staff member, redirect appropriately
  useEffect(() => {
    if (!loading && !isPending && !isActive) {
      // Not in staff_users at all - redirect to Synthex Studio
      router.push('/synthex/studio');
    }
  }, [isPending, isActive, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 -z-20"
          style={{
            background: 'radial-gradient(circle at center top, #0d2a5c 0%, #051224 80%)'
          }}
        />
        <Card className="w-full max-w-md bg-bg-card/90 border-border-subtle backdrop-blur-lg">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-500/10 mb-4">
              <Clock className="w-6 h-6 text-accent-500 animate-spin" />
            </div>
            <p className="text-text-secondary">Checking approval status...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background: 'radial-gradient(circle at center top, #0d2a5c 0%, #051224 80%)'
        }}
      />

      {/* Wave pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, transparent 2px, transparent 100px)'
        }}
      />

      <Card className="w-full max-w-md mx-4 bg-bg-card/90 backdrop-blur-lg border-border-subtle shadow-xl">
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-accent-500/10 flex items-center justify-center border border-accent-500/20">
              <Clock className="w-10 h-10 text-accent-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-text-primary text-center mb-2">
            Awaiting Staff Approval
          </h1>

          {/* Description */}
          <p className="text-text-secondary text-center mb-6">
            Your staff account is pending approval from the owner.
            You&apos;ll receive CRM access once approved.
          </p>

          {/* User Info */}
          <div className="bg-bg-surface rounded-lg p-4 mb-6 border border-border-subtle">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-tertiary">Email</span>
              <span className="text-text-primary font-medium">{user?.email}</span>
            </div>
            {staffUser && (
              <>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-text-tertiary">Requested Role</span>
                  <span className="text-text-primary font-medium capitalize">{staffUser.role}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-text-tertiary">Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                    Pending
                  </span>
                </div>
              </>
            )}
          </div>

          {/* What happens next */}
          <div className="bg-bg-surface/50 border border-border-subtle rounded-lg p-4 mb-6">
            <h3 className="text-text-primary font-semibold text-sm mb-3">
              What happens next:
            </h3>
            <ol className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-500/20 text-accent-500 text-xs font-semibold mr-2 flex-shrink-0">
                  1
                </span>
                <span>The owner will review your request</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-500/20 text-accent-500 text-xs font-semibold mr-2 flex-shrink-0">
                  2
                </span>
                <span>Once approved, you&apos;ll be redirected to the CRM</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-500/20 text-accent-500 text-xs font-semibold mr-2 flex-shrink-0">
                  3
                </span>
                <span>Check back here or click refresh below</span>
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full bg-accent-500 hover:bg-accent-600 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Checking...' : 'Check Status'}
            </Button>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-border-subtle hover:bg-bg-surface"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-text-tertiary text-center mt-6 pt-6 border-t border-border-subtle">
            Need immediate access? Contact the owner at{' '}
            <a href="mailto:phill.mcgurk@gmail.com" className="text-accent-500 hover:underline">
              phill.mcgurk@gmail.com
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
