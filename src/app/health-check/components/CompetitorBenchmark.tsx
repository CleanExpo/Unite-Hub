/**
 * Competitor Benchmark Component
 * Side-by-side comparison of competitors vs current domain
 *
 * Features:
 * - Top 3 competitor comparison
 * - Health score deltas
 * - Visual ranking indicators
 * - Current domain highlighting
 */

'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface Competitor {
  domain: string;
  health_score: number;
}

interface CompetitorBenchmarkProps {
  competitors: Competitor[];
  currentDomain?: string;
}

export function CompetitorBenchmark({ competitors, currentDomain }: CompetitorBenchmarkProps) {
  if (!competitors || competitors.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-text-secondary text-sm">No competitor data available yet</p>
      </div>
    );
  }

  // Sort by health score descending, take top 3
  const topCompetitors = [...competitors]
    .sort((a, b) => b.health_score - a.health_score)
    .slice(0, 3);

  // Calculate current domain score (assume we have one)
  const currentScore = competitors.find(
    (c) => c.domain.toLowerCase() === currentDomain?.toLowerCase(),
  )?.health_score || 0;

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  const calculateDelta = (competitorScore: number) => {
    if (currentScore === 0) return 0;
    return competitorScore - currentScore;
  };

  return (
    <div className="bg-bg-card rounded-lg border border-border p-6">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Competitor Benchmarking</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topCompetitors.map((competitor, index) => {
          const delta = calculateDelta(competitor.health_score);
          const isCurrentDomain =
            competitor.domain.toLowerCase() === currentDomain?.toLowerCase();

          return (
            <div
              key={competitor.domain}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                isCurrentDomain
                  ? 'border-accent-500 bg-accent-500/5'
                  : `border-border ${getScoreBgColor(competitor.health_score)}`
              }`}
            >
              {/* Ranking Badge */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-500 text-white text-xs font-bold">
                  {index + 1}
                </span>
              </div>

              {/* Domain */}
              <div className="mb-4 pr-8">
                <h3 className="font-semibold text-text-primary truncate">{competitor.domain}</h3>
                {isCurrentDomain && (
                  <span className="text-xs text-accent-500 font-medium">Your Domain</span>
                )}
              </div>

              {/* Score */}
              <div className="mb-4">
                <div
                  className={`text-3xl font-bold ${getScoreTextColor(competitor.health_score)}`}
                >
                  {competitor.health_score}
                </div>
                <div className="text-xs text-text-secondary mt-1">Health Score</div>
              </div>

              {/* Delta */}
              {!isCurrentDomain && currentScore > 0 && (
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  {delta > 0 ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">
                        {Math.abs(delta).toFixed(1)} points behind
                      </span>
                    </>
                  ) : delta < 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {Math.abs(delta).toFixed(1)} points ahead
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-text-secondary">Tied</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Key Insights */}
      <div className="mt-6 p-4 bg-bg-primary rounded-lg border border-border">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Insights</h4>
        <ul className="space-y-2">
          {currentScore > 0 ? (
            <>
              <li className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-accent-500 font-bold">•</span>
                {currentScore >= topCompetitors[0]?.health_score
                  ? `You're leading the competition with a ${currentScore} score`
                  : `You're ${(topCompetitors[0]?.health_score - currentScore).toFixed(1)} points behind the leader`}
              </li>
              <li className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-accent-500 font-bold">•</span>
                Average competitor score:{' '}
                {(topCompetitors.reduce((sum, c) => sum + c.health_score, 0) / topCompetitors.length).toFixed(1)}
              </li>
            </>
          ) : (
            <li className="text-sm text-text-secondary flex items-start gap-2">
              <span className="text-accent-500 font-bold">•</span>
              Analyze your website first to compare against competitors
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
