'use client';

/**
 * AudienceScores Component
 *
 * Displays engagement scores, personas, and tags for audience contacts.
 * Supports AI persona classification.
 *
 * Phase: B11 - Audience Scoring + Smart Tags
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Loader2,
  Brain,
  Activity,
  Users,
} from 'lucide-react';

interface AudienceScore {
  id: string;
  contactId: string;
  tenantId: string;
  engagementScore: number;
  activityVector: Record<string, number>;
  lastEventAt: string | null;
  persona: string | null;
  personaConfidence: number | null;
  tags: string[];
  totalEvents: number;
  positiveSignals: number;
  negativeSignals: number;
  createdAt: string;
  updatedAt: string;
}

interface AudienceScoresProps {
  tenantId: string;
}

export default function AudienceScores({ tenantId }: AudienceScoresProps) {
  const [scores, setScores] = useState<AudienceScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadScores = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/synthex/audience/score?tenantId=${tenantId}&limit=50`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load scores');
      }

      setScores(data.scores || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scores');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const classifyPersona = async (contactId: string) => {
    setClassifying(contactId);

    try {
      const res = await fetch('/api/synthex/audience/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, contactId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to classify persona');
      }

      // Reload scores to show updated persona
      await loadScores();
    } catch (err) {
      console.error('Failed to classify:', err);
    } finally {
      setClassifying(null);
    }
  };

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const getScoreTrend = (score: AudienceScore) => {
    if (score.positiveSignals > score.negativeSignals) {
      return { icon: TrendingUp, color: 'text-green-400' };
    } else if (score.negativeSignals > score.positiveSignals) {
      return { icon: TrendingDown, color: 'text-red-400' };
    }
    return { icon: Minus, color: 'text-gray-400' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 50) return 'text-green-400';
    if (score >= 20) return 'text-yellow-400';
    if (score >= 0) return 'text-gray-400';
    return 'text-red-400';
  };

  const getPersonaBadgeColor = (persona: string | null) => {
    if (!persona) return 'bg-gray-700 text-gray-400';

    const colors: Record<string, string> = {
      'Early Adopter': 'bg-purple-500/20 text-purple-400',
      'Power User': 'bg-blue-500/20 text-blue-400',
      'Brand Loyalist': 'bg-green-500/20 text-green-400',
      'Price Conscious': 'bg-yellow-500/20 text-yellow-400',
      'At-Risk': 'bg-red-500/20 text-red-400',
      'Window Shopper': 'bg-orange-500/20 text-orange-400',
      'New Prospect': 'bg-cyan-500/20 text-cyan-400',
    };

    return colors[persona] || 'bg-gray-600 text-gray-300';
  };

  if (!tenantId) {
    return (
      <div className="py-12 text-center">
        <BarChart3 className="h-12 w-12 text-gray-700 mx-auto mb-4" />
        <p className="text-gray-500">Enter tenant ID to view engagement scores</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
        <p className="text-gray-500 mt-4">Loading scores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="py-12 text-center">
        <Activity className="h-12 w-12 text-gray-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Scores Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Engagement scores are created when contacts interact with your campaigns.
          Track opens, clicks, conversions, and more.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{scores.length}</p>
                <p className="text-sm text-gray-500">Scored Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">
                  {scores.filter((s) => s.engagementScore >= 50).length}
                </p>
                <p className="text-sm text-gray-500">High Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">
                  {scores.filter((s) => s.persona).length}
                </p>
                <p className="text-sm text-gray-500">Classified Personas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">
                  {scores.reduce((sum, s) => sum + s.totalEvents, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scores.map((score) => {
          const Trend = getScoreTrend(score);
          return (
            <Card key={score.id} className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`text-3xl font-bold ${getScoreColor(score.engagementScore)}`}>
                      {score.engagementScore}
                    </p>
                    <p className="text-sm text-gray-500">Engagement Score</p>
                  </div>
                  <Trend.icon className={`h-5 w-5 ${Trend.color}`} />
                </div>

                {/* Persona */}
                <div className="mb-4">
                  {score.persona ? (
                    <div className="flex items-center gap-2">
                      <Badge className={getPersonaBadgeColor(score.persona)}>
                        {score.persona}
                      </Badge>
                      {score.personaConfidence && (
                        <span className="text-xs text-gray-500">
                          {Math.round(score.personaConfidence * 100)}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-400 hover:text-gray-100"
                      onClick={() => classifyPersona(score.contactId)}
                      disabled={classifying === score.contactId}
                    >
                      {classifying === score.contactId ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Classifying...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Classify Persona
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Tags */}
                {score.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {score.tags.map((tag, i) => (
                      <Badge key={i} className="bg-gray-700 text-gray-300 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Activity Vector */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Total Events</span>
                    <span className="text-gray-100">{score.totalEvents}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Positive / Negative</span>
                    <span>
                      <span className="text-green-400">{score.positiveSignals}</span>
                      {' / '}
                      <span className="text-red-400">{score.negativeSignals}</span>
                    </span>
                  </div>
                  {score.lastEventAt && (
                    <div className="flex justify-between text-gray-400">
                      <span>Last Activity</span>
                      <span className="text-gray-100">
                        {new Date(score.lastEventAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Activity Vector Details */}
                {Object.keys(score.activityVector).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Activity Breakdown</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(score.activityVector).map(([type, count]) => (
                        <Badge
                          key={type}
                          className={`text-xs ${
                            type === 'conversion'
                              ? 'bg-green-500/20 text-green-400'
                              : type === 'unsubscribe' || type === 'bounce'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {type}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
