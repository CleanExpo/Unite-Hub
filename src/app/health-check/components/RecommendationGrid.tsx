/**
 * Recommendation Grid Component
 * Priority matrix of actionable insights (impact vs effort)
 *
 * Features:
 * - 2x2 priority matrix layout
 * - Impact and effort scoring
 * - Visual priority indicators
 * - Action buttons
 */

'use client';

import { Zap, Target, Lightbulb, BookOpen } from 'lucide-react';

interface ActionableInsight {
  title: string;
  impact: string;
  effort: string;
  description?: string;
}

interface RecommendationGridProps {
  insights: ActionableInsight[];
}

export function RecommendationGrid({ insights }: RecommendationGridProps) {
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-text-secondary text-sm">
          No recommendations yet. Run an analysis to get actionable insights.
        </p>
      </div>
    );
  }

  // Parse impact and effort levels
  const parseLevel = (level: string): 'high' | 'medium' | 'low' => {
    const lower = level?.toLowerCase() || 'low';
    if (lower.includes('high')) return 'high';
    if (lower.includes('medium')) return 'medium';
    return 'low';
  };

  // Categorize insights by impact/effort
  const getQuadrant = (impact: string, effort: string) => {
    const impactLevel = parseLevel(impact);
    const effortLevel = parseLevel(effort);

    if (impactLevel === 'high' && effortLevel === 'low') return 'quick-wins';
    if (impactLevel === 'high' && effortLevel === 'medium') return 'strategic';
    if (impactLevel === 'high' && effortLevel === 'high') return 'major-projects';
    return 'nice-to-have';
  };

  const quickWins = insights.filter(
    (i) => getQuadrant(i.impact, i.effort) === 'quick-wins',
  );
  const strategic = insights.filter((i) => getQuadrant(i.impact, i.effort) === 'strategic');
  const majorProjects = insights.filter(
    (i) => getQuadrant(i.impact, i.effort) === 'major-projects',
  );
  const niceToHave = insights.filter((i) => getQuadrant(i.impact, i.effort) === 'nice-to-have');

  const QuadrantCard = ({
    title,
    subtitle,
    icon: Icon,
    items,
    color,
  }: {
    title: string;
    subtitle: string;
    icon: React.ComponentType<any>;
    items: ActionableInsight[];
    color: string;
  }) => (
    <div className={`rounded-lg border-2 p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5" />
        <div>
          <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
          <p className="text-xs text-text-secondary">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-text-secondary italic py-2">None yet</p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="p-2 bg-bg-primary rounded border border-border">
              <p className="text-sm font-medium text-text-primary">{item.title}</p>
              {item.description && (
                <p className="text-xs text-text-secondary mt-1">{item.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-bg-card rounded-lg border border-border p-6">
      <h2 className="text-2xl font-bold text-text-primary mb-2">Recommendations</h2>
      <p className="text-text-secondary mb-6">
        Prioritized by impact and implementation effort
      </p>

      {/* 2x2 Priority Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Quick Wins: High Impact, Low Effort */}
        <QuadrantCard
          title="Quick Wins"
          subtitle="High impact, low effort"
          icon={Zap}
          items={quickWins}
          color="border-green-200 bg-green-50"
        />

        {/* Strategic: High Impact, Medium+ Effort */}
        <QuadrantCard
          title="Strategic Projects"
          subtitle="High impact, medium-high effort"
          icon={Target}
          items={strategic}
          color="border-blue-200 bg-blue-50"
        />

        {/* Major Projects: High Impact, High Effort */}
        <QuadrantCard
          title="Major Projects"
          subtitle="Highest impact, highest effort"
          icon={Lightbulb}
          items={majorProjects}
          color="border-purple-200 bg-purple-50"
        />

        {/* Nice to Have: Low Impact */}
        <QuadrantCard
          title="Nice to Have"
          subtitle="Lower impact or effort intensive"
          icon={BookOpen}
          items={niceToHave}
          color="border-gray-200 bg-gray-50"
        />
      </div>

      {/* Implementation Guide */}
      <div className="space-y-4 p-4 bg-bg-primary rounded-lg border border-border">
        <h3 className="font-semibold text-text-primary">Implementation Strategy</h3>

        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                1
              </div>
            </div>
            <div>
              <p className="font-medium text-text-primary">Start with Quick Wins</p>
              <p className="text-text-secondary">
                Implement high-impact, low-effort items first to build momentum
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                2
              </div>
            </div>
            <div>
              <p className="font-medium text-text-primary">Plan Strategic Projects</p>
              <p className="text-text-secondary">
                Schedule medium-effort, high-impact work with clear timelines
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs">
                3
              </div>
            </div>
            <div>
              <p className="font-medium text-text-primary">Queue Major Projects</p>
              <p className="text-text-secondary">
                Plan long-term initiatives that require significant resources
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-700">{quickWins.length}</div>
          <div className="text-xs text-green-600">Quick Wins</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{strategic.length}</div>
          <div className="text-xs text-blue-600">Strategic</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">{majorProjects.length}</div>
          <div className="text-xs text-purple-600">Major</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-700">{niceToHave.length}</div>
          <div className="text-xs text-gray-600">Optional</div>
        </div>
      </div>
    </div>
  );
}
