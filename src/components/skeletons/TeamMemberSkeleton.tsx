import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * TeamMemberSkeleton
 *
 * Loading skeleton for team member cards
 * Matches the team member card structure
 */
export function TeamMemberSkeleton() {
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
      <CardHeader className="border-b border-slate-700/50">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Skeleton className="h-16 w-16 rounded-full bg-slate-700" />

          {/* Name & Role */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 bg-slate-700" />
                <Skeleton className="h-4 w-24 bg-slate-700" />
              </div>
              <Skeleton className="h-6 w-20 bg-slate-700 rounded-full" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Contact Info */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-48 bg-slate-700" />
          <Skeleton className="h-4 w-40 bg-slate-700" />
          <Skeleton className="h-4 w-36 bg-slate-700" />
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-12 bg-slate-700" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 bg-slate-700 rounded-full" />
            <Skeleton className="h-6 w-20 bg-slate-700 rounded-full" />
            <Skeleton className="h-6 w-18 bg-slate-700 rounded-full" />
          </div>
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 bg-slate-700" />
            <Skeleton className="h-4 w-20 bg-slate-700" />
          </div>
          <Skeleton className="h-2 w-full bg-slate-700 rounded-full" />
        </div>

        {/* Projects */}
        <div className="pt-4 border-t border-slate-700/50">
          <Skeleton className="h-4 w-44 bg-slate-700" />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 bg-slate-700 rounded-md" />
          <Skeleton className="h-9 flex-1 bg-slate-700 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * TeamMemberGridSkeleton
 *
 * Grid of team member skeletons
 */
export function TeamMemberGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <TeamMemberSkeleton key={i} />
      ))}
    </div>
  );
}
