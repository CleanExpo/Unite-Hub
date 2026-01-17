/**
 * Loading state for AI Phill Page
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-bg-base p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-bg-raised rounded-full" />
            <div className="space-y-2">
              <div className="h-8 bg-bg-raised rounded w-32" />
              <div className="h-4 bg-bg-raised rounded w-48" />
            </div>
          </div>
          <div className="h-10 bg-bg-raised rounded w-48" />
        </div>

        {/* Main content grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-bg-raised/50 rounded-lg h-[600px] animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-bg-raised rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-bg-raised/50 rounded-lg h-80 animate-pulse" />
            <div className="bg-bg-raised/50 rounded-lg h-40 animate-pulse" />
          </div>
        </div>

        {/* Journal section skeleton */}
        <div className="space-y-4">
          <div className="h-8 bg-bg-raised rounded w-48 animate-pulse" />
          {[1, 2].map((i) => (
            <div key={i} className="bg-bg-raised/50 rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
