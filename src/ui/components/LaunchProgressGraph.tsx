'use client';

/**
 * Launch Progress Graph Component
 * Phase 47: Visual progress indicator for client onboarding
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LaunchProgressGraphProps {
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  daysActive: number;
}

export function LaunchProgressGraph({
  progress,
  tasksCompleted,
  totalTasks,
  daysActive,
}: LaunchProgressGraphProps) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getProgressColor = () => {
    if (progress >= 100) {
return '#10b981';
} // green
    if (progress >= 70) {
return '#3b82f6';
} // blue
    if (progress >= 40) {
return '#f59e0b';
} // amber
    return '#6b7280'; // gray
  };

  const milestones = [
    { percent: 25, label: 'Setup' },
    { percent: 50, label: 'Brand' },
    { percent: 75, label: 'Content' },
    { percent: 100, label: 'Launch!' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Launch Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Circular progress */}
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={getProgressColor()}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{progress}%</span>
              <span className="text-xs text-muted-foreground">Complete</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 w-full">
            <div className="text-center">
              <p className="text-2xl font-bold">{tasksCompleted}</p>
              <p className="text-xs text-muted-foreground">Tasks Done</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{totalTasks - tasksCompleted}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{daysActive}</p>
              <p className="text-xs text-muted-foreground">Days Active</p>
            </div>
          </div>

          {/* Milestones */}
          <div className="mt-6 w-full">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.percent}
                    className={`text-xs ${
                      progress >= milestone.percent
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-400'
                    }`}
                  >
                    {milestone.label}
                  </div>
                ))}
              </div>
              <div className="flex h-2 overflow-hidden rounded bg-bg-hover">
                <div
                  style={{ width: `${progress}%` }}
                  className="flex flex-col justify-center overflow-hidden bg-blue-500 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LaunchProgressGraph;
