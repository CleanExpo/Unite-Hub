export default function ReportsLoading() {
  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-pulse">
        <div className="h-7 bg-gray-800 rounded w-28" />
        <div className="h-9 bg-gray-800 rounded w-36" />
      </div>

      {/* Filter toolbar */}
      <div className="flex gap-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 bg-gray-800 rounded w-28" />
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-800/50 rounded-lg overflow-hidden">
        <div className="grid grid-cols-4 gap-4 p-3 border-b border-gray-700 animate-pulse">
          {['w-28', 'w-20', 'w-24', 'w-16'].map((w, i) => (
            <div key={i} className={`h-4 bg-gray-700 rounded ${w}`} />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="grid grid-cols-4 gap-4 p-3 border-b border-gray-800 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-36" />
            <div className="h-4 bg-gray-700 rounded w-16" />
            <div className="h-4 bg-gray-700 rounded w-24" />
            <div className="h-4 bg-gray-700 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
