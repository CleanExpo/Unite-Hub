/**
 * Task Queue Page
 *
 * Submit tasks to the agentic layer and monitor their execution.
 */

import { Suspense } from 'react'
import { TaskSubmissionForm } from './components/TaskSubmissionForm'
import { TaskList } from './components/TaskList'
import { QueueStats } from './components/QueueStats'

export const metadata = {
  title: 'Task Queue | Agentic Layer',
  description: 'Submit and monitor tasks for autonomous execution',
}

async function fetchQueueStats() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const res = await fetch(`${backendUrl}/api/tasks/stats/summary`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    })

    if (!res.ok) {
      return {
        total_tasks: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        failed: 0
      }
    }

    return res.json()
  } catch (error) {
    console.error('Failed to fetch queue stats:', error)
    return {
      total_tasks: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      failed: 0
    }
  }
}

export default async function TaskQueuePage() {
  const stats = await fetchQueueStats()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Task Queue</h1>
        <p className="text-gray-600">
          Submit tasks to the agentic layer for autonomous execution
        </p>
      </div>

      {/* Queue Stats */}
      <div className="mb-8">
        <QueueStats stats={stats} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Submission Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Submit New Task</h2>
            <TaskSubmissionForm />
          </div>
        </div>

        {/* Task List */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Task Queue</h2>
          <Suspense fallback={<TaskListSkeleton />}>
            <TaskList />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function TaskListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}
