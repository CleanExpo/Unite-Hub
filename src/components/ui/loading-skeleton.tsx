'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type SkeletonVariant =
  | 'text'
  | 'paragraph'
  | 'card'
  | 'table-row'
  | 'avatar'
  | 'stat-card'
  | 'project-card'
  | 'client-card';

type SkeletonSize = 'sm' | 'md' | 'lg';

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  size?: SkeletonSize;
  count?: number;
  className?: string;
}

/**
 * LoadingSkeleton Component
 *
 * Versatile skeleton component with multiple variants for loading states.
 */
export function LoadingSkeleton({
  variant = 'text',
  size = 'md',
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return <TextSkeleton size={size} />;
      case 'paragraph':
        return <ParagraphSkeleton lines={size === 'sm' ? 2 : size === 'md' ? 3 : 5} />;
      case 'card':
        return <CardSkeleton size={size} />;
      case 'table-row':
        return <TableRowSkeleton columns={size === 'sm' ? 3 : size === 'md' ? 5 : 7} />;
      case 'avatar':
        return <AvatarSkeleton size={size} />;
      case 'stat-card':
        return <StatCardSkeleton />;
      case 'project-card':
        return <ProjectCardSkeleton />;
      case 'client-card':
        return <ClientCardSkeleton />;
      default:
        return <TextSkeleton size={size} />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
}

/**
 * TextSkeleton - Single line of text
 */
function TextSkeleton({ size = 'md' }: { size?: SkeletonSize }) {
  const widths = { sm: 'w-24', md: 'w-48', lg: 'w-64' };
  const heights = { sm: 'h-3', md: 'h-4', lg: 'h-5' };

  return <Skeleton className={cn(heights[size], widths[size])} />;
}

/**
 * ParagraphSkeleton - Multiple lines of text
 */
function ParagraphSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

/**
 * CardSkeleton - Card with header and content
 */
function CardSkeleton({ size = 'md' }: { size?: SkeletonSize }) {
  const heights = { sm: 'h-32', md: 'h-48', lg: 'h-64' };

  return (
    <Card className={cn(heights[size], 'overflow-hidden')}>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * TableRowSkeleton - Table row with cells
 */
function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border-subtle">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === 0 ? 'w-8' : 'flex-1')} />
      ))}
    </div>
  );
}

/**
 * AvatarSkeleton - Avatar with optional text
 */
function AvatarSkeleton({ size = 'md' }: { size?: SkeletonSize }) {
  const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };

  return (
    <div className="flex items-center gap-3">
      <Skeleton className={cn('rounded-full', sizes[size])} />
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * StatCardSkeleton - Stat card loading state
 */
function StatCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </Card>
  );
}

/**
 * ProjectCardSkeleton - Project card loading state
 */
function ProjectCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full border-2 border-bg-card" />
            ))}
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </Card>
  );
}

/**
 * ClientCardSkeleton - Client card loading state
 */
function ClientCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </Card>
  );
}

export default LoadingSkeleton;
