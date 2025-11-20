// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Staff Dashboard Page - Phase 2 Step 6
 *
 * Main dashboard for staff users with overview stats
 * Wired to real API endpoints
 */


import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FolderKanban, CheckSquare, Users, TrendingUp } from 'lucide-react';
import { getDashboardStats } from '@/lib/services/staff/staffService';

export default async function StaffDashboardPage() {
  // Fetch real dashboard stats from API
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">
          Dashboard
        </h1>
        <p className="text-gray-400 mt-2">
          Welcome back! Here's your overview for today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Projects */}
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Projects</p>
                <p className="text-3xl font-bold text-gray-100 mt-2">
                  {stats.activeProjects}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FolderKanban className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Tasks */}
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Tasks</p>
                <p className="text-3xl font-bold text-gray-100 mt-2">
                  {stats.pendingTasks}
                </p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <CheckSquare className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </Card>

        {/* Completed This Week */}
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed (Week)</p>
                <p className="text-3xl font-bold text-gray-100 mt-2">
                  {stats.completedThisWeek}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>
        </Card>

        {/* Total Tasks */}
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-100 mt-2">
                  {stats.totalTasks}
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent activity - wired to real data */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="info">{activity.action}</Badge>
                    <span className="text-gray-300">
                      {activity.metadata?.description || activity.action}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
