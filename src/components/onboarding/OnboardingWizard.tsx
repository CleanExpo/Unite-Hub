'use client';

/**
 * Onboarding Wizard Component
 * Guides new users through Unite-Hub setup with sequential steps
 * Based on pattern analysis: "I don't know where to start" (4 users)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Mail,
  Users,
  Send,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
} from 'lucide-react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  completed: boolean;
}

export interface OnboardingWizardProps {
  workspaceId: string;
  userId: string;
  initialProgress?: {
    currentStep: number;
    completedSteps: string[];
    progressPercentage: number;
  };
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OnboardingWizard({
  workspaceId,
  userId,
  initialProgress,
  onComplete,
  onSkip,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialProgress?.currentStep || 1);
  const [loading, setLoading] = useState(false);

  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'gmail_connected',
      title: 'Connect Gmail',
      description: 'Let Unite-Hub read your emails for AI intelligence',
      icon: <Mail className="w-6 h-6" />,
      required: true,
      completed: initialProgress?.completedSteps?.includes('gmail_connected') || false,
    },
    {
      id: 'first_contact_added',
      title: 'Add Your First Contact',
      description: 'Import or manually add a contact to get started',
      icon: <Users className="w-6 h-6" />,
      required: false,
      completed: initialProgress?.completedSteps?.includes('first_contact_added') || false,
    },
    {
      id: 'first_email_sent',
      title: 'Send AI-Generated Email',
      description: 'Let AI create a personalized email for you',
      icon: <Send className="w-6 h-6" />,
      required: false,
      completed: initialProgress?.completedSteps?.includes('first_email_sent') || false,
    },
    {
      id: 'viewed_analytics',
      title: 'View Your Analytics',
      description: 'See how Unite-Hub tracks your marketing performance',
      icon: <BarChart3 className="w-6 h-6" />,
      required: false,
      completed: initialProgress?.completedSteps?.includes('viewed_analytics') || false,
    },
  ]);

  const progressPercentage = initialProgress?.progressPercentage || 0;
  const completedCount = steps.filter(s => s.completed).length;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      updateProgress(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      updateProgress(currentStep - 1);
    }
  };

  const handleStepComplete = async (stepId: string) => {
    setLoading(true);

    try {
      // Mark step as complete in database
      const res = await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          stepId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Update local state
        setSteps(steps.map(s =>
          s.id === stepId ? { ...s, completed: true } : s
        ));

        // Auto-advance to next step
        setTimeout(() => handleNext(), 500);
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
        }),
      });

      if (res.ok) {
        if (onComplete) {
          onComplete();
        } else {
          router.push('/dashboard/overview');
        }
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!confirm('Are you sure you want to skip the setup wizard? You can always complete it later from your profile.')) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/onboarding/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
        }),
      });

      if (res.ok) {
        if (onSkip) {
          onSkip();
        } else {
          router.push('/dashboard/overview');
        }
      }
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (step: number) => {
    try {
      await fetch('/api/onboarding/update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          currentStep: step,
        }),
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-base to-bg-raised flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-3">
            Welcome to Unite-Hub! 👋
          </h1>
          <p className="text-text-secondary text-lg">
            Let's get you set up in just a few quick steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm font-medium text-accent-500">
              {progressPercentage}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />

          {/* Step Indicators */}
          <div className="flex justify-between mt-6">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index + 1)}
                className={`flex flex-col items-center gap-2 px-2 transition-opacity ${
                  index + 1 === currentStep
                    ? 'opacity-100'
                    : index + 1 < currentStep || step.completed
                    ? 'opacity-75 hover:opacity-100'
                    : 'opacity-40'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                    step.completed
                      ? 'bg-accent-500 border-accent-500 text-white'
                      : index + 1 === currentStep
                      ? 'border-accent-500 text-accent-500 bg-accent-500/10'
                      : 'border-border-base text-text-tertiary'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="text-lg font-semibold">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs text-text-secondary text-center max-w-[80px]">
                  {step.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-500">
                  {currentStepData.icon}
                </div>
                <div>
                  <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {currentStepData.description}
                  </CardDescription>
                </div>
              </div>
              {currentStepData.required && (
                <Badge variant="destructive">Required</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step Content */}
            <div className="min-h-[300px]">
              {renderStepContent(currentStepData, workspaceId, handleStepComplete, loading)}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={loading}
                className="text-text-tertiary"
              >
                Skip Setup
                <X className="w-4 h-4 ml-2" />
              </Button>

              <Button
                onClick={handleNext}
                disabled={loading || (currentStepData.required && !currentStepData.completed)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : currentStep === steps.length ? (
                  <>
                    Complete Setup
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-text-tertiary pt-4">
              {currentStepData.required
                ? 'This step is required to use Unite-Hub'
                : 'This step is optional but recommended'}
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            {completedCount} of {steps.length} steps completed •{' '}
            <span className="text-accent-500 font-medium">
              {steps.length - completedCount} remaining
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Render step-specific content
 */
function renderStepContent(
  step: OnboardingStep,
  workspaceId: string,
  onComplete: (stepId: string) => void,
  loading: boolean
) {
  switch (step.id) {
    case 'gmail_connected':
      return (
        <div className="space-y-6">
          <div className="bg-bg-raised rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3">Why Connect Gmail?</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent-500 mt-0.5 flex-shrink-0" />
                <span className="text-text-secondary">
                  AI automatically processes incoming emails and extracts contact data
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent-500 mt-0.5 flex-shrink-0" />
                <span className="text-text-secondary">
                  Detects meeting requests, questions, and follow-up opportunities
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent-500 mt-0.5 flex-shrink-0" />
                <span className="text-text-secondary">
                  Links emails to contacts automatically (no manual tagging)
                </span>
              </li>
            </ul>
          </div>

          {step.completed ? (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-green-900 dark:text-green-100">
                Gmail Connected Successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                Your emails are now being processed by AI
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Button
                size="lg"
                onClick={() => router.push('/dashboard/settings/integrations')}
                className="w-full"
              >
                <Mail className="w-5 h-5 mr-2" />
                Connect Gmail Now
              </Button>
              <p className="text-sm text-text-tertiary">
                Opens in new tab. Come back here when connected.
              </p>
            </div>
          )}
        </div>
      );

    case 'first_contact_added':
      return (
        <div className="space-y-6">
          <div className="bg-bg-raised rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3">Add Your First Contact</h3>
            <p className="text-text-secondary mb-4">
              Contacts are the foundation of your CRM. Add someone you've recently emailed or worked with.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-500 font-semibold">
                  1
                </div>
                <span className="text-text-secondary">Click "Add Contact" below</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-500 font-semibold">
                  2
                </div>
                <span className="text-text-secondary">Enter name and email</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-500 font-semibold">
                  3
                </div>
                <span className="text-text-secondary">Click "Save" and you're done!</span>
              </div>
            </div>
          </div>

          {step.completed ? (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-green-900 dark:text-green-100">
                First Contact Added!
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Button
                size="lg"
                onClick={() => router.push('/dashboard/contacts')}
                className="w-full"
              >
                <Users className="w-5 h-5 mr-2" />
                Add Contact
              </Button>
            </div>
          )}
        </div>
      );

    case 'first_email_sent':
      return (
        <div className="space-y-6">
          <div className="bg-bg-raised rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3">AI-Powered Email Generation</h3>
            <p className="text-text-secondary mb-4">
              Unite-Hub can generate personalized emails based on your contacts and previous conversations.
            </p>
            <div className="bg-accent-500/5 border border-accent-500/20 rounded-lg p-4">
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Example:</strong> AI can write a follow-up email to a prospect mentioning their specific project needs, your previous conversation, and a personalized call-to-action.
              </p>
            </div>
          </div>

          {step.completed ? (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-green-900 dark:text-green-100">
                First AI Email Sent!
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Button
                size="lg"
                onClick={() => router.push('/dashboard/emails')}
                className="w-full"
              >
                <Send className="w-5 h-5 mr-2" />
                Generate & Send Email
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStepComplete(step.id)}
                className="w-full"
              >
                Skip This Step
              </Button>
            </div>
          )}
        </div>
      );

    case 'viewed_analytics':
      return (
        <div className="space-y-6">
          <div className="bg-bg-raised rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3">Track Your Marketing Performance</h3>
            <p className="text-text-secondary mb-4">
              Unite-Hub provides real-time analytics on email opens, campaign performance, and contact engagement.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-bg-card rounded-lg p-4 border border-border-base">
                <div className="text-2xl font-bold text-text-primary">85%</div>
                <div className="text-sm text-text-secondary">Email Open Rate</div>
              </div>
              <div className="bg-bg-card rounded-lg p-4 border border-border-base">
                <div className="text-2xl font-bold text-text-primary">47</div>
                <div className="text-sm text-text-secondary">Active Contacts</div>
              </div>
            </div>
          </div>

          {step.completed ? (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-green-900 dark:text-green-100">
                Analytics Viewed!
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Button
                size="lg"
                onClick={() => router.push('/dashboard/analytics')}
                className="w-full"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                View Analytics
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStepComplete(step.id)}
                className="w-full"
              >
                Skip This Step
              </Button>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="text-center text-text-secondary">
          Step content not configured
        </div>
      );
  }
}
