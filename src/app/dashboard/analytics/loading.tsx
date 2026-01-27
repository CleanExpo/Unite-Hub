export default function AnalyticsLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-7 bg-gray-800 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-800 rounded w-48" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-5 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-20 mb-3" />
            <div className="h-7 bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="bg-gray-800/50 rounded-lg p-5 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-36 mb-4" />
        <div className="h-64 bg-gray-700/50 rounded" />
      </div>

      {/* Secondary chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-5 animate-pulse">
            <div className="h-5 bg-gray-700 rounded w-28 mb-4" />
            <div className="h-40 bg-gray-700/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
