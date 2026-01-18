'use client';

/**
 * Client Report Center
 * Phase 76: View and export composed reports
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Copy,
  Check,
  Calendar,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReportSummaryCard } from '@/ui/components/ReportSummaryCard';
import { ReportSectionBlock } from '@/ui/components/ReportSectionBlock';
import { ReportTimelineList } from '@/ui/components/ReportTimelineList';
import { CalloutHint, NoDataPlaceholder } from '@/ui/components/CalloutHint';
import { ReportExportBar } from '@/ui/components/ReportExportBar';
import {
  buildClientReport,
  ComposedReport,
} from '@/lib/reports/reportCompositionEngine';
import {
  exportReportToHTML,
  exportReportToMarkdown,
} from '@/lib/reports/reportExportComposer';
import { ReportType } from '@/lib/reports/reportSectionsConfig';

export default function ClientReportCenterPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ReportType>('weekly');
  const [currentReport, setCurrentReport] = useState<ComposedReport | null>(null);
  const [reportHistory, setReportHistory] = useState<ComposedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [selectedType]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      // Generate report for current type
      const report = buildClientReport({
        workspace_id: 'ws_demo',
        client_id: 'contact_demo',
        client_name: 'Your Business',
        report_type: selectedType,
        include_optional_sections: true,
      });

      setCurrentReport(report);

      // Generate history (all types)
      const history: ComposedReport[] = [];
      for (const type of ['weekly', 'monthly', 'ninety_day'] as ReportType[]) {
        const histReport = buildClientReport({
          workspace_id: 'ws_demo',
          client_id: 'contact_demo',
          client_name: 'Your Business',
          report_type: type,
        });
        history.push(histReport);
      }
      setReportHistory(history);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Report Center</h1>
          <p className="text-muted-foreground">
            View and export your journey reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/client/dashboard/stories')}>
            <BookOpen className="h-4 w-4 mr-2" />
            Stories
          </Button>
          <Button variant="outline" onClick={() => router.push('/client/dashboard/touchpoints')}>
            <Calendar className="h-4 w-4 mr-2" />
            Touchpoints
          </Button>
        </div>
      </div>

      {/* Report type selector */}
      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as ReportType)}>
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="ninety_day">90-Day</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="mt-6 space-y-6">
          {currentReport ? (
            <>
              {/* Report header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentReport.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentReport.subtitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {currentReport.meta.complete_sections}/{currentReport.meta.total_sections} sections
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          currentReport.data_completeness >= 75
                            ? 'text-success-500 border-success-500/30'
                            : currentReport.data_completeness >= 40
                            ? 'text-warning-500 border-warning-500/30'
                            : 'text-warning-600 border-warning-600/30'
                        }
                      >
                        {currentReport.data_completeness}% complete
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Timeframe: {currentReport.timeframe.label}</span>
                    <span>•</span>
                    <span>
                      Generated: {new Date(currentReport.generated_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Export actions */}
                  <div className="mt-4">
                    <ReportExportBar
                      reportType={selectedType}
                      clientId="contact_demo"
                      workspaceId="ws_demo"
                      clientName="Your Business"
                    />
                  </div>
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

              {/* Omitted sections notice */}
              {currentReport.omitted_sections.length > 0 && (
                <Card className="border-warning-500/30">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      {currentReport.omitted_sections.length} section(s) omitted due to insufficient data:{' '}
                      {currentReport.omitted_sections.join(', ')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <NoDataPlaceholder
              message="Unable to generate report"
              suggestion="Please try again later"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Report history */}
      <ReportTimelineList
        reports={reportHistory}
        onViewReport={(report) => setSelectedType(report.report_type)}
      />

      {/* Link to alignment */}
      <CalloutHint
        variant="explore"
        title="View Your Alignment"
        description="See how you're progressing across all dimensions"
        actionLabel="Open Alignment"
        onAction={() => router.push('/client/dashboard/alignment')}
      />
    </div>
  );
}
