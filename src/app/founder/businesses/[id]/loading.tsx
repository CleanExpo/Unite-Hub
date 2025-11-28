/**
 * Loading state for Business Detail Page
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gray-800 rounded-lg animate-pulse" />
            <div className="space-y-2 animate-pulse">
              <div className="h-8 bg-gray-800 rounded w-64" />
              <div className="h-4 bg-gray-800 rounded w-32" />
              <div className="h-6 bg-gray-800 rounded w-24" />
            </div>
          </div>
          <div className="flex space-x-2 animate-pulse">
            <div className="h-10 bg-gray-800 rounded w-24" />
            <div className="h-10 bg-gray-800 rounded w-28" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="border-b border-gray-700">
          <div className="flex space-x-8 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-800 rounded w-20" />
            ))}
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-48 mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-700 rounded" />
              <div className="h-4 bg-gray-700 rounded w-3/4" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-24 mb-4" />
                <div className="h-8 bg-gray-700 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
