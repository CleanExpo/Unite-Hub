'use client';

/**
 * Onboarding Checklist Widget
 * Shows incomplete onboarding steps in dashboard
 * Encourages completion without being intrusive
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ArrowRight, X } from 'lucide-react';

export interface OnboardingChecklistProps {
  userId: string;
  workspaceId: string;
}

export function OnboardingChecklistWidget({ userId, workspaceId }: OnboardingChecklistProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch(
          `/api/onboarding/status?userId=${userId}&workspaceId=${workspaceId}`
        );
        const data = await res.json();

        if (data.success) {
          setStatus(data.data);
        }
      } catch (error) {
        console.error('Failed to load onboarding status:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, [userId, workspaceId]);

  if (loading || !status || status.wizardCompleted || status.wizardSkipped || dismissed) {
    return null; // Don't show if completed, skipped, or dismissed
  }

  const steps = [
    { id: 'gmail_connected', label: 'Connect Gmail', completed: status.completedSteps?.includes('gmail_connected') },
    { id: 'first_contact_added', label: 'Add First Contact', completed: status.completedSteps?.includes('first_contact_added') },
    { id: 'first_email_sent', label: 'Send AI Email', completed: status.completedSteps?.includes('first_email_sent') },
    { id: 'viewed_analytics', label: 'View Analytics', completed: status.completedSteps?.includes('viewed_analytics') },
  ];

  const remaining = steps.filter(s => !s.completed).length;

  return (
    <Card className="border-accent-500/20 bg-accent-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Complete Your Setup</CardTitle>
            <CardDescription>
              {remaining} step{remaining !== 1 ? 's' : ''} remaining to get the most out of Unite-Hub
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-text-tertiary hover:text-text-secondary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">
              {status.completedCount || 0} of {status.totalSteps || 4} complete
            </span>
            <span className="text-sm font-medium text-accent-500">
              {status.progressPercentage || 0}%
            </span>
          </div>
          <Progress value={status.progressPercentage || 0} className="h-2" />
        </div>

        {/* Steps List */}
        <div className="space-y-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-3 text-sm"
            >
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-text-tertiary flex-shrink-0" />
              )}
              <span className={step.completed ? 'text-text-secondary line-through' : 'text-text-primary'}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/onboarding">
          <Button className="w-full" size="sm">
            Continue Setup
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
