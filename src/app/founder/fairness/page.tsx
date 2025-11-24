'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseBrowser } from '@/lib/supabase';

interface FairnessReport {
  id: string;
  auditType: string;
  auditScope: string;
  biasFlags: string[];
  riskLevel: string;
  recommendations: string[];
  confidence: number;
  uncertaintyNotes?: string;
  createdAt: string;
}

export default function FairnessPage() {
  const [reports, setReports] = useState<FairnessReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/cross-tenant/fairness', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
      setLoading(false);
    }

    fetchReports();
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'none': return 'outline';
      case 'low': return 'secondary';
      case 'medium': return 'warning';
      case 'high': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cross-Tenant Safety & Fairness Auditor</h1>
        <Badge variant="outline">Phase 149</Badge>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Truth Layer Notice:</strong> Fairness audits detect bias in pattern distribution,
          benefit concentration, region balance, and cohort equity. All findings include confidence bands.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Fairness Audit Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="text-muted-foreground">No audit reports available</p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{report.auditType.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">Scope: {report.auditScope}</p>
                    </div>
                    <Badge variant={getRiskColor(report.riskLevel) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                      {report.riskLevel} risk
                    </Badge>
                  </div>
                  {report.biasFlags.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium">Bias Flags:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {report.biasFlags.map((flag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{flag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-sm">
                    <p>Confidence: {(report.confidence * 100).toFixed(0)}%</p>
                    {report.uncertaintyNotes && (
                      <p className="text-muted-foreground text-xs mt-1">{report.uncertaintyNotes}</p>
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
