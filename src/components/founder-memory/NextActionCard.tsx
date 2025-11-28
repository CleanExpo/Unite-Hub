'use client';

/**
 * NextActionCard Component
 *
 * Displays a recommended next action with urgency and impact indicators.
 */

import React from 'react';
import {
  Zap,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  MessageSquare,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface NextAction {
  id: string;
  category: string;
  urgency: string;
  title: string;
  description: string;
  reasoning: string;
  estimatedImpact: string;
  estimatedEffort: string;
}

interface NextActionCardProps {
  action: NextAction;
  onClick?: () => void;
  className?: string;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  client_outreach: { icon: MessageSquare, color: 'text-blue-500' },
  follow_up: { icon: Clock, color: 'text-orange-500' },
  proposal: { icon: FileText, color: 'text-purple-500' },
  meeting: { icon: Users, color: 'text-cyan-500' },
  revenue: { icon: DollarSign, color: 'text-green-500' },
  risk_mitigation: { icon: AlertTriangle, color: 'text-red-500' },
  opportunity: { icon: Target, color: 'text-amber-500' },
  growth: { icon: TrendingUp, color: 'text-emerald-500' },
};

const URGENCY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  immediate: {
    label: 'Now',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  today: {
    label: 'Today',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  this_week: {
    label: 'This Week',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  next_week: {
    label: 'Next Week',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  this_month: {
    label: 'This Month',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
  },
};

const IMPACT_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: 'High Impact', color: 'text-green-600 dark:text-green-400' },
  medium: { label: 'Medium Impact', color: 'text-yellow-600 dark:text-yellow-400' },
  low: { label: 'Low Impact', color: 'text-gray-600 dark:text-gray-400' },
};

const EFFORT_CONFIG: Record<string, { label: string; color: string }> = {
  minimal: { label: '5 min', color: 'text-green-600' },
  low: { label: '15 min', color: 'text-green-500' },
  medium: { label: '30 min', color: 'text-yellow-500' },
  high: { label: '1+ hr', color: 'text-orange-500' },
};

export function NextActionCard({ action, onClick, className = '' }: NextActionCardProps) {
  const category = CATEGORY_CONFIG[action.category] || { icon: Zap, color: 'text-primary' };
  const CategoryIcon = category.icon;

  const urgency = URGENCY_CONFIG[action.urgency] || URGENCY_CONFIG.this_week;
  const impact = IMPACT_CONFIG[action.estimatedImpact] || IMPACT_CONFIG.medium;
  const effort = EFFORT_CONFIG[action.estimatedEffort] || EFFORT_CONFIG.medium;

  return (
    <div
      className={`group rounded-lg border bg-card p-3 transition-all hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`rounded-md bg-primary/10 p-1.5 ${category.color}`}>
            <CategoryIcon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="line-clamp-1 font-medium">{action.title}</h4>
            <p className="text-xs text-muted-foreground capitalize">
              {action.category.replace('_', ' ')}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${urgency.bgColor} ${urgency.color}`}
        >
          {urgency.label}
        </span>
      </div>

      <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{action.description}</p>

      {action.reasoning && (
        <p className="mb-3 line-clamp-1 text-xs italic text-muted-foreground/80">
          Why: {action.reasoning}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs">
        <div className={`flex items-center gap-1 ${impact.color}`}>
          <TrendingUp className="h-3 w-3" />
          {impact.label}
        </div>
        <div className={`flex items-center gap-1 ${effort.color}`}>
          <Clock className="h-3 w-3" />
          {effort.label}
        </div>
      </div>
    </div>
  );
}

export default NextActionCard;
