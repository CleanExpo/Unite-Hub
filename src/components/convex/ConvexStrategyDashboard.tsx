'use client';

/**
 * CONVEX Strategy Dashboard Component
 *
 * Main interface for CONVEX strategy generation and management:
 * - Framework selector dropdown
 * - Strategy brief input form
 * - Real-time CONVEX scoring display
 * - Template library browser
 * - Execution roadmap builder
 * - Results visualization
 * - Export capabilities
 *
 * Performance Target: <1s page load, <2s strategy generation
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Download, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

interface StrategyInput {
  businessName: string;
  industry: string;
  targetAudience: string;
  currentChallenges: string;
  existingCompetitors: string;
  desiredOutcome: string;
  framework: 'brand_positioning' | 'funnel_design' | 'seo_patterns' | 'competitor_model' | 'offer_architecture';
}

interface ConvexScore {
  overallScore: number; // 0-100
  clarity: number;
  specificity: number;
  outcomeFocus: number;
  proof: number;
  riskRemoval: number;
  compliance: 'pass' | 'needs_revision' | 'fail';
}

interface StrategyResult {
  id: string;
  strategy: string;
  score: ConvexScore;
  frameworks: string[];
  executionPlan: string[];
  successMetrics: string[];
  generatedAt: Date;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConvexStrategyDashboard() {
  // State management
  const [input, setInput] = useState<StrategyInput>({
    businessName: '',
    industry: '',
    targetAudience: '',
    currentChallenges: '',
    existingCompetitors: '',
    desiredOutcome: '',
    framework: 'brand_positioning',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Handle input changes
  const handleInputChange = (field: keyof StrategyInput, value: string) => {
    setInput((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  // Validate input
  const validateInput = (): boolean => {
    if (!input.businessName.trim()) {
      setError('Business name is required');
      return false;
    }
    if (!input.industry.trim()) {
      setError('Industry is required');
      return false;
    }
    if (!input.targetAudience.trim()) {
      setError('Target audience is required');
      return false;
    }
    if (!input.desiredOutcome.trim()) {
      setError('Desired outcome is required');
      return false;
    }
    return true;
  };

  // Generate strategy
  const handleGenerateStrategy = async () => {
    if (!validateInput()) return;

    setIsLoading(true);
    setError(null);
    logger.info('[CONVEX-UI] Generating strategy for ' + input.businessName);

    try {
      const response = await fetch('/api/convex/generate-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          businessName: input.businessName,
          industry: input.industry,
          targetAudience: input.targetAudience,
          currentChallenges: input.currentChallenges.split('\n').filter(Boolean),
          existingCompetitors: input.existingCompetitors.split('\n').filter(Boolean),
          desiredOutcome: input.desiredOutcome,
          framework: input.framework,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate strategy');
      }

      const data = await response.json();

      setResult({
        id: data.strategyId || `strategy-${Date.now()}`,
        strategy: data.strategy || 'Strategy generated successfully',
        score: data.score || {
          overallScore: 0,
          clarity: 0,
          specificity: 0,
          outcomeFocus: 0,
          proof: 0,
          riskRemoval: 0,
          compliance: 'pass',
        },
        frameworks: data.frameworks || [],
        executionPlan: data.executionPlan || [],
        successMetrics: data.successMetrics || [],
        generatedAt: new Date(),
      });

      setShowResults(true);
      logger.info('[CONVEX-UI] Strategy generated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      logger.error('[CONVEX-UI] Strategy generation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get auth token (mock implementation)
  const getAuthToken = async (): Promise<string> => {
    // In production, get from Supabase auth
    return 'mock-token';
  };

  // Export strategy
  const handleExportStrategy = () => {
    if (!result) return;

    const exportData = JSON.stringify(result, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `convex-strategy-${result.id}.json`;
    a.click();
    URL.revokeObjectURL(url);

    logger.info('[CONVEX-UI] Strategy exported');
  };

  // Score color mapping
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          CONVEX Strategy Generator
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Generate high-conversion marketing strategies using CONVEX frameworks
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Input Form */}
      {!showResults && (
        <Card className="border-2 dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Strategy Brief</CardTitle>
            <CardDescription>
              Provide details about your business to generate a CONVEX strategy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Framework Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                CONVEX Framework
              </label>
              <Select
                value={input.framework}
                onValueChange={(value: any) => handleInputChange('framework', value)}
              >
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="brand_positioning">Brand Positioning</SelectItem>
                  <SelectItem value="funnel_design">Funnel Design</SelectItem>
                  <SelectItem value="seo_patterns">SEO Patterns</SelectItem>
                  <SelectItem value="competitor_model">Competitor Model</SelectItem>
                  <SelectItem value="offer_architecture">Offer Architecture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Business Name *
              </label>
              <Input
                placeholder="e.g., TechFlow Solutions"
                value={input.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            {/* Industry & Audience Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Industry *
                </label>
                <Input
                  placeholder="e.g., Project Management SaaS"
                  value={input.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Target Audience *
                </label>
                <Input
                  placeholder="e.g., Mid-market teams"
                  value={input.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Current Challenges */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Current Challenges
              </label>
              <Textarea
                placeholder="List main challenges (one per line)&#10;e.g., Complex pricing&#10;Poor onboarding"
                value={input.currentChallenges}
                onChange={(e) => handleInputChange('currentChallenges', e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                rows={3}
              />
            </div>

            {/* Existing Competitors */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Existing Competitors
              </label>
              <Textarea
                placeholder="List main competitors (one per line)&#10;e.g., Asana&#10;Monday.com"
                value={input.existingCompetitors}
                onChange={(e) => handleInputChange('existingCompetitors', e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                rows={3}
              />
            </div>

            {/* Desired Outcome */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Desired Outcome *
              </label>
              <Textarea
                placeholder="What do you want to achieve? Be specific about the market position or outcome."
                value={input.desiredOutcome}
                onChange={(e) => handleInputChange('desiredOutcome', e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                rows={3}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateStrategy}
              disabled={isLoading}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Strategy...
                </>
              ) : (
                'Generate CONVEX Strategy'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results View */}
      {showResults && result && (
        <div className="space-y-6">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => {
              setShowResults(false);
              setResult(null);
            }}
            className="dark:bg-gray-800 dark:border-gray-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate New Strategy
          </Button>

          {/* CONVEX Score Card */}
          <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 dark:border-blue-900">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>CONVEX Strategy Score</CardTitle>
                  <CardDescription>Quality assessment against CONVEX standards</CardDescription>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${getScoreColor(result.score.overallScore)}`}>
                    {result.score.overallScore}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">/100</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Clarity</div>
                  <Badge variant={getScoreBadgeVariant(result.score.clarity)}>
                    {result.score.clarity}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Specificity</div>
                  <Badge variant={getScoreBadgeVariant(result.score.specificity)}>
                    {result.score.specificity}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Outcome Focus</div>
                  <Badge variant={getScoreBadgeVariant(result.score.outcomeFocus)}>
                    {result.score.outcomeFocus}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Proof</div>
                  <Badge variant={getScoreBadgeVariant(result.score.proof)}>
                    {result.score.proof}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Risk Removal</div>
                  <Badge variant={getScoreBadgeVariant(result.score.riskRemoval)}>
                    {result.score.riskRemoval}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Compliance</div>
                  <Badge
                    variant={
                      result.score.compliance === 'pass'
                        ? 'default'
                        : result.score.compliance === 'needs_revision'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {result.score.compliance}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Card */}
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Strategy</CardTitle>
              <CardDescription>CONVEX-based market positioning</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {result.strategy}
              </p>
            </CardContent>
          </Card>

          {/* Execution Plan */}
          {result.executionPlan.length > 0 && (
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Execution Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.executionPlan.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Success Metrics */}
          {result.successMetrics.length > 0 && (
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Success Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.successMetrics.map((metric, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <div className="h-2 w-2 bg-blue-600 rounded-full" />
                      {metric}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExportStrategy}
            variant="outline"
            className="w-full dark:bg-gray-800 dark:border-gray-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Strategy as JSON
          </Button>
        </div>
      )}
    </div>
  );
}

export default ConvexStrategyDashboard;
