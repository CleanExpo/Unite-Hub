"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  RefreshCw,
  Download,
  TrendingUp,
  Users,
  Target,
  Lightbulb,
  BarChart3,
  FileText,
} from "lucide-react";
import CompetitorsList from "@/components/competitors/CompetitorsList";
import SWOTAnalysis from "@/components/competitors/SWOTAnalysis";
import MarketGapsPanel from "@/components/competitors/MarketGapsPanel";
import OpportunitiesPanel from "@/components/competitors/OpportunitiesPanel";
import ActionableInsights from "@/components/competitors/ActionableInsights";
import ComparisonMatrix from "@/components/competitors/ComparisonMatrix";
import { FeaturePageWrapper } from "@/components/features/FeaturePageWrapper";
import { Id } from "@/convex/_generated/dataModel";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { supabaseBrowser } from "@/lib/supabase";

export default function CompetitorsPage() {
  return (
    <FeaturePageWrapper
      featureName="Competitor Analysis"
      description="Track competitors, identify market gaps, find opportunities"
      icon={<Target className="h-20 w-20 text-slate-600" />}
    >
      {(clientId) => <CompetitorFeature clientId={clientId} />}
    </FeaturePageWrapper>
  );
}

function CompetitorFeature({ clientId }: { clientId: Id<"clients"> }) {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch competitors
  const fetchCompetitors = async () => {
    try {
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        console.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/competitors?clientId=${clientId}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch competitors");
      const data = await response.json();
      setCompetitors(data.competitors || []);
    } catch (error) {
      console.error("Error fetching competitors:", error);
    }
  };

  // Fetch latest analysis
  const fetchLatestAnalysis = async () => {
    try {
      const response = await fetch(
        `/api/competitors/analysis/latest?clientId=${clientId}`
      );
      if (response.ok) {
        const data = await response.json();
        setLatestAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Error fetching analysis:", error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCompetitors(), fetchLatestAnalysis()]);
      setLoading(false);
    };

    loadData();
  }, [clientId]);

  // Run AI analysis
  const runAnalysis = async () => {
    if (competitors.length === 0) {
      alert("Please add at least one competitor before running analysis.");
      return;
    }

    setAnalyzing(true);
    try {
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        alert("Not authenticated");
        setAnalyzing(false);
        return;
      }

      const response = await fetch("/api/competitors/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      const data = await response.json();
      setLatestAnalysis(data.analysis);
      alert("Analysis completed successfully!");
      setActiveTab("swot");
    } catch (error: any) {
      console.error("Error running analysis:", error);
      alert(error.message || "Failed to run analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  // Export analysis
  const exportAnalysis = () => {
    if (!latestAnalysis) {
      alert("No analysis to export. Run an analysis first.");
      return;
    }

    const dataStr = JSON.stringify(latestAnalysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `competitor-analysis-${Date.now()}.json`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Breadcrumbs items={[
        { label: "Insights", href: "/dashboard/insights" },
        { label: "Competitors" }
      ]} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Competitor Analysis
          </h1>
          <p className="text-gray-600 mt-1">
            Track competitors and discover market opportunities
          </p>
        </div>

        <div className="flex gap-3">
          {latestAnalysis && (
            <Button variant="outline" onClick={exportAnalysis}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          <Button
            onClick={runAnalysis}
            disabled={analyzing || competitors.length === 0}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {latestAnalysis ? "Refresh Analysis" : "Run Analysis"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Competitors</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {competitors.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Direct Competitors</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {competitors.filter((c) => c.category === "direct").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Market Gaps</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {latestAnalysis?.marketGaps?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Opportunities</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {latestAnalysis?.differentiationOpportunities?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="swot" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            SWOT
          </TabsTrigger>
          <TabsTrigger value="gaps" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Market Gaps
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Comparison
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          {latestAnalysis ? (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Analysis Summary
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {latestAnalysis.aiSummary}
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  Last analyzed:{" "}
                  {new Date(latestAnalysis.analysisDate).toLocaleString()}
                </div>
              </Card>

              <CompetitorsList
                clientId={clientId}
                competitors={competitors}
                onRefresh={fetchCompetitors}
              />
            </div>
          ) : (
            <div>
              <Card className="p-8 text-center mb-6">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Analysis Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Add competitors and run your first analysis to get insights
                </p>
                <Button onClick={runAnalysis} disabled={competitors.length === 0}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Analysis
                </Button>
              </Card>

              <CompetitorsList
                clientId={clientId}
                competitors={competitors}
                onRefresh={fetchCompetitors}
              />
            </div>
          )}
        </TabsContent>

        {/* SWOT Tab */}
        <TabsContent value="swot" className="mt-6">
          {latestAnalysis?.swotAnalysis ? (
            <SWOTAnalysis swot={latestAnalysis.swotAnalysis} />
          ) : (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No SWOT Analysis
              </h3>
              <p className="text-gray-600 mb-4">
                Run a competitor analysis to generate SWOT insights
              </p>
              <Button onClick={runAnalysis} disabled={competitors.length === 0}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Analysis
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Market Gaps Tab */}
        <TabsContent value="gaps" className="mt-6">
          <MarketGapsPanel marketGaps={latestAnalysis?.marketGaps || []} />
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="mt-6">
          <OpportunitiesPanel
            opportunities={latestAnalysis?.differentiationOpportunities || []}
          />
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="mt-6">
          <ActionableInsights
            insights={latestAnalysis?.actionableInsights || []}
          />
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="mt-6">
          <ComparisonMatrix competitors={competitors} />
        </TabsContent>
      </Tabs>

      {/* Professional Tier Notice */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-purple-900 mb-1">
              Professional Feature
            </h4>
            <p className="text-sm text-purple-800">
              Competitor analysis is available on the Professional plan. Track up
              to 10 competitors and get AI-powered insights to stay ahead of the
              competition.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
