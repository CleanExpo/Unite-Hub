'use client';

/**
 * OpportunityCard Component
 *
 * Displays a single opportunity with key metrics and status.
 */

import React from 'react';
import { Lightbulb, DollarSign, Clock, TrendingUp } from 'lucide-react';

interface Opportunity {
  id: string;
  category: string;
  title: string;
  description: string;
  potentialValue: number;
  confidenceScore: number;
  urgencyScore: number;
  status: string;
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick?: () => void;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  upsell: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cross_sell: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  new_business: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  partnership: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  expansion: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  referral: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500',
  evaluating: 'bg-yellow-500',
  pursuing: 'bg-green-500',
  won: 'bg-emerald-500',
  lost: 'bg-red-500',
  deferred: 'bg-gray-500',
};

export function OpportunityCard({ opportunity, onClick, className = '' }: OpportunityCardProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const categoryColor =
    CATEGORY_COLORS[opportunity.category] ||
    'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';

  const statusColor = STATUS_COLORS[opportunity.status] || 'bg-gray-500';

  const getUrgencyLabel = (score: number) => {
    if (score >= 80) {
return 'Urgent';
}
    if (score >= 60) {
return 'High';
}
    if (score >= 40) {
return 'Medium';
}
    return 'Low';
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 80) {
return 'text-red-500';
}
    if (score >= 60) {
return 'text-orange-500';
}
    if (score >= 40) {
return 'text-yellow-500';
}
    return 'text-green-500';
  };

  return (
    <div
      className={`group rounded-lg border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-accent/50 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 shrink-0 text-green-500" />
          <h4 className="line-clamp-1 font-medium">{opportunity.title}</h4>
        </div>
        <div className={`h-2 w-2 rounded-full ${statusColor}`} title={opportunity.status} />
      </div>

      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
        {opportunity.description}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor}`}>
          {opportunity.category.replace('_', ' ')}
        </span>

        <div className="flex items-center gap-1 text-sm">
          <DollarSign className="h-3 w-3 text-green-500" />
          <span className="font-medium text-green-600 dark:text-green-400">
            {formatCurrency(opportunity.potentialValue)}
          </span>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <TrendingUp className="h-3 w-3 text-blue-500" />
          <span className="text-muted-foreground">
            {Math.round(opportunity.confidenceScore * 100)}%
          </span>
        </div>

        <div className={`flex items-center gap-1 text-xs ${getUrgencyColor(opportunity.urgencyScore)}`}>
          <Clock className="h-3 w-3" />
          {getUrgencyLabel(opportunity.urgencyScore)}
        </div>
      </div>
    </div>
  );
}

export default OpportunityCard;
