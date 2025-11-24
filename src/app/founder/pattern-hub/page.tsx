'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseBrowser } from '@/lib/supabase';

interface GlobalPattern {
  id: string;
  patternHash: string;
  patternName: string;
  patternData: Record<string, unknown>;
  category: string;
  contributorCount: number;
  confidence: number;
  uncertaintyNotes?: string;
  createdAt: string;
}

export default function PatternHubPage() {
  const [patterns, setPatterns] = useState<GlobalPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatterns() {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/cross-tenant/patterns', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPatterns(data.patterns || []);
      }
      setLoading(false);
    }

    fetchPatterns();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Federated Pattern Exchange Hub</h1>
        <Badge variant="outline">Phase 142</Badge>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Truth Layer Notice:</strong> Patterns anonymised and untraceable to individual tenants.
          Pattern confidence capped at 95%. All patterns validated through TIBE before exchange.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Global Pattern Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading patterns...</p>
          ) : patterns.length === 0 ? (
            <p className="text-muted-foreground">No patterns available</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {patterns.map((pattern) => (
                <div key={pattern.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{pattern.patternName}</p>
                    <Badge variant="secondary">{pattern.category}</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>Contributors: {pattern.contributorCount}</p>
                    <p>Confidence: {(pattern.confidence * 100).toFixed(0)}%</p>
                    {pattern.uncertaintyNotes && (
                      <p className="text-muted-foreground text-xs">{pattern.uncertaintyNotes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
