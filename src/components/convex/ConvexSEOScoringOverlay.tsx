'use client';

/**
 * CONVEX SEO Scoring Overlay Component
 *
 * Displays detailed CONVEX SEO scoring with 3-pillar analysis:
 * - Technical SEO (Core Web Vitals, mobile-friendliness, site structure)
 * - Topical Authority (content depth, keyword coverage, subtopic completeness)
 * - Domain Authority (backlinks, E-E-A-T, brand signals)
 *
 * Includes:
 * - 3-pillar score breakdown with detailed metrics
 * - Semantic clustering visualization
 * - Content gap identification
 * - Competitor benchmarking
 * - Ranking prediction timeline
 * - Actionable recommendations
 *
 * Performance Target: <200ms scoring calculation, <500ms display render
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  AlertCircle,
  TrendingUp,
  Eye,
  Link2,
  Search,
  Target,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

interface TechnicalScore {
  coreWebVitals: number; // LCP, FID, CLS
  mobileOptimization: number;
  siteStructure: number; // crawlability, indexation
  pageSpeed: number;
  overallTechnical: number; // 0-100
}

interface TopicalScore {
  contentDepth: number; // word count, comprehensiveness
  keywordCoverage: number; // primary + LSI keywords
  subtopicCompleteness: number; // pillar-to-subtopic depth
  contentFreshness: number; // update frequency
  overallTopical: number; // 0-100
}

interface AuthorityScore {
  backlinks: number; // quantity + quality
  domainAge: number; // trust signal
  brandMentions: number; // off-page E-E-A-T
  eeatSignals: number; // expertise, authority, trustworthiness
  overallAuthority: number; // 0-100
}

interface SemanticCluster {
  intent: 'awareness' | 'consideration' | 'decision';
  keywords: string[];
  contentGap: boolean;
  opportunity: 'easy' | 'medium' | 'hard';
}

interface RankingPrediction {
  timeframe: '1-3 months' | '3-6 months' | '6-12 months';
  position: number; // predicted ranking position
  confidence: number; // 0-100
  requiredActions: string[];
}

interface SEOScoringResult {
  domain: string;
  primaryKeyword: string;
  technical: TechnicalScore;
  topical: TopicalScore;
  authority: AuthorityScore;
  overallScore: number; // weighted: 35% technical, 40% topical, 25% authority
  semanticClusters: SemanticCluster[];
  contentGaps: string[];
  competitorBenchmarks: {
    competitor: string;
    overallScore: number;
  }[];
  rankingPrediction: RankingPrediction;
  recommendations: string[];
  scoredAt: Date;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface ConvexSEOScoringOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  primaryKeyword: string;
  onScoreComplete?: (result: SEOScoringResult) => void;
}

export function ConvexSEOScoringOverlay({
  isOpen,
  onClose,
  domain,
  primaryKeyword,
  onScoreComplete,
}: ConvexSEOScoringOverlayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SEOScoringResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  // Fetch SEO scoring
  const handleCalculateScore = async () => {
    setIsLoading(true);
    setError(null);
    logger.info(`[CONVEX-SEO] Calculating SEO score for ${domain} targeting "${primaryKeyword}"`);

    try {
      const response = await fetch('/api/convex/score-seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          primaryKeyword,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate SEO score');
      }

      const data = await response.json();
      setResult(data);
      logger.info('[CONVEX-SEO] Score calculated successfully');

      if (onScoreComplete) {
        onScoreComplete(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      logger.error('[CONVEX-SEO] Score calculation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Score color mapping
  const getScoreColor = (score: number): string => {
    if (score >= 80) {
return 'text-green-600';
}
    if (score >= 60) {
return 'text-yellow-600';
}
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (
    score: number
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 80) {
return 'default';
}
    if (score >= 60) {
return 'secondary';
}
    return 'destructive';
  };

  if (!isOpen) {
return null;
}

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="sticky top-0 bg-bg-card z-10 border-b dark:border-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>CONVEX SEO Score Analysis</CardTitle>
              <CardDescription>
                3-pillar assessment: Technical (35%) + Topical (40%) + Authority (25%)
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Input Section */}
          {!result && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Domain:</strong> {domain}
                </p>
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Primary Keyword:</strong> {primaryKeyword}
                </p>
              </div>

              <Button
                onClick={handleCalculateScore}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Calculating Score...' : 'Calculate SEO Score'}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Results View */}
          {result && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                  <CardContent className="pt-6 text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(result.overallScore)}`}>
                      {result.overallScore}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">Overall Score</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
                  <CardContent className="pt-6 text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(result.technical.overallTechnical)}`}>
                      {result.technical.overallTechnical}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">Technical (35%)</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700">
                  <CardContent className="pt-6 text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(result.topical.overallTopical)}`}>
                      {result.topical.overallTopical}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">Topical (40%)</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700">
                  <CardContent className="pt-6 text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(result.authority.overallAuthority)}`}>
                      {result.authority.overallAuthority}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">Authority (25%)</div>
                  </CardContent>
                </Card>
              </div>

              {/* 3-Pillar Breakdown */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    3-Pillar Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Technical Pillar */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold">Technical SEO</span>
                        <span className="text-sm font-bold">{result.technical.overallTechnical}/100</span>
                      </div>
                      <Progress value={result.technical.overallTechnical} className="h-2" />
                      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mt-2">
                        <div>Core Web Vitals: {result.technical.coreWebVitals}</div>
                        <div>Mobile: {result.technical.mobileOptimization}</div>
                        <div>Site Structure: {result.technical.siteStructure}</div>
                        <div>Page Speed: {result.technical.pageSpeed}</div>
                      </div>
                    </div>

                    {/* Topical Pillar */}
                    <div className="space-y-2 pt-4 border-t dark:border-gray-700">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold">Topical Authority</span>
                        <span className="text-sm font-bold">{result.topical.overallTopical}/100</span>
                      </div>
                      <Progress value={result.topical.overallTopical} className="h-2" />
                      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mt-2">
                        <div>Content Depth: {result.topical.contentDepth}</div>
                        <div>Keyword Coverage: {result.topical.keywordCoverage}</div>
                        <div>Subtopic Completeness: {result.topical.subtopicCompleteness}</div>
                        <div>Freshness: {result.topical.contentFreshness}</div>
                      </div>
                    </div>

                    {/* Authority Pillar */}
                    <div className="space-y-2 pt-4 border-t dark:border-gray-700">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold">Domain Authority</span>
                        <span className="text-sm font-bold">{result.authority.overallAuthority}/100</span>
                      </div>
                      <Progress value={result.authority.overallAuthority} className="h-2" />
                      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mt-2">
                        <div>Backlinks: {result.authority.backlinks}</div>
                        <div>Domain Age: {result.authority.domainAge}</div>
                        <div>Brand Mentions: {result.authority.brandMentions}</div>
                        <div>E-E-A-T: {result.authority.eeatSignals}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Semantic Clustering */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Semantic Keyword Clusters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.semanticClusters.map((cluster, idx) => (
                      <div key={idx} className="border dark:border-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {cluster.intent === 'awareness'
                                ? 'Awareness'
                                : cluster.intent === 'consideration'
                                  ? 'Consideration'
                                  : 'Decision'}
                            </Badge>
                            {cluster.contentGap && (
                              <Badge variant="destructive">Content Gap</Badge>
                            )}
                          </div>
                          <span className="text-xs text-text-secondary">
                            {cluster.opportunity} opportunity
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cluster.keywords.map((keyword, kidx) => (
                            <span
                              key={kidx}
                              className="text-xs bg-bg-hover px-2 py-1 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Content Gaps */}
              {result.contentGaps.length > 0 && (
                <Card className="dark:bg-gray-800 dark:border-gray-700 border-2 border-orange-200 dark:border-orange-900">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      Content Gaps Identified
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.contentGaps.map((gap, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
                          <ArrowRight className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Competitor Benchmarking */}
              {result.competitorBenchmarks.length > 0 && (
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Competitor Benchmarking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.competitorBenchmarks.map((comp, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{comp.competitor}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={comp.overallScore} className="w-24 h-2" />
                            <span className="text-sm font-bold">{comp.overallScore}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ranking Prediction */}
              <Card className="dark:bg-gray-800 dark:border-gray-700 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Ranking Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-text-secondary">Predicted Position</div>
                      <div className="text-2xl font-bold text-blue-600">
                        #{result.rankingPrediction.position}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-text-secondary">Confidence</div>
                      <div className="text-2xl font-bold text-green-600">
                        {result.rankingPrediction.confidence}%
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary mb-2">Timeframe</div>
                    <Badge>{result.rankingPrediction.timeframe}</Badge>
                  </div>
                  {result.rankingPrediction.requiredActions.length > 0 && (
                    <div className="pt-2 border-t dark:border-gray-700">
                      <div className="text-sm font-semibold mb-2">Required Actions:</div>
                      <ul className="space-y-1">
                        {result.rankingPrediction.requiredActions.map((action, idx) => (
                          <li key={idx} className="text-sm text-text-secondary flex items-center gap-2">
                            <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Actionable Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
                          <div className="h-2 w-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Close Button */}
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ConvexSEOScoringOverlay;
