/**
 * Staff Copywriting Dashboard
 *
 * Unified interface for:
 * - VOC (Voice of Customer) Research
 * - Competitor Analysis
 * - Copy Generation with Verification
 * - NAP Consistency Management
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Search,
  CheckCircle2,
  Sparkles,
  Building2,
  Globe,
  Quote,
  Target,
  Loader2,
  RefreshCcw,
} from 'lucide-react';

interface VOCSummary {
  totalQuotes: number;
  goldQuotes: number;
  byCategory: Record<string, number>;
  topPainPoints: string[];
  topDreamOutcomes: string[];
}

interface CompetitorSummary {
  id: string;
  competitor_name: string;
  competitor_url: string;
  competitor_rank: string;
  analyzed_at: string;
}

interface GeneratedCopy {
  id: string;
  page_type: string;
  status: string;
  version: number;
  created_at: string;
}

export default function StaffCopywritingPage() {
  const { currentOrganization } = useAuth();
  const workspaceId = currentOrganization?.org_id || '';

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [vocSummary, setVocSummary] = useState<VOCSummary | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorSummary[]>([]);
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy[]>([]);

  useEffect(() => {
    if (workspaceId) {
      loadDashboardData();
    }
  }, [workspaceId]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load VOC summary
      const vocRes = await fetch(`/api/copywriting/voc-research?workspaceId=${workspaceId}&summary=true`);
      if (vocRes.ok) {
        const vocData = await vocRes.json();
        setVocSummary(vocData.data);
      }

      // Load competitors
      const compRes = await fetch(`/api/copywriting/competitors?workspaceId=${workspaceId}`);
      if (compRes.ok) {
        const compData = await compRes.json();
        setCompetitors(compData.data || []);
      }

      // Load generated copy
      const copyRes = await fetch(`/api/copywriting/generate?workspaceId=${workspaceId}`);
      if (copyRes.ok) {
        const copyData = await copyRes.json();
        setGeneratedCopy(copyData.data || []);
      }
    } catch (error) {
       
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-500" />
              Copywriting Hub
            </h1>
            <p className="text-slate-400 mt-1">
              VOC research, competitor analysis, and conversion-optimized copy generation
            </p>
          </div>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">VOC Quotes</p>
                  <p className="text-2xl font-bold text-white">{vocSummary?.totalQuotes || 0}</p>
                </div>
                <Quote className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {vocSummary?.goldQuotes || 0} gold patterns
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Competitors</p>
                  <p className="text-2xl font-bold text-white">{competitors.length}</p>
                </div>
                <Target className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">Analyzed</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Generated Copy</p>
                  <p className="text-2xl font-bold text-white">{generatedCopy.length}</p>
                </div>
                <Sparkles className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {generatedCopy.filter(c => c.status === 'approved').length} approved
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">NAP Score</p>
                  <p className="text-2xl font-bold text-green-400">94%</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">Consistency</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900 border-slate-800 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="voc" className="data-[state=active]:bg-purple-600">
              VOC Research
            </TabsTrigger>
            <TabsTrigger value="competitors" className="data-[state=active]:bg-orange-600">
              Competitors
            </TabsTrigger>
            <TabsTrigger value="generate" className="data-[state=active]:bg-blue-600">
              Generate Copy
            </TabsTrigger>
            <TabsTrigger value="consistency" className="data-[state=active]:bg-green-600">
              NAP Consistency
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent VOC Quotes */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Quote className="w-5 h-5 text-purple-500" />
                    Top Pain Points (Gold)
                  </CardTitle>
                  <CardDescription>
                    Most repeated customer frustrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vocSummary?.topPainPoints?.length ? (
                    <ul className="space-y-2">
                      {vocSummary.topPainPoints.map((quote, i) => (
                        <li key={i} className="text-sm text-slate-300 p-2 bg-slate-800 rounded">
                          "{quote}..."
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 text-sm">
                      No VOC research yet. Run research to collect customer quotes.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Competitors */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="w-5 h-5 text-orange-500" />
                    Analyzed Competitors
                  </CardTitle>
                  <CardDescription>
                    Recent competitor analyses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {competitors.length ? (
                    <ul className="space-y-2">
                      {competitors.slice(0, 5).map((comp) => (
                        <li key={comp.id} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                          <div>
                            <p className="text-sm text-white">{comp.competitor_name}</p>
                            <p className="text-xs text-slate-500">{comp.competitor_url}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {comp.competitor_rank}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 text-sm">
                      No competitors analyzed yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Generated Copy */}
              <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    Recent Generated Copy
                  </CardTitle>
                  <CardDescription>
                    Copy awaiting review and approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedCopy.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {generatedCopy.slice(0, 6).map((copy) => (
                        <div key={copy.id} className="p-3 bg-slate-800 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <Badge>{copy.page_type}</Badge>
                            <Badge variant={
                              copy.status === 'approved' ? 'default' :
                              copy.status === 'draft' ? 'secondary' : 'destructive'
                            }>
                              {copy.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            v{copy.version} • {new Date(copy.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">
                      No copy generated yet. Use the Generate tab to create copy.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* VOC Research Tab */}
          <TabsContent value="voc">
            <VOCResearchPanel workspaceId={workspaceId} onRefresh={loadDashboardData} />
          </TabsContent>

          {/* Competitors Tab */}
          <TabsContent value="competitors">
            <CompetitorAnalysisPanel workspaceId={workspaceId} onRefresh={loadDashboardData} />
          </TabsContent>

          {/* Generate Copy Tab */}
          <TabsContent value="generate">
            <CopyGenerationPanel workspaceId={workspaceId} onRefresh={loadDashboardData} />
          </TabsContent>

          {/* NAP Consistency Tab */}
          <TabsContent value="consistency">
            <NAPConsistencyPanel workspaceId={workspaceId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// VOC Research Panel Component
function VOCResearchPanel({ workspaceId, onRefresh }: { workspaceId: string; onRefresh: () => void }) {
  const [running, setRunning] = useState(false);
  const [industry, setIndustry] = useState('');
  const [productService, setProductService] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  async function runResearch() {
    setRunning(true);
    try {
      const res = await fetch('/api/copywriting/voc-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          industry,
          productService,
          targetAudience,
        }),
      });
      if (res.ok) {
        onRefresh();
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Run VOC Research</CardTitle>
        <CardDescription>
          Extract customer quotes from forums, reviews, and social media
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Industry</label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., trades, saas, healthcare"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Product/Service</label>
            <Input
              value={productService}
              onChange={(e) => setProductService(e.target.value)}
              placeholder="e.g., plumbing services"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Target Audience</label>
            <Input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., homeowners, small businesses"
              className="bg-slate-800 border-slate-700"
            />
          </div>
        </div>
        <Button onClick={runResearch} disabled={running || !industry || !productService || !targetAudience}>
          {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Run VOC Research
        </Button>
      </CardContent>
    </Card>
  );
}

// Competitor Analysis Panel Component
function CompetitorAnalysisPanel({ workspaceId, onRefresh }: { workspaceId: string; onRefresh: () => void }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [competitorName, setCompetitorName] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');

  async function analyzeCompetitor() {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/copywriting/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          competitorName,
          competitorUrl,
        }),
      });
      if (res.ok) {
        setCompetitorName('');
        setCompetitorUrl('');
        onRefresh();
      }
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Analyze Competitor</CardTitle>
        <CardDescription>
          Extract page structures, messaging patterns, and unique features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Competitor Name</label>
            <Input
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              placeholder="e.g., ABC Plumbing"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Website URL</label>
            <Input
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              placeholder="https://competitor.com"
              className="bg-slate-800 border-slate-700"
            />
          </div>
        </div>
        <Button onClick={analyzeCompetitor} disabled={analyzing || !competitorName || !competitorUrl}>
          {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Target className="w-4 h-4 mr-2" />}
          Analyze Competitor
        </Button>
      </CardContent>
    </Card>
  );
}

// Copy Generation Panel Component
function CopyGenerationPanel({ workspaceId, onRefresh }: { workspaceId: string; onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [pageType, setPageType] = useState('homepage');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [primaryOffer, setPrimaryOffer] = useState('');
  const [result, setResult] = useState<any>(null);

  async function generateCopy() {
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/copywriting/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          pageType,
          businessName,
          industry,
          targetAudience,
          primaryOffer,
          uniqueSellingPoints: [],
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        onRefresh();
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Generate Page Copy</CardTitle>
          <CardDescription>
            Create conversion-optimized copy with verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1">Page Type</label>
              <select
                value={pageType}
                onChange={(e) => setPageType(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
              >
                <option value="homepage">Homepage</option>
                <option value="about">About</option>
                <option value="services">Services</option>
                <option value="contact">Contact</option>
                <option value="landing">Landing Page</option>
                <option value="pricing">Pricing</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Business Name</label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your Business Name"
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Industry</label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., trades, professional services"
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Target Audience</label>
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Who are you targeting?"
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-400 block mb-1">Primary Offer</label>
              <Input
                value={primaryOffer}
                onChange={(e) => setPrimaryOffer(e.target.value)}
                placeholder="Your main product/service offering"
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>
          <Button
            onClick={generateCopy}
            disabled={generating || !businessName || !industry || !targetAudience || !primaryOffer}
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Copy
          </Button>
        </CardContent>
      </Card>

      {/* Result Display */}
      {result && (
        <Card className={`bg-slate-900 border-slate-800 ${result.success ? 'border-green-500/50' : 'border-red-500/50'}`}>
          <CardHeader>
            <CardTitle className={result.success ? 'text-green-400' : 'text-red-400'}>
              {result.success ? 'Copy Generated Successfully' : 'Generation Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.data?.verification && (
              <div className="mb-4 p-3 bg-slate-800 rounded">
                <h4 className="text-sm font-semibold text-white mb-2">Verification Report</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Uniqueness:</span>
                    <span className={`ml-2 ${result.data.verification.uniqueness_score >= 95 ? 'text-green-400' : 'text-red-400'}`}>
                      {result.data.verification.uniqueness_score}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Verified Claims:</span>
                    <span className="ml-2 text-green-400">{result.data.verification.verified_claims_count}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Unverified:</span>
                    <span className={`ml-2 ${result.data.verification.unverified_claims_count === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {result.data.verification.unverified_claims_count}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <Badge className="ml-2" variant={result.data.verification.passed ? 'default' : 'destructive'}>
                      {result.data.verification.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            {result.error && (
              <p className="text-red-400 text-sm">{result.error}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// NAP Consistency Panel Component
function NAPConsistencyPanel({ workspaceId }: { workspaceId: string }) {
  const [master, setMaster] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaster();
  }, [workspaceId]);

  async function loadMaster() {
    setLoading(true);
    try {
      const res = await fetch(`/api/copywriting/consistency?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setMaster(data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Building2 className="w-5 h-5 text-green-500" />
          NAP Consistency Master
        </CardTitle>
        <CardDescription>
          Single source of truth for business information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {master ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800 rounded">
                <p className="text-sm text-slate-400">Business Name</p>
                <p className="text-white font-medium">{master.legal_business_name}</p>
              </div>
              <div className="p-3 bg-slate-800 rounded">
                <p className="text-sm text-slate-400">Primary Phone</p>
                <p className="text-white font-medium">{master.primary_phone}</p>
              </div>
              <div className="p-3 bg-slate-800 rounded md:col-span-2">
                <p className="text-sm text-slate-400">Address</p>
                <p className="text-white font-medium">
                  {master.street_address}, {master.suburb} {master.state} {master.postcode}
                </p>
              </div>
              <div className="p-3 bg-slate-800 rounded">
                <p className="text-sm text-slate-400">Website</p>
                <p className="text-blue-400">{master.website_url}</p>
              </div>
              <div className="p-3 bg-slate-800 rounded">
                <p className="text-sm text-slate-400">Primary Category</p>
                <p className="text-white">{master.primary_category}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Globe className="w-4 h-4 mr-2" />
              Run Consistency Audit
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">
              No business consistency master found.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Consistency Master
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper for Plus icon
function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
