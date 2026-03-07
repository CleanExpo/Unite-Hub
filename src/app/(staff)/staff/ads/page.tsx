'use client';

/**
 * Ads Dashboard Page
 *
 * Unified ads management with optimization suggestions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Lightbulb,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ShoppingCart,
} from 'lucide-react';

type AdPlatform = 'google_ads' | 'meta_ads' | 'tiktok_ads';

interface AdAccount {
  id: string;
  platform: AdPlatform;
  accountName: string;
  accountId: string;
  status: 'active' | 'paused' | 'disconnected';
  currency: string;
  timezone: string;
}

interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
}

interface AdCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'ended';
  budget: number;
  budgetType: 'daily' | 'lifetime';
  metrics: CampaignMetrics;
}

interface Opportunity {
  id: string;
  type: 'budget' | 'bid' | 'targeting' | 'creative' | 'audience';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedSavings?: number;
  estimatedGain?: number;
  campaignId?: string;
  campaignName?: string;
}

const PLATFORM_NAMES: Record<AdPlatform, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  tiktok_ads: 'TikTok Ads',
};

export default function AdsPage() {
  const { currentOrganization, session } = useAuth();
  const workspaceId = currentOrganization?.org_id;

  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    try {
      const response = await fetch(`/api/ads/accounts?workspaceId=${workspaceId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.accounts) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0 && !selectedAccount) {
          setSelectedAccount(data.accounts[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch ad accounts:', error);
    }
  }, [workspaceId, session?.access_token, selectedAccount]);

  const fetchCampaigns = useCallback(async () => {
    if (!workspaceId || !session?.access_token || !selectedAccount) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/ads/campaigns?workspaceId=${workspaceId}&accountId=${selectedAccount}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const data = await response.json();
      if (data.data) setCampaigns(data.data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, session?.access_token, selectedAccount]);

  const fetchOpportunities = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    try {
      const response = await fetch(`/api/ads/opportunities?workspaceId=${workspaceId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.opportunities) setOpportunities(data.opportunities);
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    }
  }, [workspaceId, session?.access_token]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { if (selectedAccount) fetchCampaigns(); }, [selectedAccount, fetchCampaigns]);
  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

  const handleAnalyze = async () => {
    if (!workspaceId || !session?.access_token) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ads/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'analyze', workspaceId }),
      });
      if (response.ok) await fetchOpportunities();
    } catch (error) {
      console.error('Failed to analyze campaigns:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalSpend = campaigns.reduce((sum, c) => sum + (c.metrics?.spend || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.metrics?.revenue || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0);
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const highImpactOpportunities = opportunities.filter((o) => o.impact === 'high').length;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

  const getImpactStyle = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-[#FF4444]/30 text-[#FF4444]';
      case 'medium': return 'border-[#FFB800]/30 text-[#FFB800]';
      case 'low': return 'border-[#00FF88]/30 text-[#00FF88]';
      default: return 'border-white/10 text-white/40';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'opportunities', label: `Opportunities${highImpactOpportunities > 0 ? ` (${highImpactOpportunities})` : ''}` },
  ];

  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-mono">Ads Dashboard</h1>
            <p className="text-white/40 font-mono text-sm mt-1">
              Monitor and optimise your advertising campaigns across platforms
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2 hover:bg-white/[0.06] disabled:opacity-50"
            >
              <Lightbulb className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
              {isAnalyzing ? 'Analysing...' : 'Find Opportunities'}
            </button>
            <button
              onClick={fetchCampaigns}
              disabled={isLoading}
              className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2 hover:bg-white/[0.06] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => setSelectedAccount(account.id)}
              className={`flex items-center gap-2 whitespace-nowrap font-mono text-sm rounded-sm px-3 py-1.5 border transition-colors ${
                selectedAccount === account.id
                  ? 'bg-[#00F5FF] text-[#050505] border-[#00F5FF] font-bold'
                  : 'bg-white/[0.04] border-white/[0.06] text-white/60 hover:bg-white/[0.06]'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${account.status === 'active' ? 'bg-[#00FF88]' : 'bg-white/20'}`} />
              <span>{PLATFORM_NAMES[account.platform]}</span>
              <span className={selectedAccount === account.id ? 'text-[#050505]/70' : 'text-white/30'}>({account.accountName})</span>
            </button>
          ))}
          {accounts.length === 0 && (
            <div className="text-white/30 font-mono text-sm p-4 border border-white/[0.06] rounded-sm w-full text-center">
              No ad accounts connected. Connect your Google Ads, Meta Ads, or TikTok Ads accounts to get started.
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Spend', value: formatCurrency(totalSpend), icon: <DollarSign className="h-8 w-8" style={{ color: '#00F5FF' }} /> },
            { label: 'Revenue', value: formatCurrency(totalRevenue), icon: <TrendingUp className="h-8 w-8" style={{ color: '#00FF88' }} /> },
            { label: 'Conversions', value: formatNumber(totalConversions), icon: <ShoppingCart className="h-8 w-8" style={{ color: '#FF00FF' }} /> },
            { label: 'ROAS', value: `${avgRoas.toFixed(2)}x`, icon: <Target className="h-8 w-8" style={{ color: '#FFB800' }} /> },
            { label: 'Opportunities', value: highImpactOpportunities, icon: <AlertTriangle className="h-8 w-8" style={{ color: '#FFB800' }} /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40 font-mono">{stat.label}</p>
                  <p className="text-2xl font-bold text-white font-mono mt-1">{stat.value}</p>
                </div>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div>
          <div className="flex border-b border-white/[0.06] mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-mono text-sm px-4 py-2 border-b-2 transition-colors ${
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
                <div className="p-4 border-b border-white/[0.06]">
                  <h2 className="font-mono text-white font-bold">Top Campaigns by ROAS</h2>
                  <p className="text-xs text-white/40 font-mono mt-0.5">Best performing campaigns by return on ad spend</p>
                </div>
                <div className="p-4 space-y-4">
                  {campaigns
                    .sort((a, b) => (b.metrics?.roas || 0) - (a.metrics?.roas || 0))
                    .slice(0, 5)
                    .map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-mono font-medium text-white text-sm truncate">{campaign.name}</p>
                          <p className="text-xs text-white/40 font-mono">
                            {formatCurrency(campaign.metrics?.spend || 0)} spent
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold font-mono text-sm" style={{ color: '#00FF88' }}>
                            {(campaign.metrics?.roas || 0).toFixed(2)}x
                          </p>
                          <p className="text-xs text-white/40 font-mono">
                            {formatCurrency(campaign.metrics?.revenue || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  {campaigns.length === 0 && (
                    <p className="text-center text-white/30 font-mono text-sm py-4">No campaign data available</p>
                  )}
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
                <div className="p-4 border-b border-white/[0.06]">
                  <h2 className="font-mono text-white font-bold">Recent Opportunities</h2>
                  <p className="text-xs text-white/40 font-mono mt-0.5">AI-detected optimisation suggestions</p>
                </div>
                <div className="p-4 space-y-4">
                  {opportunities.slice(0, 5).map((opp) => (
                    <div key={opp.id} className="p-3 border border-white/[0.06] rounded-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${getImpactStyle(opp.impact)}`}>
                              {opp.impact}
                            </span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/10 text-white/40">
                              {opp.type}
                            </span>
                          </div>
                          <p className="font-mono font-medium text-white text-sm">{opp.title}</p>
                          <p className="text-xs text-white/40 font-mono">{opp.description}</p>
                        </div>
                        {opp.estimatedSavings && (
                          <div className="text-right">
                            <p className="text-xs text-white/30 font-mono">Est. savings</p>
                            <p className="font-bold font-mono text-sm" style={{ color: '#00FF88' }}>
                              {formatCurrency(opp.estimatedSavings)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {opportunities.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-white/30 font-mono text-sm mb-2">No opportunities detected</p>
                      <button
                        onClick={handleAnalyze}
                        className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-xs rounded-sm px-3 py-1.5 hover:bg-white/[0.06]"
                      >
                        Run Analysis
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06]">
                <h2 className="font-mono text-white font-bold">All Campaigns</h2>
                <p className="text-xs text-white/40 font-mono mt-0.5">Campaign performance across all connected accounts</p>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {['Campaign', 'Status', 'Budget', 'Impressions', 'Clicks', 'CTR', 'Spend', 'Conv.', 'ROAS'].map((h, i) => (
                          <th key={h} className={`py-3 px-4 font-mono text-xs text-white/40 font-normal ${i === 0 || i === 1 ? 'text-left' : 'text-right'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <p className="font-mono font-medium text-white text-sm">{campaign.name}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${
                              campaign.status === 'active'
                                ? 'border-[#00FF88]/30 text-[#00FF88]'
                                : 'border-white/10 text-white/40'
                            }`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-sm text-white/60">
                            {formatCurrency(campaign.budget)}/{campaign.budgetType === 'daily' ? 'day' : 'total'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-sm text-white/60">{formatNumber(campaign.metrics?.impressions || 0)}</td>
                          <td className="py-3 px-4 text-right font-mono text-sm text-white/60">{formatNumber(campaign.metrics?.clicks || 0)}</td>
                          <td className="py-3 px-4 text-right font-mono text-sm text-white/60">{((campaign.metrics?.ctr || 0) * 100).toFixed(2)}%</td>
                          <td className="py-3 px-4 text-right font-mono text-sm text-white/60">{formatCurrency(campaign.metrics?.spend || 0)}</td>
                          <td className="py-3 px-4 text-right font-mono text-sm text-white/60">{formatNumber(campaign.metrics?.conversions || 0)}</td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className="font-mono text-sm font-bold"
                              style={{ color: (campaign.metrics?.roas || 0) >= 1 ? '#00FF88' : '#FF4444' }}
                            >
                              {(campaign.metrics?.roas || 0).toFixed(2)}x
                            </span>
                          </td>
                        </tr>
                      ))}
                      {campaigns.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-white/30 font-mono text-sm">
                            No campaigns found. Connect an ad account to see your campaigns.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Opportunities Tab */}
          {activeTab === 'opportunities' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="font-mono text-white font-bold">Optimisation Opportunities</h2>
                  <p className="text-xs text-white/40 font-mono mt-0.5">
                    AI-detected suggestions to improve your campaign performance
                  </p>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2 hover:bg-white/[0.06] disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  Re-analyse
                </button>
              </div>
              <div className="p-4 space-y-4">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="p-4 border border-white/[0.06] rounded-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${getImpactStyle(opp.impact)}`}>
                            {opp.impact} impact
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/10 text-white/40">
                            {opp.type}
                          </span>
                          {opp.campaignName && (
                            <span className="text-xs text-white/30 font-mono">· {opp.campaignName}</span>
                          )}
                        </div>
                        <h3 className="font-mono font-semibold text-white text-base">{opp.title}</h3>
                        <p className="text-white/40 font-mono text-sm mt-1">{opp.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        {opp.estimatedSavings && (
                          <div>
                            <p className="text-xs text-white/30 font-mono">Potential savings</p>
                            <p className="text-xl font-bold font-mono" style={{ color: '#00FF88' }}>
                              {formatCurrency(opp.estimatedSavings)}
                            </p>
                          </div>
                        )}
                        {opp.estimatedGain && (
                          <div>
                            <p className="text-xs text-white/30 font-mono">Potential gain</p>
                            <p className="text-xl font-bold font-mono" style={{ color: '#00FF88' }}>
                              {formatCurrency(opp.estimatedGain)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                      <p className="text-xs text-white/30 font-mono">
                        This is a suggestion only. Review before making changes.
                      </p>
                      <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-xs rounded-sm px-3 py-1.5 flex items-center gap-1 hover:bg-white/[0.06]">
                        View Details
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {opportunities.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#00FF88' }} />
                    <p className="text-lg font-mono font-medium text-white">No opportunities detected</p>
                    <p className="text-white/40 font-mono text-sm mb-4">
                      Your campaigns are performing well or there's not enough data yet.
                    </p>
                    <button
                      onClick={handleAnalyze}
                      className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 hover:bg-[#00F5FF]/90"
                    >
                      Run Analysis
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
