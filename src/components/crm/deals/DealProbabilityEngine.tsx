"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface DealData {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  client: string;
  expectedCloseDate: Date;
  lastActivity: Date;
  assignedTo: string;
}

interface DealStats {
  totalValue: number;
  averageDealSize: number;
  winRate: number;
  averageSalesCycle: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  activeDeals: number;
}

interface DealProbabilityEngineProps {
  data: DealData[];
  timeframe: 'mtd' | 'ytd';
}

export default function DealProbabilityEngine({ data, timeframe }: DealProbabilityEngineProps) {
  const [deals, setDeals] = useState<DealData[]>([]);
  const [stats, setStats] = useState<DealStats>({
    totalValue: 0,
    averageDealSize: 0,
    winRate: 0,
    averageSalesCycle: 0,
    totalDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    activeDeals: 0
  });

  useEffect(() => {
    // Process the data prop
    setDeals(data || []);
    
    // Calculate stats
    if (data && data.length > 0) {
      const totalValue = data.reduce((sum, deal) => sum + deal.value, 0);
      const wonDeals = data.filter(deal => deal.stage === 'won').length;
      const lostDeals = data.filter(deal => deal.stage === 'lost').length;
      const activeDeals = data.filter(deal => !['won', 'lost'].includes(deal.stage)).length;
      
      setStats({
        totalValue,
        averageDealSize: data.length > 0 ? totalValue / data.length : 0,
        winRate: (wonDeals + lostDeals) > 0 ? (wonDeals / (wonDeals + lostDeals)) * 100 : 0,
        averageSalesCycle: 30, // Mock data
        totalDeals: data.length,
        wonDeals,
        lostDeals,
        activeDeals
      });
    }
  }, [data]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStageBadge = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'prospecting':
        return <Badge className="bg-blue-100 text-blue-800">Prospecting</Badge>;
      case 'qualification':
        return <Badge className="bg-yellow-100 text-yellow-800">Qualification</Badge>;
      case 'proposal':
        return <Badge className="bg-orange-100 text-orange-800">Proposal</Badge>;
      case 'negotiation':
        return <Badge className="bg-purple-100 text-purple-800">Negotiation</Badge>;
      case 'won':
        return <Badge className="bg-green-100 text-green-800">Won</Badge>;
      case 'lost':
        return <Badge className="bg-red-100 text-red-800">Lost</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{stage}</Badge>;
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHighProbabilityDeals = () => {
    return deals.filter(deal => deal.probability >= 70 && !['won', 'lost'].includes(deal.stage));
  };

  const getStaleDeals = () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return deals.filter(deal => 
      deal.lastActivity < thirtyDaysAgo && 
      !['won', 'lost'].includes(deal.stage)
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeDeals} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.wonDeals} won, {stats.lostDeals} lost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageDealSize)}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.totalDeals} deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Cycle</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageSalesCycle} days</div>
            <p className="text-xs text-muted-foreground">
              Average time to close
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deal Analysis */}
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="high-probability">High Probability</TabsTrigger>
          <TabsTrigger value="stale">Stale Deals</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals.filter(deal => !['won', 'lost'].includes(deal.stage)).map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{deal.title}</h3>
                      <p className="text-sm text-muted-foreground">{deal.client}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        {getStageBadge(deal.stage)}
                        <span className="text-sm text-muted-foreground">
                          Expected: {deal.expectedCloseDate.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(deal.value)}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress value={deal.probability} className="w-20 h-2" />
                        <span className={`text-sm font-medium ${getProbabilityColor(deal.probability)}`}>
                          {deal.probability}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-probability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                High Probability Deals (70%+)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getHighProbabilityDeals().map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex-1">
                      <h3 className="font-medium">{deal.title}</h3>
                      <p className="text-sm text-muted-foreground">{deal.client}</p>
                      <p className="text-sm text-green-600 font-medium">
                        {deal.probability}% probability
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{formatCurrency(deal.value)}</p>
                      <Button size="sm" className="mt-2">
                        Follow Up
                      </Button>
                    </div>
                  </div>
                ))}
                {getHighProbabilityDeals().length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No high probability deals found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Stale Deals (No activity in 30+ days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getStaleDeals().map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
                    <div className="flex-1">
                      <h3 className="font-medium">{deal.title}</h3>
                      <p className="text-sm text-muted-foreground">{deal.client}</p>
                      <p className="text-sm text-orange-600">
                        Last activity: {deal.lastActivity.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(deal.value)}</p>
                      <Button size="sm" variant="outline" className="mt-2">
                        Re-engage
                      </Button>
                    </div>
                  </div>
                ))}
                {getStaleDeals().length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No stale deals found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Active Deals</span>
                  <span className="font-medium">{stats.activeDeals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>High Probability (70%+)</span>
                  <span className="font-medium text-green-600">{getHighProbabilityDeals().length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Stale Deals</span>
                  <span className="font-medium text-orange-600">{getStaleDeals().length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Pipeline Value</span>
                  <span className="font-medium">{formatCurrency(stats.totalValue)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getHighProbabilityDeals().length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Focus on {getHighProbabilityDeals().length} high-probability deals</strong> - 
                      These are likely to close soon and need immediate attention.
                    </p>
                  </div>
                )}
                {getStaleDeals().length > 0 && (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <strong>Re-engage {getStaleDeals().length} stale deals</strong> - 
                      These deals haven't had activity in over 30 days.
                    </p>
                  </div>
                )}
                {stats.winRate < 30 && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Low win rate detected</strong> - 
                      Consider reviewing qualification criteria and sales process.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
