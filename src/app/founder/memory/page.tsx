'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  ArrowDown,
  AlertTriangle,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CompressedPacket } from '@/lib/memoryCompression';

export default function MemoryCompressionPage() {
  const [loading, setLoading] = useState(true);
  const [packets, setPackets] = useState<CompressedPacket[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch('/api/memory/compressed', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPackets(data.packets || []);
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
          <Database className="h-8 w-8" />
          Global Memory Compression
        </h1>
        <p className="text-muted-foreground mt-1">
          Long-term memory compression with loss tracking
        </p>
      </div>

      {/* Packets */}
      {packets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Compressed Packets</h3>
            <p className="text-muted-foreground">
              Memory compression has not generated any packets yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {packets.map(packet => (
            <Card key={packet.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{packet.sourceType}</CardTitle>
                  <Badge variant="outline">
                    {packet.compressionRatio ? `${(packet.compressionRatio * 100).toFixed(0)}%` : 'N/A'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Confidence</span>
                    <span>{(packet.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={packet.confidence * 100} className="h-1.5" />
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  <span>{packet.droppedSignals} signals dropped</span>
                </div>

                {packet.lossNotes && (
                  <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                    {packet.lossNotes}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  {new Date(packet.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <Card className="border-warning-200 bg-warning-50 dark:bg-warning-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" />
            <div className="text-sm text-warning-800 dark:text-warning-200">
              <div className="font-medium mb-1">Compression Loss Notice</div>
              <p>
                Memory compression involves information loss. Dropped signals
                and loss notes indicate what was excluded. Original data should
                be preserved for critical decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
