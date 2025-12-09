'use client';

/**
 * DigestSummaryCard Component
 *
 * Compact card displaying a weekly digest summary.
 */

import React from 'react';
import { Calendar, Trophy, AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DigestSummary {
  id: string;
  weekStart: string;
  weekEnd: string;
  executiveSummary: string;
  winsCount: number;
  risksCount: number;
  opportunitiesCount: number;
  overallMomentum: number;
}

interface DigestSummaryCardProps {
  digest: DigestSummary;
  className?: string;
}

export function DigestSummaryCard({ digest, className = '' }: DigestSummaryCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getMomentumColor = (score: number) => {
    if (score >= 80) {
return 'text-green-600 dark:text-green-400';
}
    if (score >= 60) {
return 'text-yellow-600 dark:text-yellow-400';
}
    if (score >= 40) {
return 'text-orange-600 dark:text-orange-400';
}
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Link
      href={`/founder/cognitive-twin/weekly-digest?id=${digest.id}`}
      className={`group block rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium">
            {formatDate(digest.weekStart)} - {formatDate(digest.weekEnd)}
          </span>
        </div>
        <div className={`text-lg font-bold ${getMomentumColor(digest.overallMomentum)}`}>
          {digest.overallMomentum}
        </div>
      </div>

      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{digest.executiveSummary}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Trophy className="h-3.5 w-3.5" />
            <span>{digest.winsCount} wins</span>
          </div>
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{digest.risksCount} risks</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>{digest.opportunitiesCount} opps</span>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default DigestSummaryCard;
