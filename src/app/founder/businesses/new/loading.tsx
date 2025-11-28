/**
 * Loading state for New Business Page
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4" />
          <div className="h-8 bg-gray-800 rounded w-64 mx-auto mb-2" />
          <div className="h-4 bg-gray-800 rounded w-48 mx-auto" />
        </div>

        {/* Step indicator skeleton */}
        <div className="flex items-center justify-center animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className="w-10 h-10 bg-gray-800 rounded-full" />
              {i < 3 && <div className="w-24 h-1 bg-gray-800 mx-2" />}
            </div>
          ))}
        </div>

        {/* Form skeleton */}
        <div className="bg-gray-800/50 rounded-lg p-8 space-y-6 animate-pulse">
          <div>
            <div className="h-4 bg-gray-700 rounded w-32 mb-2" />
            <div className="h-10 bg-gray-700 rounded" />
          </div>
          <div>
            <div className="h-4 bg-gray-700 rounded w-24 mb-2" />
            <div className="h-10 bg-gray-700 rounded" />
          </div>
          <div>
            <div className="h-4 bg-gray-700 rounded w-28 mb-2" />
            <div className="h-24 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
