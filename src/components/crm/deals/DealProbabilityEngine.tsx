"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, DollarSign, Calendar, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

interface DealProbabilityEngineProps {
  dealId?: string;
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

interface DealStats {
  totalValue: number;
  averageDealSize: number;
  totalDeals: number;
  stageBreakdown: Record<string, number>;
  probabilityDistribution: Record<string, number>;
  recentDeals: number;
}

// REAL Deal Analytics Component - NO MOCK DATA, NO FAKE AI
export default function DealProbabilityEngine({ dealId }: DealProbabilityEngineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<DealData[]>([]);
  const [stats, setStats] = useState<DealStats> "use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, DollarSign, Calendar, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

interface DealProbabilityEngineProps {
  dealId?: string;
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

interface DealStats {
  totalValue: number;
  averageDealSize: number;
  totalDeals: number;
  stageBreakdown: Record<string, number>;
  probabilityDistribution: Record<string, number>;
  recentDeals: number;
}

// REAL Deal Analytics Component - NO MOCK DATA, NO FAKE AI
export default function DealProbabilityEngine({ dealId }: DealProbabilityEngineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<DealData[]>([]);
  const [stats, setStats] = useState<DealStats>({
    totalValue: 0,
    averageDealSize: 0,
    totalDeals: 0,
    stageBreakdown: {},
    probabilityDistribution: {},
    recentDeals: 0
  });

  // Fetch real deal data from API
  useEffect(() => {
    const fetchRealDealData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/crm/deals');
        if (!response.ok) {
          throw new Error(`Failed to fetch deals: ${response.status}`);
        }

        const data = await response.json();
        const dealsData = data.data || [];
        setDeals(dealsData);

        // Calculate REAL statistics from actual data
        const realStats = calculateRealStats(dealsData);
        setStats(realStats);

      } catch (error) {
        console.error('Error fetching deal data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load deal data');
      } finally {
        setLoading(false);
      }
    };

    fetchRealDealData();
  }, [dealId]);

  // Calculate real statistics from actual database data
  const calculateRealStats = (dealsData: DealData[]): DealStats => {
    const totalDeals = dealsData.length;
    const totalValue = dealsData.reduce((sum, deal) => sum + parseFloat(deal.value.toString()), 0);
    const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

    // Calculate stage breakdown
    const stageBreakdown: Record<string, number> = {};
    dealsData.forEach(deal => {
      const stage = deal.stage || 'Unknown';
      stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
    });

    // Calculate probability distribution
    const probabilityDistribution: Record<string, number> = {
      'High (80-100%)': 0,
      'Medium (50-79%)': 0,
      'Low (0-49%)': 0
    };

    dealsData.forEach(deal => {
      const prob = deal.probability || 0;
      if (prob >= 80) probabilityDistribution['High (80-100%)']++;
      else if (prob >= 50) probabilityDistribution['Medium (50-79%)']++;
      else probabilityDistribution['Low (0-49%)']++;
    });

    // Calculate recent deals (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDeals = dealsData.filter(deal => 
      new Date(deal.created_at) > thirtyDaysAgo
    ).length;

    return {
      totalValue,
      averageDealSize,
      totalDeals,
      stageBreakdown,
      probabilityDistribution,
      recentDeals
    };
  };

  // Get deals by stage for pipeline view
  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  // Get high value deals
  const getHighValueDeals = () => {
    return deals
      .filter(deal => parseFloat(deal.value.toString()) > stats.averageDealSize)
      .sort((a, b) => parseFloat(b.value.toString()) - parseFloat(a.value.toString()))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real deal data...</span>
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
      {/* Real Deal Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDeals} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(stats.averageDealSize).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per deal average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Deals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentDeals}</div>
            <p className="text-xs text-muted-foreground">
              Added last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Stages</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.stageBreakdown).length}</div>
            <p className="text-xs text-muted-foreground">
              Active stages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real Deal Analytics Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Pipeline Stages
          </TabsTrigger>
          <TabsTrigger value="probability">
            <Target className="w-4 h-4 mr-2" />
            Probability Distribution
          </TabsTrigger>
          <TabsTrigger value="high-value">
            <DollarSign className="w-4 h-4 mr-2" />
            High Value Deals
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Calendar className="w-4 h-4 mr-2" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stage Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real breakdown of deals by stage from database
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.stageBreakdown).map(([stage, count]) => (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{stage.replace('_', ' ')}</span>
                      <span>{count} deals</span>
                    </div>
                    <Progress 
                      value={(count / stats.totalDeals) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
                {Object.keys(stats.stageBreakdown).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal stage data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="probability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal Probability Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribution of deal probabilities from actual data
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.probabilityDistribution).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        range.includes('High') ? 'bg-green-500' :
                        range.includes('Medium') ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{range}</span>
                    </div>
                    <Badge variant="outline">{count} deals</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High Value Deals</CardTitle>
              <p className="text-sm text-muted-foreground">
                Deals above average value (${Math.round(stats.averageDealSize).toLocaleString()})
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getHighValueDeals().map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{deal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.clients.name} • {deal.clients.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stage: {deal.stage.replace('_', ' ')} • {deal.probability}% probability
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {deal.expected_close_date ? 
                          `Due: ${new Date(deal.expected_close_date).toLocaleDateString()}` :
                          'No close date set'
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
              <CardTitle>Recent Deal Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest deal additions and updates
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{deal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {deal.clients.name} • {deal.clients.company}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                        <Badge 
                          variant={deal.probability >= 80 ? 'default' : 
                                  deal.probability >= 50 ? 'secondary' : 'outline'}
                        >
                          {deal.probability}% probability
                        </Badge>
                      </div>
                    </div>
                  ))}
                {deals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal data available yet
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
.Value -replace "'", "'" <string, number> "use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, DollarSign, Calendar, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

interface DealProbabilityEngineProps {
  dealId?: string;
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

interface DealStats {
  totalValue: number;
  averageDealSize: number;
  totalDeals: number;
  stageBreakdown: Record<string, number>;
  probabilityDistribution: Record<string, number>;
  recentDeals: number;
}

// REAL Deal Analytics Component - NO MOCK DATA, NO FAKE AI
export default function DealProbabilityEngine({ dealId }: DealProbabilityEngineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<DealData[]>([]);
  const [stats, setStats] = useState<DealStats>({
    totalValue: 0,
    averageDealSize: 0,
    totalDeals: 0,
    stageBreakdown: {},
    probabilityDistribution: {},
    recentDeals: 0
  });

  // Fetch real deal data from API
  useEffect(() => {
    const fetchRealDealData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/crm/deals');
        if (!response.ok) {
          throw new Error(`Failed to fetch deals: ${response.status}`);
        }

        const data = await response.json();
        const dealsData = data.data || [];
        setDeals(dealsData);

        // Calculate REAL statistics from actual data
        const realStats = calculateRealStats(dealsData);
        setStats(realStats);

      } catch (error) {
        console.error('Error fetching deal data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load deal data');
      } finally {
        setLoading(false);
      }
    };

    fetchRealDealData();
  }, [dealId]);

  // Calculate real statistics from actual database data
  const calculateRealStats = (dealsData: DealData[]): DealStats => {
    const totalDeals = dealsData.length;
    const totalValue = dealsData.reduce((sum, deal) => sum + parseFloat(deal.value.toString()), 0);
    const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

    // Calculate stage breakdown
    const stageBreakdown: Record<string, number> = {};
    dealsData.forEach(deal => {
      const stage = deal.stage || 'Unknown';
      stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
    });

    // Calculate probability distribution
    const probabilityDistribution: Record<string, number> = {
      'High (80-100%)': 0,
      'Medium (50-79%)': 0,
      'Low (0-49%)': 0
    };

    dealsData.forEach(deal => {
      const prob = deal.probability || 0;
      if (prob >= 80) probabilityDistribution['High (80-100%)']++;
      else if (prob >= 50) probabilityDistribution['Medium (50-79%)']++;
      else probabilityDistribution['Low (0-49%)']++;
    });

    // Calculate recent deals (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDeals = dealsData.filter(deal => 
      new Date(deal.created_at) > thirtyDaysAgo
    ).length;

    return {
      totalValue,
      averageDealSize,
      totalDeals,
      stageBreakdown,
      probabilityDistribution,
      recentDeals
    };
  };

  // Get deals by stage for pipeline view
  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  // Get high value deals
  const getHighValueDeals = () => {
    return deals
      .filter(deal => parseFloat(deal.value.toString()) > stats.averageDealSize)
      .sort((a, b) => parseFloat(b.value.toString()) - parseFloat(a.value.toString()))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real deal data...</span>
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
      {/* Real Deal Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDeals} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(stats.averageDealSize).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per deal average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Deals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentDeals}</div>
            <p className="text-xs text-muted-foreground">
              Added last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Stages</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.stageBreakdown).length}</div>
            <p className="text-xs text-muted-foreground">
              Active stages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real Deal Analytics Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Pipeline Stages
          </TabsTrigger>
          <TabsTrigger value="probability">
            <Target className="w-4 h-4 mr-2" />
            Probability Distribution
          </TabsTrigger>
          <TabsTrigger value="high-value">
            <DollarSign className="w-4 h-4 mr-2" />
            High Value Deals
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Calendar className="w-4 h-4 mr-2" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stage Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real breakdown of deals by stage from database
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.stageBreakdown).map(([stage, count]) => (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{stage.replace('_', ' ')}</span>
                      <span>{count} deals</span>
                    </div>
                    <Progress 
                      value={(count / stats.totalDeals) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
                {Object.keys(stats.stageBreakdown).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal stage data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="probability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal Probability Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribution of deal probabilities from actual data
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.probabilityDistribution).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        range.includes('High') ? 'bg-green-500' :
                        range.includes('Medium') ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{range}</span>
                    </div>
                    <Badge variant="outline">{count} deals</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High Value Deals</CardTitle>
              <p className="text-sm text-muted-foreground">
                Deals above average value (${Math.round(stats.averageDealSize).toLocaleString()})
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getHighValueDeals().map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{deal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.clients.name} • {deal.clients.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stage: {deal.stage.replace('_', ' ')} • {deal.probability}% probability
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {deal.expected_close_date ? 
                          `Due: ${new Date(deal.expected_close_date).toLocaleDateString()}` :
                          'No close date set'
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
              <CardTitle>Recent Deal Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest deal additions and updates
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{deal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {deal.clients.name} • {deal.clients.company}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                        <Badge 
                          variant={deal.probability >= 80 ? 'default' : 
                                  deal.probability >= 50 ? 'secondary' : 'outline'}
                        >
                          {deal.probability}% probability
                        </Badge>
                      </div>
                    </div>
                  ))}
                {deals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal data available yet
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
.Value -replace "'", "'" <string, number> "use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, DollarSign, Calendar, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

interface DealProbabilityEngineProps {
  dealId?: string;
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

interface DealStats {
  totalValue: number;
  averageDealSize: number;
  totalDeals: number;
  stageBreakdown: Record<string, number>;
  probabilityDistribution: Record<string, number>;
  recentDeals: number;
}

// REAL Deal Analytics Component - NO MOCK DATA, NO FAKE AI
export default function DealProbabilityEngine({ dealId }: DealProbabilityEngineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<DealData[]>([]);
  const [stats, setStats] = useState<DealStats>({
    totalValue: 0,
    averageDealSize: 0,
    totalDeals: 0,
    stageBreakdown: {},
    probabilityDistribution: {},
    recentDeals: 0
  });

  // Fetch real deal data from API
  useEffect(() => {
    const fetchRealDealData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/crm/deals');
        if (!response.ok) {
          throw new Error(`Failed to fetch deals: ${response.status}`);
        }

        const data = await response.json();
        const dealsData = data.data || [];
        setDeals(dealsData);

        // Calculate REAL statistics from actual data
        const realStats = calculateRealStats(dealsData);
        setStats(realStats);

      } catch (error) {
        console.error('Error fetching deal data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load deal data');
      } finally {
        setLoading(false);
      }
    };

    fetchRealDealData();
  }, [dealId]);

  // Calculate real statistics from actual database data
  const calculateRealStats = (dealsData: DealData[]): DealStats => {
    const totalDeals = dealsData.length;
    const totalValue = dealsData.reduce((sum, deal) => sum + parseFloat(deal.value.toString()), 0);
    const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

    // Calculate stage breakdown
    const stageBreakdown: Record<string, number> = {};
    dealsData.forEach(deal => {
      const stage = deal.stage || 'Unknown';
      stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
    });

    // Calculate probability distribution
    const probabilityDistribution: Record<string, number> = {
      'High (80-100%)': 0,
      'Medium (50-79%)': 0,
      'Low (0-49%)': 0
    };

    dealsData.forEach(deal => {
      const prob = deal.probability || 0;
      if (prob >= 80) probabilityDistribution['High (80-100%)']++;
      else if (prob >= 50) probabilityDistribution['Medium (50-79%)']++;
      else probabilityDistribution['Low (0-49%)']++;
    });

    // Calculate recent deals (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDeals = dealsData.filter(deal => 
      new Date(deal.created_at) > thirtyDaysAgo
    ).length;

    return {
      totalValue,
      averageDealSize,
      totalDeals,
      stageBreakdown,
      probabilityDistribution,
      recentDeals
    };
  };

  // Get deals by stage for pipeline view
  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  // Get high value deals
  const getHighValueDeals = () => {
    return deals
      .filter(deal => parseFloat(deal.value.toString()) > stats.averageDealSize)
      .sort((a, b) => parseFloat(b.value.toString()) - parseFloat(a.value.toString()))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real deal data...</span>
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
      {/* Real Deal Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDeals} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(stats.averageDealSize).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per deal average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Deals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentDeals}</div>
            <p className="text-xs text-muted-foreground">
              Added last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Stages</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.stageBreakdown).length}</div>
            <p className="text-xs text-muted-foreground">
              Active stages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real Deal Analytics Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Pipeline Stages
          </TabsTrigger>
          <TabsTrigger value="probability">
            <Target className="w-4 h-4 mr-2" />
            Probability Distribution
          </TabsTrigger>
          <TabsTrigger value="high-value">
            <DollarSign className="w-4 h-4 mr-2" />
            High Value Deals
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Calendar className="w-4 h-4 mr-2" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stage Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real breakdown of deals by stage from database
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.stageBreakdown).map(([stage, count]) => (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{stage.replace('_', ' ')}</span>
                      <span>{count} deals</span>
                    </div>
                    <Progress 
                      value={(count / stats.totalDeals) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
                {Object.keys(stats.stageBreakdown).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal stage data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="probability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal Probability Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribution of deal probabilities from actual data
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.probabilityDistribution).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        range.includes('High') ? 'bg-green-500' :
                        range.includes('Medium') ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{range}</span>
                    </div>
                    <Badge variant="outline">{count} deals</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High Value Deals</CardTitle>
              <p className="text-sm text-muted-foreground">
                Deals above average value (${Math.round(stats.averageDealSize).toLocaleString()})
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getHighValueDeals().map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{deal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.clients.name} • {deal.clients.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stage: {deal.stage.replace('_', ' ')} • {deal.probability}% probability
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {deal.expected_close_date ? 
                          `Due: ${new Date(deal.expected_close_date).toLocaleDateString()}` :
                          'No close date set'
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
              <CardTitle>Recent Deal Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest deal additions and updates
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{deal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {deal.clients.name} • {deal.clients.company}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                        <Badge 
                          variant={deal.probability >= 80 ? 'default' : 
                                  deal.probability >= 50 ? 'secondary' : 'outline'}
                        >
                          {deal.probability}% probability
                        </Badge>
                      </div>
                    </div>
                  ))}
                {deals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal data available yet
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
.Value -replace "'", "'" <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real deal data...</span>
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
      {/* Real Deal Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDeals} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(stats.averageDealSize).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per deal average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Deals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentDeals}</div>
            <p className="text-xs text-muted-foreground">
              Added last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Stages</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.stageBreakdown).length}</div>
            <p className="text-xs text-muted-foreground">
              Active stages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real Deal Analytics Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Pipeline Stages
          </TabsTrigger>
          <TabsTrigger value="probability">
            <Target className="w-4 h-4 mr-2" />
            Probability Distribution
          </TabsTrigger>
          <TabsTrigger value="high-value">
            <DollarSign className="w-4 h-4 mr-2" />
            High Value Deals
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Calendar className="w-4 h-4 mr-2" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stage Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real breakdown of deals by stage from database
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.stageBreakdown).map(([stage, count]) => (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize"> "use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, DollarSign, Calendar, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

interface DealProbabilityEngineProps {
  dealId?: string;
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

interface DealStats {
  totalValue: number;
  averageDealSize: number;
  totalDeals: number;
  stageBreakdown: Record<string, number>;
  probabilityDistribution: Record<string, number>;
  recentDeals: number;
}

// REAL Deal Analytics Component - NO MOCK DATA, NO FAKE AI
export default function DealProbabilityEngine({ dealId }: DealProbabilityEngineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<DealData[]>([]);
  const [stats, setStats] = useState<DealStats>({
    totalValue: 0,
    averageDealSize: 0,
    totalDeals: 0,
    stageBreakdown: {},
    probabilityDistribution: {},
    recentDeals: 0
  });

  // Fetch real deal data from API
  useEffect(() => {
    const fetchRealDealData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/crm/deals');
        if (!response.ok) {
          throw new Error(`Failed to fetch deals: ${response.status}`);
        }

        const data = await response.json();
        const dealsData = data.data || [];
        setDeals(dealsData);

        // Calculate REAL statistics from actual data
        const realStats = calculateRealStats(dealsData);
        setStats(realStats);

      } catch (error) {
        console.error('Error fetching deal data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load deal data');
      } finally {
        setLoading(false);
      }
    };

    fetchRealDealData();
  }, [dealId]);

  // Calculate real statistics from actual database data
  const calculateRealStats = (dealsData: DealData[]): DealStats => {
    const totalDeals = dealsData.length;
    const totalValue = dealsData.reduce((sum, deal) => sum + parseFloat(deal.value.toString()), 0);
    const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

    // Calculate stage breakdown
    const stageBreakdown: Record<string, number> = {};
    dealsData.forEach(deal => {
      const stage = deal.stage || 'Unknown';
      stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
    });

    // Calculate probability distribution
    const probabilityDistribution: Record<string, number> = {
      'High (80-100%)': 0,
      'Medium (50-79%)': 0,
      'Low (0-49%)': 0
    };

    dealsData.forEach(deal => {
      const prob = deal.probability || 0;
      if (prob >= 80) probabilityDistribution['High (80-100%)']++;
      else if (prob >= 50) probabilityDistribution['Medium (50-79%)']++;
      else probabilityDistribution['Low (0-49%)']++;
    });

    // Calculate recent deals (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDeals = dealsData.filter(deal => 
      new Date(deal.created_at) > thirtyDaysAgo
    ).length;

    return {
      totalValue,
      averageDealSize,
      totalDeals,
      stageBreakdown,
      probabilityDistribution,
      recentDeals
    };
  };

  // Get deals by stage for pipeline view
  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  // Get high value deals
  const getHighValueDeals = () => {
    return deals
      .filter(deal => parseFloat(deal.value.toString()) > stats.averageDealSize)
      .sort((a, b) => parseFloat(b.value.toString()) - parseFloat(a.value.toString()))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real deal data...</span>
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
      {/* Real Deal Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDeals} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(stats.averageDealSize).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per deal average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Deals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentDeals}</div>
            <p className="text-xs text-muted-foreground">
              Added last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Stages</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.stageBreakdown).length}</div>
            <p className="text-xs text-muted-foreground">
              Active stages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real Deal Analytics Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Pipeline Stages
          </TabsTrigger>
          <TabsTrigger value="probability">
            <Target className="w-4 h-4 mr-2" />
            Probability Distribution
          </TabsTrigger>
          <TabsTrigger value="high-value">
            <DollarSign className="w-4 h-4 mr-2" />
            High Value Deals
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Calendar className="w-4 h-4 mr-2" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stage Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real breakdown of deals by stage from database
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.stageBreakdown).map(([stage, count]) => (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{stage.replace('_', ' ')}</span>
                      <span>{count} deals</span>
                    </div>
                    <Progress 
                      value={(count / stats.totalDeals) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
                {Object.keys(stats.stageBreakdown).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal stage data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="probability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal Probability Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribution of deal probabilities from actual data
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.probabilityDistribution).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        range.includes('High') ? 'bg-green-500' :
                        range.includes('Medium') ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{range}</span>
                    </div>
                    <Badge variant="outline">{count} deals</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High Value Deals</CardTitle>
              <p className="text-sm text-muted-foreground">
                Deals above average value (${Math.round(stats.averageDealSize).toLocaleString()})
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getHighValueDeals().map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{deal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.clients.name} • {deal.clients.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stage: {deal.stage.replace('_', ' ')} • {deal.probability}% probability
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {deal.expected_close_date ? 
                          `Due: ${new Date(deal.expected_close_date).toLocaleDateString()}` :
                          'No close date set'
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
              <CardTitle>Recent Deal Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest deal additions and updates
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{deal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {deal.clients.name} • {deal.clients.company}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                        <Badge 
                          variant={deal.probability >= 80 ? 'default' : 
                                  deal.probability >= 50 ? 'secondary' : 'outline'}
                        >
                          {deal.probability}% probability
                        </Badge>
                      </div>
                    </div>
                  ))}
                {deals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal data available yet
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
.Value -replace "'", "'" </span>
                      <span>{count} deals</span>
                    </div>
                    <Progress 
                      value={(count / stats.totalDeals) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
                {Object.keys(stats.stageBreakdown).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal stage data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="probability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal Probability Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribution of deal probabilities from actual data
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.probabilityDistribution).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        range.includes('High') ? 'bg-green-500' :
                        range.includes('Medium') ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{range}</span>
                    </div>
                    <Badge variant="outline">{count} deals</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High Value Deals</CardTitle>
              <p className="text-sm text-muted-foreground">
                Deals above average value (${Math.round(stats.averageDealSize).toLocaleString()})
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getHighValueDeals().map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{deal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.clients.name} • {deal.clients.company}
                      </p>
                      <p className="text-xs text-muted-foreground"> "use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, DollarSign, Calendar, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

interface DealProbabilityEngineProps {
  dealId?: string;
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

interface DealStats {
  totalValue: number;
  averageDealSize: number;
  totalDeals: number;
  stageBreakdown: Record<string, number>;
  probabilityDistribution: Record<string, number>;
  recentDeals: number;
}

// REAL Deal Analytics Component - NO MOCK DATA, NO FAKE AI
export default function DealProbabilityEngine({ dealId }: DealProbabilityEngineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<DealData[]>([]);
  const [stats, setStats] = useState<DealStats>({
    totalValue: 0,
    averageDealSize: 0,
    totalDeals: 0,
    stageBreakdown: {},
    probabilityDistribution: {},
    recentDeals: 0
  });

  // Fetch real deal data from API
  useEffect(() => {
    const fetchRealDealData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/crm/deals');
        if (!response.ok) {
          throw new Error(`Failed to fetch deals: ${response.status}`);
        }

        const data = await response.json();
        const dealsData = data.data || [];
        setDeals(dealsData);

        // Calculate REAL statistics from actual data
        const realStats = calculateRealStats(dealsData);
        setStats(realStats);

      } catch (error) {
        console.error('Error fetching deal data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load deal data');
      } finally {
        setLoading(false);
      }
    };

    fetchRealDealData();
  }, [dealId]);

  // Calculate real statistics from actual database data
  const calculateRealStats = (dealsData: DealData[]): DealStats => {
    const totalDeals = dealsData.length;
    const totalValue = dealsData.reduce((sum, deal) => sum + parseFloat(deal.value.toString()), 0);
    const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

    // Calculate stage breakdown
    const stageBreakdown: Record<string, number> = {};
    dealsData.forEach(deal => {
      const stage = deal.stage || 'Unknown';
      stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
    });

    // Calculate probability distribution
    const probabilityDistribution: Record<string, number> = {
      'High (80-100%)': 0,
      'Medium (50-79%)': 0,
      'Low (0-49%)': 0
    };

    dealsData.forEach(deal => {
      const prob = deal.probability || 0;
      if (prob >= 80) probabilityDistribution['High (80-100%)']++;
      else if (prob >= 50) probabilityDistribution['Medium (50-79%)']++;
      else probabilityDistribution['Low (0-49%)']++;
    });

    // Calculate recent deals (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDeals = dealsData.filter(deal => 
      new Date(deal.created_at) > thirtyDaysAgo
    ).length;

    return {
      totalValue,
      averageDealSize,
      totalDeals,
      stageBreakdown,
      probabilityDistribution,
      recentDeals
    };
  };

  // Get deals by stage for pipeline view
  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  // Get high value deals
  const getHighValueDeals = () => {
    return deals
      .filter(deal => parseFloat(deal.value.toString()) > stats.averageDealSize)
      .sort((a, b) => parseFloat(b.value.toString()) - parseFloat(a.value.toString()))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real deal data...</span>
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
      {/* Real Deal Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDeals} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(stats.averageDealSize).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per deal average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Deals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentDeals}</div>
            <p className="text-xs text-muted-foreground">
              Added last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Stages</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.stageBreakdown).length}</div>
            <p className="text-xs text-muted-foreground">
              Active stages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real Deal Analytics Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Pipeline Stages
          </TabsTrigger>
          <TabsTrigger value="probability">
            <Target className="w-4 h-4 mr-2" />
            Probability Distribution
          </TabsTrigger>
          <TabsTrigger value="high-value">
            <DollarSign className="w-4 h-4 mr-2" />
            High Value Deals
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Calendar className="w-4 h-4 mr-2" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stage Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real breakdown of deals by stage from database
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.stageBreakdown).map(([stage, count]) => (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{stage.replace('_', ' ')}</span>
                      <span>{count} deals</span>
                    </div>
                    <Progress 
                      value={(count / stats.totalDeals) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
                {Object.keys(stats.stageBreakdown).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal stage data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="probability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal Probability Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribution of deal probabilities from actual data
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.probabilityDistribution).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        range.includes('High') ? 'bg-green-500' :
                        range.includes('Medium') ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{range}</span>
                    </div>
                    <Badge variant="outline">{count} deals</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High Value Deals</CardTitle>
              <p className="text-sm text-muted-foreground">
                Deals above average value (${Math.round(stats.averageDealSize).toLocaleString()})
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getHighValueDeals().map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{deal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.clients.name} • {deal.clients.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stage: {deal.stage.replace('_', ' ')} • {deal.probability}% probability
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {deal.expected_close_date ? 
                          `Due: ${new Date(deal.expected_close_date).toLocaleDateString()}` :
                          'No close date set'
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
              <CardTitle>Recent Deal Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest deal additions and updates
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{deal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {deal.clients.name} • {deal.clients.company}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                        <Badge 
                          variant={deal.probability >= 80 ? 'default' : 
                                  deal.probability >= 50 ? 'secondary' : 'outline'}
                        >
                          {deal.probability}% probability
                        </Badge>
                      </div>
                    </div>
                  ))}
                {deals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal data available yet
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
.Value -replace "'", "'" </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground"> "use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, DollarSign, Calendar, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

interface DealProbabilityEngineProps {
  dealId?: string;
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

interface DealStats {
  totalValue: number;
  averageDealSize: number;
  totalDeals: number;
  stageBreakdown: Record<string, number>;
  probabilityDistribution: Record<string, number>;
  recentDeals: number;
}

// REAL Deal Analytics Component - NO MOCK DATA, NO FAKE AI
export default function DealProbabilityEngine({ dealId }: DealProbabilityEngineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<DealData[]>([]);
  const [stats, setStats] = useState<DealStats>({
    totalValue: 0,
    averageDealSize: 0,
    totalDeals: 0,
    stageBreakdown: {},
    probabilityDistribution: {},
    recentDeals: 0
  });

  // Fetch real deal data from API
  useEffect(() => {
    const fetchRealDealData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/crm/deals');
        if (!response.ok) {
          throw new Error(`Failed to fetch deals: ${response.status}`);
        }

        const data = await response.json();
        const dealsData = data.data || [];
        setDeals(dealsData);

        // Calculate REAL statistics from actual data
        const realStats = calculateRealStats(dealsData);
        setStats(realStats);

      } catch (error) {
        console.error('Error fetching deal data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load deal data');
      } finally {
        setLoading(false);
      }
    };

    fetchRealDealData();
  }, [dealId]);

  // Calculate real statistics from actual database data
  const calculateRealStats = (dealsData: DealData[]): DealStats => {
    const totalDeals = dealsData.length;
    const totalValue = dealsData.reduce((sum, deal) => sum + parseFloat(deal.value.toString()), 0);
    const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

    // Calculate stage breakdown
    const stageBreakdown: Record<string, number> = {};
    dealsData.forEach(deal => {
      const stage = deal.stage || 'Unknown';
      stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
    });

    // Calculate probability distribution
    const probabilityDistribution: Record<string, number> = {
      'High (80-100%)': 0,
      'Medium (50-79%)': 0,
      'Low (0-49%)': 0
    };

    dealsData.forEach(deal => {
      const prob = deal.probability || 0;
      if (prob >= 80) probabilityDistribution['High (80-100%)']++;
      else if (prob >= 50) probabilityDistribution['Medium (50-79%)']++;
      else probabilityDistribution['Low (0-49%)']++;
    });

    // Calculate recent deals (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDeals = dealsData.filter(deal => 
      new Date(deal.created_at) > thirtyDaysAgo
    ).length;

    return {
      totalValue,
      averageDealSize,
      totalDeals,
      stageBreakdown,
      probabilityDistribution,
      recentDeals
    };
  };

  // Get deals by stage for pipeline view
  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  // Get high value deals
  const getHighValueDeals = () => {
    return deals
      .filter(deal => parseFloat(deal.value.toString()) > stats.averageDealSize)
      .sort((a, b) => parseFloat(b.value.toString()) - parseFloat(a.value.toString()))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real deal data...</span>
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
      {/* Real Deal Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDeals} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(stats.averageDealSize).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per deal average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Deals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentDeals}</div>
            <p className="text-xs text-muted-foreground">
              Added last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Stages</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.stageBreakdown).length}</div>
            <p className="text-xs text-muted-foreground">
              Active stages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real Deal Analytics Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Pipeline Stages
          </TabsTrigger>
          <TabsTrigger value="probability">
            <Target className="w-4 h-4 mr-2" />
            Probability Distribution
          </TabsTrigger>
          <TabsTrigger value="high-value">
            <DollarSign className="w-4 h-4 mr-2" />
            High Value Deals
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Calendar className="w-4 h-4 mr-2" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stage Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real breakdown of deals by stage from database
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.stageBreakdown).map(([stage, count]) => (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{stage.replace('_', ' ')}</span>
                      <span>{count} deals</span>
                    </div>
                    <Progress 
                      value={(count / stats.totalDeals) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
                {Object.keys(stats.stageBreakdown).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal stage data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="probability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal Probability Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribution of deal probabilities from actual data
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.probabilityDistribution).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        range.includes('High') ? 'bg-green-500' :
                        range.includes('Medium') ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{range}</span>
                    </div>
                    <Badge variant="outline">{count} deals</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High Value Deals</CardTitle>
              <p className="text-sm text-muted-foreground">
                Deals above average value (${Math.round(stats.averageDealSize).toLocaleString()})
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getHighValueDeals().map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{deal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.clients.name} • {deal.clients.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stage: {deal.stage.replace('_', ' ')} • {deal.probability}% probability
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {deal.expected_close_date ? 
                          `Due: ${new Date(deal.expected_close_date).toLocaleDateString()}` :
                          'No close date set'
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
              <CardTitle>Recent Deal Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest deal additions and updates
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{deal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {deal.clients.name} • {deal.clients.company}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                        <Badge 
                          variant={deal.probability >= 80 ? 'default' : 
                                  deal.probability >= 50 ? 'secondary' : 'outline'}
                        >
                          {deal.probability}% probability
                        </Badge>
                      </div>
                    </div>
                  ))}
                {deals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal data available yet
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
.Value -replace "'", "'" </div>
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
              <CardTitle>Recent Deal Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest deal additions and updates
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{deal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {deal.clients.name} • {deal.clients.company}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                        <Badge 
                          variant={deal.probability > "use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, DollarSign, Calendar, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

interface DealProbabilityEngineProps {
  dealId?: string;
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

interface DealStats {
  totalValue: number;
  averageDealSize: number;
  totalDeals: number;
  stageBreakdown: Record<string, number>;
  probabilityDistribution: Record<string, number>;
  recentDeals: number;
}

// REAL Deal Analytics Component - NO MOCK DATA, NO FAKE AI
export default function DealProbabilityEngine({ dealId }: DealProbabilityEngineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<DealData[]>([]);
  const [stats, setStats] = useState<DealStats>({
    totalValue: 0,
    averageDealSize: 0,
    totalDeals: 0,
    stageBreakdown: {},
    probabilityDistribution: {},
    recentDeals: 0
  });

  // Fetch real deal data from API
  useEffect(() => {
    const fetchRealDealData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/crm/deals');
        if (!response.ok) {
          throw new Error(`Failed to fetch deals: ${response.status}`);
        }

        const data = await response.json();
        const dealsData = data.data || [];
        setDeals(dealsData);

        // Calculate REAL statistics from actual data
        const realStats = calculateRealStats(dealsData);
        setStats(realStats);

      } catch (error) {
        console.error('Error fetching deal data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load deal data');
      } finally {
        setLoading(false);
      }
    };

    fetchRealDealData();
  }, [dealId]);

  // Calculate real statistics from actual database data
  const calculateRealStats = (dealsData: DealData[]): DealStats => {
    const totalDeals = dealsData.length;
    const totalValue = dealsData.reduce((sum, deal) => sum + parseFloat(deal.value.toString()), 0);
    const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

    // Calculate stage breakdown
    const stageBreakdown: Record<string, number> = {};
    dealsData.forEach(deal => {
      const stage = deal.stage || 'Unknown';
      stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
    });

    // Calculate probability distribution
    const probabilityDistribution: Record<string, number> = {
      'High (80-100%)': 0,
      'Medium (50-79%)': 0,
      'Low (0-49%)': 0
    };

    dealsData.forEach(deal => {
      const prob = deal.probability || 0;
      if (prob >= 80) probabilityDistribution['High (80-100%)']++;
      else if (prob >= 50) probabilityDistribution['Medium (50-79%)']++;
      else probabilityDistribution['Low (0-49%)']++;
    });

    // Calculate recent deals (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDeals = dealsData.filter(deal => 
      new Date(deal.created_at) > thirtyDaysAgo
    ).length;

    return {
      totalValue,
      averageDealSize,
      totalDeals,
      stageBreakdown,
      probabilityDistribution,
      recentDeals
    };
  };

  // Get deals by stage for pipeline view
  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  // Get high value deals
  const getHighValueDeals = () => {
    return deals
      .filter(deal => parseFloat(deal.value.toString()) > stats.averageDealSize)
      .sort((a, b) => parseFloat(b.value.toString()) - parseFloat(a.value.toString()))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real deal data...</span>
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
      {/* Real Deal Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDeals} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(stats.averageDealSize).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per deal average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Deals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentDeals}</div>
            <p className="text-xs text-muted-foreground">
              Added last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Stages</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.stageBreakdown).length}</div>
            <p className="text-xs text-muted-foreground">
              Active stages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real Deal Analytics Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Pipeline Stages
          </TabsTrigger>
          <TabsTrigger value="probability">
            <Target className="w-4 h-4 mr-2" />
            Probability Distribution
          </TabsTrigger>
          <TabsTrigger value="high-value">
            <DollarSign className="w-4 h-4 mr-2" />
            High Value Deals
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Calendar className="w-4 h-4 mr-2" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stage Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real breakdown of deals by stage from database
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.stageBreakdown).map(([stage, count]) => (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{stage.replace('_', ' ')}</span>
                      <span>{count} deals</span>
                    </div>
                    <Progress 
                      value={(count / stats.totalDeals) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
                {Object.keys(stats.stageBreakdown).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal stage data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="probability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal Probability Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribution of deal probabilities from actual data
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.probabilityDistribution).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        range.includes('High') ? 'bg-green-500' :
                        range.includes('Medium') ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{range}</span>
                    </div>
                    <Badge variant="outline">{count} deals</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High Value Deals</CardTitle>
              <p className="text-sm text-muted-foreground">
                Deals above average value (${Math.round(stats.averageDealSize).toLocaleString()})
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getHighValueDeals().map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{deal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.clients.name} • {deal.clients.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stage: {deal.stage.replace('_', ' ')} • {deal.probability}% probability
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {deal.expected_close_date ? 
                          `Due: ${new Date(deal.expected_close_date).toLocaleDateString()}` :
                          'No close date set'
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
              <CardTitle>Recent Deal Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest deal additions and updates
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{deal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {deal.clients.name} • {deal.clients.company}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${parseFloat(deal.value.toString()).toLocaleString()}</div>
                        <Badge 
                          variant={deal.probability >= 80 ? 'default' : 
                                  deal.probability >= 50 ? 'secondary' : 'outline'}
                        >
                          {deal.probability}% probability
                        </Badge>
                      </div>
                    </div>
                  ))}
                {deals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal data available yet
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
.Value -replace "'", "'" </Badge>
                      </div>
                    </div>
                  ))}
                {deals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deal data available yet
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
