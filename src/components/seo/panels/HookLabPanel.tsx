/**
 * Hook Lab Panel
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 *
 * HYPNOTIC MODE ONLY
 *
 * Hook engineering laboratory for testing retention mechanisms:
 * - Hook templates (pattern interrupts)
 * - A/B test results
 * - Retention scores
 * - Hook performance analytics
 *
 * Applies Hypnotic Velocity Matrix principles:
 * - First 3-second pattern interrupt
 * - Open loop mechanisms
 * - Curiosity gap engineering
 * - Retention optimization
 */

"use client";

import { useState, useEffect } from "react";
import { Beaker, TrendingUp, Target, Sparkles } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";

interface HookLabPanelProps {
  seoProfileId: string;
  organizationId: string;
  userRole: UserRole;
}

interface HookTemplate {
  id: string;
  name: string;
  pattern: string;
  retentionScore: number; // 0-100
  testStatus: "active" | "winning" | "losing" | "draft";
  impressions: number;
  avgWatchTime: number; // seconds
}

export default function HookLabPanel({
  seoProfileId,
  organizationId,
  userRole,
}: HookLabPanelProps) {
  const [hooks, setHooks] = useState<HookTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHookTemplates() {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call to fetch hook templates
        // For Phase 1, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock hook templates
        setHooks([
          {
            id: "1",
            name: "The Unexpected Problem",
            pattern: "pattern_interrupt",
            retentionScore: 89,
            testStatus: "winning",
            impressions: 12400,
            avgWatchTime: 47.3,
          },
          {
            id: "2",
            name: "The Curiosity Gap",
            pattern: "open_loop",
            retentionScore: 76,
            testStatus: "active",
            impressions: 8900,
            avgWatchTime: 38.2,
          },
          {
            id: "3",
            name: "The Bold Claim",
            pattern: "controversy",
            retentionScore: 82,
            testStatus: "active",
            impressions: 10200,
            avgWatchTime: 41.8,
          },
        ]);
      } catch (err) {
        console.error("Error fetching hook templates:", err);
        setError(err instanceof Error ? err.message : "Failed to load hook templates");
      } finally {
        setLoading(false);
      }
    }

    fetchHookTemplates();
  }, [seoProfileId, organizationId]);

  // Show loading state
  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6 lg:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-pink-500/10">
            <Beaker className="h-5 w-5 text-pink-500" />
          </div>
          <h3 className="text-lg font-semibold">Hook Engineering Lab</h3>
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
      <div className="bg-card border rounded-lg p-6 lg:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-pink-500/10">
            <Beaker className="h-5 w-5 text-pink-500" />
          </div>
          <h3 className="text-lg font-semibold">Hook Engineering Lab</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  // Show hook lab
  return (
    <div className="bg-card border rounded-lg p-6 lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-pink-500/10">
            <Beaker className="h-5 w-5 text-pink-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Hook Engineering Lab</h3>
            <p className="text-xs text-muted-foreground">A/B testing retention mechanisms</p>
          </div>
        </div>
        {userRole === "staff" && (
          <button className="px-3 py-1.5 bg-pink-500 text-white rounded-md text-sm hover:bg-pink-600">
            New Hook
          </button>
        )}
      </div>

      {/* Hook Pattern Guide */}
      <div className="mb-6 p-4 bg-pink-500/10 rounded-md">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-pink-700 dark:text-pink-400 mb-1">
              Hook Patterns in Use
            </p>
            <ul className="text-xs text-pink-700 dark:text-pink-400 space-y-1">
              <li>• Pattern Interrupt: Unexpected opening that breaks scroll</li>
              <li>• Open Loop: Create curiosity gap that demands resolution</li>
              <li>• Controversy: Bold claim that triggers engagement</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hook Templates */}
      {hooks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No hook templates yet. Create your first hook to start optimizing retention!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hooks.map((hook) => (
            <div
              key={hook.id}
              className="p-4 border rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{hook.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        hook.testStatus === "winning"
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : hook.testStatus === "losing"
                            ? "bg-red-500/10 text-red-700 dark:text-red-400"
                            : hook.testStatus === "active"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                              : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {hook.testStatus}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pattern: {hook.pattern.replace("_", " ")}
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Retention</p>
                  </div>
                  <p className="text-lg font-bold">{hook.retentionScore}%</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Impressions</p>
                  </div>
                  <p className="text-lg font-bold">{hook.impressions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Avg Watch</p>
                  <p className="text-lg font-bold">{hook.avgWatchTime}s</p>
                </div>
              </div>

              {/* Retention Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        hook.retentionScore >= 80
                          ? "bg-green-500"
                          : hook.retentionScore >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${hook.retentionScore}%` }}
                    />
                  </div>
                </div>
                {userRole === "staff" && (
                  <button className="text-xs text-primary hover:underline">Edit</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {userRole === "staff" && (
        <div className="mt-4 pt-4 border-t">
          <button className="text-sm text-primary hover:underline">
            View Hook Analytics Dashboard →
          </button>
        </div>
      )}
    </div>
  );
}
