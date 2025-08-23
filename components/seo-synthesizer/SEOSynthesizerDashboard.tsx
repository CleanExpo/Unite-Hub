'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';

interface BusinessContext {
  industry: string;
  businessStage: string;
  targetAudience: string[];
  businessGoals: string[];
  targetKeywords: string[];
  competitors: string[];
  contentObjectives: string[];
}

interface AnalysisResult {
  success: boolean;
  requestId: string;
  data?: any;
  error?: string;
  analysisMetadata?: {
    competitorCount: number;
    contentPiecesAnalyzed: number;
    analysisDepth: string;
    completedAt: string;
  };
}

interface ContentBrief {
  title: string;
  targetKeyword: string;
  contentType: string;
  targetAudience: string;
  estimatedHours: number;
  metaTitle: string;
  metaDescription: string;
  outline: Array<{
    order: number;
    heading: string;
    purpose: string;
    estimatedWords: number;
  }>;
}

export default function SEOSynthesizerDashboard() {
  const [activeTab, setActiveTab] = useState<'competitor' | 'brief' | 'strategy' | 'semrush'>('competitor');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [showBusinessContextModal, setShowBusinessContextModal] = useState(false);
  
  // Form states
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);
  const [ourContentUrls, setOurContentUrls] = useState<string[]>(['']);
  const [analysisDepth, setAnalysisDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [businessContext, setBusinessContext] = useState<BusinessContext>({
    industry: '',
    businessStage: 'growth',
    targetAudience: [''],
    businessGoals: [''],
    targetKeywords: [''],
    competitors: [''],
    contentObjectives: ['seo_traffic']
  });

  // System health state
  const [systemHealth, setSystemHealth] = useState<any>(null);
  
  // SEMrush specific states
  const [semrushResults, setSemrushResults] = useState<any>(null);
  const [semrushActiveView, setSemrushActiveView] = useState<'domain' | 'keyword' | 'competitor' | 'backlink' | 'position'>('domain');
  const [semrushDomain, setSemrushDomain] = useState('');
  const [semrushKeyword, setSemrushKeyword] = useState('');
  const [semrushUsage, setSemrushUsage] = useState<any>(null);

  useEffect(() => {
    // Check system health on component mount
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    try {
      const response = await fetch('/api/seo-synthesizer');
      const health = await response.json();
      setSystemHealth(health);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const handleCompetitorAnalysis = async () => {
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/seo-synthesizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'competitor_analysis',
          competitors: competitorUrls.filter(url => url.trim()),
          ourContentUrls: ourContentUrls.filter(url => url.trim()),
          analysisDepth,
          businessContext: businessContext.industry ? businessContext : undefined,
          generateBriefs: false,
          exportFormat: 'json'
        }),
      });

      const result = await response.json();
      setResults(result);

    } catch (error) {
      setResults({
        success: false,
        requestId: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentBrief = async () => {
    if (!targetKeyword.trim()) {
      alert('Please enter a target keyword');
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/seo-synthesizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'content_brief',
          targetKeyword: targetKeyword.trim(),
          businessContext: businessContext.industry ? businessContext : undefined,
        }),
      });

      const result = await response.json();
      setResults(result);

    } catch (error) {
      setResults({
        success: false,
        requestId: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentStrategy = async () => {
    if (!businessContext.industry) {
      setShowBusinessContextModal(true);
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/seo-synthesizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'content_strategy',
          competitors: competitorUrls.filter(url => url.trim()),
          analysisDepth: 'standard',
          businessContext,
        }),
      });

      const result = await response.json();
      setResults(result);

    } catch (error) {
      setResults({
        success: false,
        requestId: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // SEMrush API functions
  const handleSemrushDomainAnalysis = async () => {
    if (!semrushDomain.trim()) {
      alert('Please enter a domain');
      return;
    }

    setIsLoading(true);
    setSemrushResults(null);

    try {
      const response = await fetch('/api/semrush/domain-overview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: semrushDomain.trim(),
          includeCompetitors: true,
          includeKeywords: true
        }),
      });

      const result = await response.json();
      setSemrushResults(result);
      if (result.usage) {
        setSemrushUsage(result.usage);
      }

    } catch (error) {
      setSemrushResults({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze domain'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSemrushKeywordResearch = async () => {
    if (!semrushKeyword.trim()) {
      alert('Please enter a keyword');
      return;
    }

    setIsLoading(true);
    setSemrushResults(null);

    try {
      const response = await fetch('/api/semrush/keyword-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: semrushKeyword.trim(),
          includeRelated: true,
          includeSerpFeatures: true,
          relatedLimit: 100
        }),
      });

      const result = await response.json();
      setSemrushResults(result);
      if (result.usage) {
        setSemrushUsage(result.usage);
      }

    } catch (error) {
      setSemrushResults({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to research keyword'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSemrushCompetitorAnalysis = async () => {
    const ourDomain = semrushDomain.trim();
    const competitors = competitorUrls.filter(url => url.trim());

    if (!ourDomain || competitors.length === 0) {
      alert('Please enter your domain and at least one competitor');
      return;
    }

    setIsLoading(true);
    setSemrushResults(null);

    try {
      // Extract domains from URLs
      const competitorDomains = competitors.map(url => {
        try {
          return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        } catch {
          return url;
        }
      });

      const response = await fetch('/api/semrush/competitor-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ourDomain,
          competitors: competitorDomains,
          includeKeywordGaps: true,
          includeContentGaps: true,
          includeBacklinkGaps: false
        }),
      });

      const result = await response.json();
      setSemrushResults(result);
      if (result.usage) {
        setSemrushUsage(result.usage);
      }

    } catch (error) {
      setSemrushResults({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze competitors'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSemrushBacklinkAudit = async () => {
    if (!semrushDomain.trim()) {
      alert('Please enter a domain');
      return;
    }

    setIsLoading(true);
    setSemrushResults(null);

    try {
      const response = await fetch('/api/semrush/backlink-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: semrushDomain.trim(),
          includeDetails: true,
          limit: 100
        }),
      });

      const result = await response.json();
      setSemrushResults(result);
      if (result.usage) {
        setSemrushUsage(result.usage);
      }

    } catch (error) {
      setSemrushResults({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to audit backlinks'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSemrushPositionTracking = async () => {
    if (!semrushDomain.trim()) {
      alert('Please enter a domain');
      return;
    }

    setIsLoading(true);
    setSemrushResults(null);

    try {
      const keywords = semrushKeyword.trim() ? [semrushKeyword.trim()] : [];

      const response = await fetch('/api/semrush/position-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: semrushDomain.trim(),
          keywords,
          includeHistorical: true,
          monthsBack: 6
        }),
      });

      const result = await response.json();
      setSemrushResults(result);
      if (result.usage) {
        setSemrushUsage(result.usage);
      }

    } catch (error) {
      setSemrushResults({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track positions'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addUrlField = (type: 'competitor' | 'our-content') => {
    if (type === 'competitor') {
      setCompetitorUrls([...competitorUrls, '']);
    } else {
      setOurContentUrls([...ourContentUrls, '']);
    }
  };

  const updateUrl = (index: number, value: string, type: 'competitor' | 'our-content') => {
    if (type === 'competitor') {
      const newUrls = [...competitorUrls];
      newUrls[index] = value;
      setCompetitorUrls(newUrls);
    } else {
      const newUrls = [...ourContentUrls];
      newUrls[index] = value;
      setOurContentUrls(newUrls);
    }
  };

  const removeUrlField = (index: number, type: 'competitor' | 'our-content') => {
    if (type === 'competitor') {
      setCompetitorUrls(competitorUrls.filter((_, i) => i !== index));
    } else {
      setOurContentUrls(ourContentUrls.filter((_, i) => i !== index));
    }
  };

  const renderSystemHealth = () => {
    if (!systemHealth) return null;

    return (
      <Card className="mb-6">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">System Status</h3>
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${systemHealth.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {systemHealth.status === 'healthy' ? 'System Healthy' : 'System Issues Detected'}
            </span>
            <span className="text-sm text-gray-600">
              Version {systemHealth.version}
            </span>
          </div>
          {systemHealth.status !== 'healthy' && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-700">
                System health check failed. Please ensure Python and required packages are installed.
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderCompetitorAnalysis = () => (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Competitor URLs</h3>
          <div className="space-y-3">
            {competitorUrls.map((url, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  type="url"
                  placeholder="https://competitor-website.com"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value, 'competitor')}
                  className="flex-1"
                />
                {competitorUrls.length > 1 && (
                  <Button
                    variant="secondary"
                    onClick={() => removeUrlField(index, 'competitor')}
                    className="px-3"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="secondary"
              onClick={() => addUrlField('competitor')}
              className="w-full"
            >
              + Add Competitor URL
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Our Content URLs (Optional)</h3>
          <div className="space-y-3">
            {ourContentUrls.map((url, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  type="url"
                  placeholder="https://our-website.com/content"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value, 'our-content')}
                  className="flex-1"
                />
                {ourContentUrls.length > 1 && (
                  <Button
                    variant="secondary"
                    onClick={() => removeUrlField(index, 'our-content')}
                    className="px-3"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="secondary"
              onClick={() => addUrlField('our-content')}
              className="w-full"
            >
              + Add Our Content URL
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Analysis Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Depth
              </label>
              <select
                value={analysisDepth}
                onChange={(e) => setAnalysisDepth(e.target.value as 'quick' | 'standard' | 'deep')}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="quick">Quick (5-10 pages per site)</option>
                <option value="standard">Standard (15-25 pages per site)</option>
                <option value="deep">Deep (50+ pages per site)</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex space-x-4">
        <Button
          onClick={handleCompetitorAnalysis}
          disabled={isLoading || competitorUrls.filter(url => url.trim()).length === 0}
          className="flex-1"
        >
          {isLoading ? 'Analyzing...' : 'Start Analysis'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowBusinessContextModal(true)}
        >
          Business Context
        </Button>
      </div>
    </div>
  );

  const renderContentBrief = () => (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Content Brief Generation</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Keyword
              </label>
              <Input
                type="text"
                placeholder="e.g., content marketing strategy"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex space-x-4">
        <Button
          onClick={handleContentBrief}
          disabled={isLoading || !targetKeyword.trim()}
          className="flex-1"
        >
          {isLoading ? 'Generating...' : 'Generate Content Brief'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowBusinessContextModal(true)}
        >
          Business Context
        </Button>
      </div>
    </div>
  );

  const renderContentStrategy = () => (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Content Strategy Generation</h3>
          <p className="text-gray-600 mb-4">
            Generate a comprehensive content strategy based on competitor analysis and your business context.
          </p>
          {!businessContext.industry && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-700">
                Business context is required for content strategy generation. Click "Set Business Context" to configure.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Button
        onClick={handleContentStrategy}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Generating Strategy...' : 'Generate Content Strategy'}
      </Button>
    </div>
  );

  const renderResults = () => {
    if (!results) return null;

    return (
      <Card className="mt-6">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Results</h3>
          
          {results.success ? (
            <div>
              {results.analysisMetadata && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
                  <h4 className="font-semibold text-green-800 mb-2">Analysis Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-green-600">Competitors:</span>
                      <br />
                      <span className="font-semibold">{results.analysisMetadata.competitorCount}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Content Pieces:</span>
                      <br />
                      <span className="font-semibold">{results.analysisMetadata.contentPiecesAnalyzed}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Depth:</span>
                      <br />
                      <span className="font-semibold capitalize">{results.analysisMetadata.analysisDepth}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Completed:</span>
                      <br />
                      <span className="font-semibold">
                        {new Date(results.analysisMetadata.completedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="max-h-96 overflow-y-auto">
                <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </div>

              <div className="mt-4 flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const dataStr = JSON.stringify(results.data, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `seo-analysis-${results.requestId}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download JSON
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(results.data, null, 2));
                    alert('Results copied to clipboard!');
                  }}
                >
                  Copy Results
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <h4 className="font-semibold text-red-800 mb-2">Analysis Failed</h4>
              <p className="text-red-700">{results.error}</p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderBusinessContextModal = () => (
    <Modal
      isOpen={showBusinessContextModal}
      onClose={() => setShowBusinessContextModal(false)}
      title="Business Context Configuration"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry
          </label>
          <Input
            type="text"
            placeholder="e.g., B2B SaaS, Healthcare, E-commerce"
            value={businessContext.industry}
            onChange={(e) => setBusinessContext({ ...businessContext, industry: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Stage
          </label>
          <select
            value={businessContext.businessStage}
            onChange={(e) => setBusinessContext({ ...businessContext, businessStage: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="startup">Startup</option>
            <option value="growth">Growth</option>
            <option value="established">Established</option>
            <option value="enterprise">Enterprise</option>
            <option value="mature">Mature</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Keywords (comma-separated)
          </label>
          <Input
            type="text"
            placeholder="content marketing, seo strategy, digital marketing"
            value={businessContext.targetKeywords.join(', ')}
            onChange={(e) => setBusinessContext({ 
              ...businessContext, 
              targetKeywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
            })}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="secondary"
            onClick={() => setShowBusinessContextModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => setShowBusinessContextModal(false)}
          >
            Save Context
          </Button>
        </div>
      </div>
    </Modal>
  );

  const renderSemrushAnalytics = () => (
    <div className="space-y-6">
      {/* SEMrush Usage Stats */}
      {semrushUsage && (
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">SEMrush API Usage</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Calls Today:</span>
                <br />
                <span className="font-semibold">{semrushUsage.calls_made_today}</span>
              </div>
              <div>
                <span className="text-blue-600">Daily Limit:</span>
                <br />
                <span className="font-semibold">{semrushUsage.daily_limit}</span>
              </div>
              <div>
                <span className="text-blue-600">Remaining:</span>
                <br />
                <span className="font-semibold">{semrushUsage.remaining_calls}</span>
              </div>
              <div>
                <span className="text-blue-600">Cache Size:</span>
                <br />
                <span className="font-semibold">{semrushUsage.cache_size}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SEMrush Analysis Type Selector */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">SEMrush Analysis Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {[
              { key: 'domain', label: 'Domain Overview', icon: '🏢' },
              { key: 'keyword', label: 'Keyword Research', icon: '🔍' },
              { key: 'competitor', label: 'Competitor Gap', icon: '⚔️' },
              { key: 'backlink', label: 'Backlink Audit', icon: '🔗' },
              { key: 'position', label: 'Position Tracking', icon: '📊' },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setSemrushActiveView(key as typeof semrushActiveView)}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  semrushActiveView === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50'
                }`}
              >
                <div className="text-lg mb-1">{icon}</div>
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Input Fields */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Analysis Parameters</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain
              </label>
              <Input
                type="text"
                placeholder="e.g., example.com"
                value={semrushDomain}
                onChange={(e) => setSemrushDomain(e.target.value)}
                className="w-full"
              />
            </div>
            
            {(semrushActiveView === 'keyword' || semrushActiveView === 'position') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keyword {semrushActiveView === 'position' ? '(Optional)' : ''}
                </label>
                <Input
                  type="text"
                  placeholder="e.g., digital marketing"
                  value={semrushKeyword}
                  onChange={(e) => setSemrushKeyword(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => {
            switch (semrushActiveView) {
              case 'domain':
                handleSemrushDomainAnalysis();
                break;
              case 'keyword':
                handleSemrushKeywordResearch();
                break;
              case 'competitor':
                handleSemrushCompetitorAnalysis();
                break;
              case 'backlink':
                handleSemrushBacklinkAudit();
                break;
              case 'position':
                handleSemrushPositionTracking();
                break;
            }
          }}
          disabled={isLoading || !semrushDomain.trim() || (semrushActiveView === 'keyword' && !semrushKeyword.trim())}
          className="px-8 py-3 text-lg"
        >
          {isLoading ? 'Analyzing...' : `Start ${semrushActiveView === 'domain' ? 'Domain Analysis' : 
            semrushActiveView === 'keyword' ? 'Keyword Research' :
            semrushActiveView === 'competitor' ? 'Competitor Analysis' :
            semrushActiveView === 'backlink' ? 'Backlink Audit' :
            'Position Tracking'}`}
        </Button>
      </div>
    </div>
  );

  const renderSemrushResults = () => {
    if (!semrushResults) return null;

    return (
      <Card className="mt-6">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">SEMrush Results</h3>
          
          {semrushResults.success ? (
            <div>
              {/* Success Results */}
              {semrushActiveView === 'domain' && semrushResults.data && (
                <div className="space-y-4">
                  {semrushResults.data.overview && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 border border-green-200 rounded">
                      <div>
                        <span className="text-green-600">Organic Keywords:</span>
                        <br />
                        <span className="font-semibold text-lg">{semrushResults.data.overview.organic_keywords?.toLocaleString() || 0}</span>
                      </div>
                      <div>
                        <span className="text-green-600">Organic Traffic:</span>
                        <br />
                        <span className="font-semibold text-lg">{semrushResults.data.overview.organic_traffic?.toLocaleString() || 0}</span>
                      </div>
                      <div>
                        <span className="text-green-600">Authority Score:</span>
                        <br />
                        <span className="font-semibold text-lg">{semrushResults.data.overview.authority_score || 0}</span>
                      </div>
                      <div>
                        <span className="text-green-600">Backlinks:</span>
                        <br />
                        <span className="font-semibold text-lg">{semrushResults.data.overview.backlinks?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  )}
                  
                  {semrushResults.data.competitors && semrushResults.data.competitors.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Top Competitors:</h4>
                      <div className="space-y-2">
                        {semrushResults.data.competitors.slice(0, 5).map((comp: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-medium">{comp.domain}</span>
                            <span className="text-sm text-gray-600">
                              {comp.common_keywords} common keywords
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {semrushActiveView === 'keyword' && semrushResults.data && (
                <div className="space-y-4">
                  {semrushResults.data.overview && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 border border-blue-200 rounded">
                      <div>
                        <span className="text-blue-600">Search Volume:</span>
                        <br />
                        <span className="font-semibold text-lg">{semrushResults.data.overview.volume?.toLocaleString() || 0}</span>
                      </div>
                      <div>
                        <span className="text-blue-600">Keyword Difficulty:</span>
                        <br />
                        <span className="font-semibold text-lg">{semrushResults.data.overview.kd_percent || 0}%</span>
                      </div>
                      <div>
                        <span className="text-blue-600">CPC:</span>
                        <br />
                        <span className="font-semibold text-lg">${semrushResults.data.overview.cpc || 0}</span>
                      </div>
                      <div>
                        <span className="text-blue-600">Competition:</span>
                        <br />
                        <span className="font-semibold text-lg">{semrushResults.data.overview.competition || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                  
                  {semrushResults.data.related_keywords && semrushResults.data.related_keywords.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Related Keywords:</h4>
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Keyword</th>
                              <th className="text-left p-2">Volume</th>
                              <th className="text-left p-2">CPC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {semrushResults.data.related_keywords.slice(0, 20).map((kw: any, index: number) => (
                              <tr key={index} className="border-b">
                                <td className="p-2">{kw.Ph || kw.keyword}</td>
                                <td className="p-2">{(kw.Nq || kw.volume || 0).toLocaleString()}</td>
                                <td className="p-2">${(kw.Cp || kw.cpc || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 max-h-96 overflow-y-auto">
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                    View Raw Data
                  </summary>
                  <pre className="text-xs bg-gray-50 p-4 rounded mt-2 overflow-x-auto">
                    {JSON.stringify(semrushResults.data, null, 2)}
                  </pre>
                </details>
              </div>

              <div className="mt-4 flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const dataStr = JSON.stringify(semrushResults.data, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `semrush-${semrushActiveView}-${semrushDomain}-${Date.now()}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download Data
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(semrushResults.data, null, 2));
                    alert('Data copied to clipboard!');
                  }}
                >
                  Copy Data
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <h4 className="font-semibold text-red-800 mb-2">Analysis Failed</h4>
              <p className="text-red-700">{semrushResults.error}</p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Synthesizer</h1>
        <p className="text-gray-600">
          Advanced competitor analysis and content strategy generation powered by AI
        </p>
      </div>

      {renderSystemHealth()}

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'competitor', label: 'Competitor Analysis', icon: '🔍' },
              { key: 'brief', label: 'Content Brief', icon: '📝' },
              { key: 'strategy', label: 'Content Strategy', icon: '📈' },
              { key: 'semrush', label: 'SEMrush Analytics', icon: '📊' },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{icon}</span>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'competitor' && renderCompetitorAnalysis()}
      {activeTab === 'brief' && renderContentBrief()}
      {activeTab === 'strategy' && renderContentStrategy()}
      {activeTab === 'semrush' && renderSemrushAnalytics()}

      {/* Results */}
      {activeTab === 'semrush' ? renderSemrushResults() : renderResults()}

      {/* Modals */}
      {renderBusinessContextModal()}
    </div>
  );
}