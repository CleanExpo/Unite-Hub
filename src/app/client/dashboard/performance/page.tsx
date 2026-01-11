/**
 * Performance Dashboard Page
 * Phase 40: Performance Intelligence Layer
 *
 * Quarterly and annual performance reports with real data only
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageContainer, Section, ChatbotSafeZone } from "@/ui/layout/AppGrid";
import { SectionHeader } from "@/ui/components/SectionHeader";
import { PerformanceCard } from "@/ui/components/PerformanceCard";
import { KPITable } from "@/ui/components/KPITable";
import { VisualGallery } from "@/ui/components/VisualGallery";
import { BarChart3, Calendar, FileText, Loader2, AlertCircle } from "lucide-react";
import type { PerformanceReport, NormalizedMetrics } from "@/lib/services/performanceInsightsService";

type PeriodTab = "quarterly" | "annual";

export default function PerformancePage() {
  const { user, currentOrganization } = useAuth();
  const [activeTab, setActiveTab] = useState<PeriodTab>("quarterly");
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const clientId = user?.id;

  useEffect(() => {
    if (clientId) {
      fetchReports();
    }
  }, [clientId, activeTab]);

  const fetchReports = async () => {
    if (!clientId) {
return;
}

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/performance/reports?clientId=${clientId}&period=${activeTab}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!clientId) {
return;
}

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/performance/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          period: activeTab,
          domain: currentOrganization?.domain || "example.com",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      await fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const approveReport = async (reportId: string) => {
    if (!clientId) {
return;
}

    try {
      const response = await fetch("/api/performance/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, clientId }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve report");
      }

      await fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve report");
    }
  };

  const latestReport = reports[0];
  const metrics = latestReport?.metrics as NormalizedMetrics | undefined;

  return (
    <PageContainer>
      <ChatbotSafeZone>
        <SectionHeader
          icon={BarChart3}
          title="Performance Reports"
          description="Quarterly and annual performance overviews based on real data"
          action={
            <button
              type="button"
              onClick={generateReport}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent-600 rounded-lg hover:bg-accent-700 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>
          }
        />

        {/* Period Tabs */}
        <Section className="mt-6">
          <div className="flex gap-2 p-1 bg-bg-hover rounded-lg w-fit">
            <TabButton
              active={activeTab === "quarterly"}
              onClick={() => setActiveTab("quarterly")}
              icon={Calendar}
              label="Quarterly"
            />
            <TabButton
              active={activeTab === "annual"}
              onClick={() => setActiveTab("annual")}
              icon={Calendar}
              label="Annual"
            />
          </div>
        </Section>

        {/* Error State */}
        {error && (
          <Section className="mt-4">
            <div className="flex items-center gap-2 p-4 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Section>
        )}

        {/* Loading State */}
        {loading && (
          <Section className="mt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
            </div>
          </Section>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && (
          <Section className="mt-6">
            <div className="text-center py-12 bg-bg-raised/50 rounded-lg">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-text-primary mb-1">
                No {activeTab} reports yet
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Generate your first {activeTab} report to see performance metrics
              </p>
              <button
                type="button"
                onClick={generateReport}
                disabled={generating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent-600 rounded-lg hover:bg-accent-700"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </Section>
        )}

        {/* Report Content */}
        {!loading && latestReport && (
          <>
            {/* Latest Report Card */}
            <Section className="mt-6">
              <h2 className="text-sm font-medium text-text-secondary mb-3">
                Latest Report
              </h2>
              <PerformanceCard
                report={latestReport}
                onRefresh={fetchReports}
                onApprove={approveReport}
              />
            </Section>

            {/* KPI Table */}
            {metrics && (
              <Section className="mt-6">
                <h2 className="text-sm font-medium text-text-secondary mb-3">
                  Key Performance Indicators
                </h2>
                <KPITable metrics={metrics} period={activeTab} />
              </Section>
            )}

            {/* Visual Assets */}
            {latestReport.visual_asset_ids && latestReport.visual_asset_ids.length > 0 && (
              <Section className="mt-6">
                <h2 className="text-sm font-medium text-text-secondary mb-3">
                  Report Visuals
                </h2>
                <VisualGallery
                  assets={latestReport.visual_asset_ids.map((id) => ({
                    id,
                    url: "", // Would be fetched from visual_assets table
                    model: "platform",
                    type: "image" as const,
                    status: "approved" as const,
                  }))}
                  onApprove={() => {}}
                  onReject={() => {}}
                  onRegenerate={() => {}}
                />
              </Section>
            )}

            {/* Historical Reports */}
            {reports.length > 1 && (
              <Section className="mt-6">
                <h2 className="text-sm font-medium text-text-secondary mb-3">
                  Previous Reports
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {reports.slice(1).map((report) => (
                    <PerformanceCard
                      key={report.id}
                      report={report}
                      onApprove={approveReport}
                    />
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        {/* Data Integrity Notice */}
        <Section className="mt-8">
          <div className="p-4 bg-bg-raised/50 rounded-lg">
            <p className="text-xs text-text-secondary">
              <strong>Data Integrity:</strong> All metrics shown are based on real data from
              Unite-Hub internal systems and DataForSEO API. No estimates, projections, or
              synthetic performance data is included. Reports require approval before
              client-facing use.
            </p>
          </div>
        </Section>
      </ChatbotSafeZone>
    </PageContainer>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: typeof Calendar;
  label: string;
}

function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        active
          ? "bg-bg-input text-accent-600 dark:text-accent-400 shadow-sm"
          : "text-text-secondary hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
