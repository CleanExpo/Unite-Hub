/**
 * Loading state for Agent Operations Console
 */

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted rounded" />
          <div>
            <div className="h-6 bg-muted rounded w-56 mb-2" />
            <div className="h-4 bg-muted rounded w-72" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-muted rounded w-24" />
          <div className="h-10 bg-muted rounded w-32" />
        </div>
      </div>

      {/* Safety banner skeleton */}
      <div className="bg-muted/30 border rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-64 mb-2" />
        <div className="h-3 bg-muted rounded w-full" />
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4 animate-pulse">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-muted rounded w-24" />
          ))}
        </div>
        <div className="bg-card border rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted/30 rounded-lg p-4">
                <div className="h-4 bg-muted rounded w-20 mb-2" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
