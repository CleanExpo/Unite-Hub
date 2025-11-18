import { Skeleton } from "@/components/ui/skeleton";

/**
 * ProjectCardSkeleton
 *
 * Loading skeleton for project cards
 * Matches the ProjectCard component structure
 */
export function ProjectCardSkeleton() {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-48 bg-slate-700" />
          <Skeleton className="h-5 w-20 bg-slate-700 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32 bg-slate-700" />
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20 bg-slate-700" />
          <Skeleton className="h-3 w-12 bg-slate-700" />
        </div>
        <Skeleton className="h-2 w-full bg-slate-700 rounded-full" />
      </div>

      {/* Due Date & Priority */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <Skeleton className="h-4 w-28 bg-slate-700" />
        <Skeleton className="h-6 w-16 bg-slate-700 rounded-full" />
      </div>

      {/* Assignees */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 bg-slate-700 rounded-full" />
        <Skeleton className="h-8 w-8 bg-slate-700 rounded-full" />
        <Skeleton className="h-8 w-8 bg-slate-700 rounded-full" />
      </div>
    </div>
  );
}

/**
 * ProjectCardGridSkeleton
 *
 * Grid of project card skeletons
 */
export function ProjectCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
