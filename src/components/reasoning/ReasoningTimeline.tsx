'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface Pass {
  pass_number: number;
  pass_type: string;
  output: string;
  risk_score?: number;
  uncertainty_score?: number;
  duration_ms?: number;
  created_at?: string;
}

interface ReasoningTimelineProps {
  passes: Pass[];
  finalRisk: number;
  finalUncertainty: number;
}

export function ReasoningTimeline({
  passes,
  finalRisk,
  finalUncertainty,
}: ReasoningTimelineProps) {
  const passTypeLabels: Record<string, string> = {
    recall: 'Recall Memories',
    analysis: 'Analyze Context',
    draft: 'Draft Solution',
    refinement: 'Refine Output',
    validation: 'Validate Result',
  };

  const passTypeIcons: Record<string, React.ReactNode> = {
    recall: '🧠',
    analysis: '📊',
    draft: '✍️',
    refinement: '🔄',
    validation: '✅',
  };

  const passColors: Record<string, { bg: string; border: string; text: string }> = {
    recall: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    analysis: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    draft: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    refinement: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    validation: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  };

  // Calculate trend
  const riskTrend = passes.length > 1
    ? passes[passes.length - 1].risk_score! - passes[0].risk_score!
    : 0;

  const uncertaintyTrend = passes.length > 1
    ? passes[passes.length - 1].uncertainty_score! - passes[0].uncertainty_score!
    : 0;

  return (
    <div className="w-full space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Risk Score</div>
                <div className="text-3xl font-bold text-red-600">{finalRisk.toFixed(1)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {riskTrend === 0 ? 'Stable' : riskTrend > 0 ? 'Increasing' : 'Decreasing'}
                </div>
              </div>
              {riskTrend > 0 ? (
                <TrendingUp className="w-8 h-8 text-red-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Uncertainty</div>
                <div className="text-3xl font-bold text-orange-600">{finalUncertainty.toFixed(1)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {uncertaintyTrend === 0 ? 'Stable' : uncertaintyTrend > 0 ? 'Increasing' : 'Decreasing'}
                </div>
              </div>
              {uncertaintyTrend > 0 ? (
                <TrendingUp className="w-8 h-8 text-orange-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Reasoning Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {passes.map((pass, index) => {
              const colors = passColors[pass.pass_type];
              const nextPass = passes[index + 1];

              return (
                <div key={pass.pass_number}>
                  {/* Pass Card */}
                  <div className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{passTypeIcons[pass.pass_type]}</span>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Pass {pass.pass_number}: {passTypeLabels[pass.pass_type]}
                          </div>
                          <div className="text-sm text-gray-600">
                            {pass.created_at && new Date(pass.created_at).toLocaleTimeString()}
                            {pass.duration_ms && ` • ${pass.duration_ms}ms`}
                          </div>
                        </div>
                      </div>
                      <CheckCircle2 className={`w-5 h-5 ${colors.text}`} />
                    </div>

                    {/* Metrics for this pass */}
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-current opacity-50">
                      <div>
                        <div className="text-xs font-medium opacity-75">Risk</div>
                        <div className="text-lg font-semibold">
                          {pass.risk_score?.toFixed(1) || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium opacity-75">Uncertainty</div>
                        <div className="text-lg font-semibold">
                          {pass.uncertainty_score?.toFixed(1) || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium opacity-75">Duration</div>
                        <div className="text-lg font-semibold">
                          {pass.duration_ms ? `${(pass.duration_ms / 1000).toFixed(1)}s` : '-'}
                        </div>
                      </div>
                    </div>

                    {/* Output preview */}
                    {pass.output && (
                      <div className="mt-3 pt-3 border-t border-current opacity-50">
                        <div className="text-xs font-medium opacity-75 mb-2">Output Preview</div>
                        <div className="text-sm line-clamp-2 opacity-75">
                          {pass.output.substring(0, 150)}
                          {pass.output.length > 150 ? '...' : ''}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arrow to next pass */}
                  {nextPass && (
                    <div className="flex justify-center py-2">
                      <div className="text-gray-400">↓</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quality Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Risk Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Risk Level</span>
                <span className="text-sm font-semibold text-red-600">{finalRisk.toFixed(1)}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(finalRisk, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {finalRisk < 30 ? 'Low Risk' : finalRisk < 60 ? 'Medium Risk' : finalRisk < 80 ? 'High Risk' : 'Critical Risk'}
              </div>
            </div>

            {/* Confidence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Confidence</span>
                <span className="text-sm font-semibold text-green-600">{(100 - finalUncertainty).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.max(0, 100 - finalUncertainty)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {finalUncertainty < 20 ? 'Very High Confidence' : finalUncertainty < 40 ? 'High Confidence' : finalUncertainty < 60 ? 'Moderate Confidence' : 'Low Confidence'}
              </div>
            </div>

            {/* Overall Assessment */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium mb-1">Assessment</div>
              <div className="text-xs text-gray-600">
                {finalRisk > 70 ? (
                  <span>⚠️ High risk detected. Recommend review before action.</span>
                ) : finalUncertainty > 60 ? (
                  <span>🤔 High uncertainty. Consider gathering more context.</span>
                ) : (
                  <span>✅ Reasoning appears sound. Safe to proceed.</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
