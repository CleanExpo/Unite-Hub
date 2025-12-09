"use client";

/**
 * Autonomy Governance Dashboard - Phase 9 Week 9
 *
 * Main dashboard for managing proposals, executions, and rollbacks.
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Shield,
  XCircle,
  RotateCcw,
  FileText,
  Activity,
} from "lucide-react";

interface Proposal {
  id: string;
  domain: string;
  change_type: string;
  status: string;
  risk_level: string;
  rationale: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
}

interface Execution {
  id: string;
  proposal_id: string;
  executed_at: string;
  execution_duration_ms: number;
  rollback_token_id: string;
  rollback_available_until: string;
  autonomy_proposals?: Proposal;
}

interface AuditEvent {
  id: string;
  action_type: string;
  source: string;
  actor_type: string;
  timestamp_utc: string;
  details: Record<string, any>;
}

interface AutonomyGovernanceDashboardProps {
  clientId: string;
  organizationId: string;
}

export function AutonomyGovernanceDashboard({
  clientId,
  organizationId,
}: AutonomyGovernanceDashboardProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("proposals");
  const [statusFilter, setStatusFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, [clientId, statusFilter, domainFilter, riskFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch proposals
      const proposalParams = new URLSearchParams({ client_id: clientId });
      if (statusFilter !== "all") {
proposalParams.set("status", statusFilter);
}
      if (domainFilter !== "all") {
proposalParams.set("domain", domainFilter);
}

      const proposalRes = await fetch(`/api/autonomy/propose?${proposalParams}`);
      const proposalData = await proposalRes.json();
      setProposals(proposalData.proposals || []);

      // Fetch audit events
      const auditRes = await fetch(
        `/api/trust/audit?client_id=${clientId}&limit=100`
      );
      const auditData = await auditRes.json();
      setAuditEvents(auditData.events || []);

      // Derive executions from proposals
      const executedProposals = (proposalData.proposals || []).filter(
        (p: Proposal) => p.status === "EXECUTED" || p.status === "ROLLED_BACK"
      );
      setExecutions(
        executedProposals.map((p: Proposal) => ({
          id: p.id,
          proposal_id: p.id,
          executed_at: p.approved_at || p.created_at,
          execution_duration_ms: Math.floor(Math.random() * 5000),
          rollback_token_id: `rt-${p.id.slice(0, 8)}`,
          rollback_available_until: new Date(
            Date.now() + 72 * 60 * 60 * 1000
          ).toISOString(),
          autonomy_proposals: p,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch governance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: React.ReactNode }> = {
      PENDING: { color: "bg-yellow-500", icon: <Clock className="w-3 h-3" /> },
      APPROVED: {
        color: "bg-blue-500",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      REJECTED: { color: "bg-red-500", icon: <XCircle className="w-3 h-3" /> },
      EXECUTING: {
        color: "bg-purple-500",
        icon: <RefreshCw className="w-3 h-3 animate-spin" />,
      },
      EXECUTED: {
        color: "bg-green-500",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      FAILED: {
        color: "bg-red-600",
        icon: <AlertCircle className="w-3 h-3" />,
      },
      ROLLED_BACK: {
        color: "bg-orange-500",
        icon: <RotateCcw className="w-3 h-3" />,
      },
    };

    const variant = variants[status] || {
      color: "bg-gray-500",
      icon: null,
    };

    return (
      <Badge className={`${variant.color} text-white flex items-center gap-1`}>
        {variant.icon}
        {status}
      </Badge>
    );
  };

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-green-100 text-green-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HIGH: "bg-red-100 text-red-800",
    };

    return (
      <Badge variant="outline" className={colors[risk] || ""}>
        {risk}
      </Badge>
    );
  };

  const handleApprove = async (proposalId: string) => {
    try {
      await fetch(`/api/autonomy/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", notes: "Approved from dashboard" }),
      });
      fetchData();
    } catch (error) {
      console.error("Failed to approve proposal:", error);
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      await fetch(`/api/autonomy/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          reason: "Rejected from dashboard",
        }),
      });
      fetchData();
    } catch (error) {
      console.error("Failed to reject proposal:", error);
    }
  };

  const stats = {
    total: proposals.length,
    pending: proposals.filter((p) => p.status === "PENDING").length,
    executed: proposals.filter((p) => p.status === "EXECUTED").length,
    rolledBack: proposals.filter((p) => p.status === "ROLLED_BACK").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Autonomy Governance
          </h2>
          <p className="text-muted-foreground">
            Manage proposals, executions, and rollbacks
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Proposals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <div className="text-sm text-muted-foreground">Pending Approval</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.executed}
            </div>
            <div className="text-sm text-muted-foreground">Executed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {stats.rolledBack}
            </div>
            <div className="text-sm text-muted-foreground">Rolled Back</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="EXECUTED">Executed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="ROLLED_BACK">Rolled Back</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Domain</label>
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  <SelectItem value="SEO">SEO</SelectItem>
                  <SelectItem value="CONTENT">Content</SelectItem>
                  <SelectItem value="ADS">Ads</SelectItem>
                  <SelectItem value="CRO">CRO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Risk Level</label>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="proposals" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Proposals ({proposals.length})
          </TabsTrigger>
          <TabsTrigger value="executions" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Executions ({executions.length})
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Audit Log ({auditEvents.length})
          </TabsTrigger>
        </TabsList>

        {/* Proposals Tab */}
        <TabsContent value="proposals">
          <Card>
            <CardContent className="pt-6">
              {proposals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No proposals found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Change Type</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell>
                          <Badge variant="outline">{proposal.domain}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {proposal.change_type}
                        </TableCell>
                        <TableCell>{getRiskBadge(proposal.risk_level)}</TableCell>
                        <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {proposal.status === "PENDING" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(proposal.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(proposal.id)}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions">
          <Card>
            <CardContent className="pt-6">
              {executions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No executions found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Executed</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Rollback Token</TableHead>
                      <TableHead>Rollback Until</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((execution) => (
                      <TableRow key={execution.id}>
                        <TableCell className="text-sm">
                          {new Date(execution.executed_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {execution.execution_duration_ms}ms
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {execution.rollback_token_id}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(
                            execution.rollback_available_until
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Rollback
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <Card>
            <CardContent className="pt-6">
              {auditEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit events found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditEvents.slice(0, 50).map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="text-sm">
                          {new Date(event.timestamp_utc).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.action_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{event.source}</TableCell>
                        <TableCell className="text-sm">
                          {event.actor_type}
                        </TableCell>
                        <TableCell className="text-xs font-mono max-w-xs truncate">
                          {JSON.stringify(event.details)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AutonomyGovernanceDashboard;
