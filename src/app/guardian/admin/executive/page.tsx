'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
} from 'lucide-react';

interface ExecutiveReportSummary {
  readinessScore: number;
  readinessDelta: number;
  upliftProgressPct: number;
  editionAlignmentScore: number;
  networkHealthStatus: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface TimelinePoint {
  id: string;
  occurredAt: string;
  label: string;
  category: string;
  narrativeSnippet?: string;
  metricValue?: number;
}

interface ExecutiveReportData {
  id: string;
  title: string;
  reportType: 'monthly' | 'quarterly' | 'custom' | 'snapshot';
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  summary: ExecutiveReportSummary;
  sections: Array<{
    sectionKey: string;
    sectionTitle: string;
    highlights: string[];
  }>;
}

const RISK_COLORS = {
  low: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-red-100 text-red-800 border-red-300',
};

const HEALTH_COLORS = {
  healthy: 'bg-green-100 text-green-800',
  warnings: 'bg-yellow-100 text-yellow-800',
  degraded: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function ExecutiveDashboard() {
  const [reports, setReports] = useState<ExecutiveReportData[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [selectedReport, setSelectedReport] = useState<ExecutiveReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  const { workspaceId, loading: workspaceLoading, error: workspaceError } = useWorkspace();

  // Load reports and timeline on mount
  useEffect(() => {
    if (!workspaceId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load reports
        const reportsRes = await fetch(
          `/api/guardian/meta/reports?workspaceId=${workspaceId}&limit=5`
        );
        if (!reportsRes.ok) throw new Error(`Failed to load reports: ${reportsRes.status}`);
        const reportsData = await reportsRes.json();
        setReports(reportsData.data?.reports || []);

        // Load timeline
        const timelineRes = await fetch(
          `/api/guardian/meta/timeline?workspaceId=${workspaceId}&daysPast=90`
        );
        if (!timelineRes.ok) throw new Error(`Failed to load timeline: ${timelineRes.status}`);
        const timelineData = await timelineRes.json();
        setTimeline(timelineData.data?.timeline || []);

        // Select first report if available
        if (reportsData.data?.reports.length > 0) {
          setSelectedReport(reportsData.data.reports[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [workspaceId]);

  const handleGenerateReport = async () => {
    if (!workspaceId) return;

    try {
      setGenerating(true);
      const res = await fetch(`/api/guardian/meta/reports?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'monthly',
          audience: 'executive',
          enableAiNarrative: true,
        }),
      });

      if (!res.ok) throw new Error(`Failed to generate: ${res.status}`);
      const data = await res.json();

      // Add new report to list
      if (data.data?.report) {
        setReports([data.data.report, ...reports]);
        setSelectedReport(data.data.report);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate executive report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = (format: 'json' | 'csv' | 'pdf') => {
    if (!selectedReport) return;

    // Prepare download data
    const reportJson = JSON.stringify(selectedReport, null, 2);
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${selectedReport.id}.${format === 'json' ? 'json' : 'csv'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (workspaceLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12 text-gray-500">Loading workspace...</div>
      </div>
    );
  }

  if (workspaceError || !workspaceId) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-900">{workspaceError || 'No workspace selected'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12 text-gray-500">Loading executive dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Guardian health reports and timeline</p>
        </div>
        <Button
          onClick={handleGenerateReport}
          disabled={generating}
          className="bg-accent-600 hover:bg-accent-700"
        >
          {generating ? 'Generating...' : '+ Generate Report'}
        </Button>
      </div>

      {/* Current Report Summary */}
      {selectedReport && (
        <Card className="bg-gradient-to-br from-blue-50 to-accent-50 border-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{selectedReport.title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(selectedReport.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge className="bg-accent-100 text-accent-800">{selectedReport.reportType}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              {/* Readiness */}
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-xs font-medium text-gray-600 mb-1">Readiness</p>
                <p className="text-2xl font-bold text-blue-600">
                  {selectedReport.summary.readinessScore}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  {selectedReport.summary.readinessDelta >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  <span
                    className={
                      selectedReport.summary.readinessDelta >= 0 ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {selectedReport.summary.readinessDelta > 0 ? '+' : ''}
                    {selectedReport.summary.readinessDelta}
                  </span>
                </div>
              </div>

              {/* Edition Alignment */}
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-xs font-medium text-gray-600 mb-1">Edition Alignment</p>
                <p className="text-2xl font-bold text-purple-600">
                  {selectedReport.summary.editionAlignmentScore}
                </p>
                <p className="text-xs text-gray-500 mt-2">All editions avg</p>
              </div>

              {/* Uplift Progress */}
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-xs font-medium text-gray-600 mb-1">Uplift Progress</p>
                <p className="text-2xl font-bold text-green-600">
                  {selectedReport.summary.upliftProgressPct}%
                </p>
                <p className="text-xs text-gray-500 mt-2">Tasks completed</p>
              </div>

              {/* Network Health */}
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-xs font-medium text-gray-600 mb-1">Network Health</p>
                <Badge
                  className={`${HEALTH_COLORS[selectedReport.summary.networkHealthStatus as keyof typeof HEALTH_COLORS] || HEALTH_COLORS.healthy}`}
                >
                  {selectedReport.summary.networkHealthStatus}
                </Badge>
              </div>

              {/* Risk Level */}
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-xs font-medium text-gray-600 mb-1">Risk Level</p>
                <Badge className={RISK_COLORS[selectedReport.summary.riskLevel]}>
                  {selectedReport.summary.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Export Options */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadReport('json')}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadReport('csv')}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" disabled className="gap-2">
                <Download className="w-4 h-4" />
                PDF (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Report Sections */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Report Sections</h2>
          {selectedReport?.sections.map((section) => (
            <Card key={section.sectionKey} className="cursor-pointer hover:shadow-md transition">
              <div
                onClick={() =>
                  setExpandedSectionId(
                    expandedSectionId === section.sectionKey ? null : section.sectionKey
                  )
                }
                className="p-4 flex justify-between items-start"
              >
                <div>
                  <h3 className="font-semibold text-sm">{section.sectionTitle}</h3>
                  <div className="mt-2 space-y-1">
                    {section.highlights.slice(0, 2).map((h, idx) => (
                      <p key={idx} className="text-xs text-gray-600">
                        • {h}
                      </p>
                    ))}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition ${
                    expandedSectionId === section.sectionKey ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {expandedSectionId === section.sectionKey && (
                <div className="border-t bg-gray-50 p-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">All Highlights</p>
                    <ul className="space-y-1">
                      {section.highlights.map((h, idx) => (
                        <li key={idx} className="text-xs text-gray-600">
                          ✓ {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Timeline & History */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Health Timeline</h2>
          <Card>
            <CardContent className="pt-6 space-y-3">
              {timeline.slice(0, 8).map((point) => (
                <div key={point.id} className="flex gap-3 pb-3 border-b last:border-0">
                  <div className="mt-1">
                    {point.category === 'core' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                    {point.category === 'meta' && (
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    )}
                    {point.category === 'network_intelligence' && (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    )}
                    {!['core', 'meta', 'network_intelligence'].includes(point.category) && (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{point.label}</p>
                    {point.narrativeSnippet && (
                      <p className="text-xs text-gray-600 mt-1">{point.narrativeSnippet}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(point.occurredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Report History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Report History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`p-3 rounded border cursor-pointer transition ${
                  selectedReport?.id === report.id
                    ? 'bg-accent-50 border-accent-400'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{report.title}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
