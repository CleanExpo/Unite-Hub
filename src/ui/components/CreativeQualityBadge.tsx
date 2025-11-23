'use client';

/**
 * Creative Quality Badge
 * Phase 61: Display quality grade and score
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface CreativeQualityBadgeProps {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export function CreativeQualityBadge({
  score,
  grade,
  size = 'md',
  showScore = true,
}: CreativeQualityBadgeProps) {
  const getGradeColor = (g: string) => {
    switch (g) {
      case 'A':
        return 'bg-green-500';
      case 'B':
        return 'bg-blue-500';
      case 'C':
        return 'bg-yellow-500';
      case 'D':
        return 'bg-orange-500';
      case 'F':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getIcon = (g: string) => {
    switch (g) {
      case 'A':
      case 'B':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'C':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <XCircle className="h-3 w-3" />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge className={`${getGradeColor(grade)} ${sizeClasses[size]} gap-1`}>
      {getIcon(grade)}
      <span className="font-bold">{grade}</span>
      {showScore && <span className="opacity-80">({score})</span>}
    </Badge>
  );
}

export default CreativeQualityBadge;
