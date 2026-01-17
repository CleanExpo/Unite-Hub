"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Clock,
  Tag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/useWorkspace";

interface TriageItem {
  incidentId: string;
  triageId: string;
  incidentAge: number | null;
  currentStatus: string | null;
  triageStatus: string;
  score: number | null;
  band: string | null;
  lastScoredAt: string | null;
  priorityOverride: number | null;
  owner: string | null;
  tags: string[];
  updatedAt: string;
}

interface DetailItem extends TriageItem {
  features: {
    alertCount1h: number;
    alertCount24h: number;
    uniqueRuleCount: number;
    correlationClusterCount: number;
    riskScoreLatest: number;
    riskDelta24h: number;
    notificationFailureRate: number;
    anomalyEventCount: number;
    incidentAgeMinutes: number;
    reopenCount: number;
  };
  rationale: string;
  narrative?: {
    summary: string;
    likelyDrivers: string[];
    nextSteps: string[];
    confidence: number;
    source: "deterministic" | "ai";
  };
}

const BAND_COLORS: Record<string, { bg: string; text: string; icon: string }> =
  {
    critical: { bg: "bg-error-100", text: "text-error-900", icon: "🔴" },
    high: { bg: "bg-accent-100", text: "text-accent-900", icon: "🟠" },
    medium: { bg: "bg-warning-100", text: "text-warning-900", icon: "🟡" },
    low: { bg: "bg-success-100", text: "text-success-900", icon: "🟢" },
  };

const TRIAGE_STATUSES = [
  "untriaged",
  "in_review",
  "actioned",
  "watch",
  "closed_out",
];

export default function TriageQueuePage() {
  const { workspace } = useWorkspace();
  const [items, setItems] = useState<TriageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DetailItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Filters
  const [filterBand, setFilterBand] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterMinScore, setFilterMinScore] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  // Detail drawer state
  const [editingTriageStatus, setEditingTriageStatus] = useState<string>("");
  const [editingPriority, setEditingPriority] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState("");

  const filteredItems = items.filter((item) => {
    if (filterBand && item.band !== filterBand) {
return false;
}
    if (filterStatus && item.triageStatus !== filterStatus) {
return false;
}
    if (filterMinScore !== undefined && (!item.score || item.score < filterMinScore)) {
return false;
}
    if (searchTerm && !item.incidentId.includes(searchTerm)) {
return false;
}
    return true;
  });

  // Fetch triage queue
  const fetchTriageQueue = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspaceId: workspace?.id || "",
        ...(filterBand && { band: filterBand }),
        ...(filterStatus && { triageStatus: filterStatus }),
        ...(filterMinScore !== undefined && { minScore: String(filterMinScore) }),
        limit: "100",
      });

      const res = await fetch(`/api/guardian/ai/incidents/triage?${params}`, {
        headers: {
          "X-Workspace-Id": workspace?.id || "",
        },
      });

      if (!res.ok) {
throw new Error("Failed to fetch triage queue");
}
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching triage queue:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch detail for selected item
  const fetchItemDetail = async (incidentId: string) => {
    setDetailLoading(true);
    try {
      const params = new URLSearchParams({
        workspaceId: workspace?.id || "",
      });

      const res = await fetch(
        `/api/guardian/ai/incidents/triage/${incidentId}/explain?${params}`,
        {
          headers: {
            "X-Workspace-Id": workspace?.id || "",
          },
        }
      );

      if (!res.ok) {
throw new Error("Failed to fetch detail");
}
      const data = await res.json();

      const item = filteredItems.find((i) => i.incidentId === incidentId);
      if (item) {
        const detail: DetailItem = {
          ...item,
          features: data.features,
          rationale: data.rationale,
          narrative: data.narrative,
        };
        setSelectedItem(detail);
        setEditingTriageStatus(item.triageStatus);
        setEditingPriority(item.priorityOverride);
        setEditingNotes("");
      }
    } catch (error) {
      console.error("Error fetching detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  // Trigger batch scoring
  const handleScoreNow = async () => {
    setScoring(true);
    try {
      const res = await fetch("/api/guardian/ai/incidents/score/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-Id": workspace?.id || "",
        },
        body: JSON.stringify({
          maxIncidents: 100,
          lookbackHours: 24,
        }),
      });

      if (!res.ok) {
throw new Error("Failed to score incidents");
}
      await fetchTriageQueue();
    } catch (error) {
      console.error("Error scoring:", error);
    } finally {
      setScoring(false);
    }
  };

  // Update triage state
  const handleUpdateTriage = async () => {
    if (!selectedItem) {
return;
}

    setUpdateLoading(true);
    try {
      const res = await fetch(
        `/api/guardian/ai/incidents/triage/${selectedItem.incidentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Workspace-Id": workspace?.id || "",
          },
          body: JSON.stringify({
            triageStatus: editingTriageStatus,
            priorityOverride: editingPriority,
            notes: editingNotes,
          }),
        }
      );

      if (!res.ok) {
throw new Error("Failed to update triage");
}
      await fetchTriageQueue();
      setSelectedItem(null);
    } catch (error) {
      console.error("Error updating triage:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    if (workspace?.id) {
      fetchTriageQueue();
    }
  }, [workspace?.id]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Incident Triage Queue</h1>
        <p className="text-text-secondary">
          Manage incident severity scores and triage state. Scores are advisory only and do not
          modify incidents automatically.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search incident ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={filterBand} onValueChange={setFilterBand}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by band" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Bands</SelectItem>
              {["critical", "high", "medium", "low"].map((band) => (
                <SelectItem key={band} value={band}>
                  {band.charAt(0).toUpperCase() + band.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {TRIAGE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace(/_/g, " ").toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTriageQueue}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleScoreNow}
            disabled={scoring}
            className="bg-accent-500 hover:bg-accent-600"
          >
            {scoring ? "Scoring..." : "Score Now"}
          </Button>
        </div>
      </div>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Triage Queue</CardTitle>
          <CardDescription>
            {filteredItems.length} incident(s) • Sorted by priority and score
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-text-secondary">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center text-text-secondary">No incidents match filters</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border-base">
                  <tr className="bg-bg-raised">
                    <th className="px-4 py-3 text-left font-semibold">Incident ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Age (min)</th>
                    <th className="px-4 py-3 text-left font-semibold">Score</th>
                    <th className="px-4 py-3 text-left font-semibold">Band</th>
                    <th className="px-4 py-3 text-left font-semibold">Triage Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Priority</th>
                    <th className="px-4 py-3 text-left font-semibold">Last Scored</th>
                    <th className="px-4 py-3 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.incidentId}
                      className="hover:bg-bg-hover transition-colors cursor-pointer"
                      onClick={() => fetchItemDetail(item.incidentId)}
                    >
                      <td className="px-4 py-3 font-mono text-text-primary">
                        {item.incidentId.slice(0, 12)}...
                      </td>
                      <td className="px-4 py-3">{item.incidentAge ?? "—"}</td>
                      <td className="px-4 py-3">
                        {item.score !== null ? (
                          <span className="font-semibold">{item.score.toFixed(0)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.band ? (
                          <Badge
                            className={`${BAND_COLORS[item.band]?.bg} ${BAND_COLORS[item.band]?.text}`}
                          >
                            {item.band.toUpperCase()}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{item.triageStatus.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {item.priorityOverride ? (
                          <span className="font-semibold text-accent-500">★ {item.priorityOverride}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {item.lastScoredAt ? (
                          <span className="text-xs">
                            {new Date(item.lastScoredAt).toLocaleDateString()}
                          </span>
                        ) : (
                          "Never"
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          fetchItemDetail(item.incidentId);
                        }}>
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      {selectedItem && (
        <Card className="border-accent-500 bg-bg-raised">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border-base pb-4">
            <div>
              <CardTitle className="text-accent-500">Incident Details</CardTitle>
              <CardDescription>{selectedItem.incidentId}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItem(null)}
            >
              ✕
            </Button>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Score & Rationale */}
            {selectedItem.score !== null && (
              <div className="space-y-3">
                <h3 className="font-semibold">Predictive Score</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-bg-card p-3 rounded border border-border-base">
                    <div className="text-text-secondary text-xs font-medium">SCORE</div>
                    <div className="text-2xl font-bold text-accent-500">
                      {selectedItem.score.toFixed(0)}
                    </div>
                  </div>
                  <div className="bg-bg-card p-3 rounded border border-border-base">
                    <div className="text-text-secondary text-xs font-medium">BAND</div>
                    <div className="text-lg font-semibold">{selectedItem.band?.toUpperCase()}</div>
                  </div>
                  <div className="bg-bg-card p-3 rounded border border-border-base">
                    <div className="text-text-secondary text-xs font-medium">AGE</div>
                    <div className="text-lg font-semibold">{selectedItem.incidentAge} min</div>
                  </div>
                </div>
                <div className="bg-bg-card p-4 rounded border border-border-subtle">
                  <p className="text-sm text-text-secondary">{selectedItem.rationale}</p>
                </div>
              </div>
            )}

            {/* Aggregate Features */}
            <div className="space-y-3">
              <h3 className="font-semibold">Aggregate Features</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: "Alerts (1h)", value: selectedItem.features?.alertCount1h },
                  { label: "Alerts (24h)", value: selectedItem.features?.alertCount24h },
                  { label: "Rules", value: selectedItem.features?.uniqueRuleCount },
                  { label: "Clusters", value: selectedItem.features?.correlationClusterCount },
                  { label: "Risk Score", value: selectedItem.features?.riskScoreLatest?.toFixed(2) },
                  { label: "Risk Delta", value: selectedItem.features?.riskDelta24h?.toFixed(2) },
                ].map((item, idx) => (
                  <div key={idx} className="bg-bg-card p-2 rounded border border-border-base">
                    <div className="text-text-secondary text-xs font-medium">{item.label}</div>
                    <div className="font-semibold">{item.value ?? "—"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Narrative (if available) */}
            {selectedItem.narrative && (
              <div className="space-y-3 border-t border-border-base pt-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">AI Narrative</h3>
                  <Badge variant={selectedItem.narrative.source === "ai" ? "default" : "outline"}>
                    {selectedItem.narrative.source === "ai" ? "AI-Generated" : "Deterministic"}
                  </Badge>
                </div>
                <div className="bg-bg-card p-4 rounded border border-border-subtle space-y-3">
                  <p className="text-sm">{selectedItem.narrative.summary}</p>
                  {selectedItem.narrative.likelyDrivers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-secondary mb-2">Likely Drivers:</p>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        {selectedItem.narrative.likelyDrivers.map((driver, idx) => (
                          <li key={idx}>{driver}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedItem.narrative.nextSteps.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-secondary mb-2">Next Steps:</p>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        {selectedItem.narrative.nextSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Triage Editing */}
            <div className="space-y-3 border-t border-border-base pt-4">
              <h3 className="font-semibold">Triage State</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Triage Status</label>
                  <Select value={editingTriageStatus} onValueChange={setEditingTriageStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIAGE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, " ").toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Priority Override (1-5)</label>
                  <Select
                    value={editingPriority?.toString() || ""}
                    onValueChange={(val) => setEditingPriority(val ? parseInt(val) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {[1, 2, 3, 4, 5].map((p) => (
                        <SelectItem key={p} value={p.toString()}>
                          Priority {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    placeholder="Internal triage notes..."
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-border-base rounded bg-bg-card text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-500"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleUpdateTriage}
                  disabled={updateLoading}
                  className="w-full bg-accent-500 hover:bg-accent-600"
                >
                  {updateLoading ? "Updating..." : "Update Triage State"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
