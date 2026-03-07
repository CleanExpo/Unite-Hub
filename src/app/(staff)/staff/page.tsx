// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Staff Dashboard Page - Phase 2 Step 6
 *
 * Main dashboard for staff users with overview stats
 * Wired to real API endpoints
 */


import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, CheckSquare, Users, TrendingUp } from 'lucide-react';
import { getDashboardStats } from '@/lib/services/staff/staffService';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

export default async function StaffDashboardPage() {
  // Fetch real dashboard stats from API
  const stats = await getDashboardStats();

  return (
    <PageContainer>
      <Section>
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-white font-mono">
            Dashboard
          </h1>
          <p className="text-white/40 mt-2 font-mono text-sm">
            Welcome back! Here&apos;s your overview for today.
          </p>
        </div>
      </Section>

      <Section>
        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Projects */}
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40 font-mono">Active Projects</p>
                <p className="text-3xl font-bold text-white mt-2 font-mono">
                  {stats.activeProjects}
                </p>
              </div>
              <div className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-sm">
                <FolderKanban className="h-6 w-6 text-[#00F5FF]" />
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Tasks */}
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40 font-mono">Pending Tasks</p>
                <p className="text-3xl font-bold text-white mt-2 font-mono">
                  {stats.pendingTasks}
                </p>
              </div>
              <div className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-sm">
                <CheckSquare className="h-6 w-6 text-[#FFB800]" />
              </div>
            </div>
          </div>
        </Card>

        {/* Completed This Week */}
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40 font-mono">Completed (Week)</p>
                <p className="text-3xl font-bold text-white mt-2 font-mono">
                  {stats.completedThisWeek}
                </p>
              </div>
              <div className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-sm">
                <TrendingUp className="h-6 w-6 text-[#00FF88]" />
              </div>
            </div>
          </div>
        </Card>

        {/* Total Tasks */}
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40 font-mono">Total Tasks</p>
                <p className="text-3xl font-bold text-white mt-2 font-mono">
                  {stats.totalTasks}
                </p>
              </div>
              <div className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-sm">
                <Users className="h-6 w-6 text-[#FF00FF]" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent activity - wired to real data */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4 font-mono">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="info">{activity.action}</Badge>
                    <span className="text-white/60 font-mono text-sm">
                      {activity.metadata?.description || activity.action}
                    </span>
                  </div>
                  <span className="text-sm text-white/40 font-mono">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-white/40 text-center py-4 font-mono text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </Card>
      </Section>
    </PageContainer>
  );
}
