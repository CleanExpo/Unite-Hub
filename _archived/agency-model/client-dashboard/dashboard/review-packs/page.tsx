/**
 * Client Review Packs Page
 * Phase 43: Agency Review Pack Generator
 *
 * View quarterly and annual review packs
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer, Section, ChatbotSafeZone } from "@/ui/layout/AppGrid";
import { SectionHeader } from "@/ui/components/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/Card";
import { ReviewPackCard } from "@/ui/components/ReviewPackCard";
import {
  FolderOpen,
  Loader2,
  Calendar,
  FileText,
  Image,
  CheckCircle,
  Clock,
  Send,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import type { ReviewPack } from "@/lib/services/clientReviewPackService";

export default function ClientReviewPacksPage() {
  const [packs, setPacks] = useState<ReviewPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<ReviewPack | null>(null);

  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/review-packs");
      if (res.ok) {
        const data = await res.json();
        setPacks(data.packs || []);
      }
    } catch (err) {
      console.error("Failed to fetch review packs:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusConfig = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: FileText },
    ready_for_review: { label: "Ready for Review", color: "bg-amber-100 text-amber-700", icon: Clock },
    approved: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
    sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
  };

  return (
    <PageContainer>
      <ChatbotSafeZone>
        <SectionHeader
          icon={FolderOpen}
          title="Agency Review Packs"
          description="Your quarterly and annual performance review packs"
        />

        {loading ? (
          <Section className="mt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          </Section>
        ) : selectedPack ? (
          /* Detail View */
          <Section className="mt-6">
            <button
              type="button"
              onClick={() => setSelectedPack(null)}
              className="text-sm text-teal-600 hover:text-teal-700 mb-4 flex items-center gap-1"
            >
              ← Back to list
            </button>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">
                    {selectedPack.periodType} Review Pack
                  </CardTitle>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig[selectedPack.status].color}`}>
                    {statusConfig[selectedPack.status].label}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Period */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Review Period</h3>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    {formatDate(selectedPack.startDate)} - {formatDate(selectedPack.endDate)}
                  </div>
                </div>

                {/* Narrative */}
                {selectedPack.narrative && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Performance Summary</h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {selectedPack.narrative}
                      </p>
                    </div>
                  </div>
                )}

                {/* Performance Report Link */}
                {selectedPack.performanceReportId && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Performance Report</h3>
                    <a
                      href={`/client/dashboard/reports/${selectedPack.performanceReportId}`}
                      className="flex items-center gap-2 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span className="text-sm font-medium">View Detailed Report</span>
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </a>
                  </div>
                )}

                {/* Visual Assets */}
                {selectedPack.visualAssetIds.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Visual Assets ({selectedPack.visualAssetIds.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedPack.visualAssetIds.map((id, i) => (
                        <div
                          key={id}
                          className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
                        >
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Sources */}
                {selectedPack.dataSources.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Data Sources</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPack.dataSources.map((source) => (
                        <span
                          key={source}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery Info */}
                {selectedPack.sentAt && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500">
                      Delivered via <strong className="capitalize">{selectedPack.deliveryChannel}</strong> on{" "}
                      {formatDate(selectedPack.sentAt)}
                    </p>
                  </div>
                )}

                {/* Data Notice */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    All metrics in this review are based on real data from the reporting period.
                    No estimates or projections are included.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Section>
        ) : (
          /* List View */
          <>
            {packs.length === 0 ? (
              <Section className="mt-6">
                <Card>
                  <CardContent className="py-12 text-center">
                    <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No review packs available yet.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your agency will create review packs for you periodically.
                    </p>
                  </CardContent>
                </Card>
              </Section>
            ) : (
              <Section className="mt-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {packs.map((pack) => (
                    <ReviewPackCard
                      key={pack.id}
                      pack={pack}
                      onClick={() => setSelectedPack(pack)}
                    />
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        {/* Info Notice */}
        <Section className="mt-8">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>About Review Packs:</strong> These documents summarize your agency's work
              during each period. All data is sourced from real performance metrics and verified
              before delivery.
            </p>
          </div>
        </Section>
      </ChatbotSafeZone>
    </PageContainer>
  );
}
