import { Skeleton } from "@/components/ui/skeleton";

/**
 * ProjectCardSkeleton
 *
 * Loading skeleton for project cards
 * Matches the ProjectCard component structure
 */
export function ProjectCardSkeleton() {
  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-6 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Due Date & Priority */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Assignees */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
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
