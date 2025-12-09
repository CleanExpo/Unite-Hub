'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ExchangeMessage } from '@/lib/intelligenceExchange';

export default function IntelligenceExchangePage() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ExchangeMessage[]>([]);

  useEffect(() => {
 fetchData(); 
}, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}
      const response = await fetch('/api/intelligence/messages', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
 console.error('Failed:', error); 
} finally {
 setLoading(false); 
}
  };

  if (loading) {
return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;
}

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Network className="h-8 w-8" />Intelligence Exchange</h1>
        <p className="text-muted-foreground mt-1">Message bus for engine intelligence sharing</p>
      </div>
      {messages.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Exchange Messages</h3><p className="text-muted-foreground">No intelligence has been exchanged between engines yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {messages.slice(0, 20).map(msg => (
            <Card key={msg.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">{msg.producerEngine}</Badge>
                  <ArrowRight className="h-3 w-3" />
                  <Badge variant="outline">{msg.consumerEngine}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{(msg.confidence * 100).toFixed(0)}% conf</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Exchange Protocol</div><p>Messages carry confidence and provenance. No message treated as absolute truth. Engines respect consumer-side safety constraints.</p></div></div></CardContent></Card>
    </div>
  );
}
