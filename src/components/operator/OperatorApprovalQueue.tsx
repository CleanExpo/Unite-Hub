"use client";

/**
 * Operator Approval Queue - Phase 10 Week 1-2
 *
 * UI component for reviewing and approving proposals.
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  XCircle,
  ArrowUpCircle,
  Eye,
  User,
} from "lucide-react";

interface QueueItem {
  id: string;
  proposal_id: string;
  status: string;
  priority: number;
  assigned_to?: string;
  expires_at: string;
  created_at: string;
  autonomy_proposals?: {
    id: string;
    domain: string;
    change_type: string;
    risk_level: string;
    rationale: string;
    proposed_diff: Record<string, any>;
  };
}

interface QueueStats {
  total: number;
  pending: number;
  assigned: number;
  approved: number;
  rejected: number;
  escalated: number;
  expired: number;
  average_resolution_time_ms: number;
}

interface OperatorProfile {
  id: string;
  role: string;
  can_approve_low: boolean;
  can_approve_medium: boolean;
  can_approve_high: boolean;
  approvals_today: number;
  daily_approval_limit: number;
}

interface OperatorApprovalQueueProps {
  organizationId: string;
}

export function OperatorApprovalQueue({
  organizationId,
}: OperatorApprovalQueueProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [operator, setOperator] = useState<OperatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [resolveAction, setResolveAction] = useState<"approve" | "reject" | "escalate">("approve");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, [organizationId]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/operator/queue?organization_id=${organizationId}&my_queue=true`
      );
      const data = await response.json();

      setQueue(data.queue || []);
      setStats(data.stats || null);
      setOperator(data.operator || null);
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedItem) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/operator/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queue_item_id: selectedItem.id,
          action: resolveAction,
          notes,
          reason: resolveAction === "escalate" ? notes : undefined,
        }),
      });

      if (response.ok) {
        setShowResolve(false);
        setNotes("");
        setSelectedItem(null);
        fetchQueue();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to process");
      }
    } catch (error) {
      console.error("Failed to resolve:", error);
    } finally {
      setProcessing(false);
    }
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

  const getPriorityBadge = (priority: number) => {
    if (priority >= 8) return <Badge className="bg-red-500">Urgent</Badge>;
    if (priority >= 5) return <Badge className="bg-yellow-500">Normal</Badge>;
    return <Badge className="bg-gray-500">Low</Badge>;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (remaining < 0) return "Expired";
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const canApprove = (riskLevel: string) => {
    if (!operator) return false;
    switch (riskLevel) {
      case "LOW":
        return operator.can_approve_low;
      case "MEDIUM":
        return operator.can_approve_medium;
      case "HIGH":
        return operator.can_approve_high;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            Approval Queue
          </h2>
          <p className="text-muted-foreground">
            {queue.length} items awaiting your review
          </p>
        </div>
        <Button onClick={fetchQueue} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {stats.approved}
              </div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {stats.rejected}
              </div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {Math.round(stats.average_resolution_time_ms / 60000)}m
              </div>
              <div className="text-sm text-muted-foreground">Avg Resolution</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Operator Info */}
      {operator && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {operator.role}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {operator.approvals_today}/{operator.daily_approval_limit} approvals today
                </span>
              </div>
              <div className="flex gap-2">
                {operator.can_approve_low && (
                  <Badge variant="outline" className="bg-green-50">LOW</Badge>
                )}
                {operator.can_approve_medium && (
                  <Badge variant="outline" className="bg-yellow-50">MEDIUM</Badge>
                )}
                {operator.can_approve_high && (
                  <Badge variant="outline" className="bg-red-50">HIGH</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Table */}
      <Card>
        <CardContent className="pt-6">
          {queue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No items in your queue</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Change Type</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.autonomy_proposals?.domain}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.autonomy_proposals?.change_type}
                    </TableCell>
                    <TableCell>
                      {getRiskBadge(item.autonomy_proposals?.risk_level || "")}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(item.expires_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canApprove(item.autonomy_proposals?.risk_level || "") ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setResolveAction("approve");
                                setShowResolve(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedItem(item);
                                setResolveAction("reject");
                                setShowResolve(true);
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(item);
                              setResolveAction("escalate");
                              setShowResolve(true);
                            }}
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proposal Details</DialogTitle>
          </DialogHeader>
          {selectedItem?.autonomy_proposals && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Domain</label>
                  <p>{selectedItem.autonomy_proposals.domain}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Change Type</label>
                  <p className="font-mono">
                    {selectedItem.autonomy_proposals.change_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Risk Level</label>
                  <p>{getRiskBadge(selectedItem.autonomy_proposals.risk_level)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <p>{getPriorityBadge(selectedItem.priority)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Rationale</label>
                <p className="text-sm text-muted-foreground">
                  {selectedItem.autonomy_proposals.rationale}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Proposed Changes</label>
                <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(
                    selectedItem.autonomy_proposals.proposed_diff,
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolve} onOpenChange={setShowResolve}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolveAction === "approve" && "Approve Proposal"}
              {resolveAction === "reject" && "Reject Proposal"}
              {resolveAction === "escalate" && "Escalate Proposal"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {resolveAction === "escalate" ? (
              <div>
                <label className="text-sm font-medium">Escalation Reason *</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Why are you escalating this proposal?"
                  rows={3}
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about your decision..."
                  rows={3}
                />
              </div>
            )}

            {resolveAction === "approve" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                This will approve the proposal for execution.
              </div>
            )}

            {resolveAction === "reject" && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                This will permanently reject the proposal.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolve(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={processing || (resolveAction === "escalate" && !notes)}
              variant={resolveAction === "reject" ? "destructive" : "default"}
            >
              {processing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {resolveAction === "approve" && "Approve"}
              {resolveAction === "reject" && "Reject"}
              {resolveAction === "escalate" && "Escalate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OperatorApprovalQueue;
