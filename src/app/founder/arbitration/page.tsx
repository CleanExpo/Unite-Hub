'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Gavel,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ArbitrationEvent } from '@/lib/arbitration';

export default function ArbitrationPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ArbitrationEvent[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/arbitration/events', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'escalated': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'dismissed': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
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
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Gavel className="h-8 w-8" />
          Decision Arbitration
        </h1>
        <p className="text-muted-foreground mt-1">
          Truth-layer governed conflict resolution
        </p>
      </div>

      {/* Events */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Arbitration Events</h3>
            <p className="text-muted-foreground">
              No conflicts have required arbitration yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <Card key={event.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{event.conflictType}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(event.status)}
                    <Badge variant="outline">{event.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {event.conflictDescription}
                </p>

                {/* Conflicting Sources */}
                <div className="flex flex-wrap gap-1">
                  {event.conflictingSources.map((source, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>

                {/* Resolution */}
                {event.resolution && (
                  <div className="bg-muted/50 rounded p-3">
                    <div className="text-xs font-medium mb-1">Resolution</div>
                    <p className="text-sm">{event.resolution}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      Confidence: {(event.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                )}

                {event.uncertaintyNotes && (
                  <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                    {event.uncertaintyNotes}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <div className="font-medium mb-1">Arbitration Limitations</div>
              <p>
                Automated arbitration provides recommendations, not final decisions.
                Complex conflicts with significant business impact should involve
                human review before resolution is implemented.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
