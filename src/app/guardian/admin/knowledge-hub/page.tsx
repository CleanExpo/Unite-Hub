'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { GuardianMetaPattern, GuardianPlaybookSummary } from '@/lib/guardian/meta/playbookMappingService';
import type { GuardianKnowledgeHubSummary } from '@/lib/guardian/meta/knowledgeHubService';

interface SuggestedPlaybook {
  id: string;
  key: string;
  title: string;
  summary: string;
  domains: string[];
  matchedPatterns: string[];
}

export default function KnowledgeHubPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [summary, setSummary] = useState<GuardianKnowledgeHubSummary | null>(null);
  const [allPlaybooks, setAllPlaybooks] = useState<GuardianPlaybookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Load knowledge hub summary and playbooks
  useEffect(() => {
    if (!workspaceId) return;

    const loadData = async () => {
      try {
        const summaryRes = await fetch(
          `/api/guardian/meta/knowledge-hub/summary?workspaceId=${workspaceId}`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        const playbooksRes = await fetch(
          `/api/guardian/meta/playbooks?workspaceId=${workspaceId}`
        );
        const playbooksData = await playbooksRes.json();
        setAllPlaybooks(playbooksData.playbooks || []);
      } catch (error) {
        console.error('Failed to load knowledge hub data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [workspaceId]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-error-600" />;
      case 'moderate':
        return <Info className="w-4 h-4 text-warning-600" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-info-600" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-error-100 text-error-800';
      case 'moderate':
        return 'bg-warning-100 text-warning-800';
      case 'info':
        return 'bg-info-100 text-info-800';
      default:
        return 'bg-bg-hover text-text-secondary';
    }
  };

  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      readiness: 'bg-purple-100 text-purple-800',
      adoption: 'bg-success-100 text-success-800',
      editions: 'bg-indigo-100 text-indigo-800',
      uplift: 'bg-accent-100 text-accent-800',
      executive: 'bg-pink-100 text-pink-800',
      goals_okrs: 'bg-accent-100 text-accent-800',
      network_meta: 'bg-info-100 text-info-800',
    };
    return colors[domain] || 'bg-bg-hover text-text-secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-text-secondary">Loading Knowledge Hub...</p>
      </div>
    );
  }

  const filteredPatterns = (summary?.patterns || []).filter((p) => {
    if (filterDomain !== 'all' && p.domain !== filterDomain) return false;
    if (filterSeverity !== 'all' && p.severity !== filterSeverity) return false;
    return true;
  });

  const uniqueDomains = Array.from(
    new Set((summary?.patterns || []).map((p) => p.domain))
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-6 h-6 text-accent-500" />
          <h1 className="text-3xl font-bold text-text-primary">Guardian Knowledge Hub</h1>
        </div>
        <p className="text-text-secondary">Current patterns & suggested playbooks for your workspace</p>
      </div>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-bg-card border border-border">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-text-primary">{summary.patternCount}</div>
              <p className="text-xs text-text-secondary">Detected Patterns</p>
            </CardContent>
          </Card>
          <Card className="bg-bg-card border border-border">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-text-primary">{summary.playbookCount}</div>
              <p className="text-xs text-text-secondary">Suggested Playbooks</p>
            </CardContent>
          </Card>
          <Card className="bg-bg-card border border-border">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-accent-500">
                {(summary.patterns || []).filter((p) => p.severity === 'high').length}
              </div>
              <p className="text-xs text-text-secondary">High Priority</p>
            </CardContent>
          </Card>
          <Card className="bg-bg-card border border-border">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-text-primary">{uniqueDomains.length}</div>
              <p className="text-xs text-text-secondary">Domains</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patterns Panel */}
      <Card className="bg-bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Detected Patterns</CardTitle>
          <p className="text-xs text-text-secondary mt-1">
            Current patterns detected from Z-series meta metrics
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap pb-3 border-b border-border">
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="text-xs px-2 py-1 border border-border rounded bg-bg-secondary text-text-primary"
            >
              <option value="all">All Domains</option>
              {uniqueDomains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="text-xs px-2 py-1 border border-border rounded bg-bg-secondary text-text-primary"
            >
              <option value="all">All Severity</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Pattern List */}
          {filteredPatterns.length > 0 ? (
            <div className="space-y-2">
              {filteredPatterns.map((pattern) => (
                <div
                  key={pattern.key}
                  className="flex items-center justify-between p-3 bg-bg-secondary rounded border border-border"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getSeverityIcon(pattern.severity)}
                    <div>
                      <p className="font-medium text-text-primary">{pattern.label}</p>
                      <p className="text-xs text-text-secondary">{pattern.key}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getDomainColor(pattern.domain)}>{pattern.domain}</Badge>
                    <Badge className={getSeverityColor(pattern.severity)}>{pattern.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary italic text-center py-4">
              No patterns detected. Your Guardian setup looks good!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Suggested Playbooks Panel */}
      <Card className="bg-bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Suggested Playbooks</CardTitle>
          <p className="text-xs text-text-secondary mt-1">
            Playbooks matched to your detected patterns
          </p>
        </CardHeader>
        <CardContent>
          {summary && summary.suggestedPlaybooks.length > 0 ? (
            <div className="space-y-4">
              {summary.suggestedPlaybooks.map((playbook) => (
                <div key={playbook.id} className="border-l-4 border-accent-500 pl-4 py-2">
                  <h3 className="font-semibold text-text-primary">{playbook.title}</h3>
                  <p className="text-sm text-text-secondary mt-1">{playbook.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {playbook.domains.map((domain) => (
                      <Badge key={domain} className={getDomainColor(domain)}>
                        {domain}
                      </Badge>
                    ))}
                    {playbook.matchedPatterns.map((pattern) => (
                      <Badge key={pattern} variant="outline">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary italic text-center py-4">
              No playbooks suggested at this time.
            </p>
          )}
        </CardContent>
      </Card>

      {/* All Playbooks Tab */}
      <Card className="bg-bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">All Available Playbooks</CardTitle>
          <p className="text-xs text-text-secondary mt-1">
            Complete playbook library for your workspace
          </p>
        </CardHeader>
        <CardContent>
          {allPlaybooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allPlaybooks.map((playbook: any) => (
                <div
                  key={playbook.id}
                  className="p-4 border border-border rounded-lg hover:border-accent-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-text-primary text-sm">{playbook.title}</h4>
                    <Badge className={getDomainColor(playbook.category)}>
                      {playbook.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">{playbook.summary}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {playbook.complexity}
                    </Badge>
                    {playbook.estimated_duration_minutes && (
                      <Badge variant="outline" className="text-xs">
                        {playbook.estimated_duration_minutes} min
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary italic text-center py-4">
              No playbooks available yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
