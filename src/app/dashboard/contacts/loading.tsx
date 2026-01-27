export default function ContactsLoading() {
  return (
    <div className="p-6 space-y-4">
      {/* Header + search */}
      <div className="flex items-center justify-between animate-pulse">
        <div className="h-7 bg-gray-800 rounded w-32" />
        <div className="h-9 bg-gray-800 rounded w-48" />
      </div>

      {/* Search bar */}
      <div className="animate-pulse">
        <div className="h-10 bg-gray-800 rounded w-full" />
      </div>

      {/* Table header */}
      <div className="bg-gray-800/50 rounded-lg overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-3 border-b border-gray-700 animate-pulse">
          {['w-24', 'w-32', 'w-28', 'w-20', 'w-16'].map((w, i) => (
            <div key={i} className={`h-4 bg-gray-700 rounded ${w}`} />
          ))}
        </div>
        {/* Table rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="grid grid-cols-5 gap-4 p-3 border-b border-gray-800 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full" />
              <div className="h-4 bg-gray-700 rounded w-24" />
            </div>
            <div className="h-4 bg-gray-700 rounded w-32" />
            <div className="h-4 bg-gray-700 rounded w-20" />
            <div className="h-4 bg-gray-700 rounded w-16" />
            <div className="h-4 bg-gray-700 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
