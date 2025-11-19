/**
 * Velocity Queue Panel
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 *
 * HYPNOTIC MODE ONLY
 *
 * Displays content velocity queue:
 * - Planned content pieces
 * - Publishing schedule
 * - Velocity score (pieces per week)
 * - Hook engineering status
 *
 * Applies Hypnotic Velocity Matrix principles:
 * - High-frequency publishing
 * - Retention-focused hooks
 * - Pattern interrupt mechanisms
 */

"use client";

import { useState, useEffect } from "react";
import { Zap, Calendar, Clock, CheckCircle2 } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";

interface VelocityQueuePanelProps {
  seoProfileId: string;
  organizationId: string;
  userRole: UserRole;
}

interface ContentQueueItem {
  id: string;
  title: string;
  status: "planned" | "in_progress" | "ready" | "published";
  scheduledDate: string;
  hookScore: number; // 0-100
  velocityImpact: "high" | "medium" | "low";
}

export default function VelocityQueuePanel({
  seoProfileId,
  organizationId,
  userRole,
}: VelocityQueuePanelProps) {
  const [queueItems, setQueueItems] = useState<ContentQueueItem[]>([]);
  const [velocityScore, setVelocityScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVelocityQueue() {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call to fetch content queue
        // For Phase 1, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock queue items
        setQueueItems([
          {
            id: "1",
            title: "7 Signs Your Balustrade Needs Immediate Replacement",
            status: "ready",
            scheduledDate: "2025-01-20",
            hookScore: 87,
            velocityImpact: "high",
          },
          {
            id: "2",
            title: "Modern Glass vs Steel: The 2025 Balustrade Debate",
            status: "in_progress",
            scheduledDate: "2025-01-22",
            hookScore: 72,
            velocityImpact: "high",
          },
          {
            id: "3",
            title: "Brisbane's New Balustrade Safety Standards Explained",
            status: "planned",
            scheduledDate: "2025-01-24",
            hookScore: 65,
            velocityImpact: "medium",
          },
        ]);

        setVelocityScore(3.5); // pieces per week
      } catch (err) {
        console.error("Error fetching velocity queue:", err);
        setError(err instanceof Error ? err.message : "Failed to load velocity queue");
      } finally {
        setLoading(false);
      }
    }

    fetchVelocityQueue();
  }, [seoProfileId, organizationId]);

  // Show loading state
  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6 lg:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-purple-500/10">
            <Zap className="h-5 w-5 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold">Content Velocity Queue</h3>
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
          <div className="p-2 rounded-md bg-purple-500/10">
            <Zap className="h-5 w-5 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold">Content Velocity Queue</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  // Show velocity queue
  return (
    <div className="bg-card border rounded-lg p-6 lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-500/10">
            <Zap className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Content Velocity Queue</h3>
            <p className="text-xs text-muted-foreground">
              Publishing at {velocityScore} pieces/week
            </p>
          </div>
        </div>
        {userRole === "staff" && (
          <button className="px-3 py-1.5 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-600">
            Add Content
          </button>
        )}
      </div>

      {/* Velocity Score */}
      <div className="mb-6 p-4 bg-purple-500/10 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Current Velocity
            </p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {velocityScore} <span className="text-sm font-normal">pieces/week</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Target</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">5.0</p>
          </div>
        </div>
        <div className="mt-3 h-2 bg-purple-200 dark:bg-purple-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${(velocityScore / 5.0) * 100}%` }}
          />
        </div>
      </div>

      {/* Queue Items */}
      {queueItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No content in queue. Add your first piece to start building velocity!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {queueItems.map((item) => (
            <div
              key={item.id}
              className="p-4 border rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.scheduledDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    item.velocityImpact === "high"
                      ? "bg-purple-500/10 text-purple-700 dark:text-purple-400"
                      : item.velocityImpact === "medium"
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
                  }`}
                >
                  {item.velocityImpact} impact
                </span>
              </div>

              {/* Hook Score */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Hook Score</span>
                    <span className="font-medium">{item.hookScore}/100</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.hookScore >= 80
                          ? "bg-green-500"
                          : item.hookScore >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${item.hookScore}%` }}
                    />
                  </div>
                </div>
                {item.status === "ready" && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {userRole === "staff" && (
        <div className="mt-4 pt-4 border-t">
          <button className="text-sm text-primary hover:underline">
            View Full Content Calendar →
          </button>
        </div>
      )}
    </div>
  );
}
