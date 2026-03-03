/**
 * AgentStats Component
 *
 * Displays key metrics about agent performance in card format.
 */

interface AgentStatsProps {
  stats: {
    total_agents: number
    active_agents: number
    total_tasks: number
    successful_tasks: number
    failed_tasks: number
    success_rate: number
    avg_iterations: number
    avg_duration_seconds: number
  }
}

export function AgentStats({ stats }: AgentStatsProps) {
  const cards = [
    {
      label: 'Active Agents',
      value: stats.active_agents,
      total: stats.total_agents,
      suffix: ` / ${stats.total_agents}`,
      color: 'blue',
    },
    {
      label: 'Success Rate',
      value: (stats.success_rate * 100).toFixed(1),
      suffix: '%',
      color: stats.success_rate > 0.8 ? 'green' : 'yellow',
    },
    {
      label: 'Total Tasks',
      value: stats.total_tasks,
      subtitle: `${stats.successful_tasks} successful`,
      color: 'purple',
    },
    {
      label: 'Avg Iterations',
      value: stats.avg_iterations.toFixed(1),
      subtitle: 'Self-corrections',
      color: stats.avg_iterations < 2 ? 'green' : 'orange',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white p-6 rounded-lg shadow-md border-l-4"
          style={{
            borderLeftColor:
              card.color === 'green'
                ? '#10b981'
                : card.color === 'blue'
                  ? '#3b82f6'
                  : card.color === 'purple'
                    ? '#8b5cf6'
                    : card.color === 'orange'
                      ? '#f59e0b'
                      : '#eab308',
          }}
        >
          <div className="text-sm font-medium text-gray-600 mb-2">
            {card.label}
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {card.value}
            {card.suffix && <span className="text-lg text-gray-600">{card.suffix}</span>}
          </div>
          {card.subtitle && (
            <div className="text-sm text-gray-500 mt-1">{card.subtitle}</div>
          )}
        </div>
      ))}
    </div>
  )
}
