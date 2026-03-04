'use client';

/**
 * Staff Onboarding Assistant Page
 *
 * Automated onboarding assistant for staff members using the Synthex Auto-Action Engine.
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingAssistantPanel } from '@/components/auto-action';
import { Bot, Users, CheckCircle, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StaffOnboardingAssistantPage() {
  const { currentOrganization } = useAuth();
  const [selectedFlow, setSelectedFlow] = useState<'standard' | 'crm'>('standard');

  const workspaceId = currentOrganization?.org_id || 'default';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Staff Onboarding Assistant</h1>
        </div>
        <p className="text-muted-foreground">
          Automate staff onboarding tasks and CRM operations with AI assistance.
        </p>
      </div>

      {/* Flow Selector */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setSelectedFlow('standard')}
          className={cn(
            'flex-1 p-4 rounded-lg border-2 transition-all',
            selectedFlow === 'standard'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Staff Onboarding</h3>
          </div>
          <p className="text-sm text-muted-foreground text-left">
            Automate the onboarding process for new team members
          </p>
        </button>

        <button
          onClick={() => setSelectedFlow('crm')}
          className={cn(
            'flex-1 p-4 rounded-lg border-2 transition-all',
            selectedFlow === 'crm'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-medium">CRM Auto-Fill</h3>
          </div>
          <p className="text-sm text-muted-foreground text-left">
            Automatically populate CRM records from contact data
          </p>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">85%</p>
          <p className="text-sm text-muted-foreground">Time Saved</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-500">99%</p>
          <p className="text-sm text-muted-foreground">Accuracy</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-500">2min</p>
          <p className="text-sm text-muted-foreground">Avg. Duration</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">0</p>
          <p className="text-sm text-muted-foreground">Manual Steps</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Assistant Panel */}
        <div className="lg:col-span-2">
          <OnboardingAssistantPanel
            flowType={selectedFlow === 'standard' ? 'staff' : 'crm'}
            workspaceId={workspaceId}
            onSessionStart={() => console.log('Session started')}
            onSessionEnd={() => console.log('Session ended')}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Flow Details */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {selectedFlow === 'standard' ? 'Staff Onboarding Steps' : 'CRM Auto-Fill Steps'}
            </h3>
            <ul className="space-y-2">
              {selectedFlow === 'standard' ? (
                <>
                  <StepItem completed={false} label="Navigate to onboarding form" />
                  <StepItem completed={false} label="Fill personal information" />
                  <StepItem completed={false} label="Set role and department" />
                  <StepItem completed={false} label="Assign manager" />
                  <StepItem completed={false} label="Set start date" />
                  <StepItem completed={false} label="Review and submit" />
                </>
              ) : (
                <>
                  <StepItem completed={false} label="Navigate to contact form" />
                  <StepItem completed={false} label="Fill contact details" />
                  <StepItem completed={false} label="Add company information" />
                  <StepItem completed={false} label="Save contact record" />
                </>
              )}
            </ul>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">Recent Activity</h3>
            <div className="space-y-3">
              <ActivityItem
                time="2 hours ago"
                description="Staff onboarding completed for 3 members"
              />
              <ActivityItem
                time="Yesterday"
                description="CRM auto-fill: 12 contacts added"
              />
              <ActivityItem
                time="2 days ago"
                description="Staff onboarding completed for 1 member"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                View all session logs
              </button>
              <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Configure auto-action settings
              </button>
              <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Manage approval rules
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StepItem({ completed, label }: { completed: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <CheckCircle
        className={cn(
          'w-4 h-4',
          completed ? 'text-green-500' : 'text-muted-foreground/30'
        )}
      />
      <span className={completed ? 'text-muted-foreground line-through' : ''}>
        {label}
      </span>
    </li>
  );
}

function ActivityItem({ time, description }: { time: string; description: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
      <div>
        <p className="text-sm">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
