/**
 * Loading state for Autonomous Agents Dashboard
 */

export default function Loading() {
  return (
    <div className="space-y-8 p-8">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-56 mb-2" />
        <div className="h-4 bg-muted rounded w-80" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 bg-muted rounded mx-auto" />
              <div className="h-6 bg-muted rounded w-12 mx-auto" />
              <div className="h-4 bg-muted rounded w-24 mx-auto" />
            </div>
          </div>
        ))}
      </div>

      {/* Alert skeleton */}
      <div className="bg-muted/30 border rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-48 mb-2" />
        <div className="h-3 bg-muted rounded w-full" />
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4 animate-pulse">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-muted rounded w-24" />
          ))}
        </div>
        <div className="bg-card border rounded-lg p-8">
          <div className="space-y-4">
            <div className="h-5 bg-muted rounded w-40" />
            <div className="h-10 bg-muted rounded w-full" />
            <div className="h-10 bg-muted rounded w-full" />
            <div className="h-10 bg-muted rounded w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
