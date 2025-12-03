/**
 * Risk Opportunity Panel - Cognitive Twin
 *
 * Split panel showing risks and opportunities with severity badges,
 * filters by domain/severity/status, and bulk actions.
 */

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  TrendingUp,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Archive,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskItem {
  id: string;
  title: string;
  description: string;
  domain: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "monitoring" | "resolved" | "dismissed";
  probability: number; // 0-100
  impact_score: number; // 0-100
  identified_at: string;
  mitigation_plan?: string;
}

interface OpportunityItem {
  id: string;
  title: string;
  description: string;
  domain: string;
  impact: "high" | "medium" | "low";
  status: "identified" | "evaluating" | "pursuing" | "completed" | "dismissed";
  potential_value: number; // 0-100
  effort_required: "low" | "medium" | "high";
  identified_at: string;
  action_plan?: string;
}

interface RiskOpportunityPanelProps {
  risks: RiskItem[];
  opportunities: OpportunityItem[];
  onStatusChange?: (id: string, type: "risk" | "opportunity", newStatus: string) => void;
  onBulkAction?: (ids: string[], type: "risk" | "opportunity", action: string) => void;
  isLoading?: boolean;
  error?: string;
}

export default function RiskOpportunityPanel({
  risks,
  opportunities,
  onStatusChange,
  onBulkAction,
  isLoading = false,
  error,
}: RiskOpportunityPanelProps) {
  // Filters state
  const [riskDomain, setRiskDomain] = useState<string>("all");
  const [riskSeverity, setRiskSeverity] = useState<string>("all");
  const [riskStatus, setRiskStatus] = useState<string>("all");

  const [oppDomain, setOppDomain] = useState<string>("all");
  const [oppImpact, setOppImpact] = useState<string>("all");
  const [oppStatus, setOppStatus] = useState<string>("all");

  // Selected items
  const [selectedRisks, setSelectedRisks] = useState<Set<string>>(new Set());
  const [selectedOpps, setSelectedOpps] = useState<Set<string>>(new Set());

  // Extract unique domains
  const domains = useMemo(() => {
    const allDomains = new Set([
      ...risks.map(r => r.domain),
      ...opportunities.map(o => o.domain),
    ]);
    return Array.from(allDomains).sort();
  }, [risks, opportunities]);

  // Filtered risks
  const filteredRisks = useMemo(() => {
    return risks.filter(risk => {
      if (riskDomain !== "all" && risk.domain !== riskDomain) return false;
      if (riskSeverity !== "all" && risk.severity !== riskSeverity) return false;
      if (riskStatus !== "all" && risk.status !== riskStatus) return false;
      return true;
    });
  }, [risks, riskDomain, riskSeverity, riskStatus]);

  // Filtered opportunities
  const filteredOpps = useMemo(() => {
    return opportunities.filter(opp => {
      if (oppDomain !== "all" && opp.domain !== oppDomain) return false;
      if (oppImpact !== "all" && opp.impact !== oppImpact) return false;
      if (oppStatus !== "all" && opp.status !== oppStatus) return false;
      return true;
    });
  }, [opportunities, oppDomain, oppImpact, oppStatus]);

  // Toggle selection
  const toggleRiskSelection = (id: string) => {
    const newSet = new Set(selectedRisks);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRisks(newSet);
  };

  const toggleOppSelection = (id: string) => {
    const newSet = new Set(selectedOpps);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedOpps(newSet);
  };

  // Select all
  const selectAllRisks = () => {
    setSelectedRisks(new Set(filteredRisks.map(r => r.id)));
  };

  const selectAllOpps = () => {
    setSelectedOpps(new Set(filteredOpps.map(o => o.id)));
  };

  // Clear selection
  const clearRiskSelection = () => setSelectedRisks(new Set());
  const clearOppSelection = () => setSelectedOpps(new Set());

  // Get severity badge variant
  const getSeverityVariant = (severity: string): "danger" | "warning" | "default" => {
    if (severity === "critical" || severity === "high") return "danger";
    if (severity === "medium") return "warning";
    return "default";
  };

  // Get impact badge variant
  const getImpactVariant = (impact: string): "success" | "warning" | "default" => {
    if (impact === "high") return "success";
    if (impact === "medium") return "warning";
    return "default";
  };

  // Get status icon
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "resolved":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "monitoring":
      case "evaluating":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "dismissed":
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-bg-hover rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-bg-hover rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-bg-hover rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-bg-hover rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="bordered" className="border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">Error Loading Data</p>
              <p className="text-sm text-text-secondary">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* RISKS PANEL */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Risks
                <Badge variant="danger">{filteredRisks.length}</Badge>
              </CardTitle>

              {selectedRisks.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{selectedRisks.size} selected</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBulkAction?.(Array.from(selectedRisks), "risk", "resolve")}
                  >
                    Resolve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBulkAction?.(Array.from(selectedRisks), "risk", "dismiss")}
                  >
                    Dismiss
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearRiskSelection}>
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Select value={riskDomain} onValueChange={setRiskDomain}>
                <SelectTrigger>
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {domains.map(domain => (
                    <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={riskSeverity} onValueChange={setRiskSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={riskStatus} onValueChange={setRiskStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredRisks.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={selectAllRisks}>
                  Select All
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredRisks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No risks found</p>
              </div>
            ) : (
              filteredRisks.map(risk => (
                <Card
                  key={risk.id}
                  variant={selectedRisks.has(risk.id) ? "bordered" : "flat"}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedRisks.has(risk.id) && "ring-2 ring-blue-500"
                  )}
                  onClick={() => toggleRiskSelection(risk.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{risk.title}</h4>
                        <p className="text-sm text-text-secondary mt-1">
                          {risk.description}
                        </p>
                      </div>
                      <StatusIcon status={risk.status} />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      <Badge size="sm" variant="outline">{risk.domain}</Badge>
                      <Badge size="sm" variant={getSeverityVariant(risk.severity)}>
                        {risk.severity.toUpperCase()}
                      </Badge>
                      <Badge size="sm" variant="default">
                        {risk.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border-subtle">
                      <div className="text-xs">
                        <span className="text-gray-500">Probability:</span>{" "}
                        <span className="font-semibold">{risk.probability}%</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500">Impact:</span>{" "}
                        <span className="font-semibold">{risk.impact_score}/100</span>
                      </div>
                    </div>

                    {risk.mitigation_plan && (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                        <strong>Mitigation:</strong> {risk.mitigation_plan}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* OPPORTUNITIES PANEL */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-500" />
                Opportunities
                <Badge variant="success">{filteredOpps.length}</Badge>
              </CardTitle>

              {selectedOpps.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{selectedOpps.size} selected</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBulkAction?.(Array.from(selectedOpps), "opportunity", "pursue")}
                  >
                    Pursue
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBulkAction?.(Array.from(selectedOpps), "opportunity", "dismiss")}
                  >
                    Dismiss
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearOppSelection}>
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Select value={oppDomain} onValueChange={setOppDomain}>
                <SelectTrigger>
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {domains.map(domain => (
                    <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={oppImpact} onValueChange={setOppImpact}>
                <SelectTrigger>
                  <SelectValue placeholder="Impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Impacts</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={oppStatus} onValueChange={setOppStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="identified">Identified</SelectItem>
                  <SelectItem value="evaluating">Evaluating</SelectItem>
                  <SelectItem value="pursuing">Pursuing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredOpps.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={selectAllOpps}>
                  Select All
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredOpps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No opportunities found</p>
              </div>
            ) : (
              filteredOpps.map(opp => (
                <Card
                  key={opp.id}
                  variant={selectedOpps.has(opp.id) ? "bordered" : "flat"}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedOpps.has(opp.id) && "ring-2 ring-blue-500"
                  )}
                  onClick={() => toggleOppSelection(opp.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{opp.title}</h4>
                        <p className="text-sm text-text-secondary mt-1">
                          {opp.description}
                        </p>
                      </div>
                      <StatusIcon status={opp.status} />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      <Badge size="sm" variant="outline">{opp.domain}</Badge>
                      <Badge size="sm" variant={getImpactVariant(opp.impact)}>
                        {opp.impact.toUpperCase()} IMPACT
                      </Badge>
                      <Badge size="sm" variant="default">
                        {opp.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border-subtle">
                      <div className="text-xs">
                        <span className="text-gray-500">Value:</span>{" "}
                        <span className="font-semibold">{opp.potential_value}/100</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500">Effort:</span>{" "}
                        <span className="font-semibold capitalize">{opp.effort_required}</span>
                      </div>
                    </div>

                    {opp.action_plan && (
                      <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 rounded text-xs">
                        <strong>Action Plan:</strong> {opp.action_plan}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
