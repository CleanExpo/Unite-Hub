'use client';

/**
 * Training Lesson List Component
 * Phase 55: Display lessons within a module
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Video,
  FileText,
  HelpCircle,
  MousePointer,
  CheckCircle2,
  Circle,
  Play,
  Clock,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  contentType: 'video' | 'text' | 'interactive' | 'quiz';
  durationSeconds?: number;
  status: 'not_started' | 'in_progress' | 'completed';
  quizScore?: number;
}

interface TrainingLessonListProps {
  lessons: Lesson[];
  currentLessonId?: string;
  onLessonSelect?: (lessonId: string) => void;
}

export function TrainingLessonList({
  lessons,
  currentLessonId,
  onLessonSelect,
}: TrainingLessonListProps) {
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4" />;
      case 'interactive':
        return <MousePointer className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) {
return '';
}
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const completedCount = lessons.filter((l) => l.status === 'completed').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Lessons</CardTitle>
          <Badge variant="secondary">
            {completedCount}/{lessons.length} complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lessons.map((lesson, index) => {
            const isCurrent = lesson.id === currentLessonId;
            const isLocked = index > 0 && lessons[index - 1].status !== 'completed';

            return (
              <div
                key={lesson.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-primary/10 border border-primary'
                    : lesson.status === 'completed'
                    ? 'bg-green-50 dark:bg-green-900/10'
                    : isLocked
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-muted'
                }`}
                onClick={() => !isLocked && onLessonSelect?.(lesson.id)}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {lesson.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : isCurrent ? (
                    <Play className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        lesson.status === 'completed'
                          ? 'text-muted-foreground'
                          : ''
                      }`}
                    >
                      {index + 1}. {lesson.title}
                    </span>
                  </div>
                  {lesson.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {lesson.description}
                    </p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-muted-foreground">
                    {getContentIcon(lesson.contentType)}
                  </div>
                  {lesson.durationSeconds && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(lesson.durationSeconds)}
                    </span>
                  )}
                  {lesson.quizScore !== undefined && (
                    <Badge
                      variant={lesson.quizScore >= 80 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {lesson.quizScore}%
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default TrainingLessonList;
