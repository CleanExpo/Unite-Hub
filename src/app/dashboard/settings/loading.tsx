export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-7 bg-gray-800 rounded w-28 mb-2" />
        <div className="h-4 bg-gray-800 rounded w-56" />
      </div>

      {/* Form sections */}
      {[1, 2, 3].map((section) => (
        <div key={section} className="bg-gray-800/50 rounded-lg p-5 space-y-4 animate-pulse">
          <div className="h-5 bg-gray-700 rounded w-32 mb-4" />
          {[1, 2].map((field) => (
            <div key={field}>
              <div className="h-4 bg-gray-700 rounded w-20 mb-2" />
              <div className="h-10 bg-gray-700/50 rounded w-full" />
            </div>
          ))}
        </div>
      ))}

      {/* Save button */}
      <div className="animate-pulse">
        <div className="h-10 bg-gray-700 rounded w-28" />
      </div>
    </div>
  );
}
