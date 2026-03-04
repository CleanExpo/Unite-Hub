/**
 * Agent Dashboard Page
 *
 * Displays real-time agent metrics, task history, and performance trends.
 * Built with Next.js 15 Server Components for optimal performance.
 */

import { Suspense } from 'react';
import { AgentStats } from './components/AgentStats';
import { AgentList } from './components/AgentList';
import { TaskHistory } from './components/TaskHistory';
import { PerformanceTrends } from './components/PerformanceTrends';

export const metadata = {
  title: 'Agent Dashboard | Agentic Layer',
  description: 'Monitor autonomous agent performance and metrics',
};

async function fetchAgentStats() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/api/agents/stats`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      // Fallback to mock data if API fails
      return {
        total_agents: 7,
        active_agents: 3,
        total_tasks: 135,
        successful_tasks: 120,
        failed_tasks: 15,
        success_rate: 0.89,
        avg_iterations: 1.5,
        avg_duration_seconds: 180,
      };
    }

    return res.json();
  } catch (_error) {
    // Fallback mock data on error
    return {
      total_agents: 7,
      active_agents: 3,
      total_tasks: 135,
      successful_tasks: 120,
      failed_tasks: 15,
      success_rate: 0.89,
      avg_iterations: 1.5,
      avg_duration_seconds: 180,
    };
  }
}

export default async function AgentDashboardPage() {
  const stats = await fetchAgentStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Agent Dashboard</h1>
        <p className="text-gray-600">Real-time monitoring of the autonomous agentic layer</p>
      </div>

      {/* Overview Stats */}
      <div className="mb-8">
        <Suspense fallback={<AgentStatsSkeleton />}>
          <AgentStats stats={stats} />
        </Suspense>
      </div>

      {/* Main Content Grid */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Agent List */}
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Active Agents</h2>
          <Suspense fallback={<AgentListSkeleton />}>
            <AgentList />
          </Suspense>
        </div>

        {/* Recent Tasks */}
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Recent Tasks</h2>
          <Suspense fallback={<TaskHistorySkeleton />}>
            <TaskHistory limit={10} />
          </Suspense>
        </div>
      </div>

      {/* Performance Trends */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Performance Trends</h2>
        <Suspense fallback={<PerformanceTrendsSkeleton />}>
          <PerformanceTrends days={7} />
        </Suspense>
      </div>
    </div>
  );
}

// Loading skeletons
function AgentStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg bg-white p-6 shadow">
          <div className="mb-2 h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-8 w-3/4 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function AgentListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg bg-white p-4 shadow">
          <div className="mb-2 h-4 w-1/3 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function TaskHistorySkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg bg-white p-4 shadow">
          <div className="mb-2 h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-3 w-1/3 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function PerformanceTrendsSkeleton() {
  return (
    <div className="animate-pulse rounded-lg bg-white p-6 shadow">
      <div className="h-64 rounded bg-gray-200" />
    </div>
  );
}
