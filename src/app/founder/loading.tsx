/**
 * Loading state for Founder OS Dashboard
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-800 rounded w-64" />
        </div>

        {/* Metrics skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-24 mb-4" />
              <div className="h-8 bg-gray-700 rounded w-16" />
            </div>
          ))}
        </div>

        {/* Business cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-700 rounded w-20 mb-4" />
              <div className="space-y-3">
                <div className="h-2 bg-gray-700 rounded" />
                <div className="h-4 bg-gray-700 rounded w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
              <div className="w-8 h-8 bg-gray-700 rounded mb-3" />
              <div className="h-5 bg-gray-700 rounded w-24 mb-2" />
              <div className="h-3 bg-gray-700 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
