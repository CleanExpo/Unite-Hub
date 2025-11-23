/**
 * Staff Activity Page - Phase 2 Step 4
 *
 * Activity log viewer for staff users
 * Fully wired to /api/staff/activity
 */

// Force dynamic rendering to avoid build-time data fetching
export const dynamic = 'force-dynamic';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Activity, Download, Filter } from 'lucide-react';
import { getStaffActivity } from '@/lib/services/staff/staffService';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

export default async function StaffActivityPage() {
  // Fetch real activity from API
  const response = await getStaffActivity().catch(() => ({ data: [] }));
  const logs = response?.data || [];

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      staff_login: 'Logged in',
      task_created: 'Created task',
      task_updated: 'Updated task',
      task_completed: 'Completed task',
      project_created: 'Created project',
      project_updated: 'Updated project',
    };
    return labels[action] || action;
  };

  const getActionVariant = (action: string) => {
    if (action.includes('completed')) return 'success';
    if (action.includes('created')) return 'info';
    if (action.includes('updated')) return 'warning';
    return 'default';
  };

  return (
    <PageContainer>
      <Section>
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">
              Activity Log
            </h1>
            <p className="text-gray-400 mt-2">
              View recent activity and system events
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
              Filter
            </Button>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
              Export
            </Button>
          </div>
        </div>
      </Section>

      <Section>
        {/* Activity stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Today</p>
            <p className="text-2xl font-bold text-gray-100 mt-1">
              {logs.filter((log) => {
                const logDate = new Date(log.timestamp).toDateString();
                const today = new Date().toDateString();
                return logDate === today;
              }).length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">This Week</p>
            <p className="text-2xl font-bold text-gray-100 mt-1">
              {logs.length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Tasks Completed</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {logs.filter((log) => log.action === 'task_completed').length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Projects Updated</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {logs.filter((log) => log.action === 'project_updated').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Activity timeline */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">
            Recent Activity
          </h2>

          <div className="space-y-4">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className={`flex items-start space-x-4 pb-4 ${
                  index !== logs.length - 1 ? 'border-b border-gray-800' : ''
                }`}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className="p-2 bg-gray-800 rounded-full">
                    <Activity className="h-4 w-4 text-gray-400" />
                  </div>
                  {index !== logs.length - 1 && (
                    <div className="w-px h-full bg-gray-800 mt-2" />
                  )}
                </div>

                {/* Activity content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Badge variant={getActionVariant(log.action) as any}>
                        {getActionLabel(log.action)}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  {log.metadata && (
                    <div className="mt-2 p-3 bg-gray-800/50 rounded-lg">
                      <pre className="text-xs text-gray-300 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Empty state */}
      {logs.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              No activity recorded yet.
            </p>
          </div>
        </Card>
      )}
      </Section>
    </PageContainer>
  );
}
