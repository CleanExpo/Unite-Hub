import { Skeleton } from "@/components/ui/skeleton";

/**
 * CalendarSkeleton
 *
 * Loading skeleton for calendar view
 */
export function CalendarSkeleton() {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 bg-slate-700 rounded" />
          <Skeleton className="h-6 w-32 bg-slate-700" />
          <Skeleton className="h-8 w-8 bg-slate-700 rounded" />
        </div>
        <Skeleton className="h-9 w-28 bg-slate-700 rounded-md" />
      </div>

      {/* Calendar Grid */}
      <div className="space-y-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 bg-slate-700" />
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square">
              <Skeleton className="h-full w-full bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * CalendarPostListSkeleton
 *
 * Loading skeleton for calendar post list view
 */
export function CalendarPostListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6"
        >
          <div className="flex items-start gap-4">
            {/* Platform Icon */}
            <Skeleton className="h-12 w-12 bg-slate-700 rounded-full shrink-0" />

            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48 bg-slate-700" />
                  <Skeleton className="h-4 w-32 bg-slate-700" />
                </div>
                <Skeleton className="h-6 w-20 bg-slate-700 rounded-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-slate-700" />
                <Skeleton className="h-4 w-5/6 bg-slate-700" />
                <Skeleton className="h-4 w-4/6 bg-slate-700" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Skeleton className="h-9 w-24 bg-slate-700 rounded-md" />
                <Skeleton className="h-9 w-24 bg-slate-700 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
