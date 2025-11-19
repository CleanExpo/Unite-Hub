/**
 * Staff Dashboard Page - Phase 2 Step 3
 *
 * Main dashboard for staff users with overview stats
 * Will be wired to APIs in Phase 2 Step 4
 */

import { Card } from '@/next/components/ui/Card';
import { Badge } from '@/next/components/ui/Badge';
import { FolderKanban, CheckSquare, Users, TrendingUp } from 'lucide-react';

export default function StaffDashboardPage() {
  // TODO: Fetch real data from APIs in Phase 2 Step 4
  const stats = {
    activeProjects: 12,
    pendingTasks: 8,
    completedThisWeek: 24,
    clientSatisfaction: 94,
  };

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

        {/* Client Satisfaction */}
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Client Satisfaction</p>
                <p className="text-3xl font-bold text-gray-100 mt-2">
                  {stats.clientSatisfaction}%
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent activity placeholder */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <Badge variant="success">Completed</Badge>
                <span className="text-gray-300">Task: Homepage redesign</span>
              </div>
              <span className="text-sm text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <Badge variant="info">In Progress</Badge>
                <span className="text-gray-300">Project: Mobile app development</span>
              </div>
              <span className="text-sm text-gray-400">5 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <Badge variant="warning">Pending</Badge>
                <span className="text-gray-300">Task: Client feedback review</span>
              </div>
              <span className="text-sm text-gray-400">1 day ago</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
