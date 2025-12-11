"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, XCircle, TrendingUp } from "lucide-react";

type EarlyWarning = {
  id: string;
  created_at: string;
  severity: "low" | "medium" | "high" | "critical";
  match_score: number;
  bucket_date: string;
  status: "open" | "acknowledged" | "dismissed";
  suggestion_theme: string;
  evidence: {
    contributingAnomalies: number;
    matchScore: number;
    cohortKey: string;
  };
  pattern: {
    pattern_key: string;
    metric_family: string;
    metric_keys: string[];
    severity: string;
    cohort_key: string;
    description: string;
  };
};

type PatternSignature = {
  id: string;
  pattern_key: string;
  metric_family: string;
  metric_keys: string[];
  cohort_key: string;
  severity: string;
  description: string;
  created_at: string;
};

const SEVERITY_COLORS = {
  critical: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-blue-100 text-blue-800 border-blue-300",
};

const STATUS_ICONS = {
  open: <AlertCircle className="w-4 h-4 text-red-600" />,
  acknowledged: <CheckCircle className="w-4 h-4 text-yellow-600" />,
  dismissed: <XCircle className="w-4 h-4 text-gray-400" />,
};

export default function NetworkPage() {
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [patterns, setPatterns] = useState<PatternSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState<"warnings" | "patterns">(
    "warnings"
  );

  const workspaceId = "00000000-0000-0000-0000-000000000000"; // TODO: Get from auth context

  useEffect(() => {
    loadData();
  }, [severityFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const warningParams = new URLSearchParams({
        workspaceId,
      });

      if (severityFilter !== "all") {
        warningParams.append("severity", severityFilter);
      }

      if (statusFilter !== "all") {
        warningParams.append("status", statusFilter);
      }

      // Load early warnings
      const warningRes = await fetch(
        `/api/guardian/network/early-warnings?${warningParams.toString()}`
      );

      if (!warningRes.ok) {
        throw new Error(`Failed to load early warnings: ${warningRes.status}`);
      }

      const warningData = await warningRes.json();
      setWarnings(warningData.warnings || []);

      // Load patterns
      const patternRes = await fetch(
        `/api/guardian/network/patterns?workspaceId=${workspaceId}`
      );

      if (!patternRes.ok) {
        throw new Error(`Failed to load patterns: ${patternRes.status}`);
      }

      const patternData = await patternRes.json();
      setPatterns(patternData.patterns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    id: string,
    newStatus: "acknowledged" | "dismissed"
  ) => {
    try {
      const res = await fetch(
        `/api/guardian/network/early-warnings?workspaceId=${workspaceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: newStatus }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update warning");
      }

      // Reload warnings
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const filteredWarnings = warnings.filter((w) => {
    if (severityFilter !== "all" && w.severity !== severityFilter) {
      return false;
    }
    if (statusFilter !== "all" && w.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Network Anomalies & Patterns</h1>
          <p className="text-gray-600 mt-1">
            Privacy-preserving network intelligence and early warning signals
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Privacy Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Data is aggregated and privacy-preserving. Network comparisons use
              anonymized cohorts with no individual tenant cross-references.
            </span>
          </p>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-900">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setSelectedTab("warnings")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            selectedTab === "warnings"
              ? "border-accent-500 text-accent-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Early Warnings ({filteredWarnings.length})
        </button>
        <button
          onClick={() => setSelectedTab("patterns")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            selectedTab === "patterns"
              ? "border-accent-500 text-accent-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Pattern Catalog ({patterns.length})
        </button>
      </div>

      {/* Early Warnings Tab */}
      {selectedTab === "warnings" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warnings List */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredWarnings.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No early warnings detected
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredWarnings.map((warning) => (
                <Card
                  key={warning.id}
                  className={`border-l-4 ${
                    SEVERITY_COLORS[warning.severity]
                  } border-l-${
                    warning.severity === "critical"
                      ? "red"
                      : warning.severity === "high"
                      ? "orange"
                      : warning.severity === "medium"
                      ? "yellow"
                      : "blue"
                  }-500`}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {STATUS_ICONS[warning.status]}
                          <h3 className="font-semibold">
                            {warning.pattern.pattern_key}
                          </h3>
                          <Badge className="bg-accent-500 text-white">
                            {(warning.match_score * 100).toFixed(0)}% match
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-700 mb-2">
                          {warning.pattern.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                          <div>
                            <span className="text-gray-600">Metrics: </span>
                            <code className="bg-gray-100 px-2 py-1 rounded">
                              {warning.pattern.metric_keys.join(", ")}
                            </code>
                          </div>
                          <div>
                            <span className="text-gray-600">Cohort: </span>
                            <span className="font-mono">
                              {warning.evidence.cohortKey}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Detected:{" "}
                          {new Date(warning.created_at).toLocaleDateString()}{" "}
                          • Status: {warning.status}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {warning.status === "open" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusUpdate(warning.id, "acknowledged")
                              }
                            >
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleStatusUpdate(warning.id, "dismissed")
                              }
                            >
                              Dismiss
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pattern Catalog Tab */}
      {selectedTab === "patterns" && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : patterns.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No pattern signatures available
              </CardContent>
            </Card>
          ) : (
            patterns.map((pattern) => (
              <Card key={pattern.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">
                        {pattern.pattern_key}
                      </h3>
                      <p className="text-sm text-gray-700 mb-2">
                        {pattern.description}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-gray-600">Family: </span>
                          <span className="font-mono">
                            {pattern.metric_family}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cohort: </span>
                          <span className="font-mono">{pattern.cohort_key}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Severity: </span>
                          <Badge className={SEVERITY_COLORS[pattern.severity as keyof typeof SEVERITY_COLORS]}>
                            {pattern.severity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
