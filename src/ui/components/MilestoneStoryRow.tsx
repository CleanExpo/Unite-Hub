'use client';

/**
 * Milestone Story Row
 * Phase 74: Display key milestones with dates, type, description, and status
 */

import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Clock,
  Circle,
  Star,
  TrendingUp,
  Zap,
  Target,
  Calendar,
} from 'lucide-react';
import { StoryMilestone } from '@/lib/storytelling/storytellingSources';

interface MilestoneStoryRowProps {
  milestone: StoryMilestone;
  showDescription?: boolean;
  className?: string;
}

export function MilestoneStoryRow({
  milestone,
  showDescription = true,
  className = '',
}: MilestoneStoryRowProps) {
  const getStatusConfig = (status: StoryMilestone['status']) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          label: 'Completed',
        };
      case 'in-progress':
        return {
          icon: Clock,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          label: 'In Progress',
        };
      case 'upcoming':
        return {
          icon: Circle,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          label: 'Upcoming',
        };
    }
  };

  const getTypeIcon = (type: StoryMilestone['type']) => {
    switch (type) {
      case 'activation':
        return Zap;
      case 'performance':
        return TrendingUp;
      case 'creative':
        return Star;
      case 'success':
        return Target;
      default:
        return Circle;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const statusConfig = getStatusConfig(milestone.status);
  const StatusIcon = statusConfig.icon;
  const TypeIcon = getTypeIcon(milestone.type);

  return (
    <div className={`flex items-start gap-3 py-2 ${className}`}>
      {/* Status indicator */}
      <div className={`p-1.5 rounded-full ${statusConfig.bgColor} flex-shrink-0`}>
        <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{milestone.name}</span>
          <Badge variant="outline" className="text-[10px] flex items-center gap-1">
            <TypeIcon className="h-2.5 w-2.5" />
            {milestone.type}
          </Badge>
        </div>

        {showDescription && milestone.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {milestone.description}
          </p>
        )}

        {/* Date */}
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
          <Calendar className="h-2.5 w-2.5" />
          {formatDate(milestone.date)}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact milestone list
 */
export function MilestoneStoryList({
  milestones,
  maxItems = 5,
  showAll = false,
  className = '',
}: {
  milestones: StoryMilestone[];
  maxItems?: number;
  showAll?: boolean;
  className?: string;
}) {
  const displayMilestones = showAll ? milestones : milestones.slice(0, maxItems);
  const remainingCount = milestones.length - displayMilestones.length;

  return (
    <div className={`space-y-1 ${className}`}>
      {displayMilestones.map((milestone) => (
        <MilestoneStoryRow
          key={milestone.milestone_id}
          milestone={milestone}
          showDescription={false}
        />
      ))}
      {remainingCount > 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          +{remainingCount} more milestone{remainingCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

/**
 * Milestone summary stats
 */
export function MilestoneSummary({
  milestones,
}: {
  milestones: StoryMilestone[];
}) {
  const completed = milestones.filter(m => m.status === 'completed').length;
  const inProgress = milestones.filter(m => m.status === 'in-progress').length;
  const upcoming = milestones.filter(m => m.status === 'upcoming').length;

  return (
    <div className="flex items-center gap-3 text-xs">
      {completed > 0 && (
        <div className="flex items-center gap-1 text-green-500">
          <CheckCircle2 className="h-3 w-3" />
          {completed}
        </div>
      )}
      {inProgress > 0 && (
        <div className="flex items-center gap-1 text-blue-500">
          <Clock className="h-3 w-3" />
          {inProgress}
        </div>
      )}
      {upcoming > 0 && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Circle className="h-3 w-3" />
          {upcoming}
        </div>
      )}
    </div>
  );
}

export default MilestoneStoryRow;
