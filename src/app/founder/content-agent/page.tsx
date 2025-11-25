'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { contentAgent, type ContentResult } from '@/agents/content/contentAgent';
import { validateBrandTone, suggestToneImprovements } from '@/agents/content/toneValidator';

/**
 * Content Agent Demo Dashboard
 *
 * Demonstrates autonomous content generation with:
 * - Extended thinking for deep reasoning
 * - Brand-safe validation
 * - Tone alignment checking
 * - Research integration
 * - Risk scoring and approval routing
 *
 * Used by: Founder for content review, team for learning
 */

export default function ContentAgentPage() {
  const [results, setResults] = useState<ContentResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ContentResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunDemo = async (intent: string, topic: string) => {
    setIsRunning(true);
    try {
      const result = await contentAgent.generateContent({
        brand: 'unite_hub',
        intent: intent as any,
        topic,
        audience: 'Trade business owners',
        targetLength: 'medium',
      });

      setResults([result, ...results]);
      setSelectedResult(result);
    } catch (error) {
      console.error('Content generation failed:', error);
      alert('Failed to generate content');
    } finally {
      setIsRunning(false);
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

  const getAlignmentColor = (aligned: boolean) => {
    return aligned ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const contentIntents = [
    { intent: 'email', label: 'Email', icon: '📧', topic: 'Why automation is essential for trade businesses' },
    { intent: 'post', label: 'Social Post', icon: '📱', topic: 'The future of business operations in 2025' },
    { intent: 'script', label: 'Video Script', icon: '🎬', topic: 'How to streamline your workflow' },
    { intent: 'article', label: 'Article', icon: '📰', topic: 'Digital transformation for service businesses' },
    { intent: 'ad', label: 'Ad Copy', icon: '🎯', topic: 'Productivity solutions for teams' },
    { intent: 'training', label: 'Training', icon: '🎓', topic: 'Best practices for team coordination' },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Content Agent Demo</h1>
        <p className="text-gray-600">
          Autonomous content generation with extended thinking, brand-safe validation, tone alignment, and founder governance.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="generation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generation">Content Generation</TabsTrigger>
          <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
          <TabsTrigger value="documentation">How It Works</TabsTrigger>
        </TabsList>

        {/* Generation Tab */}
        <TabsContent value="generation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentIntents.map((item) => (
              <Card key={item.intent} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <CardDescription className="text-xs">{item.topic}</CardDescription>
                </CardHeader>
                <CardContent>
                  <button
                    onClick={() => handleRunDemo(item.intent, item.topic)}
                    disabled={isRunning}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                  >
                    {isRunning ? 'Generating...' : 'Generate'}
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
                <p className="text-gray-600 text-center">No content generated yet. Generate content to see results here.</p>
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
                        <CardTitle className="text-lg capitalize">{result.request.intent}</CardTitle>
                        <CardDescription className="mt-1">{result.request.topic}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getAlignmentColor(result.toneAlignment.aligned)}>
                          Tone: {result.toneAlignment.aligned ? 'Aligned' : 'Issues'}
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
                <CardTitle>Content Details</CardTitle>
                <CardDescription>
                  {new Date(selectedResult.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Request */}
                <div>
                  <h3 className="font-semibold mb-2">Request</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Intent:</span>
                      <p className="font-medium capitalize">{selectedResult.request.intent}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Topic:</span>
                      <p className="font-medium">{selectedResult.request.topic}</p>
                    </div>
                    {selectedResult.request.audience && (
                      <div>
                        <span className="text-gray-600">Audience:</span>
                        <p className="font-medium">{selectedResult.request.audience}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-semibold mb-2">Generated Content</h3>
                  <div className="bg-white p-4 rounded border max-h-64 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedResult.content}</p>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-sm text-gray-700">{selectedResult.summary}</p>
                </div>

                {/* Extended Thinking */}
                {selectedResult.thinkingProcess && (
                  <div>
                    <h3 className="font-semibold mb-2">Extended Thinking Process</h3>
                    <div className="bg-white p-3 rounded border text-xs text-gray-700 max-h-40 overflow-y-auto font-mono">
                      {selectedResult.thinkingProcess}
                    </div>
                  </div>
                )}

                {/* Tone Alignment */}
                <div>
                  <h3 className="font-semibold mb-2">Tone Alignment</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className={getAlignmentColor(selectedResult.toneAlignment.aligned)}>
                        {selectedResult.toneAlignment.aligned ? 'Aligned' : 'Issues Found'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Score:</span>
                      <span className="font-semibold">{selectedResult.toneAlignment.score}/100</span>
                    </div>
                    {selectedResult.toneAlignment.matchedTones.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Matched Tones:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedResult.toneAlignment.matchedTones.map((tone, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tone}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedResult.toneAlignment.issues.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Issues:</span>
                        <ul className="space-y-1 mt-1">
                          {selectedResult.toneAlignment.issues.map((issue, idx) => (
                            <li key={idx} className="text-sm text-orange-700">
                              • {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Risk Assessment */}
                <div>
                  <h3 className="font-semibold mb-2">Risk Assessment</h3>
                  <div className="space-y-2">
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
                    {selectedResult.riskAssessment.reasons.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Risk Factors:</span>
                        <ul className="space-y-1 mt-1">
                          {selectedResult.riskAssessment.reasons.map((reason, idx) => (
                            <li key={idx} className="text-sm text-gray-700">
                              • {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval Status */}
                <div>
                  <h3 className="font-semibold mb-2">Approval Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge
                        className={
                          selectedResult.approvalStatus === 'auto_approved'
                            ? 'bg-green-100 text-green-800'
                            : selectedResult.approvalStatus === 'pending_approval'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                        }
                      >
                        {selectedResult.approvalStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Ready to Use:</span>
                      <span className="font-semibold">{selectedResult.readyToUse ? '✓ Yes' : 'Pending approval'}</span>
                    </div>
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
              <CardTitle>Content Agent Workflow</CardTitle>
              <CardDescription>How autonomous content generation with governance works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 6 Content Intents */}
              <div>
                <h3 className="font-semibold mb-3">6 Content Intents</h3>
                <div className="space-y-3">
                  {contentIntents.map((item) => (
                    <div key={item.intent} className="bg-blue-50 p-3 rounded">
                      <p className="font-medium text-sm">
                        {item.icon} {item.label}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{item.topic}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extended Thinking */}
              <div>
                <h3 className="font-semibold mb-3">Extended Thinking</h3>
                <div className="bg-purple-50 p-3 rounded text-sm space-y-2">
                  <p>
                    Uses Claude Opus with extended thinking enabled (5000-10000 token budget) for:
                  </p>
                  <ul className="space-y-1 list-inside">
                    <li>• Deep reasoning about content strategy</li>
                    <li>• Multi-perspective analysis</li>
                    <li>• Complex risk assessment</li>
                    <li>• Brand-audience alignment</li>
                    <li>• Research synthesis</li>
                  </ul>
                  <p className="text-xs text-gray-600 mt-2">
                    Cost: ~27x more expensive than standard tokens, but produces significantly higher quality results.
                  </p>
                </div>
              </div>

              {/* 4-Step Workflow */}
              <div>
                <h3 className="font-semibold mb-3">4-Step Generation Workflow</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">Step 1: Extended Thinking</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Deep reasoning about topic, audience, brand positioning, and content strategy. Generates comprehensive content.
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">Step 2: Tone Alignment Check</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Validates content against brand tone guidelines. Checks for required tones, identifies issues.
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">Step 3: Risk Assessment</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Scores risk 0-100 based on claims, context, and brand risk flags. Detects unsubstantiated statements.
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">Step 4: Approval Routing</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Routes to founder for review if high risk or tone issues. Auto-approves low-risk content.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tone Alignment */}
              <div>
                <h3 className="font-semibold mb-3">Tone Alignment (0-100 Score)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-100 text-green-800">75-100</Badge>
                    <span className="text-gray-600">Excellent alignment - ready to use</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-100 text-yellow-800">50-74</Badge>
                    <span className="text-gray-600">Good but needs minor adjustments</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-100 text-orange-800">25-49</Badge>
                    <span className="text-gray-600">Significant issues - requires revision</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-100 text-red-800">0-24</Badge>
                    <span className="text-gray-600">Poor alignment - needs major revision</span>
                  </div>
                </div>
              </div>

              {/* Risk Scoring */}
              <div>
                <h3 className="font-semibold mb-3">Risk Scoring (0-100)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-100 text-green-800">Low 0-19</Badge>
                    <span className="text-gray-600">Auto-approved, ready to use</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-100 text-yellow-800">Medium 20-39</Badge>
                    <span className="text-gray-600">Content review required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-100 text-orange-800">High 40-69</Badge>
                    <span className="text-gray-600">Founder manual approval required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-100 text-red-800">Critical 70+</Badge>
                    <span className="text-gray-600">Auto-rejected, founder escalation</span>
                  </div>
                </div>
              </div>

              {/* Governance Integration */}
              <div>
                <h3 className="font-semibold mb-3">Founder Governance Integration</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Content automatically routes to founder for review when:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>
                      <span className="font-medium">Risk Level = High/Critical</span> - Business/brand impact concern
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>
                      <span className="font-medium">Tone Alignment &lt; 75</span> - Brand consistency issues
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>
                      <span className="font-medium">Unsubstantiated Claims Detected</span> - Risk flag violations
                    </span>
                  </li>
                </ul>
              </div>

              {/* Research Integration */}
              <div>
                <h3 className="font-semibold mb-3">Research Integration</h3>
                <p className="text-sm text-gray-600">
                  Content agent synthesizes insights from research agent into narrative, supporting claims with citations. Research links track integration types: supports claim, provides context, strengthens narrative, or illustrates point.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
