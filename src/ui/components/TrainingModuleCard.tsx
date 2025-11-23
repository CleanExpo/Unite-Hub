'use client';

/**
 * Training Module Card Component
 * Phase 55: Display training module with progress
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Play,
  Lock,
  Star,
} from 'lucide-react';

interface TrainingModuleCardProps {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  isRequired: boolean;
  lessonCount: number;
  progress: {
    status: 'not_started' | 'in_progress' | 'completed';
    percent: number;
    completedLessons: number;
  };
  isLocked?: boolean;
  onStart?: () => void;
  onContinue?: () => void;
  onReview?: () => void;
}

export function TrainingModuleCard({
  id,
  title,
  description,
  category,
  difficulty,
  estimatedMinutes,
  isRequired,
  lessonCount,
  progress,
  isLocked = false,
  onStart,
  onContinue,
  onReview,
}: TrainingModuleCardProps) {
  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'advanced':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  const getCategoryColor = () => {
    const colors: Record<string, string> = {
      platform_usage: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      ai_basics: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      seo_fundamentals: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      content_strategy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      analytics: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
      best_practices: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getStatusButton = () => {
    if (isLocked) {
      return (
        <Button disabled className="w-full">
          <Lock className="h-4 w-4 mr-2" />
          Complete Prerequisites
        </Button>
      );
    }

    switch (progress.status) {
      case 'completed':
        return (
          <Button variant="outline" className="w-full" onClick={onReview}>
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            Review
          </Button>
        );
      case 'in_progress':
        return (
          <Button className="w-full" onClick={onContinue}>
            <Play className="h-4 w-4 mr-2" />
            Continue
          </Button>
        );
      default:
        return (
          <Button className="w-full" onClick={onStart}>
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
        );
    }
  };

  return (
    <Card className={`${isLocked ? 'opacity-60' : ''} ${progress.status === 'completed' ? 'border-green-500/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${
                progress.status === 'completed'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-muted'
              }`}
            >
              {progress.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
          {isRequired && (
            <Badge variant="destructive" className="text-xs">
              Required
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={`text-xs ${getCategoryColor()}`}>
            {category.replace(/_/g, ' ')}
          </Badge>
          <Badge variant="outline" className={`text-xs ${getDifficultyColor()}`}>
            {difficulty}
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {estimatedMinutes} min
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {lessonCount} lessons
          </div>
        </div>

        {/* Progress */}
        {progress.status !== 'not_started' && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progress</span>
              <span>
                {progress.completedLessons}/{lessonCount} lessons
              </span>
            </div>
            <Progress value={progress.percent} className="h-2" />
          </div>
        )}

        {/* Action Button */}
        {getStatusButton()}
      </CardContent>
    </Card>
  );
}

export default TrainingModuleCard;
