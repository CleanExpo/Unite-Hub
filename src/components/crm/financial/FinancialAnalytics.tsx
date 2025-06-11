"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart
} from 'lucide-react';

interface ClientData {
  id: string;
  name: string;
  totalRevenue: number;
  monthlyRevenue: number;
  lastPayment: Date;
  status: 'active' | 'overdue' | 'pending';
}

interface FinancialMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  outstandingInvoices: number;
  overdueAmount: number;
  averagePaymentTime: number;
  revenueGrowth: number;
  clientRetention: number;
}

interface FinancialAnalyticsProps {
  data: any;
  timeframe: 'mtd' | 'ytd';
}

export default function FinancialAnalytics({ data, timeframe }: FinancialAnalyticsProps) {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    outstandingInvoices: 0,
    overdueAmount: 0,
    averagePaymentTime: 0,
    revenueGrowth: 0,
    clientRetention: 0
  });

  useEffect(() => {
    // Process the data prop
    if (data) {
      // Extract financial metrics from data
      setMetrics({
        totalRevenue: data.totalRevenue || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        yearlyRevenue: data.yearlyRevenue || 0,
        outstandingInvoices: data.outstandingInvoices || 0,
        overdueAmount: data.overdueAmount || 0,
        averagePaymentTime: data.averagePaymentTime || 30,
        revenueGrowth: data.revenueGrowth || 0,
        clientRetention: data.clientRetention || 85
      });

      // Extract client data
      if (data.clients) {
        setClients(data.clients);
      }
    }
  }, [data, timeframe]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTopClients = () => {
    return clients
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
  };

  const getOverdueClients = () => {
    return clients.filter(client => client.status === 'overdue');
  };

  const revenueValue = timeframe === 'mtd' ? metrics.monthlyRevenue : metrics.yearlyRevenue;
  const revenueTarget = timeframe === 'mtd' ? 50000 : 500000;
  const revenueProgress = Math.min((revenueValue / revenueTarget) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Financial Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue ({timeframe.toUpperCase()})
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueValue)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {metrics.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={metrics.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(metrics.revenueGrowth)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
            <Progress value={revenueProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.outstandingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.overdueAmount)} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Payment Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averagePaymentTime} days</div>
            <p className="text-xs text-muted-foreground">
              Industry avg: 45 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Retention</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.clientRetention}%</div>
            <Progress value={metrics.clientRetention} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Financial Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Top Clients</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Monthly Recurring Revenue</span>
                  <span className="font-medium">{formatCurrency(metrics.monthlyRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>One-time Revenue</span>
                  <span className="font-medium">{formatCurrency(metrics.totalRevenue - metrics.monthlyRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Revenue ({timeframe.toUpperCase()})</span>
                  <span className="font-medium text-lg">{formatCurrency(revenueValue)}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span>Target Achievement</span>
                    <span className="font-medium">{revenueProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={revenueProgress} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>On-time Payments</span>
                  <span className="font-medium text-green-600">
                    {((clients.length - getOverdueClients().length) / Math.max(clients.length, 1) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Overdue Clients</span>
                  <span className="font-medium text-red-600">{getOverdueClients().length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Payment Time</span>
                  <span className="font-medium">{metrics.averagePaymentTime} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Outstanding Amount</span>
                  <span className="font-medium">{formatCurrency(metrics.overdueAmount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Revenue Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTopClients().map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{client.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Monthly: {formatCurrency(client.monthlyRevenue)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(client.totalRevenue)}</p>
                      {getStatusBadge(client.status)}
                    </div>
                  </div>
                ))}
                {getTopClients().length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No client data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getOverdueClients().map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                    <div className="flex items-center space-x-4">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                      <div>
                        <h3 className="font-medium">{client.name}</h3>
                        <p className="text-sm text-red-600">
                          Last payment: {client.lastPayment.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">{formatCurrency(client.totalRevenue)}</p>
                      <Button size="sm" variant="outline" className="mt-2">
                        Send Reminder
                      </Button>
                    </div>
                  </div>
                ))}
                {getOverdueClients().length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No overdue payments!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Revenue Growth</span>
                  <div className="flex items-center">
                    {metrics.revenueGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`font-medium ${metrics.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {metrics.revenueGrowth}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Client Retention</span>
                  <span className="font-medium text-blue-600">{metrics.clientRetention}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Efficiency</span>
                  <span className="font-medium">
                    {metrics.averagePaymentTime <= 30 ? 'Excellent' : 
                     metrics.averagePaymentTime <= 45 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.revenueGrowth > 10 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Strong Growth</strong> - Revenue is growing at {metrics.revenueGrowth}% rate
                    </p>
                  </div>
                )}
                {getOverdueClients().length > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Payment Issues</strong> - {getOverdueClients().length} clients have overdue payments
                    </p>
                  </div>
                )}
                {metrics.averagePaymentTime <= 30 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Excellent Cash Flow</strong> - Average payment time is {metrics.averagePaymentTime} days
                    </p>
                  </div>
                )}
                {metrics.clientRetention >= 90 && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>High Retention</strong> - {metrics.clientRetention}% client retention rate
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
