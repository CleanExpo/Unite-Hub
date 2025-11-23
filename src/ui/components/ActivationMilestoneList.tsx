'use client';

/**
 * Activation Milestone List Component
 * Phase 53: Display and manage activation milestones
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Play,
  SkipForward,
} from 'lucide-react';

interface Milestone {
  id: string;
  phase: number;
  day_number: number;
  title: string;
  description?: string;
  category: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
  completed_at?: string;
  deliverables?: any[];
}

interface ActivationMilestoneListProps {
  milestones: Milestone[];
  currentDay: number;
  onStatusChange?: (milestoneId: string, status: string) => void;
  onMilestoneClick?: (milestoneId: string) => void;
  showActions?: boolean;
}

export function ActivationMilestoneList({
  milestones,
  currentDay,
  onStatusChange,
  onMilestoneClick,
  showActions = true,
}: ActivationMilestoneListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'blocked':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'skipped':
        return <SkipForward className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, dayNumber: number) => {
    if (status === 'completed') {
      return <Badge variant="default" className="bg-green-500">Completed</Badge>;
    }
    if (status === 'in_progress') {
      return <Badge variant="secondary" className="bg-blue-500 text-white">In Progress</Badge>;
    }
    if (status === 'blocked') {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    if (status === 'skipped') {
      return <Badge variant="outline">Skipped</Badge>;
    }
    if (dayNumber < currentDay) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (dayNumber === currentDay) {
      return <Badge variant="secondary">Due Today</Badge>;
    }
    return <Badge variant="outline">Upcoming</Badge>;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      audit: 'border-l-purple-500',
      setup: 'border-l-blue-500',
      content: 'border-l-green-500',
      seo: 'border-l-orange-500',
      social: 'border-l-pink-500',
      review: 'border-l-yellow-500',
      report: 'border-l-cyan-500',
    };
    return colors[category] || 'border-l-gray-500';
  };

  // Group by phase
  const grouped = milestones.reduce((acc, m) => {
    if (!acc[m.phase]) acc[m.phase] = [];
    acc[m.phase].push(m);
    return acc;
  }, {} as Record<number, Milestone[]>);

  const phaseNames = ['', 'Foundation', 'Implementation', 'Momentum'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activation Milestones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(grouped).map(([phase, phaseMilestones]) => (
          <div key={phase}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Phase {phase}: {phaseNames[Number(phase)]}
            </h3>
            <div className="space-y-2">
              {phaseMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`border-l-4 ${getCategoryColor(milestone.category)} bg-muted/30 rounded-r-lg p-3`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(milestone.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-medium ${
                            milestone.status === 'completed'
                              ? 'line-through text-muted-foreground'
                              : ''
                          }`}
                        >
                          {milestone.title}
                        </span>
                        {getStatusBadge(milestone.status, milestone.day_number)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Day {milestone.day_number}</span>
                        <span className="capitalize">{milestone.category}</span>
                        {milestone.completed_at && (
                          <span>
                            Completed{' '}
                            {new Date(milestone.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {showActions && milestone.status !== 'completed' && (
                        <>
                          {milestone.status === 'not_started' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => onStatusChange?.(milestone.id, 'in_progress')}
                              title="Start"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          {milestone.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => onStatusChange?.(milestone.id, 'completed')}
                              title="Complete"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => onMilestoneClick?.(milestone.id)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default ActivationMilestoneList;
