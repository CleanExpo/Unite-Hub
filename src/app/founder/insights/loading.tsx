/**
 * Loading state for Insights Page
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-bg-base p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-bg-raised rounded w-48 mb-2" />
          <div className="h-4 bg-bg-raised rounded w-96" />
        </div>

        {/* Filters skeleton */}
        <div className="bg-bg-raised/50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-bg-elevated rounded" />
            ))}
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-bg-raised/50 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-bg-elevated rounded w-24 mb-2" />
              <div className="h-8 bg-bg-elevated rounded w-16" />
            </div>
          ))}
        </div>

        {/* Insights skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-bg-raised/50 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-bg-elevated rounded w-64 mb-3" />
              <div className="h-4 bg-bg-elevated rounded w-full mb-2" />
              <div className="h-4 bg-bg-elevated rounded w-3/4 mb-4" />
              <div className="flex space-x-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-3 bg-bg-elevated rounded w-24" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
