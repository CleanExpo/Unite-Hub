'use client';

/**
 * DecisionScenarioCard Component
 *
 * Compact card displaying a decision scenario summary.
 */

import React from 'react';
import {
  Target,
  DollarSign,
  Users,
  Package,
  Megaphone,
  Scale,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Brain,
} from 'lucide-react';
import Link from 'next/link';

type ScenarioType =
  | 'pricing_change'
  | 'new_product'
  | 'hiring'
  | 'marketing_campaign'
  | 'partnership'
  | 'market_expansion'
  | 'cost_reduction'
  | 'other';

type ScenarioStatus = 'draft' | 'simulated' | 'decided' | 'executed' | 'reviewed';

interface DecisionScenario {
  id: string;
  scenarioType: ScenarioType;
  title: string;
  description: string;
  aiRecommendation: string;
  confidenceScore: number;
  status: ScenarioStatus;
  createdAt: string;
}

interface DecisionScenarioCardProps {
  scenario: DecisionScenario;
  className?: string;
}

const TYPE_CONFIG: Record<ScenarioType, { icon: React.ElementType; color: string }> = {
  pricing_change: { icon: DollarSign, color: 'text-green-500' },
  new_product: { icon: Package, color: 'text-blue-500' },
  hiring: { icon: Users, color: 'text-purple-500' },
  marketing_campaign: { icon: Megaphone, color: 'text-orange-500' },
  partnership: { icon: Scale, color: 'text-cyan-500' },
  market_expansion: { icon: TrendingUp, color: 'text-emerald-500' },
  cost_reduction: { icon: TrendingDown, color: 'text-red-500' },
  other: { icon: Target, color: 'text-gray-500' },
};

const STATUS_CONFIG: Record<ScenarioStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  simulated: { label: 'Simulated', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  decided: { label: 'Decided', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  executed: { label: 'Executed', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  reviewed: { label: 'Reviewed', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
};

export function DecisionScenarioCard({ scenario, className = '' }: DecisionScenarioCardProps) {
  const typeConfig = TYPE_CONFIG[scenario.scenarioType] || TYPE_CONFIG.other;
  const statusConfig = STATUS_CONFIG[scenario.status] || STATUS_CONFIG.draft;
  const TypeIcon = typeConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link
      href={`/founder/cognitive-twin/decision-scenarios?id=${scenario.id}`}
      className={`group block rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md ${className}`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
          <h4 className="line-clamp-1 font-medium">{scenario.title}</h4>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>

      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{scenario.description}</p>

      {scenario.aiRecommendation && (
        <div className="mb-3 rounded-lg bg-primary/5 p-2">
          <div className="flex items-start gap-2">
            <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {scenario.aiRecommendation}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{formatDate(scenario.createdAt)}</span>
          {scenario.confidenceScore > 0 && (
            <span>{Math.round(scenario.confidenceScore * 100)}% confidence</span>
          )}
        </div>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default DecisionScenarioCard;
