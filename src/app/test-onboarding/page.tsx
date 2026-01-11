'use client';

/**
 * Test Onboarding Wizard (Bypasses Auth)
 * Navigate to: http://localhost:3008/test-onboarding
 */

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useState } from 'react';

export default function TestOnboardingPage() {
  const [completed, setCompleted] = useState(false);
  const [skipped, setSkipped] = useState(false);

  if (completed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4">✅ Wizard Completed!</h1>
          <p className="text-text-secondary">
            In production, user would be redirected to dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (skipped) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-secondary mb-4">Wizard Skipped</h1>
          <p className="text-text-secondary">
            In production, user would be redirected to dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingWizard
      userId="test-user-123"
      workspaceId="test-workspace-456"
      initialProgress={{
        currentStep: 1,
        completedSteps: [],
        progressPercentage: 0,
      }}
      onComplete={() => setCompleted(true)}
      onSkip={() => setSkipped(true)}
    />
  );
}
