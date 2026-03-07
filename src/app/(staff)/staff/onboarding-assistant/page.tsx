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
    <div className="min-h-screen bg-[#050505] p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#00F5FF]/10 border border-[#00F5FF]/20 rounded-sm">
            <Bot className="w-6 h-6" style={{ color: '#00F5FF' }} />
          </div>
          <h1 className="text-2xl font-bold text-white font-mono">Staff Onboarding Assistant</h1>
        </div>
        <p className="text-white/40 font-mono text-sm">
          Automate staff onboarding tasks and CRM operations with AI assistance.
        </p>
      </div>

      {/* Flow Selector */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setSelectedFlow('standard')}
          className={cn(
            'flex-1 p-4 border-2 rounded-sm transition-colors',
            selectedFlow === 'standard'
              ? 'border-[#00F5FF]/40 bg-[#00F5FF]/5'
              : 'border-white/[0.06] hover:border-white/20'
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5" style={{ color: '#00F5FF' }} />
            <h3 className="font-mono font-medium text-white">Staff Onboarding</h3>
          </div>
          <p className="text-sm text-white/40 font-mono text-left">
            Automate the onboarding process for new team members
          </p>
        </button>

        <button
          onClick={() => setSelectedFlow('crm')}
          className={cn(
            'flex-1 p-4 border-2 rounded-sm transition-colors',
            selectedFlow === 'crm'
              ? 'border-[#00F5FF]/40 bg-[#00F5FF]/5'
              : 'border-white/[0.06] hover:border-white/20'
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5" style={{ color: '#00F5FF' }} />
            <h3 className="font-mono font-medium text-white">CRM Auto-Fill</h3>
          </div>
          <p className="text-sm text-white/40 font-mono text-left">
            Automatically populate CRM records from contact data
          </p>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { value: '85%', label: 'Time Saved', color: '#00F5FF' },
          { value: '99%', label: 'Accuracy', color: '#00FF88' },
          { value: '2min', label: 'Avg. Duration', color: '#00F5FF' },
          { value: '0', label: 'Manual Steps', color: '#FFB800' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 text-center">
            <p className="text-2xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-white/40 font-mono mt-1">{stat.label}</p>
          </div>
        ))}
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
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <h3 className="font-mono font-medium text-white mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-white/40" />
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
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <h3 className="font-mono font-medium text-white mb-3">Recent Activity</h3>
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
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <h3 className="font-mono font-medium text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {['View all session logs', 'Configure auto-action settings', 'Manage approval rules'].map((label) => (
                <button
                  key={label}
                  className="w-full text-left px-3 py-2 text-sm font-mono text-white/40 rounded-sm hover:bg-white/[0.04] hover:text-white/60 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({ completed, label }: { completed: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <CheckCircle
        className={cn('w-4 h-4', completed ? '' : 'text-white/20')}
        style={completed ? { color: '#00FF88' } : undefined}
      />
      <span className={cn('font-mono text-sm', completed ? 'text-white/30 line-through' : 'text-white/60')}>
        {label}
      </span>
    </li>
  );
}

function ActivityItem({ time, description }: { time: string; description: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: '#00F5FF' }} />
      <div>
        <p className="text-sm font-mono text-white/60">{description}</p>
        <p className="text-xs text-white/30 font-mono">{time}</p>
      </div>
    </div>
  );
}
