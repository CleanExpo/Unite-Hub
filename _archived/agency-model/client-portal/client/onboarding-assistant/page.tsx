'use client';

/**
 * Client Onboarding Assistant Page
 *
 * Automated onboarding assistant for clients using the Synthex Auto-Action Engine.
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingAssistantPanel } from '@/components/auto-action';
import { Bot, Sparkles, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClientOnboardingAssistantPage() {
  const { currentOrganization } = useAuth();
  const [showDemo, setShowDemo] = useState(false);

  const workspaceId = currentOrganization?.org_id || 'default';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Client Onboarding Assistant</h1>
        </div>
        <p className="text-muted-foreground">
          Let our AI assistant help you complete your onboarding faster and more accurately.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium">Smart Form Filling</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Automatically fills forms with your provided data, saving time and reducing errors.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-green-500" />
            <h3 className="font-medium">Secure & Safe</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Critical actions require your approval. You stay in control at all times.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <h3 className="font-medium">Time Saving</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete onboarding in minutes instead of filling forms manually.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-card border border-border rounded-lg p-4 mb-8">
        <h2 className="font-medium mb-3">How it works</h2>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              1
            </span>
            <span>Click "Start Assistant" to begin the automated onboarding process</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              2
            </span>
            <span>The assistant will navigate through forms and fill in your information</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              3
            </span>
            <span>For sensitive actions, you'll be asked to approve before proceeding</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              4
            </span>
            <span>Review the action log to see what steps have been completed</span>
          </li>
        </ol>
      </div>

      {/* Assistant Panel */}
      <OnboardingAssistantPanel
        flowType="client"
        workspaceId={workspaceId}
        onSessionStart={() => console.log('Session started')}
        onSessionEnd={() => console.log('Session ended')}
      />

      {/* Demo Toggle */}
      <div className="mt-8 text-center">
        <button
          onClick={() => setShowDemo(!showDemo)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showDemo ? 'Hide demo mode' : 'View demo mode'}
        </button>
      </div>

      {/* Demo Info */}
      {showDemo && (
        <div className="mt-4 bg-muted/50 border border-border rounded-lg p-4">
          <h3 className="font-medium mb-2">Demo Mode</h3>
          <p className="text-sm text-muted-foreground mb-4">
            In demo mode, you can see how the assistant works without actually filling any forms.
            The assistant will simulate the onboarding process with sample data.
          </p>
          <div className="bg-card border border-border rounded-md p-3">
            <p className="text-xs text-muted-foreground mb-2">Sample Data:</p>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(
                {
                  clientName: 'John Demo',
                  clientEmail: 'demo@example.com',
                  clientCompany: 'Demo Corp',
                  clientIndustry: 'Technology',
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-600 dark:text-yellow-400 mb-1">
              Your Data is Protected
            </h3>
            <p className="text-sm text-muted-foreground">
              The assistant operates within a secure sandbox environment. Sensitive actions
              like submitting forms or entering payment information always require your
              explicit approval. You can stop the assistant at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
