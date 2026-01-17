/**
 * Loading state for Journal Page
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-bg-base p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-8 bg-bg-raised rounded w-32 mb-2" />
            <div className="h-4 bg-bg-raised rounded w-64" />
          </div>
          <div className="h-10 bg-bg-raised rounded w-32 animate-pulse" />
        </div>

        {/* Filters skeleton */}
        <div className="bg-bg-raised/50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            <div className="h-10 bg-bg-elevated rounded" />
            <div className="h-10 bg-bg-elevated rounded" />
          </div>
        </div>

        {/* Entries skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-bg-raised/50 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-bg-elevated rounded w-64 mb-4" />
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-bg-elevated rounded" />
                <div className="h-4 bg-bg-elevated rounded w-5/6" />
                <div className="h-4 bg-bg-elevated rounded w-4/6" />
              </div>
              <div className="flex space-x-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-6 bg-bg-elevated rounded w-20" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
