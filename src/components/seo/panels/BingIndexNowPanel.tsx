/**
 * Bing IndexNow Panel
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 *
 * Displays Bing IndexNow status and allows URL submission for instant indexing.
 * Shows:
 * - Recent submissions
 * - Pending URLs
 * - Submit new URLs (staff only)
 *
 * Gracefully handles missing credentials with CTA.
 */

"use client";

import { useState } from "react";
import { Zap, Check, Clock, AlertCircle } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";

interface BingIndexNowPanelProps {
  seoProfileId: string;
  organizationId: string;
  hasCredential: boolean;
  userRole: UserRole;
}

export default function BingIndexNowPanel({
  seoProfileId,
  organizationId,
  hasCredential,
  userRole,
}: BingIndexNowPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleSubmitUrls() {
    if (!urlInput.trim() || !hasCredential) return;

    setSubmitting(true);
    setSubmitResult(null);

    try {
      // Split URLs by newline, trim, and filter empty
      const urls = urlInput
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      if (urls.length === 0) {
        throw new Error("Please enter at least one URL");
      }

      const response = await fetch("/api/seo/bing/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seo_profile_id: seoProfileId,
          organization_id: organizationId,
          urls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit URLs");
      }

      const result = await response.json();
      setSubmitResult({
        success: true,
        message: `Successfully submitted ${urls.length} URL(s) to Bing IndexNow`,
      });
      setUrlInput("");
    } catch (err) {
      setSubmitResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to submit URLs",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Show CTA if no credential
  if (!hasCredential) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-blue-500/10">
            <Zap className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold">Bing IndexNow</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">
            Connect Bing Webmaster to submit URLs for instant indexing.
          </p>
          {userRole === "staff" && (
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
              Connect Bing
            </button>
          )}
          {userRole === "client" && (
            <p className="text-xs text-muted-foreground">
              Contact your account manager to enable this feature.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show panel with submission form (staff only) or status view (client)
  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-md bg-blue-500/10">
          <Zap className="h-5 w-5 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold">Bing IndexNow</h3>
      </div>

      {userRole === "staff" ? (
        <>
          {/* URL Submission Form */}
          <div className="mb-4">
            <label htmlFor="url-input" className="block text-sm font-medium mb-2">
              Submit URLs for Instant Indexing
            </label>
            <textarea
              id="url-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/page1&#10;https://example.com/page2&#10;(one URL per line)"
              className="w-full h-24 px-3 py-2 bg-background border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={submitting}
            />
          </div>

          <button
            onClick={handleSubmitUrls}
            disabled={submitting || !urlInput.trim()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit to Bing"}
          </button>

          {/* Submit Result */}
          {submitResult && (
            <div
              className={`mt-4 p-3 rounded-md text-sm ${
                submitResult.success
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
            >
              <div className="flex items-start gap-2">
                {submitResult.success ? (
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <p>{submitResult.message}</p>
              </div>
            </div>
          )}

          {/* Status Summary */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-3">Recent Activity</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Submitted Today</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">-</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Client View: Status Only */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-md">
              <Check className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">IndexNow Active</p>
                <p className="text-xs text-muted-foreground">
                  Your pages are being submitted for instant indexing
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">This Week</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">This Month</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
