/**
 * Loading state for Businesses List Page
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-800 rounded w-64" />
          </div>
          <div className="h-10 bg-gray-800 rounded w-32 animate-pulse" />
        </div>

        {/* Filters skeleton */}
        <div className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-10 bg-gray-700 rounded w-64" />
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-gray-700 rounded w-20" />
              ))}
            </div>
          </div>
        </div>

        {/* Business cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      </div>
    </div>
  );
}
