"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Loader2,
  RefreshCw,
  Waves,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ApprovalRequest } from "@/lib/approval/approvalTypes";

export default function FounderApprovalsPage() {
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    setLoading(true);
    try {
      // TODO: Get business_id from context/session
      const res = await fetch("/api/client-approvals?status=pending_review");
      if (!res.ok) {
throw new Error("Failed to load approvals");
}
      const data = await res.json();
      setApprovals(data);
    } catch (error) {
      console.error("Failed to load approvals:", error);
      toast({
        title: "Error",
        description: "Failed to load approvals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(
    id: string,
    action: "approve" | "reject" | "needs_changes",
    notes?: string
  ) {
    setActionLoading(id);
    try {
      const status =
        action === "approve"
          ? "approved"
          : action === "reject"
          ? "rejected"
          : "needs_changes";

      const res = await fetch("/api/client-approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, reviewer_notes: notes }),
      });

      if (!res.ok) {
throw new Error("Failed to update approval");
}

      toast({
        title: "Success",
        description: `Approval ${status}`,
      });

      // Reload approvals
      loadApprovals();
    } catch (error) {
      console.error("Action error:", error);
      toast({
        title: "Error",
        description: "Failed to update approval",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return (
          <Badge variant="outline" className="bg-warning-100 text-warning-800">
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-success-100 text-success-800">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-error-100 text-error-800">
            Rejected
          </Badge>
        );
      case "needs_changes":
        return (
          <Badge variant="outline" className="bg-accent-100 text-accent-800">
            Needs Changes
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Waves className="w-8 h-8 text-primary" />
            Client Approvals & Strategy
          </h1>
          <p className="text-muted-foreground mt-1">
            All proposed SEO, content, schema, Boost Bump, ads and automation
            changes must pass through this human-governed queue before going
            live.
          </p>
        </div>
        <Button variant="outline" onClick={loadApprovals}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {approvals.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending approvals. All caught up!</p>
            </CardContent>
          </Card>
        )}

        {approvals.map((approval) => (
          <Card key={approval.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{approval.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Source: {approval.source}
                  </p>
                </div>
                {getStatusBadge(approval.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{approval.description}</p>

              {/* Raw Data Payload */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-info-600 hover:text-info-800">
                  <ChevronDown className="w-3 h-3" />
                  Raw data payload
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(approval.data, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>

              {/* Strategy Options */}
              {approval.strategy_options && (
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
                    <ChevronDown className="w-3 h-3" />
                    Strategy Options (Conservative / Aggressive / Blue Ocean /
                    Data-Driven)
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(approval.strategy_options, null, 2)}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <Separator />

              {/* Action Buttons */}
              {approval.status === "pending_review" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-success-600 hover:bg-success-700"
                    onClick={() => handleAction(approval.id, "approve")}
                    disabled={actionLoading === approval.id}
                  >
                    {actionLoading === approval.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    )}
                    Approve & Queue for Execution
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-warning-600 text-warning-600 hover:bg-warning-50"
                    onClick={() =>
                      handleAction(
                        approval.id,
                        "needs_changes",
                        "Please review and adjust"
                      )
                    }
                    disabled={actionLoading === approval.id}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Request Changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-error-600 text-error-600 hover:bg-error-50"
                    onClick={() => handleAction(approval.id, "reject")}
                    disabled={actionLoading === approval.id}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
