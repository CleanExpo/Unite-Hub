/**
 * Founder Ops Layout
 * Phase D02: Founder Ops Console
 *
 * Provides tabbed navigation for founder-facing dashboard:
 * - Twin: Profile, principles, preferences, playbooks management
 * - Metrics: Business health overview
 * - Controls: Automation and AI settings
 * - Research: Research Fabric (D03)
 */

import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase';
import Link from 'next/link';
import {
  User,
  BarChart3,
  Settings,
  BookOpen,
  Brain,
} from 'lucide-react';

interface FounderOpsLayoutProps {
  children: React.ReactNode;
}

const tabs = [
  {
    label: 'Twin',
    href: '/founder/ops/twin',
    icon: User,
    description: 'Profile & preferences',
  },
  {
    label: 'Metrics',
    href: '/founder/ops/metrics',
    icon: BarChart3,
    description: 'Business health',
  },
  {
    label: 'Controls',
    href: '/founder/ops/controls',
    icon: Settings,
    description: 'Automation settings',
  },
  {
    label: 'Research',
    href: '/founder/ops/research',
    icon: BookOpen,
    description: 'Research Fabric',
  },
];

export default async function FounderOpsLayout({ children }: FounderOpsLayoutProps) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?redirectTo=/founder/ops/twin');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-accent-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Founder Ops</h1>
            <p className="text-sm text-muted-foreground">
              Your AI-powered command center
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="group flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-accent-500 transition-colors"
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {children}
      </div>
    </div>
  );
}
