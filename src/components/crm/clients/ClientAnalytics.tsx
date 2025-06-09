"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, AlertCircle, Loader2, Building, Calendar, Activity } from 'lucide-react';

interface ClientAnalyticsProps {
  clientId?: string;
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

interface ClientSegment {
  id: string;
  name: string;
  criteria: string;
  count: number;
  color: string;
}

// REAL Client Analytics Component - NO MOCK DATA, NO FAKE AI
export default function ClientAnalytics({ clientId }: ClientAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [analytics, setAnalytics] = useState({
    totalClients: 0,
    activeClients: 0,
    prospectClients: 0,
    inactiveClients: 0,
    industryBreakdown: {} as Record<string, number>,
    recentClients: 0
  });

  const [segments, setSegments] = useState<ClientSegment[]>([]);

  // Fetch real client data from API
  useEffect(() => {
    const fetchRealClientData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/crm/clients');
        if (!response.ok) {
          throw new Error(`Failed to fetch clients: ${response.status}`);
        }

        const data = await response.json();
        const clientsData = data.data || [];
        setClients(clientsData);

        // Calculate REAL analytics from actual data
        const realAnalytics = calculateRealAnalytics(clientsData);
        setAnalytics(realAnalytics);

        // Generate REAL segments from actual data
        const realSegments = generateRealSegments(clientsData);
        setSegments(realSegments);

      } catch (error) {
        console.error('Error fetching client data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load client data');
      } finally {
        setLoading(false);
      }
    };

    fetchRealClientData();
  }, [clientId]);

  // Calculate real analytics from actual database data
  const calculateRealAnalytics = (clientsData: ClientData[]) => {
    const total = clientsData.length;
    const active = clientsData.filter(c => c.status === 'active').length;
    const prospects = clientsData.filter(c => c.status === 'prospect').length;
    const inactive = clientsData.filter(c => c.status === 'inactive').length;

    // Calculate industry breakdown
    const industryBreakdown: Record<string, number> = {};
    clientsData.forEach(client => {
      const industry = client.industry || 'Unknown';
      industryBreakdown[industry] = (industryBreakdown[industry] || 0) + 1;
    });

    // Calculate recent clients (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentClients = clientsData.filter(c => 
      new Date(c.created_at) > thirtyDaysAgo
    ).length;

    return {
      totalClients: total,
      activeClients: active,
      prospectClients: prospects,
      inactiveClients: inactive,
      industryBreakdown,
      recentClients
    };
  };

  // Generate real segments from actual data
  const generateRealSegments = (clientsData: ClientData[]): ClientSegment[] => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'active',
        name: 'Active Clients',
        criteria: 'Status: Active',
        count: clientsData.filter(c => c.status === 'active').length,
        color: 'bg-green-500'
      },
      {
        id: 'prospects',
        name: 'Prospects',
        criteria: 'Status: Prospect',
        count: clientsData.filter(c => c.status === 'prospect').length,
        color: 'bg-blue-500'
      },
      {
        id: 'recent',
        name: 'Recently Added',
        criteria: 'Added < 30 days',
        count: clientsData.filter(c => new Date(c.created_at) > thirtyDaysAgo).length,
        color: 'bg-purple-500'
      },
      {
        id: 'inactive',
        name: 'Inactive',
        criteria: 'Status: Inactive',
        count: clientsData.filter(c => c.status === 'inactive').length,
        color: 'bg-red-500'
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real client data...</span>
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
      {/* Real Client Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeClients} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.prospectClients} prospects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Clients</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recentClients}</div>
            <p className="text-xs text-muted-foreground">
              Added last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Industries</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(analytics.industryBreakdown).length}</div>
            <p className="text-xs text-muted-foreground">
              Different industries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real Analytics Tabs */}
      <Tabs defaultValue="segmentation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="segmentation">
            <Users className="w-4 h-4 mr-2" />
            Client Segmentation
          </TabsTrigger>
          <TabsTrigger value="industries">
            <Building className="w-4 h-4 mr-2" />
            Industry Breakdown
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Calendar className="w-4 h-4 mr-2" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="segmentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Segmentation</CardTitle>
              <p className="text-sm text-muted-foreground">
                Client categorization based on status and activity
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {segments.map((segment) => (
                <div key={segment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                    <div>
                      <h4 className="font-medium">{segment.name}</h4>
                      <p className="text-sm text-muted-foreground">{segment.criteria}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{segment.count} clients</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="industries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Industry Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real breakdown of client industries from database
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(analytics.industryBreakdown).map(([industry, count]) => (
                <div key={industry} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{industry}</span>
                  </div>
                  <Badge variant="outline">{count} clients</Badge>
                </div>
              ))}
              {Object.keys(analytics.industryBreakdown).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No industry data available yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Client Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest client additions and status changes
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {clients
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10)
                .map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{client.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {client.company} • {client.industry || 'Unknown industry'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(client.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={client.status === 'active' ? 'default' : 'secondary'}
                    >
                      {client.status}
                    </Badge>
                  </div>
                ))}
              {clients.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No client data available yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
