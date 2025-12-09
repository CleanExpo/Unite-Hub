'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge, AlertTriangle, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { FlightDeckLayout } from '@/lib/founderFlightDeck';

export default function FlightDeckPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<FlightDeckLayout | null>(null);

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchData();
    }
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch(`/api/founder/flight-deck/layout?tenantId=${currentOrganization?.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLayout(data.layout);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gauge className="h-8 w-8" />
            Flight Deck
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified executive cockpit for founders
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Settings className="h-3 w-3" />
          Customizable
        </Badge>
      </div>

      {/* Widget Grid Placeholder */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {layout?.layoutConfig?.widgets?.map(widget => (
          <Card key={widget.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm capitalize">{widget.type}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted/50 rounded flex items-center justify-center">
                <span className="text-muted-foreground text-sm">
                  {widget.type} widget
                </span>
              </div>
            </CardContent>
          </Card>
        )) || (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted/50 rounded flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Navigator widget</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Alignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted/50 rounded flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Alignment widget</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted/50 rounded flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Opportunities widget</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <div className="font-medium mb-1">Dashboard Limitations</div>
              <p>
                Visual aggregations include data with varying confidence levels.
                All widgets surface uncertainty indicators. No single view
                presents deterministic outcomes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
