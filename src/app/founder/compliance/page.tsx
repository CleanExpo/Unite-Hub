'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ComplianceOverviewPanel,
  ComplianceIncidentTable,
  LocaleProfileSummary
} from '@/components/compliance';
import {
  Shield,
  Search,
  RefreshCw,
  Globe
} from 'lucide-react';
import type {
  ComplianceIncident,
  IncidentSummary,
  LocaleProfile
} from '@/lib/compliance';

export default function ComplianceDashboardPage() {
  const { currentOrganization, session } = useAuth();
  const agencyId = currentOrganization?.org_id;

  const [incidents, setIncidents] = useState<ComplianceIncident[]>([]);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [coverage, setCoverage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check panel state
  const [checkText, setCheckText] = useState('');
  const [checkRegion, setCheckRegion] = useState('au');
  const [checkPlatform, setCheckPlatform] = useState('generic');
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    if (!agencyId || !session?.access_token) {
return;
}

    setIsLoading(true);
    try {
      // Fetch incidents
      const incidentsRes = await fetch(
        `/api/compliance/incidents?agencyId=${agencyId}&includeSummary=true`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (incidentsRes.ok) {
        const data = await incidentsRes.json();
        setIncidents(data.incidents || []);
        setSummary(data.summary);
      }

      // Fetch policy coverage
      const policiesRes = await fetch(
        `/api/compliance/policies?includeCoverage=true`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (policiesRes.ok) {
        const data = await policiesRes.json();
        setCoverage(data.coverage);
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [agencyId, session?.access_token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheck = async () => {
    if (!checkText.trim() || !session?.access_token) {
return;
}

    setIsChecking(true);
    setCheckResult(null);

    try {
      const response = await fetch('/api/compliance/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text: checkText,
          regionSlug: checkRegion,
          platform: checkPlatform,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCheckResult(data.report);
      } else {
        setCheckResult('Failed to run compliance check.');
      }
    } catch (error) {
      setCheckResult('Error running compliance check.');
    } finally {
      setIsChecking(false);
    }
  };

  // Filter incidents
  const filteredIncidents = incidents.filter(incident => {
    if (severityFilter !== 'all' && incident.severity !== severityFilter) {
      return false;
    }
    if (statusFilter !== 'all' && incident.status !== statusFilter) {
      return false;
    }
    return true;
  });

  if (!agencyId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-muted-foreground">
          Please select an agency to view compliance data.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading compliance data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor compliance policies, incidents, and cultural adaptation
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Legal Disclaimer */}
      <Card className="border-warning-200 bg-warning-50">
        <CardContent className="pt-4">
          <p className="text-sm text-warning-800">
            <strong>Important:</strong> This compliance system provides automated pattern matching
            and is not a substitute for legal advice. Platform policies and regulations change
            frequently. Consult qualified professionals for critical compliance decisions.
          </p>
        </CardContent>
      </Card>

      {/* Overview Panel */}
      {summary && (
        <ComplianceOverviewPanel summary={summary} coverage={coverage} />
      )}

      {/* Quick Check Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Quick Compliance Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select value={checkRegion} onValueChange={setCheckRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="au">Australia (AU)</SelectItem>
                <SelectItem value="us">United States (US)</SelectItem>
                <SelectItem value="uk">United Kingdom (UK)</SelectItem>
                <SelectItem value="eu">European Union (EU)</SelectItem>
                <SelectItem value="nz">New Zealand (NZ)</SelectItem>
                <SelectItem value="ca">Canada (CA)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={checkPlatform} onValueChange={setCheckPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generic">Generic</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Enter content to check for compliance issues..."
            value={checkText}
            onChange={(e) => setCheckText(e.target.value)}
            rows={4}
          />

          <Button onClick={handleCheck} disabled={isChecking || !checkText.trim()}>
            {isChecking ? 'Checking...' : 'Run Compliance Check'}
          </Button>

          {checkResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{checkResult}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incidents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Incidents</h2>
          <div className="flex items-center gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="overridden">Overridden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ComplianceIncidentTable incidents={filteredIncidents} />
      </div>
    </div>
  );
}
