'use client';

/**
 * Activation Phase Card Component
 * Phase 53: Display single phase with milestones
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';

interface Milestone {
  id: string;
  day_number: number;
  title: string;
  category: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
}

interface ActivationPhaseCardProps {
  phase: number;
  name: string;
  days: string;
  description: string;
  progress: number;
  milestones: Milestone[];
  isActive?: boolean;
  onMilestoneClick?: (milestoneId: string) => void;
}

export function ActivationPhaseCard({
  phase,
  name,
  days,
  description,
  progress,
  milestones,
  isActive = false,
  onMilestoneClick,
}: ActivationPhaseCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'audit':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'setup':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'content':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'seo':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'social':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300';
      case 'review':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'report':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Card className={isActive ? 'border-primary ring-2 ring-primary/20' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                progress >= 100
                  ? 'bg-green-500 text-white'
                  : isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {phase}
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <p className="text-xs text-muted-foreground">Days {days}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{progress}%</div>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
        <Progress value={progress} className="mt-3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                milestone.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-900/10'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onMilestoneClick?.(milestone.id)}
            >
              {getStatusIcon(milestone.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      milestone.status === 'completed'
                        ? 'line-through text-muted-foreground'
                        : ''
                    }`}
                  >
                    {milestone.title}
                  </span>
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(milestone.category)}`}>
                    {milestone.category}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  Day {milestone.day_number}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ActivationPhaseCard;
