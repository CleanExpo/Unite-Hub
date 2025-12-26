'use client';

/**
 * Onboarding Wizard Page
 * Guides new users through Unite-Hub setup
 * Based on UX pattern analysis: "I don't know where to start" (4 users)
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (authLoading) {
return;
}

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // TODO: Get actual workspace ID from user context
        const workspaceId = 'placeholder-workspace-id';

        const res = await fetch(
          `/api/onboarding/status?userId=${user.id}&workspaceId=${workspaceId}`
        );
        const data = await res.json();

        if (data.success) {
          const status = data.data;

          // If already completed or skipped, redirect to dashboard
          if (status.wizardCompleted || status.wizardSkipped) {
            router.push('/dashboard/overview');
            return;
          }

          setOnboardingStatus(status);
        }
      } catch (error) {
        console.error('Failed to fetch onboarding status:', error);
      } finally {
        setLoading(false);
      }
    }

    checkOnboardingStatus();
  }, [user, authLoading, router]);

  const handleComplete = () => {
    router.push('/dashboard/overview');
  };

  const handleSkip = () => {
    router.push('/dashboard/overview');
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent-500" />
          <p className="text-text-secondary">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <OnboardingWizard
      userId={user.id}
      workspaceId="placeholder-workspace-id"
      initialProgress={onboardingStatus}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
