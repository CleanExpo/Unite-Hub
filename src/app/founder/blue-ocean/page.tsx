'use client';

/**
 * Blue Ocean Strategy Generator
 * Create uncontested market positioning for SaaS clients
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Zap, TrendingUp, Target, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger-client';

interface BlueOceanFormData {
  projectId: string;
  businessName: string;
  industry: string;
  targetAudience: string;
  currentChallenges: string;
  existingCompetitors: string;
  desiredOutcome: string;
  budgetRange?: string;
}

interface BlueOceanResult {
  success: boolean;
  strategyId?: string;
  strategy?: {
    businessName: string;
    industry: string;
    blueOceanPositioning: string;
    newCategoryName: string;
    categoryDescription: string;
    narrativeStrategy: string;
    defensibilityScore: number;
    marketOpportunitySizeEstimate: string;
    strategicAdvantages: Array<{
      title: string;
      description: string;
      defensibility: string;
    }>;
    executionSteps: Array<{
      phase: number;
      title: string;
      description: string;
      timeline: string;
    }>;
    subAgentRouting: Record<string, any>;
  };
  error?: string;
}

export default function BlueOceanPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<BlueOceanFormData>({
    projectId: '',
    businessName: '',
    industry: '',
    targetAudience: '',
    currentChallenges: '',
    existingCompetitors: '',
    desiredOutcome: '',
    budgetRange: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<BlueOceanResult | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return false;
    }
    if (!formData.industry.trim()) {
      setError('Industry is required');
      return false;
    }
    if (!formData.targetAudience.trim()) {
      setError('Target audience is required');
      return false;
    }
    if (!formData.currentChallenges.trim()) {
      setError('Current challenges are required');
      return false;
    }
    if (!formData.existingCompetitors.trim()) {
      setError('Existing competitors are required');
      return false;
    }
    if (!formData.desiredOutcome.trim()) {
      setError('Desired outcome is required');
      return false;
    }
    return true;
  };

  const handleGenerateStrategy = async () => {
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      log.info('Generating Blue Ocean Strategy', {
        businessName: formData.businessName,
        industry: formData.industry,
      });

      const response = await fetch('/api/managed/blue-ocean/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: formData.projectId || 'default-project',
          businessName: formData.businessName,
          industry: formData.industry,
          targetAudience: formData.targetAudience,
          currentChallenges: formData.currentChallenges.split('\n').filter(c => c.trim()),
          existingCompetitors: formData.existingCompetitors.split('\n').filter(c => c.trim()),
          desiredOutcome: formData.desiredOutcome,
          budgetRange: formData.budgetRange,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate strategy');
      }

      const data: BlueOceanResult = await response.json();
      setResult(data);
      setSuccess(`✅ Blue Ocean Strategy generated successfully! Strategy ID: ${data.strategyId}`);

      log.info('Blue Ocean Strategy generated', {
        strategyId: data.strategyId,
        categoryName: data.strategy?.newCategoryName,
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate strategy';
      setError(errorMsg);
      log.error('Failed to generate Blue Ocean Strategy', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const DefensibilityIndicator = ({ score }: { score: number }) => {
    const color = score >= 80 ? 'text-success-400' : score >= 60 ? 'text-warning-400' : 'text-error-400';
    const bgColor = score >= 80 ? 'bg-success-500/20' : score >= 60 ? 'bg-warning-500/20' : 'bg-error-500/20';

    return (
      <div className={`inline-block px-3 py-1 rounded-full ${bgColor} ${color}`}>
        {score}% Defensibility
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-text-muted hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-2">
              <Zap className="h-8 w-8 text-info-400" />
              Blue Ocean Strategy
            </h1>
            <p className="text-text-muted mt-1">Create uncontested market positioning for your SaaS business</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-error-500/50 bg-error-500/10">
            <AlertCircle className="h-4 w-4 text-error-500" />
            <AlertDescription className="text-error-400">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-success-500/50 bg-success-500/10">
            <CheckCircle2 className="h-4 w-4 text-success-500" />
            <AlertDescription className="text-success-400">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-bg-raised">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-info-400" />
                  Strategy Input
                </CardTitle>
                <CardDescription>
                  Provide details about your business to generate a Blue Ocean strategy
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Business Name */}
                <div>
                  <label className="text-sm font-medium text-text-secondary block mb-2">Business Name *</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="e.g., TechFlow Solutions"
                    className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-white placeholder-gray-500 focus:outline-none focus:border-info-500"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="text-sm font-medium text-text-secondary block mb-2">Industry *</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g., SaaS Project Management"
                    className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-white placeholder-gray-500 focus:outline-none focus:border-info-500"
                  />
                </div>

                {/* Target Audience */}
                <div>
                  <label className="text-sm font-medium text-text-secondary block mb-2">Target Audience *</label>
                  <input
                    type="text"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    placeholder="e.g., Mid-market SaaS companies (50-500 employees)"
                    className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-white placeholder-gray-500 focus:outline-none focus:border-info-500"
                  />
                </div>

                {/* Current Challenges */}
                <div>
                  <label className="text-sm font-medium text-text-secondary block mb-2">
                    Current Challenges (one per line) *
                  </label>
                  <textarea
                    name="currentChallenges"
                    value={formData.currentChallenges}
                    onChange={handleInputChange}
                    placeholder="Complex pricing models&#10;Poor customer onboarding&#10;Limited integration capabilities"
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-white placeholder-gray-500 focus:outline-none focus:border-info-500"
                  />
                </div>

                {/* Existing Competitors */}
                <div>
                  <label className="text-sm font-medium text-text-secondary block mb-2">
                    Existing Competitors (one per line) *
                  </label>
                  <textarea
                    name="existingCompetitors"
                    value={formData.existingCompetitors}
                    onChange={handleInputChange}
                    placeholder="Asana&#10;Monday.com&#10;Jira&#10;Notion"
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-white placeholder-gray-500 focus:outline-none focus:border-info-500"
                  />
                </div>

                {/* Desired Outcome */}
                <div>
                  <label className="text-sm font-medium text-text-secondary block mb-2">Desired Outcome *</label>
                  <textarea
                    name="desiredOutcome"
                    value={formData.desiredOutcome}
                    onChange={handleInputChange}
                    placeholder="Become the go-to platform for AI-powered project management with emphasis on simplicity and speed"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-white placeholder-gray-500 focus:outline-none focus:border-info-500"
                  />
                </div>

                {/* Budget Range (Optional) */}
                <div>
                  <label className="text-sm font-medium text-text-secondary block mb-2">
                    Budget Range (Optional)
                  </label>
                  <input
                    type="text"
                    name="budgetRange"
                    value={formData.budgetRange}
                    onChange={handleInputChange}
                    placeholder="e.g., $50K - $150K annually"
                    className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-white placeholder-gray-500 focus:outline-none focus:border-info-500"
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateStrategy}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-info-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Strategy...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Blue Ocean Strategy
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            <Card className="border-info-700/50 bg-info-900/20">
              <CardHeader>
                <CardTitle className="text-white text-sm">What is Blue Ocean?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-text-secondary space-y-3">
                <p>
                  Blue Ocean Strategy means creating <strong>uncontested market space</strong> instead of competing in saturated markets.
                </p>
                <p>
                  Instead of beating competitors on price or features, you <strong>redefine the category</strong> entirely.
                </p>
                <div className="pt-2 border-t border-info-700/30">
                  <p className="font-medium text-info-300">We generate:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>New category positioning</li>
                    <li>Unique narrative framework</li>
                    <li>Strategic advantages</li>
                    <li>4-phase execution plan</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-success-700/50 bg-success-900/20">
              <CardHeader>
                <CardTitle className="text-white text-sm">Expected Output</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-text-secondary space-y-2">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-success-400 mt-1 flex-shrink-0" />
                  <span>Category name & description</span>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-success-400 mt-1 flex-shrink-0" />
                  <span>Narrative strategy & frameworks</span>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-success-400 mt-1 flex-shrink-0" />
                  <span>Defensibility score (0-100)</span>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-success-400 mt-1 flex-shrink-0" />
                  <span>Market opportunity estimate</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results Section */}
        {result && result.strategy && (
          <div className="space-y-6">
            {/* Positioning Card */}
            <Card className="border-success-700/50 bg-gradient-to-br from-green-900/20 to-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success-400" />
                  Blue Ocean Positioning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-bg-elevated/50 border border-success-700/30">
                  <p className="text-lg font-semibold text-white">{result.strategy.blueOceanPositioning}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-muted mb-2">New Category</p>
                    <Badge className="bg-info-600 text-white text-base px-3 py-2">
                      {result.strategy.newCategoryName}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-text-muted mb-2">Market Defensibility</p>
                      <DefensibilityIndicator score={result.strategy.defensibilityScore} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-text-muted mb-2">Category Description</p>
                  <p className="text-text-secondary">{result.strategy.categoryDescription}</p>
                </div>

                <div>
                  <p className="text-sm text-text-muted mb-2">Market Opportunity</p>
                  <p className="text-text-secondary">{result.strategy.marketOpportunitySizeEstimate}</p>
                </div>
              </CardContent>
            </Card>

            {/* Narrative Strategy */}
            <Card className="border-info-700/50 bg-bg-raised">
              <CardHeader>
                <CardTitle className="text-white">Narrative Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">{result.strategy.narrativeStrategy}</p>
              </CardContent>
            </Card>

            {/* Strategic Advantages */}
            {result.strategy.strategicAdvantages.length > 0 && (
              <Card className="border-purple-700/50 bg-bg-raised">
                <CardHeader>
                  <CardTitle className="text-white">Strategic Advantages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.strategy.strategicAdvantages.map((advantage, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-bg-elevated/50 border border-purple-700/30">
                        <p className="font-medium text-white flex items-center gap-2">
                          {advantage.title}
                          <Badge variant="outline" className={advantage.defensibility === 'high' ? 'bg-success-500/20 text-success-400 border-success-600' : 'bg-warning-500/20 text-warning-400 border-warning-600'}>
                            {advantage.defensibility}
                          </Badge>
                        </p>
                        <p className="text-sm text-text-secondary mt-1">{advantage.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Execution Steps */}
            {result.strategy.executionSteps.length > 0 && (
              <Card className="border-orange-700/50 bg-bg-raised">
                <CardHeader>
                  <CardTitle className="text-white">4-Phase Execution Roadmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.strategy.executionSteps.map((step) => (
                      <div key={step.phase} className="p-4 rounded-lg bg-bg-elevated/50 border border-orange-700/30">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-white">Phase {step.phase}: {step.title}</p>
                          <Badge variant="secondary" className="text-xs">{step.timeline}</Badge>
                        </div>
                        <p className="text-sm text-text-secondary">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
