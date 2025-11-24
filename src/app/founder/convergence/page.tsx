'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  GitMerge,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LearningPacket } from '@/lib/regionConvergence';

export default function ConvergencePage() {
  const [loading, setLoading] = useState(true);
  const [packets, setPackets] = useState<LearningPacket[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/regions/convergence/packets', {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
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
          <GitMerge className="h-8 w-8" />
          Knowledge Convergence
        </h1>
        <p className="text-muted-foreground mt-1">
          Cross-region pattern transfer with cultural adaptation
        </p>
      </div>

      {/* Packets */}
      {packets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitMerge className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Learning Packets</h3>
            <p className="text-muted-foreground">
              No cross-region patterns have been identified yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {packets.map(packet => (
            <Card key={packet.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {packet.sourceRegionId.slice(0, 8)}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                    <span className="font-mono text-sm">
                      {packet.targetRegionId.slice(0, 8)}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(packet.status)}
                    <Badge variant="outline">{packet.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium">{packet.patternSummary.type}</div>
                  <p className="text-sm text-muted-foreground">
                    {packet.patternSummary.description}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Transferability</span>
                      <span>{(packet.transferabilityScore * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={packet.transferabilityScore * 100} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Confidence</span>
                      <span>{(packet.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={packet.confidence * 100} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Cultural Distance</span>
                      <span>{(packet.culturalDistance * 100).toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={packet.culturalDistance * 100}
                      className={`h-1.5 ${packet.culturalDistance > 0.4 ? '[&>div]:bg-amber-500' : ''}`}
                    />
                  </div>
                </div>

                {packet.adjustmentNotes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Adjustments: </span>
                    {packet.adjustmentNotes}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs">
                  <Badge variant={packet.complianceCompatible ? 'default' : 'destructive'}>
                    {packet.complianceCompatible ? 'Compliance Compatible' : 'Review Compliance'}
                  </Badge>
                </div>

                {packet.uncertaintyNotes && (
                  <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                    {packet.uncertaintyNotes}
                  </div>
                )}
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
              <div className="font-medium mb-1">Cultural Adaptation Notice</div>
              <p>
                Patterns from one region may not directly apply to another.
                Cultural distance and compliance differences must be considered.
                Always validate locally before applying transferred patterns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
