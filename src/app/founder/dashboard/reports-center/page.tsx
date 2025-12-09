'use client';

/**
 * Founder Report Center
 * Phase 76: Review and manage client reports
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Users,
  Download,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Send,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReportSummaryCard } from '@/ui/components/ReportSummaryCard';
import { ReportSectionBlock } from '@/ui/components/ReportSectionBlock';
import { CalloutHint } from '@/ui/components/CalloutHint';
import { ReportExportBar } from '@/ui/components/ReportExportBar';
import {
  buildFounderReport,
  ComposedReport,
  getReportSummary,
} from '@/lib/reports/reportCompositionEngine';
import {
  exportReportToHTML,
  exportReportToMarkdown,
} from '@/lib/reports/reportExportComposer';
import { ReportType } from '@/lib/reports/reportSectionsConfig';

interface ClientItem {
  client_id: string;
  client_name: string;
  industry: string;
}

export default function FounderReportCenterPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ReportType>('weekly');
  const [currentReport, setCurrentReport] = useState<ComposedReport | null>(null);
  const [founderNotes, setFounderNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadReport();
    }
  }, [selectedClient, selectedType]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const mockClients: ClientItem[] = [
        { client_id: 'client_1', client_name: 'Alpha Construction', industry: 'Construction' },
        { client_id: 'client_2', client_name: 'Beta Balustrades', industry: 'Manufacturing' },
        { client_id: 'client_3', client_name: 'Gamma Glass', industry: 'Glass & Glazing' },
      ];
      setClients(mockClients);
      setSelectedClient(mockClients[0]?.client_id || null);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReport = async () => {
    if (!selectedClient) {
return;
}

    const client = clients.find(c => c.client_id === selectedClient);
    if (!client) {
return;
}

    try {
      const report = buildFounderReport({
        workspace_id: `ws_${selectedClient}`,
        client_id: selectedClient,
        client_name: client.client_name,
        report_type: selectedType,
        include_optional_sections: true,
      });
      setCurrentReport(report);
    } catch (error) {
      console.error('Failed to load report:', error);
    }
  };

  const handleCopyMarkdown = async () => {
    if (!currentReport) {
return;
}
    try {
      const exported = exportReportToMarkdown(currentReport);
      await navigator.clipboard.writeText(exported.content);
      setCopied('markdown');
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadHTML = () => {
    if (!currentReport) {
return;
}
    const exported = exportReportToHTML(currentReport);
    const blob = new Blob([exported.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exported.filename_suggestion;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  // Calculate summary stats
  const totalClients = clients.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Report Center</h1>
          <p className="text-muted-foreground">
            Review and manage client reports before delivery
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/founder/dashboard/client-stories')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Client Stories
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/founder/dashboard/story-touchpoints')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Touchpoints
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalClients}</p>
                <p className="text-xs text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Report Types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">Ready</p>
                <p className="text-xs text-muted-foreground">For Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client and type selectors */}
      <div className="flex items-center gap-4">
        <Select value={selectedClient || ''} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.client_id} value={client.client_id}>
                {client.client_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ReportType)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly Report</SelectItem>
            <SelectItem value="monthly">Monthly Report</SelectItem>
            <SelectItem value="ninety_day">90-Day Report</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report content */}
      {currentReport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main report */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{currentReport.title}</CardTitle>
                    <CardDescription>{currentReport.subtitle}</CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      currentReport.data_completeness >= 75
                        ? 'text-green-500 border-green-500/30'
                        : currentReport.data_completeness >= 40
                        ? 'text-yellow-500 border-yellow-500/30'
                        : 'text-orange-500 border-orange-500/30'
                    }
                  >
                    {currentReport.data_completeness}% complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Timeframe: {currentReport.timeframe.label}</span>
                  <span>•</span>
                  <span>{currentReport.meta.complete_sections}/{currentReport.meta.total_sections} sections</span>
                </div>

                {/* Export actions */}
                <div className="mt-4">
                  <ReportExportBar
                    reportType={selectedType}
                    clientId={selectedClient || ''}
                    workspaceId={`ws_${selectedClient}`}
                    clientName={clients.find(c => c.client_id === selectedClient)?.client_name}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  All exports are based on real data from the selected timeframe.
                </p>
              </CardContent>
            </Card>

            {/* Report sections */}
            <div className="space-y-4">
              {currentReport.sections.map((section, index) => (
                <ReportSectionBlock
                  key={section.section_id}
                  section={section}
                  sectionNumber={index + 1}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Founder notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Founder Notes</CardTitle>
                <CardDescription className="text-xs">
                  Add notes before sharing with client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Add your review notes here..."
                  value={founderNotes}
                  onChange={(e) => setFounderNotes(e.target.value)}
                  rows={6}
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Notes are local-only and not saved to database
                </p>
              </CardContent>
            </Card>

            {/* Report stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Report Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sections</span>
                  <span>{currentReport.sections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Complete</span>
                  <span>{currentReport.meta.complete_sections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partial</span>
                  <span>{currentReport.meta.partial_sections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Omitted</span>
                  <span>{currentReport.meta.omitted_sections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Sources</span>
                  <span>{currentReport.meta.data_sources_used.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Omitted sections */}
            {currentReport.omitted_sections.length > 0 && (
              <Card className="border-orange-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <CardTitle className="text-sm">Omitted Sections</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {currentReport.omitted_sections.map((section) => (
                      <li key={section}>• {section.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Link to alignment */}
      <CalloutHint
        variant="explore"
        title="View Client Alignment"
        description="See how clients are progressing across all dimensions"
        actionLabel="Open Alignment"
        onAction={() => router.push('/founder/dashboard/alignment')}
      />
    </div>
  );
}
