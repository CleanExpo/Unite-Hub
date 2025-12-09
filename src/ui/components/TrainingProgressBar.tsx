'use client';

/**
 * Training Progress Bar Component
 * Phase 55: Overall training progress with stats
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, BookOpen, Clock, Star } from 'lucide-react';

interface TrainingProgressBarProps {
  modulesCompleted: number;
  totalModules: number;
  lessonsCompleted: number;
  totalTimeMinutes: number;
  badgesEarned: number;
  totalBadges: number;
  requiredModulesComplete: boolean;
}

export function TrainingProgressBar({
  modulesCompleted,
  totalModules,
  lessonsCompleted,
  totalTimeMinutes,
  badgesEarned,
  totalBadges,
  requiredModulesComplete,
}: TrainingProgressBarProps) {
  const progressPercent = totalModules > 0
    ? Math.round((modulesCompleted / totalModules) * 100)
    : 0;

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
return `${minutes}m`;
}
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Training Progress
          </CardTitle>
          {requiredModulesComplete ? (
            <Badge className="bg-green-500">Onboarding Complete</Badge>
          ) : (
            <Badge variant="secondary">In Progress</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main progress bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            {modulesCompleted} of {totalModules} modules completed
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <BookOpen className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <div className="text-xl font-bold">{lessonsCompleted}</div>
            <div className="text-xs text-muted-foreground">Lessons</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <div className="text-xl font-bold">{formatTime(totalTimeMinutes)}</div>
            <div className="text-xs text-muted-foreground">Time Spent</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <Award className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <div className="text-xl font-bold">{badgesEarned}</div>
            <div className="text-xs text-muted-foreground">
              of {totalBadges} Badges
            </div>
          </div>
        </div>

        {/* Encouragement message */}
        <div className="text-center text-sm text-muted-foreground">
          {progressPercent === 0 && (
            <span>Start your first lesson to begin tracking progress</span>
          )}
          {progressPercent > 0 && progressPercent < 50 && (
            <span>Great start! Keep going to unlock more badges</span>
          )}
          {progressPercent >= 50 && progressPercent < 100 && (
            <span>You're over halfway there! Almost fully trained</span>
          )}
          {progressPercent === 100 && (
            <span className="text-green-600 dark:text-green-400">
              Congratulations! You've completed all training modules
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TrainingProgressBar;
