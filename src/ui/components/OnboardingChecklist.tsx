'use client';

/**
 * Onboarding Checklist Component
 * Phase 47: Displays and tracks client onboarding tasks
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, ChevronRight, Mic } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface OnboardingTask {
  id: string;
  task_key: string;
  title: string;
  description: string | null;
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  priority: number;
  estimated_minutes: number;
  icon: string | null;
  action_url: string | null;
  voice_completable: boolean;
}

interface OnboardingChecklistProps {
  tasks: OnboardingTask[];
  onTaskClick?: (task: OnboardingTask) => void;
  onCompleteTask?: (taskId: string) => void;
  showProgress?: boolean;
}

export function OnboardingChecklist({
  tasks,
  onTaskClick,
  onCompleteTask,
  showProgress = true,
}: OnboardingChecklistProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const completedCount = tasks.filter(
    (t) => t.status === 'completed' || t.status === 'skipped'
  ).length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, OnboardingTask[]>);

  const categoryLabels: Record<string, string> = {
    setup: 'Setup',
    branding: 'Branding',
    content: 'Content',
    seo: 'SEO',
    social: 'Social',
    review: 'Review',
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'skipped':
        return <Circle className="h-5 w-5 text-gray-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTaskIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Onboarding Checklist</CardTitle>
          {showProgress && (
            <Badge variant={progressPercentage === 100 ? 'default' : 'secondary'}>
              {completedCount}/{tasks.length} Complete
            </Badge>
          )}
        </div>
        {showProgress && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progressPercentage}% complete
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
          <div key={category} className="space-y-2">
            <button
              onClick={() =>
                setExpandedCategory(expandedCategory === category ? null : category)
              }
              className="flex items-center justify-between w-full text-left py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="font-medium text-sm">
                {categoryLabels[category] || category}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {categoryTasks.filter((t) => t.status === 'completed').length}/
                  {categoryTasks.length}
                </span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    expandedCategory === category ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {expandedCategory === category && (
              <div className="space-y-2 pl-2">
                {categoryTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      task.status === 'completed'
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {task.icon && (
                          <span className="text-gray-400">
                            {getTaskIcon(task.icon)}
                          </span>
                        )}
                        <span
                          className={`font-medium ${
                            task.status === 'completed'
                              ? 'line-through text-gray-500'
                              : ''
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.voice_completable && (
                          <Mic className="h-3 w-3 text-purple-500" />
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          ~{task.estimated_minutes} min
                        </span>
                        {task.status !== 'completed' && task.status !== 'skipped' && (
                          <div className="flex gap-2">
                            {task.action_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onTaskClick?.(task)}
                                className="h-6 text-xs"
                              >
                                Start
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onCompleteTask?.(task.id)}
                              className="h-6 text-xs"
                            >
                              Mark Done
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default OnboardingChecklist;
