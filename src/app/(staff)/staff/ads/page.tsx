'use client';

/**
 * Ads Dashboard Page
 *
 * Unified ads management with optimization suggestions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Eye,
  MousePointer,
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

const PLATFORM_COLORS: Record<AdPlatform, string> = {
  google_ads: 'bg-blue-600',
  meta_ads: 'bg-blue-700',
  tiktok_ads: 'bg-black',
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
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      const data = await response.json();
      if (data.data) {
        setCampaigns(data.data);
      }
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
      if (data.opportunities) {
        setOpportunities(data.opportunities);
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    }
  }, [workspaceId, session?.access_token]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (selectedAccount) {
      fetchCampaigns();
    }
  }, [selectedAccount, fetchCampaigns]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleAnalyze = async () => {
    if (!workspaceId || !session?.access_token) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ads/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'analyze',
          workspaceId,
        }),
      });

      if (response.ok) {
        await fetchOpportunities();
      }
    } catch (error) {
      console.error('Failed to analyze campaigns:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate aggregate metrics
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.metrics?.spend || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.metrics?.revenue || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0);
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const highImpactOpportunities = opportunities.filter((o) => o.impact === 'high').length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Ads Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and optimize your advertising campaigns across platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAnalyze} disabled={isAnalyzing}>
            <Lightbulb className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-pulse' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Find Opportunities'}
          </Button>
          <Button variant="outline" onClick={fetchCampaigns} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {accounts.map((account) => (
          <Button
            key={account.id}
            variant={selectedAccount === account.id ? 'default' : 'outline'}
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={() => setSelectedAccount(account.id)}
          >
            <div className={`w-2 h-2 rounded-full ${account.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{PLATFORM_NAMES[account.platform]}</span>
            <span className="text-muted-foreground">({account.accountName})</span>
          </Button>
        ))}
        {accounts.length === 0 && (
          <div className="text-muted-foreground p-4 border rounded-lg w-full text-center">
            No ad accounts connected. Connect your Google Ads, Meta Ads, or TikTok Ads accounts to get started.
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpend)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{formatNumber(totalConversions)}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ROAS</p>
                <p className="text-2xl font-bold">{avgRoas.toFixed(2)}x</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Opportunities</p>
                <p className="text-2xl font-bold">{highImpactOpportunities}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="opportunities">
            Opportunities
            {highImpactOpportunities > 0 && (
              <Badge variant="destructive" className="ml-2">
                {highImpactOpportunities}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Top Campaigns by ROAS</CardTitle>
                <CardDescription>Best performing campaigns by return on ad spend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns
                    .sort((a, b) => (b.metrics?.roas || 0) - (a.metrics?.roas || 0))
                    .slice(0, 5)
                    .map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium truncate">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(campaign.metrics?.spend || 0)} spent
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{(campaign.metrics?.roas || 0).toFixed(2)}x</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(campaign.metrics?.revenue || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  {campaigns.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No campaign data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Opportunities</CardTitle>
                <CardDescription>AI-detected optimization suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opportunities.slice(0, 5).map((opp) => (
                    <div key={opp.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getImpactColor(opp.impact)}>{opp.impact}</Badge>
                            <Badge variant="outline">{opp.type}</Badge>
                          </div>
                          <p className="font-medium">{opp.title}</p>
                          <p className="text-sm text-muted-foreground">{opp.description}</p>
                        </div>
                        {opp.estimatedSavings && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Est. savings</p>
                            <p className="font-bold text-green-600">{formatCurrency(opp.estimatedSavings)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {opportunities.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">No opportunities detected</p>
                      <Button variant="outline" size="sm" onClick={handleAnalyze}>
                        Run Analysis
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>All Campaigns</CardTitle>
              <CardDescription>Campaign performance across all connected accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Campaign</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Budget</th>
                      <th className="text-right py-3 px-4">Impressions</th>
                      <th className="text-right py-3 px-4">Clicks</th>
                      <th className="text-right py-3 px-4">CTR</th>
                      <th className="text-right py-3 px-4">Spend</th>
                      <th className="text-right py-3 px-4">Conv.</th>
                      <th className="text-right py-3 px-4">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <p className="font-medium">{campaign.name}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(campaign.budget)}/{campaign.budgetType === 'daily' ? 'day' : 'total'}
                        </td>
                        <td className="py-3 px-4 text-right">{formatNumber(campaign.metrics?.impressions || 0)}</td>
                        <td className="py-3 px-4 text-right">{formatNumber(campaign.metrics?.clicks || 0)}</td>
                        <td className="py-3 px-4 text-right">{((campaign.metrics?.ctr || 0) * 100).toFixed(2)}%</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(campaign.metrics?.spend || 0)}</td>
                        <td className="py-3 px-4 text-right">{formatNumber(campaign.metrics?.conversions || 0)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={(campaign.metrics?.roas || 0) >= 1 ? 'text-green-600' : 'text-red-600'}>
                            {(campaign.metrics?.roas || 0).toFixed(2)}x
                          </span>
                        </td>
                      </tr>
                    ))}
                    {campaigns.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-muted-foreground">
                          No campaigns found. Connect an ad account to see your campaigns.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Optimization Opportunities</CardTitle>
                  <CardDescription>
                    AI-detected suggestions to improve your campaign performance
                  </CardDescription>
                </div>
                <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  Re-analyze
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getImpactColor(opp.impact)}>{opp.impact} impact</Badge>
                          <Badge variant="outline">{opp.type}</Badge>
                          {opp.campaignName && (
                            <span className="text-sm text-muted-foreground">• {opp.campaignName}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg">{opp.title}</h3>
                        <p className="text-muted-foreground mt-1">{opp.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        {opp.estimatedSavings && (
                          <div>
                            <p className="text-sm text-muted-foreground">Potential savings</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(opp.estimatedSavings)}</p>
                          </div>
                        )}
                        {opp.estimatedGain && (
                          <div>
                            <p className="text-sm text-muted-foreground">Potential gain</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(opp.estimatedGain)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        This is a suggestion only. Review before making changes.
                      </p>
                      <Button variant="outline" size="sm">
                        View Details
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ))}
                {opportunities.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-lg font-medium">No opportunities detected</p>
                    <p className="text-muted-foreground mb-4">
                      Your campaigns are performing well or there's not enough data yet.
                    </p>
                    <Button onClick={handleAnalyze}>Run Analysis</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
