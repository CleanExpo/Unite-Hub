/**
 * Keyword Opportunities Panel
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 *
 * Displays potential keyword opportunities:
 * - High impressions, low clicks (CTR opportunity)
 * - Position 11-20 (first page push opportunity)
 * - Rising queries (trending terms)
 *
 * Note: This panel doesn't require explicit credentials since it
 * analyzes existing GSC data stored in the database.
 */

"use client";

import { useState, useEffect } from "react";
import { Lightbulb, TrendingUp, Target } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";

interface KeywordOpportunitiesPanelProps {
  seoProfileId: string;
  organizationId: string;
  userRole: UserRole;
}

interface KeywordOpportunity {
  query: string;
  type: "ctr" | "push" | "trending";
  impressions: number;
  clicks: number;
  position: number;
  potential: string;
}

export default function KeywordOpportunitiesPanel({
  seoProfileId,
  organizationId,
  userRole,
}: KeywordOpportunitiesPanelProps) {
  const [opportunities, setOpportunities] = useState<KeywordOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKeywordOpportunities() {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call to fetch keyword opportunities
        // For Phase 1, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock opportunities
        setOpportunities([
          {
            query: "stainless steel balustrades brisbane",
            type: "push",
            impressions: 1200,
            clicks: 45,
            position: 12.3,
            potential: "Push to page 1",
          },
          {
            query: "glass railing systems",
            type: "ctr",
            impressions: 3400,
            clicks: 85,
            position: 5.2,
            potential: "Improve CTR by 50%+",
          },
          {
            query: "modern balustrade design",
            type: "trending",
            impressions: 890,
            clicks: 78,
            position: 8.1,
            potential: "Growing +45% MoM",
          },
        ]);
      } catch (err) {
        console.error("Error fetching keyword opportunities:", err);
        setError(err instanceof Error ? err.message : "Failed to load opportunities");
      } finally {
        setLoading(false);
      }
    }

    fetchKeywordOpportunities();
  }, [seoProfileId, organizationId]);

  // Show loading state
  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-yellow-500/10">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold">Keyword Opportunities</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-yellow-500/10">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold">Keyword Opportunities</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  // Show opportunities
  return (
    <div className="bg-card border rounded-lg p-6 lg:col-span-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-md bg-yellow-500/10">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
        </div>
        <h3 className="text-lg font-semibold">Keyword Opportunities</h3>
      </div>

      {opportunities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No keyword opportunities identified yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp, index) => (
            <div key={index} className="p-4 border rounded-md hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {opp.type === "push" && <Target className="h-4 w-4 text-blue-500" />}
                    {opp.type === "ctr" && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {opp.type === "trending" && <TrendingUp className="h-4 w-4 text-purple-500" />}
                    <h4 className="font-medium text-sm">{opp.query}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{opp.potential}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    opp.type === "push"
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      : opp.type === "ctr"
                        ? "bg-green-500/10 text-green-700 dark:text-green-400"
                        : "bg-purple-500/10 text-purple-700 dark:text-purple-400"
                  }`}
                >
                  {opp.type === "push"
                    ? "First Page"
                    : opp.type === "ctr"
                      ? "CTR Boost"
                      : "Trending"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Impressions</p>
                  <p className="font-medium">{opp.impressions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clicks</p>
                  <p className="font-medium">{opp.clicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Position</p>
                  <p className="font-medium">{opp.position.toFixed(1)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {userRole === "staff" && (
        <div className="mt-4 pt-4 border-t">
          <button className="text-sm text-primary hover:underline">
            View All Opportunities →
          </button>
        </div>
      )}
    </div>
  );
}
