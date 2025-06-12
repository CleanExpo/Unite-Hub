"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, AlertCircle, Loader2, Calendar, BarChart3 } from 'lucide-react';

interface FinancialAnalyticsProps {
  clientId?: string;
}

interface DealData {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expected_close_date: string;
  created_at: string;
  clients: {
    name: string;
    company: string;
  };
}

interface ClientData {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
  industry: string;
  created_at: string;
}

interface FinancialMetrics {
  totalPipelineValue: number;
  projectedRevenue: number;
  averageDealSize: number;
  activeClientsCount: number;
  conversionRate: number;
  recentDealsValue: number;
}

// REAL Financial Analytics Component - NO MOCK DATA, NO FAKE AI
export default function FinancialAnalytics({ clientId }: FinancialAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<DealData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalPipelineValue: 0,
    projectedRevenue: 0,
    averageDealSize: 0,
    activeClientsCount: 0,
    conversionRate: 0,
    recentDealsValue: 0
  });

  // Fetch real financial data from APIs
  useEffect(() => {
    const fetchRealFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch deals and clients in parallel
        const [dealsResponse, clientsResponse] = await Promise.all([
          fetch('/api/crm/deals'),
          fetch('/api/crm/clients')
        ]);

        if (!dealsResponse.ok) {
          throw new Error(`Failed to fetch deals: ${dealsResponse.status}`);
        }
        if (!clientsResponse.ok) {
          throw new Error(`Failed to fetch clients: ${clientsResponse.status}`);
        }

        const dealsData = await dealsResponse.json();
        const clientsData = await clientsResponse.json();

        const realDeals = dealsData.data || [];
        const realClients = clientsData.data || [];

        setDeals(realDeals);
        setClients(realClients);

        // Calculate REAL financial metrics from actual data
        const realMetrics = calculateRealMetrics(realDeals, realClients);
        setMetrics(realMetrics);

      } catch (error) {
        console.error('Error fetching financial data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchRealFinancialData();
  }, [clientId]);

  // Calculate real financial metrics from actual database data
  const calculateRealMetrics = (dealsData: DealData[], clientsData: ClientData[]): FinancialMetrics => {
    // Total pipeline value from all deals
    const totalPipelineValue = dealsData.reduce((sum, deal) => 
      sum + parseFloat(deal.value.toString()), 0
    );

    // Projected revenue based on probability-weighted deal values
    const projectedRevenue = dealsData.reduce((sum, deal) => 
      sum + (parseFloat(deal.value.toString()) * (deal.probability / 100)), 0
    );

    // Average deal size
    const averageDealSize = dealsData.length > 0 ? totalPipelineValue / dealsData.length : 0;

    // Active clients count
    const activeClientsCount = clientsData.filter(client => client.status === 'active').length;

    // Simple conversion rate calculation (closed won deals vs total deals)
    const closedWonDeals = dealsData.filter(deal => 
      deal.stage === 'closed_won' || deal.stage === 'won'
    ).length;
    const conversionRate = dealsData.length > 0 ? (closedWonDeals / dealsData.length) * 100 : 0;

    // Recent deals value (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDealsValue = dealsData
      .filter(deal => new Date(deal.created_at) > thirtyDaysAgo)
      .reduce((sum, deal) => sum + parseFloat(deal.value.toString()), 0);

    return {
      totalPipelineValue,
      projectedRevenue,
      averageDealSize,
      activeClientsCount,
      conversionRate,
      recentDealsValue
    };
  };

  // Get deals by stage for revenue analysis
  const getDealsByStage = () => {
    const stageBreakdown: Record<string, { count: number; value: number }> = {};
    
    deals.forEach(deal => {
      const stage = deal.stage || 'unknown';
      if (!stageBreakdown[stage]) {
        stageBreakdown[stage] = { count: 0, value: 0 };
      }
      stageBreakdown[stage].count++;
      stageBreakdown[stage].value += parseFloat(deal.value.toString());
    });

    return stageBreakdown;
  };

  // Get high-value deals
  const getHighValueDeals = () => {
    return deals
      .filter(deal => parseFloat(deal.value.toString()) > metrics.averageDealSize)
      .sort((a, b) => parseFloat(b.value.toString()) - parseFloat(a.value.toString()))
      .slice(0, 10);
  };

  // Get recent financial activity
  const getRecentActivity = () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return deals
      .filter(deal => new Date(deal.created_at) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real financial data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="h-8 w-8 mr-2" />
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalPipelineValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {deals.length} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${Math.round(metrics.projectedRevenue).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Probability-weighted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(metrics.averageDealSize).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per deal average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Close rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real Financial Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">
            <DollarSign className="w-4 h-4 mr-2" />
            Revenue Analysis
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Pipeline Breakdown
          </TabsTrigger>
          <TabsTrigger value="high-value">
            <TrendingUp className="w-4 h-4 mr-2" />
            High Value Deals
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Calendar className="w-4 h-4 mr-2" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real revenue calculations from actual deal data
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Current Pipeline</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      ${metrics.totalPipelineValue.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Total deal value</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Projected Revenue</h4>
                    <div className="text-2xl font-bold text-green-600">
                      ${Math.round(metrics.projectedRevenue).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Probability-weighted forecast</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Recent Revenue</h4>
                    <div className="text-2xl font-bold text-purple-600">
                      ${metrics.recentDealsValue.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Last 30 days</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Active Clients</h4>
                    <div className="text-2xl font-bold text-orange-600">
                      {metrics.activeClientsCount}
                    </div>
                    <p className="text-sm text-muted-foreground">Contributing to revenue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stage Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real deal distribution across pipeline stages
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(getDealsByStage()).map(([stage, data]) => (
                  <div key={stage} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium capitalize">{stage.replace('_', ' ')}</h4>
                      <p className="text-sm text-muted-foreground">{data.count} deals</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${data.value.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Total value</div>
                    </div>
                  </div>
                ))}
                {Object.keys(getDealsByStage()).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pipeline data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High Value Deals</CardTitle>
              <p className="text-sm text-muted-foreground">
                Deals above average size (${Math.round(metrics.averageDealSize).toLocaleString()})
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getHighValueDeals().map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{deal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.clients.name} â€¢ {deal.clients.company}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{deal.stage.replace('_', ' ')}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {deal.probability}% probability
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {deal.expected_close_date ? 
                          `Due: ${new Date(deal.expected_close_date).toLocaleDateString()}` :
                          'No close date'
                        }
                      </div>
                    </div>
                  </div>
                ))}
                {getHighValueDeals().length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No high value deals available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Financial Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest deals and financial movements (last 30 days)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getRecentActivity().map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{deal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.clients.name} â€¢ {deal.clients.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(deal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                      <Badge 
                        variant={deal.probability >= 70 ? 'default' : 'secondary'}
                      >
                        {deal.probability}% probability
                      </Badge>
                    </div>
                  </div>
                ))}
                {getRecentActivity().length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent financial activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
