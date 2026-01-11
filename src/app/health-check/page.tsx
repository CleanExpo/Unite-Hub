/**
 * Health Check Dashboard Page
 * Server-side rendered with initial data fetching
 *
 * Features:
 * - Server component with RSC for initial data
 * - Historical health score data (7 days)
 * - Real-time threat feed via WebSocket (client-side)
 * - Responsive design (mobile/tablet/desktop)
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { HealthCheckDashboard } from './components/HealthCheckDashboard';

export const metadata: Metadata = {
  title: 'Health Check | Unite-Hub',
  description: 'Monitor your website health with E.E.A.T. scoring, technical audits, and real-time threat detection',
};

interface PageProps {
  searchParams: Promise<{
    domain?: string;
    workspaceId?: string;
  }>;
}

export default async function HealthCheckPage({ searchParams }: PageProps) {
  const { domain, workspaceId } = await searchParams;

  // Validate workspace access
  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">Missing Workspace</h1>
          <p className="text-text-secondary mt-2">Please specify a workspace ID to access health check</p>
        </div>
      </div>
    );
  }

  // Fetch historical data (last 7 days)
  const supabase = await createClient();
  const { data: historicalScores } = await supabase
    .from('health_check_results')
    .select('overall_score, created_at')
    .eq('workspace_id', workspaceId)
    .eq('domain', domain || '')
    .order('created_at', { ascending: false })
    .limit(7);

  // Fetch latest results if domain specified
  let latestResults = null;
  if (domain) {
    const { data: results } = await supabase
      .from('health_check_results')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('domain', domain)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    latestResults = results;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <HealthCheckDashboard
        workspaceId={workspaceId}
        domain={domain}
        historicalScores={historicalScores || []}
        initialResults={latestResults}
      />
    </div>
  );
}
