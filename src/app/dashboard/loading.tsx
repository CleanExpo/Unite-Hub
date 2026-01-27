export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-7 bg-gray-800 rounded w-40 mb-2" />
        <div className="h-4 bg-gray-800 rounded w-56" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-5 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-20 mb-3" />
            <div className="h-7 bg-gray-700 rounded w-14 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
            <div className="w-8 h-8 bg-gray-700 rounded mb-2" />
            <div className="h-4 bg-gray-700 rounded w-20" />
          </div>
        ))}
      </div>

      {/* Activity list */}
      <div className="bg-gray-800/50 rounded-lg p-5 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
