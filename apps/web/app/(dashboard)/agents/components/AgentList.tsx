/**
 * AgentList Component
 *
 * Displays list of active agents with their status and metrics.
 */

interface Agent {
  agent_id: string;
  agent_type: string;
  status: string;
  task_count: number;
  success_rate: number;
}

async function fetchAgents(): Promise<Agent[]> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const res = await fetch(`${backendUrl}/api/agents/list`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    })

    if (!res.ok) {
      return []
    }

    return res.json()
  } catch {
    return []
  }
}

export async function AgentList() {
  const agents = await fetchAgents()

  if (agents.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center" role="status">
        <div className="text-gray-400 mb-2">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No agents yet</h3>
        <p className="text-gray-600">Agents will appear once tasks are executed</p>
      </div>
    )
  }

  return (
    <div className="space-y-3" role="list" aria-label="Agent list">
      {agents.map((agent: Agent) => {
        const statusColor =
          agent.status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'

        const successRateColor =
          agent.success_rate > 0.85
            ? 'text-green-600'
            : agent.success_rate > 0.7
              ? 'text-yellow-600'
              : 'text-red-600'

        return (
          <div
            key={agent.agent_id}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
            role="listitem"
            tabIndex={0}
            aria-label={`Agent ${agent.agent_type}, status: ${agent.status}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {agent.agent_type.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{agent.agent_type}</h3>
                  <p className="text-sm text-gray-500">{agent.agent_id.substring(0, 12)}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                {agent.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
              <div>
                <div className="text-xs text-gray-500">Tasks</div>
                <div className="text-lg font-semibold">{agent.task_count}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Success Rate</div>
                <div className={`text-lg font-semibold ${successRateColor}`}>
                  {(agent.success_rate * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
