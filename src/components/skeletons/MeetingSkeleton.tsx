import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MeetingSkeletonProps {
  count?: number;
}

/**
 * MeetingSkeleton
 *
 * Loading skeleton for calendar meetings/events
 */
export function MeetingSkeleton({ count = 3 }: MeetingSkeletonProps) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, dayIndex) => (
        <div key={dayIndex}>
          <Skeleton className="h-6 w-64 mb-3" />
          <div className="space-y-3">
            {[1, 2].map((eventIndex) => (
              <div
                key={eventIndex}
                className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-full max-w-md" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * MeetingListSkeleton
 *
 * Compact skeleton for meeting list view
 */
export function MeetingListSkeleton({ count = 5 }: MeetingSkeletonProps) {
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 border border-slate-700/50 rounded-lg"
          >
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
