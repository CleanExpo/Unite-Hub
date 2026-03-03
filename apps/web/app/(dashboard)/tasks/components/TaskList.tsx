/**
 * TaskList Component
 *
 * Displays list of tasks in the queue with status and details.
 */

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  task_type: string;
  priority: number;
  assigned_agent_type?: string;
  iterations?: number;
  pr_url?: string;
  created_at: string;
}

interface TaskListResponse {
  tasks: Task[];
  total: number;
}

async function fetchTasks(statusFilter?: string): Promise<TaskListResponse> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const url = statusFilter
      ? `${backendUrl}/api/tasks?status_filter=${statusFilter}&page_size=50`
      : `${backendUrl}/api/tasks?page_size=50`

    const res = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 0 }
    })

    if (!res.ok) {
      return { tasks: [], total: 0 }
    }

    return res.json()
  } catch {
    return { tasks: [], total: 0 }
  }
}

export async function TaskList() {
  const { tasks, total } = await fetchTasks()

  if (tasks.length === 0) {
    return (
      <div className="bg-white p-12 rounded-lg shadow text-center" role="status">
        <div className="text-gray-400 mb-3">
          <svg
            className="mx-auto h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
        <p className="text-gray-600">Submit a task to get started with the agentic layer</p>
      </div>
    )
  }

  return (
    <div className="space-y-3" role="list" aria-label="Task list">
      <div className="text-sm text-gray-600 mb-4">
        Showing {tasks.length} of {total} tasks
      </div>

      {tasks.map((task: Task) => {
        const statusConfig: Record<string, { color: string; icon: string }> = {
          pending: { color: 'bg-yellow-100 text-yellow-800', icon: '[>]' },
          in_progress: { color: 'bg-blue-100 text-blue-800', icon: '[*]' },
          completed: { color: 'bg-green-100 text-green-800', icon: '[OK]' },
          failed: { color: 'bg-red-100 text-red-800', icon: '[X]' },
          cancelled: { color: 'bg-gray-100 text-gray-800', icon: '[-]' },
        }

        const config = statusConfig[task.status] || statusConfig.pending

        const typeColors: Record<string, string> = {
          feature: 'bg-blue-50 text-blue-700',
          bug: 'bg-red-50 text-red-700',
          refactor: 'bg-purple-50 text-purple-700',
          docs: 'bg-green-50 text-green-700',
          test: 'bg-orange-50 text-orange-700',
        }

        const typeColor = typeColors[task.task_type] || 'bg-gray-50 text-gray-700'

        return (
          <div
            key={task.id}
            className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition"
            role="listitem"
            tabIndex={0}
            aria-label={`Task: ${task.title}, status: ${task.status}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor}`}>
                    {task.task_type}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                    {config.icon} {task.status}
                  </span>
                  {task.priority <= 3 && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      High Priority
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
              <div className="flex items-center space-x-4">
                {task.assigned_agent_type && (
                  <span className="flex items-center space-x-1">
                    <span className="font-medium">Agent:</span>
                    <span>{task.assigned_agent_type}</span>
                  </span>
                )}
                {task.iterations && task.iterations > 0 && (
                  <span>{task.iterations} iterations</span>
                )}
                {task.pr_url && (
                  <a
                    href={task.pr_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View PR
                  </a>
                )}
              </div>
              <div>
                Created {new Date(task.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
