'use client';

/**
 * Dashboard Layout with Mode Support
 * Filters navigation and sections based on Simple vs Advanced mode
 * Pattern 2: "There's too much I don't need yet" (4 users)
 */

import { ReactNode } from 'react';
import type { DashboardMode } from './DashboardModeToggle';

export interface DashboardSection {
  id: string;
  title: string;
  href: string;
  icon?: ReactNode;
  mode: 'simple' | 'advanced' | 'both'; // Which mode shows this section
  badge?: string; // Optional badge text
}

export interface DashboardLayoutProps {
  mode: DashboardMode;
  sections: DashboardSection[];
  children: ReactNode;
}

/**
 * Filters dashboard sections based on current mode
 */
export function filterSectionsByMode(
  sections: DashboardSection[],
  mode: DashboardMode
): DashboardSection[] {
  return sections.filter(section => {
    if (section.mode === 'both') return true;
    if (section.mode === mode) return true;
    return false;
  });
}

/**
 * Default section configuration
 */
export const DEFAULT_DASHBOARD_SECTIONS: DashboardSection[] = [
  // Simple Mode - Core CRM (always visible)
  {
    id: 'overview',
    title: 'Overview',
    href: '/dashboard/overview',
    mode: 'both',
  },
  {
    id: 'contacts',
    title: 'Contacts',
    href: '/dashboard/contacts',
    mode: 'both',
  },
  {
    id: 'emails',
    title: 'Emails',
    href: '/dashboard/emails',
    mode: 'both',
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    href: '/dashboard/campaigns',
    mode: 'both',
  },

  // Advanced Mode - AI & Automation
  {
    id: 'ai-tools',
    title: 'AI Tools',
    href: '/dashboard/ai-tools',
    mode: 'advanced',
    badge: 'AI',
  },
  {
    id: 'orchestrator',
    title: 'Agent Orchestrator',
    href: '/dashboard/orchestrator',
    mode: 'advanced',
    badge: 'AI',
  },
  {
    id: 'content',
    title: 'Content Generator',
    href: '/dashboard/content',
    mode: 'advanced',
  },

  // Advanced Mode - Analytics
  {
    id: 'analytics',
    title: 'Analytics',
    href: '/dashboard/analytics',
    mode: 'simple', // Show in simple (Pattern 3: users want to see results)
  },
  {
    id: 'insights',
    title: 'Insights',
    href: '/dashboard/insights',
    mode: 'advanced',
  },

  // Advanced Mode - Founder Tools
  {
    id: 'founder',
    title: 'Founder Intelligence',
    href: '/founder',
    mode: 'advanced',
    badge: 'Pro',
  },
  {
    id: 'market-intel',
    title: 'Market Intelligence',
    href: '/client/dashboard/market-intelligence',
    mode: 'advanced',
    badge: 'AI',
  },

  // Both Modes - Settings
  {
    id: 'settings',
    title: 'Settings',
    href: '/dashboard/settings',
    mode: 'both',
  },
];

/**
 * Simple Dashboard Info Banner
 */
export function SimpleModeInfo() {
  return (
    <div className="bg-accent-500/10 border border-accent-500/20 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="text-accent-500 text-lg">💡</div>
        <div>
          <div className="font-medium text-text-primary mb-1">Simple Mode Active</div>
          <div className="text-sm text-text-secondary">
            You're seeing core CRM features only. Need more?{' '}
            <a href="/dashboard/settings" className="text-accent-500 underline">
              Switch to Advanced Mode
            </a>{' '}
            to access AI Agents, Founder Tools, and advanced analytics.
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Advanced Dashboard Info Banner
 */
export function AdvancedModeInfo() {
  return (
    <div className="bg-bg-raised border border-border-base rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="text-text-secondary text-lg">⚡</div>
        <div>
          <div className="font-medium text-text-primary mb-1">Advanced Mode Active</div>
          <div className="text-sm text-text-secondary">
            All features visible. Feeling overwhelmed?{' '}
            <a href="/dashboard/settings" className="text-accent-500 underline">
              Switch to Simple Mode
            </a>{' '}
            to see core CRM features only.
          </div>
        </div>
      </div>
    </div>
  );
}
