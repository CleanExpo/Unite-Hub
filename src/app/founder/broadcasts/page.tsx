'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, AlertTriangle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { BroadcastMessage } from '@/lib/broadcastEngine';

export default function BroadcastsPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchData();
    }
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) return;

      const response = await fetch(`/api/broadcast/messages?senderAgencyId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
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
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Radio className="h-8 w-8" />
          Multi-Agency Broadcasts
        </h1>
        <p className="text-muted-foreground mt-1">
          Broadcast intelligence to multiple agencies and regions
        </p>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Broadcasts</h3>
            <p className="text-muted-foreground">
              No broadcast messages have been sent yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map(message => (
            <Card key={message.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{message.payload.title}</CardTitle>
                  <Badge variant="outline">{message.messageType}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{message.payload.body}</p>

                <div className="flex items-center gap-2 text-xs">
                  <Send className="h-3 w-3" />
                  <span>
                    {message.targetScope.type === 'all' ? 'All agencies' :
                     `${message.targetScope.ids?.length || 0} ${message.targetScope.type}`}
                  </span>
                </div>

                {message.confidence && (
                  <div className="text-xs text-muted-foreground">
                    Confidence: {(message.confidence * 100).toFixed(0)}%
                  </div>
                )}

                {message.uncertaintyNotes && (
                  <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                    {message.uncertaintyNotes}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  {new Date(message.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <div className="font-medium mb-1">Broadcast Guidelines</div>
              <p>
                Broadcasts must not contain fabricated performance claims.
                All content must distinguish suggestions from guarantees and
                comply with locale-specific regulations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
