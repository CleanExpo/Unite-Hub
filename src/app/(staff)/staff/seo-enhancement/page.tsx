'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  FileText,
  Code,
  MousePointerClick,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface AuditSummary {
  id: string;
  domain: string;
  overall_score: number;
  status: string;
  created_at: string;
}

interface CTROpportunity {
  url: string;
  keyword: string;
  opportunity_level: string;
  estimated_click_gain: number;
}

export default function SEOEnhancementPage() {
  const { currentOrganization, session } = useAuth();
  const workspaceId = currentOrganization?.org_id;

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [auditUrl, setAuditUrl] = useState('');
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [ctrOpportunities, setCtrOpportunities] = useState<CTROpportunity[]>([]);

  useEffect(() => {
    if (workspaceId) {
      fetchAudits();
      fetchCTROpportunities();
    }
  }, [workspaceId]);

  const fetchAudits = async () => {
    try {
      const response = await fetch(
        `/api/seo-enhancement/audit?workspaceId=${workspaceId}&limit=5`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      const data = await response.json();
      if (data.audits) setAudits(data.audits);
    } catch (error) {
      console.error('Failed to fetch audits:', error);
    }
  };

  const fetchCTROpportunities = async () => {
    try {
      const response = await fetch(
        `/api/seo-enhancement/ctr?workspaceId=${workspaceId}&type=benchmarks&opportunityLevel=high&limit=5`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      const data = await response.json();
      if (data.benchmarks) setCtrOpportunities(data.benchmarks);
    } catch (error) {
      console.error('Failed to fetch CTR opportunities:', error);
    }
  };

  const runAudit = async () => {
    if (!auditUrl || !workspaceId) return;
    setLoading(true);
    try {
      const response = await fetch('/api/seo-enhancement/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ workspaceId, url: auditUrl, auditType: 'full' }),
      });
      const data = await response.json();
      if (data.job) {
        setAuditUrl('');
        fetchAudits();
      }
    } catch (error) {
      console.error('Failed to start audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#00FF88';
    if (score >= 60) return '#FFB800';
    return '#FF4444';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-[#00FF88]/30 text-[#00FF88]">Good</span>;
    if (score >= 60) return <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-[#FFB800]/30 text-[#FFB800]">Needs Work</span>;
    return <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-[#FF4444]/30 text-[#FF4444]">Poor</span>;
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'audits', label: 'Technical Audits' },
    { id: 'content', label: 'Content' },
    { id: 'ctr', label: 'CTR Optimisation' },
    { id: 'competitors', label: 'Competitors' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white font-mono">SEO Enhancement Suite</h1>
            <p className="text-white/40 font-mono text-sm mt-1">
              Legitimate tools to improve search rankings sustainably
            </p>
          </div>
          <button
            onClick={() => { fetchAudits(); fetchCTROpportunities(); }}
            className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2 hover:bg-[#00F5FF]/90"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Technical Audits', value: audits.length, icon: <Search className="h-8 w-8" style={{ color: '#00F5FF' }} /> },
            { label: 'Content Analyses', value: '--', icon: <FileText className="h-8 w-8" style={{ color: '#00FF88' }} /> },
            { label: 'Schema Generated', value: '--', icon: <Code className="h-8 w-8" style={{ color: '#FF00FF' }} /> },
            { label: 'CTR Opportunities', value: ctrOpportunities.length, icon: <MousePointerClick className="h-8 w-8" style={{ color: '#FFB800' }} /> },
            { label: 'Competitors Tracked', value: '--', icon: <Users className="h-8 w-8" style={{ color: '#00F5FF' }} /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex items-center gap-3">
                {stat.icon}
                <div>
                  <p className="text-xs text-white/40 font-mono">{stat.label}</p>
                  <p className="text-2xl font-bold text-white font-mono mt-0.5">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Audit Input */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <h2 className="font-mono text-white font-bold flex items-center gap-2">
              <Search className="h-5 w-5 text-white/40" />
              Quick SEO Audit
            </h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">
              Enter a URL to run a comprehensive technical SEO audit
            </p>
          </div>
          <div className="p-4">
            <div className="flex gap-4">
              <input
                placeholder="https://example.com"
                value={auditUrl}
                onChange={(e) => setAuditUrl(e.target.value)}
                className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-sm px-3 py-2 text-sm font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/40"
              />
              <button
                onClick={runAudit}
                disabled={loading || !auditUrl}
                className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2 hover:bg-[#00F5FF]/90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Run Audit
              </button>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div>
          <div className="flex border-b border-white/[0.06] mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-mono text-sm px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#00F5FF] text-[#00F5FF]'
                    : 'border-transparent text-white/40 hover:text-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Audits */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
                  <div className="p-4 border-b border-white/[0.06]">
                    <h2 className="font-mono text-white font-bold">Recent Audits</h2>
                    <p className="text-xs text-white/40 font-mono mt-0.5">Latest technical SEO audit results</p>
                  </div>
                  <div className="p-4">
                    {audits.length === 0 ? (
                      <p className="text-white/30 font-mono text-sm text-center py-8">
                        No audits yet. Run your first audit above.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {audits.map((audit) => (
                          <div key={audit.id} className="flex items-center justify-between p-3 border border-white/[0.06] rounded-sm">
                            <div className="flex items-center gap-3">
                              {audit.status === 'completed' ? (
                                <CheckCircle className="h-5 w-5" style={{ color: '#00FF88' }} />
                              ) : audit.status === 'running' ? (
                                <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#00F5FF' }} />
                              ) : (
                                <AlertTriangle className="h-5 w-5" style={{ color: '#FFB800' }} />
                              )}
                              <div>
                                <p className="font-mono font-medium text-white text-sm">{audit.domain}</p>
                                <p className="text-xs text-white/30 font-mono">
                                  {new Date(audit.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {audit.status === 'completed' && audit.overall_score !== undefined && (
                                <span
                                  className="text-2xl font-bold font-mono"
                                  style={{ color: getScoreColor(audit.overall_score) }}
                                >
                                  {audit.overall_score}
                                </span>
                              )}
                              <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-sm p-1.5 hover:bg-white/[0.08]">
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* CTR Opportunities */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
                  <div className="p-4 border-b border-white/[0.06]">
                    <h2 className="font-mono text-white font-bold">High CTR Opportunities</h2>
                    <p className="text-xs text-white/40 font-mono mt-0.5">Pages with potential for more clicks</p>
                  </div>
                  <div className="p-4">
                    {ctrOpportunities.length === 0 ? (
                      <p className="text-white/30 font-mono text-sm text-center py-8">
                        No CTR opportunities found yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {ctrOpportunities.map((opp, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border border-white/[0.06] rounded-sm">
                            <div>
                              <p className="font-mono font-medium text-white text-sm truncate max-w-[200px]">{opp.keyword}</p>
                              <p className="text-xs text-white/30 font-mono truncate max-w-[200px]">{opp.url}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-[#FFB800]/30 text-[#FFB800]">
                                +{opp.estimated_click_gain} clicks
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: <Search className="h-12 w-12 mb-4" style={{ color: '#00F5FF' }} />,
                    title: 'Technical SEO Audit',
                    description: 'Core Web Vitals, crawlability, mobile-friendliness, and security analysis',
                    tab: 'audits',
                  },
                  {
                    icon: <FileText className="h-12 w-12 mb-4" style={{ color: '#00FF88' }} />,
                    title: 'Content Optimisation',
                    description: 'Keyword analysis, readability scores, and search intent alignment',
                    tab: 'content',
                  },
                  {
                    icon: <TrendingUp className="h-12 w-12 mb-4" style={{ color: '#FFB800' }} />,
                    title: 'CTR Optimisation',
                    description: 'Title/meta A/B testing, benchmark analysis, and click-through improvements',
                    tab: 'ctr',
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6 cursor-pointer hover:border-white/20 transition-colors"
                    onClick={() => setActiveTab(card.tab)}
                  >
                    {card.icon}
                    <h3 className="font-mono font-semibold text-white text-base mb-2">{card.title}</h3>
                    <p className="text-xs text-white/40 font-mono">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audits Tab */}
          {activeTab === 'audits' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06]">
                <h2 className="font-mono text-white font-bold">Technical SEO Audits</h2>
                <p className="text-xs text-white/40 font-mono mt-0.5">Comprehensive technical analysis of your websites</p>
              </div>
              <div className="p-4">
                {audits.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-white/20 mx-auto mb-4" />
                    <h3 className="font-mono font-semibold text-white text-base mb-2">No audits yet</h3>
                    <p className="text-white/40 font-mono text-sm mb-4">
                      Run your first technical SEO audit to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {audits.map((audit) => (
                      <div key={audit.id} className="border border-white/[0.06] rounded-sm p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className="text-3xl font-bold font-mono"
                              style={{ color: getScoreColor(audit.overall_score || 0) }}
                            >
                              {audit.overall_score || '--'}
                            </div>
                            <div>
                              <h4 className="font-mono font-semibold text-white">{audit.domain}</h4>
                              <p className="text-xs text-white/30 font-mono">
                                {new Date(audit.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getScoreBadge(audit.overall_score || 0)}
                            <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-xs rounded-sm px-3 py-1.5 hover:bg-white/[0.06]">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06]">
                <h2 className="font-mono text-white font-bold">Content Optimisation</h2>
                <p className="text-xs text-white/40 font-mono mt-0.5">Analyse and optimise your content for better rankings</p>
              </div>
              <div className="p-4">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-white/20 mx-auto mb-4" />
                  <h3 className="font-mono font-semibold text-white text-base mb-2">Content Analysis</h3>
                  <p className="text-white/40 font-mono text-sm mb-4">
                    Enter a URL and target keyword to analyse content optimisation opportunities
                  </p>
                  <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 hover:bg-[#00F5FF]/90">
                    Analyse Content
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CTR Tab */}
          {activeTab === 'ctr' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06]">
                <h2 className="font-mono text-white font-bold">CTR Optimisation</h2>
                <p className="text-xs text-white/40 font-mono mt-0.5">
                  Improve click-through rates with title and meta description testing
                </p>
              </div>
              <div className="p-4 space-y-4">
                {ctrOpportunities.length === 0 ? (
                  <div className="text-center py-12">
                    <MousePointerClick className="h-12 w-12 text-white/20 mx-auto mb-4" />
                    <h3 className="font-mono font-semibold text-white text-base mb-2">No CTR Data Yet</h3>
                    <p className="text-white/40 font-mono text-sm mb-4">
                      Connect Google Search Console to analyse CTR opportunities
                    </p>
                  </div>
                ) : (
                  ctrOpportunities.map((opp, idx) => (
                    <div key={idx} className="border border-white/[0.06] rounded-sm p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-mono font-semibold text-white">{opp.keyword}</h4>
                          <p className="text-xs text-white/40 font-mono">{opp.url}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${
                            opp.opportunity_level === 'high'
                              ? 'border-[#FF4444]/30 text-[#FF4444]'
                              : opp.opportunity_level === 'medium'
                              ? 'border-[#FFB800]/30 text-[#FFB800]'
                              : 'border-[#00FF88]/30 text-[#00FF88]'
                          }`}>
                            {opp.opportunity_level} opportunity
                          </span>
                          <p className="text-xs text-white/30 font-mono mt-1">
                            Est. +{opp.estimated_click_gain} clicks/month
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Competitors Tab */}
          {activeTab === 'competitors' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06]">
                <h2 className="font-mono text-white font-bold">Competitor Gap Analysis</h2>
                <p className="text-xs text-white/40 font-mono mt-0.5">
                  Find keyword, content, and backlink gaps vs competitors
                </p>
              </div>
              <div className="p-4">
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
                  <h3 className="font-mono font-semibold text-white text-base mb-2">Add Competitors</h3>
                  <p className="text-white/40 font-mono text-sm mb-4">
                    Track competitors to discover keyword and content opportunities
                  </p>
                  <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 hover:bg-[#00F5FF]/90">
                    Add Competitor
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
