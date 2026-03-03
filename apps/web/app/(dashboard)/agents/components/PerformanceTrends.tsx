/**
 * PerformanceTrends Component
 *
 * Displays performance trends over time with simple visualization.
 */

interface PerformanceTrendsProps {
  days?: number
}

async function fetchPerformanceTrends(days: number) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const res = await fetch(
      `${backendUrl}/api/agents/performance/trends?days=${days}`,
      {
        cache: 'no-store',
        next: { revalidate: 0 }
      }
    )

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch (error) {
    console.error('Failed to fetch performance trends:', error)
    return null
  }
}

export async function PerformanceTrends({ days = 7 }: PerformanceTrendsProps) {
  const trends = await fetchPerformanceTrends(days)

  if (!trends || !trends.data_points) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-600">No trend data available</p>
      </div>
    )
  }

  const dataPoints = trends.data_points.slice(0, days).reverse()
  const maxTasks = Math.max(...dataPoints.map((d: { tasks_completed: number }) => d.tasks_completed), 1)

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Last {days} Days</h3>
        <p className="text-sm text-gray-600">Task completion and success rate trends</p>
      </div>

      {/* Simple bar chart */}
      <div className="space-y-3">
        {dataPoints.map((point: { date: string; tasks_completed: number; success_rate: number }, idx: number) => {
          const barWidth = (point.tasks_completed / maxTasks) * 100
          const successRateColor =
            point.success_rate > 0.85
              ? 'bg-green-500'
              : point.success_rate > 0.7
                ? 'bg-yellow-500'
                : 'bg-red-500'

          return (
            <div key={idx} className="flex items-center space-x-3">
              <div className="text-xs text-gray-500 w-20">
                {new Date(point.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="flex-1 relative">
                <div className="w-full bg-gray-100 rounded h-8">
                  <div
                    className="bg-blue-500 rounded h-8 flex items-center justify-end pr-2"
                    style={{ width: `${barWidth}%` }}
                  >
                    <span className="text-white text-xs font-medium">
                      {point.tasks_completed}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-16 text-right">
                <span className={`text-xs font-medium ${successRateColor.replace('bg-', 'text-')}`}>
                  {(point.success_rate * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Tasks completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>&gt;85% success</span>
          </div>
        </div>
        <div>Avg: {dataPoints.reduce((acc: number, d: { tasks_completed: number }) => acc + d.tasks_completed, 0) / dataPoints.length | 0} tasks/day</div>
      </div>
    </div>
  )
}
