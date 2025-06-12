"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building,
  Star,
  Activity
} from 'lucide-react';
import { TestDataRecord } from '@/lib/crm/test-data-manager';

interface ClientSegment {
  id: string;
  name: string;
  count: number;
  revenue: number;
  color: string;
}

interface ClientMetrics {
  totalClients: number;
  activeClients: number;
  newClients: number;
  recentClients: number;
}

interface ClientAnalyticsProps {
  clients: TestDataRecord[];
  timeframe: 'mtd' | 'ytd';
}

export default function ClientAnalytics({ clients, timeframe }: ClientAnalyticsProps) {
  const [metrics, setMetrics] = useState<ClientMetrics>({
    totalClients: 0,
    activeClients: 0,
    newClients: 0,
    recentClients: 0
  });

  const [segments, setSegments] = useState<ClientSegment[]>([]);

  useEffect(() => {
    // Calculate metrics from clients data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const cutoffDate = timeframe === 'mtd' ? startOfMonth : startOfYear;

    const newClients = clients.filter(client => 
      client.createdAt && client.createdAt >= cutoffDate
    ).length;

    const recentClients = clients.filter(client => 
      client.lastContact && client.lastContact >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    setMetrics({
      totalClients: clients.length,
      activeClients: clients.filter(client => client.revenue > 0).length,
      newClients,
      recentClients
    });

    // Calculate segments
    const highValue = clients.filter(client => client.revenue >= 10000);
    const mediumValue = clients.filter(client => client.revenue >= 5000 && client.revenue < 10000);
    const lowValue = clients.filter(client => client.revenue < 5000);

    setSegments([
      {
        id: 'high-value',
        name: 'High Value',
        count: highValue.length,
        revenue: highValue.reduce((sum, client) => sum + client.revenue, 0),
        color: 'bg-green-500'
      },
      {
        id: 'medium-value',
        name: 'Medium Value',
        count: mediumValue.length,
        revenue: mediumValue.reduce((sum, client) => sum + client.revenue, 0),
        color: 'bg-yellow-500'
      },
      {
        id: 'low-value',
        name: 'Low Value',
        count: lowValue.length,
        revenue: lowValue.reduce((sum, client) => sum + client.revenue, 0),
        color: 'bg-blue-500'
      }
    ]);
  }, [clients, timeframe]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getClientStatusBadge = (client: TestDataRecord) => {
    if (client.revenue >= 10000) {
      return <Badge className="bg-green-100 text-green-800">High Value</Badge>;
    } else if (client.revenue >= 5000) {
      return <Badge className="bg-yellow-100 text-yellow-800">Medium Value</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Standard</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              All registered clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              With revenue generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Clients</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newClients}</div>
            <p className="text-xs text-muted-foreground">
              {timeframe === 'mtd' ? 'This month' : 'This year'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Contact</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.recentClients}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Segments */}
      <Card>
        <CardHeader>
          <CardTitle>Client Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {segments.map((segment) => (
              <div key={segment.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                  <div>
                    <p className="font-medium">{segment.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {segment.count} clients
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(segment.revenue)}</p>
                  <p className="text-sm text-muted-foreground">
                    {segment.count > 0 ? formatCurrency(segment.revenue / segment.count) : '$0'} avg
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle>Client Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Clients</TabsTrigger>
              <TabsTrigger value="high">High Value</TabsTrigger>
              <TabsTrigger value="medium">Medium Value</TabsTrigger>
              <TabsTrigger value="standard">Standard</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="grid gap-4">
                {clients.slice(0, 10).map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{client.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {client.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(client.revenue)}</p>
                        {client.lastContact && (
                          <p className="text-sm text-muted-foreground">
                            Last contact: {client.lastContact.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {getClientStatusBadge(client)}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="high" className="space-y-4">
              <div className="grid gap-4">
                {clients.filter(client => client.revenue >= 10000).slice(0, 10).map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Star className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{client.name}</h3>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{formatCurrency(client.revenue)}</p>
                      <Badge className="bg-green-100 text-green-800">High Value</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="medium" className="space-y-4">
              <div className="grid gap-4">
                {clients.filter(client => client.revenue >= 5000 && client.revenue < 10000).slice(0, 10).map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{client.name}</h3>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-yellow-600">{formatCurrency(client.revenue)}</p>
                      <Badge className="bg-yellow-100 text-yellow-800">Medium Value</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="standard" className="space-y-4">
              <div className="grid gap-4">
                {clients.filter(client => client.revenue < 5000).slice(0, 10).map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{client.name}</h3>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">{formatCurrency(client.revenue)}</p>
                      <Badge className="bg-blue-100 text-blue-800">Standard</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
