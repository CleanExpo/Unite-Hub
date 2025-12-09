'use client';

/**
 * LeadScoringPanel Component
 *
 * Displays lead scores, churn risk, LTV estimates, and journey maps.
 * Supports running AI analysis on contacts.
 *
 * Phase: B12 - Lead Scoring + Churn AI + LTV + Journey Mapping
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Map,
  Loader2,
  Play,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
} from 'lucide-react';

interface LeadModel {
  id: string;
  contactId: string;
  leadScore: number;
  leadGrade: string | null;
  churnRisk: number;
  churnFactors: string[];
  ltvEstimate: number;
  ltvConfidence: number | null;
  journey: JourneyMap | null;
  currentStage: string | null;
  lastComputedAt: string;
}

interface JourneyMap {
  stages: Array<{ name: string; events?: string[] }>;
  bottlenecks: string[];
  recommendations: string[];
}

interface LeadScoringPanelProps {
  tenantId: string;
}

export default function LeadScoringPanel({ tenantId }: LeadScoringPanelProps) {
  const [leadModels, setLeadModels] = useState<LeadModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLeadModels = useCallback(async () => {
    if (!tenantId) {
return;
}

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/synthex/lead?tenantId=${tenantId}&limit=50`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load lead models');
      }

      setLeadModels(data.leadModels || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lead models');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadLeadModels();
  }, [loadLeadModels]);

  const getGradeBadgeColor = (grade: string | null) => {
    switch (grade) {
      case 'A':
        return 'bg-green-500/20 text-green-400';
      case 'B':
        return 'bg-blue-500/20 text-blue-400';
      case 'C':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'D':
        return 'bg-orange-500/20 text-orange-400';
      case 'F':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-700 text-gray-400';
    }
  };

  const getChurnRiskColor = (risk: number) => {
    if (risk >= 0.7) {
return 'text-red-400';
}
    if (risk >= 0.4) {
return 'text-yellow-400';
}
    return 'text-green-400';
  };

  const getStageBadgeColor = (stage: string | null) => {
    const colors: Record<string, string> = {
      awareness: 'bg-purple-500/20 text-purple-400',
      consideration: 'bg-blue-500/20 text-blue-400',
      decision: 'bg-yellow-500/20 text-yellow-400',
      retention: 'bg-green-500/20 text-green-400',
      advocacy: 'bg-cyan-500/20 text-cyan-400',
    };
    return stage ? colors[stage] || 'bg-gray-700 text-gray-400' : 'bg-gray-700 text-gray-400';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!tenantId) {
    return (
      <div className="py-12 text-center">
        <Target className="h-12 w-12 text-gray-700 mx-auto mb-4" />
        <p className="text-gray-500">Enter tenant ID to view lead intelligence</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
        <p className="text-gray-500 mt-4">Loading lead models...</p>
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

  if (leadModels.length === 0) {
    return (
      <div className="py-12 text-center">
        <Zap className="h-12 w-12 text-gray-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Lead Models Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Run lead analysis on contacts to generate scores, churn predictions, LTV estimates, and journey maps.
        </p>
      </div>
    );
  }

  // Summary stats
  const avgScore = Math.round(leadModels.reduce((sum, m) => sum + m.leadScore, 0) / leadModels.length);
  const highRisk = leadModels.filter((m) => m.churnRisk >= 0.7).length;
  const totalLTV = leadModels.reduce((sum, m) => sum + m.ltvEstimate, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{leadModels.length}</p>
                <p className="text-sm text-gray-500">Lead Models</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{avgScore}</p>
                <p className="text-sm text-gray-500">Avg Lead Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{highRisk}</p>
                <p className="text-sm text-gray-500">High Churn Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{formatCurrency(totalLTV)}</p>
                <p className="text-sm text-gray-500">Total LTV</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {leadModels.map((model) => {
          const isExpanded = expandedId === model.id;
          return (
            <Card key={model.id} className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-100">{model.leadScore}</p>
                      <Badge className={getGradeBadgeColor(model.leadGrade)}>
                        Grade {model.leadGrade || '?'}
                      </Badge>
                    </div>
                  </div>
                  {model.currentStage && (
                    <Badge className={getStageBadgeColor(model.currentStage)}>
                      {model.currentStage}
                    </Badge>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={`h-4 w-4 ${getChurnRiskColor(model.churnRisk)}`} />
                      <span className="text-xs text-gray-500">Churn Risk</span>
                    </div>
                    <p className={`text-xl font-bold ${getChurnRiskColor(model.churnRisk)}`}>
                      {(model.churnRisk * 100).toFixed(0)}%
                    </p>
                  </div>

                  <div className="p-3 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-gray-500">LTV Estimate</span>
                    </div>
                    <p className="text-xl font-bold text-green-400">
                      {formatCurrency(model.ltvEstimate)}
                    </p>
                    {model.ltvConfidence && (
                      <p className="text-xs text-gray-500">
                        {Math.round(model.ltvConfidence * 100)}% conf.
                      </p>
                    )}
                  </div>
                </div>

                {/* Churn Factors */}
                {model.churnFactors.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Churn Factors</p>
                    <div className="flex flex-wrap gap-1">
                      {model.churnFactors.slice(0, 3).map((factor, i) => (
                        <Badge key={i} className="bg-red-500/10 text-red-400 text-xs">
                          {factor.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expand/Collapse Journey */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-gray-400 hover:text-gray-100"
                  onClick={() => setExpandedId(isExpanded ? null : model.id)}
                >
                  <Map className="h-4 w-4 mr-2" />
                  Journey Map
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 ml-auto" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  )}
                </Button>

                {/* Expanded Journey Details */}
                {isExpanded && model.journey && (
                  <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                    {/* Stages */}
                    {model.journey.stages?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Journey Stages</p>
                        <div className="flex flex-wrap gap-2">
                          {model.journey.stages.map((stage, i) => (
                            <Badge
                              key={i}
                              className={getStageBadgeColor(stage.name)}
                            >
                              {stage.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottlenecks */}
                    {model.journey.bottlenecks?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Bottlenecks</p>
                        <ul className="text-sm text-red-400 space-y-1">
                          {model.journey.bottlenecks.map((b, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {model.journey.recommendations?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Recommendations</p>
                        <ul className="text-sm text-green-400 space-y-1">
                          {model.journey.recommendations.map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1">✓</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                  Last computed: {new Date(model.lastComputedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
