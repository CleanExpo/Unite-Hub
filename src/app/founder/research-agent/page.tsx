'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { researchAgent, type ResearchResult } from '@/agents/research/researchAgent';

/**
 * Research Agent Demo Dashboard
 *
 * Demonstrates autonomous intelligence gathering with:
 * - Competitive analysis (positioning, marketing, features, sentiment)
 * - Industry trend detection (market shifts, demand, regulation)
 * - Technology monitoring (emerging tools, adoption, integrations)
 * - Algorithm tracking (SEO volatility, ranking changes)
 * - AI model monitoring (releases, benchmarks, capabilities)
 * - Threat detection and risk scoring
 * - Founder alert routing
 *
 * Used by: Founder for strategic intelligence, team for learning
 */

export default function ResearchAgentPage() {
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ResearchResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunDemo = async (category: string) => {
    setIsRunning(true);
    try {
      const query = getQueryForCategory(category);
      const result = await researchAgent.runQuery({
        brand: 'unite_hub',
        query,
        category: category as any,
        urgency: 'high',
      });

      setResults([result, ...results]);
      setSelectedResult(result);
    } catch (error) {
      console.error('Demo query failed:', error);
      alert('Failed to run research query');
    } finally {
      setIsRunning(false);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = [
    { key: 'competitor', label: 'Competitor Analysis', icon: '🎯' },
    { key: 'industry', label: 'Industry Trends', icon: '📊' },
    { key: 'technology', label: 'Technology Monitoring', icon: '🔧' },
    { key: 'algorithm', label: 'Algorithm Tracking', icon: '📈' },
    { key: 'ai_models', label: 'AI Model Releases', icon: '🤖' },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Research Agent Demo</h1>
        <p className="text-gray-600">
          Autonomous intelligence gathering with competitive analysis, trend detection, risk scoring, and founder alerts.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="queries" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queries">Research Queries</TabsTrigger>
          <TabsTrigger value="results">
            Results ({results.length})
          </TabsTrigger>
          <TabsTrigger value="documentation">How It Works</TabsTrigger>
        </TabsList>

        {/* Queries Tab */}
        <TabsContent value="queries" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Card key={cat.key} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <CardTitle className="text-base">{cat.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <button
                    onClick={() => handleRunDemo(cat.key)}
                    disabled={isRunning}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                  >
                    {isRunning ? 'Running...' : 'Run Query'}
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {results.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600 text-center">No research queries run yet. Run a query to see results here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Card
                  key={result.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedResult(result)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg capitalize">{result.query.category}</CardTitle>
                        <CardDescription className="mt-1">{result.query.query}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getThreatLevelColor(result.threatLevel)}>
                          Threat: {result.threatLevel}
                        </Badge>
                        <Badge className={getRiskLevelColor(result.riskAssessment.level)}>
                          Risk: {result.riskAssessment.level}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">{result.summary}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedResult && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>Query Details</CardTitle>
                <CardDescription>
                  {new Date(selectedResult.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Query Info */}
                <div>
                  <h3 className="font-semibold mb-2">Query</h3>
                  <p className="text-sm text-gray-700">{selectedResult.query.query}</p>
                </div>

                {/* Summary */}
                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-sm text-gray-700">{selectedResult.summary}</p>
                </div>

                {/* Threat Assessment */}
                <div>
                  <h3 className="font-semibold mb-2">Threat Assessment</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Threat Level:</span>
                      <Badge className={getThreatLevelColor(selectedResult.threatLevel)}>
                        {selectedResult.threatLevel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Risk Score:</span>
                      <span className="font-semibold">{selectedResult.riskAssessment.score}/100</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Risk Level:</span>
                      <Badge className={getRiskLevelColor(selectedResult.riskAssessment.level)}>
                        {selectedResult.riskAssessment.level}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Risk Reasons */}
                {selectedResult.riskAssessment.reasons.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Risk Factors</h3>
                    <ul className="space-y-1">
                      {selectedResult.riskAssessment.reasons.map((reason, idx) => (
                        <li key={idx} className="text-sm text-gray-700">
                          • {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Insights */}
                <div>
                  <h3 className="font-semibold mb-2">Insights ({selectedResult.insights.length})</h3>
                  <div className="space-y-2">
                    {selectedResult.insights.map((insight, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border">
                        <p className="text-sm font-medium">{insight.insight}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                          <span>Source: {insight.source}</span>
                          <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Themes */}
                {selectedResult.themes && selectedResult.themes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Key Themes</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedResult.themes.map((theme, idx) => (
                        <Badge key={idx} variant="secondary">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {selectedResult.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Recommendations</h3>
                    <ul className="space-y-2">
                      {selectedResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm bg-white p-2 rounded border-l-2 border-blue-400">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Approval Status */}
                <div>
                  <h3 className="font-semibold mb-2">Approval Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Requires Founder Review:</span>
                      <span className="font-semibold">
                        {selectedResult.requiresFounderReview ? '✓ Yes' : 'No'}
                      </span>
                    </div>
                    {selectedResult.founderReviewedAt && (
                      <div className="text-sm text-gray-600">
                        Reviewed: {new Date(selectedResult.founderReviewedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Research Agent Workflow</CardTitle>
              <CardDescription>How intelligence gathering and founder alerts work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 5 Research Categories */}
              <div>
                <h3 className="font-semibold mb-3">5 Research Categories</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">🎯 Competitor Analysis</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Positioning, marketing spend, feature releases, customer sentiment analysis
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">📊 Industry Trends</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Market shifts, demand signals, regulatory changes, industry reports
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">🔧 Technology Monitoring</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Emerging tools, adoption rates, technology ecosystem, integration opportunities
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">📈 Algorithm Tracking</p>
                    <p className="text-sm text-gray-600 mt-1">
                      SEO ranking volatility, algorithm signals, feature deprecations, platform changes
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">🤖 AI Model Releases</p>
                    <p className="text-sm text-gray-600 mt-1">
                      New model releases, benchmark improvements, capability analysis, adoption trends
                    </p>
                  </div>
                </div>
              </div>

              {/* Threat Detection */}
              <div>
                <h3 className="font-semibold mb-3">Threat Detection Logic</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Research agent analyzes insights for threat signals:
                </p>
                <div className="bg-yellow-50 p-3 rounded text-sm space-y-2">
                  <p>
                    <span className="font-medium">High Threat Keywords:</span> volatility, decline, risk, threat, outage, critical, emergency, breach, failure, shutdown
                  </p>
                  <p>
                    <span className="font-medium">Medium Threat Keywords:</span> shift, movement, change, increase, decrease, disruption, competitive, loss
                  </p>
                  <p>
                    <span className="font-medium">Weighting:</span> Adjusted by insight confidence (low confidence reduces threat score)
                  </p>
                </div>
              </div>

              {/* Risk Scoring */}
              <div>
                <h3 className="font-semibold mb-3">Risk Scoring (0-100)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-100 text-green-800">Low 0-19</Badge>
                    <span className="text-gray-600">Monitor for trends, continue current strategy</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-100 text-yellow-800">Medium 20-39</Badge>
                    <span className="text-gray-600">Review findings, reassess quarterly strategy</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-100 text-orange-800">High 40-69</Badge>
                    <span className="text-gray-600">Founder manual review required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-100 text-red-800">Critical 70+</Badge>
                    <span className="text-gray-600">Urgent founder escalation</span>
                  </div>
                </div>
              </div>

              {/* Founder Alerts */}
              <div>
                <h3 className="font-semibold mb-3">Founder Alert Routing</h3>
                <p className="text-sm text-gray-600 mb-3">
                  High-threat research automatically routes to founder for review when:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>
                      <span className="font-medium">Threat Level = High</span> - Immediate strategic implications detected
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>
                      <span className="font-medium">Risk Level = High/Critical</span> - Business impact confirmed
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>
                      <span className="font-medium">Risk Score &gt;= 40</span> - Significant risk threshold crossed
                    </span>
                  </li>
                </ul>
              </div>

              {/* Batch Processing */}
              <div>
                <h3 className="font-semibold mb-3">Batch Processing</h3>
                <p className="text-sm text-gray-600">
                  Monitor multiple queries simultaneously with batch tracking. Batch status shows query count, insight count, and high-threat items identified.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getQueryForCategory(category: string): string {
  const queries: Record<string, string> = {
    competitor: 'Who are our main competitors and what are they doing with marketing and product features?',
    industry:
      'What are the latest market shifts and regulatory changes in our industry this quarter?',
    technology: 'What new technologies are emerging that could impact our platform in the next 6 months?',
    algorithm:
      'How volatile are search algorithms and what ranking changes have we seen recently?',
    ai_models:
      'What new AI models have been released recently and how are they being adopted?',
  };

  return queries[category] || 'What market intelligence is relevant to our business?';
}
