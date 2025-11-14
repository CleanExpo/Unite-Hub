"use client";

import React, { useState, useMemo } from "react";
import { ModernSidebar } from "@/components/layout/ModernSidebar";
import { ApprovalCard } from "@/components/dashboard/ApprovalCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useApprovals } from "@/hooks/useApprovals";
import { useAuth } from "@/contexts/AuthContext";

// Helper function to format submission time
const formatSubmissionTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

// Helper function to format reviewed time
const formatReviewedTime = (dateString: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `Today at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  if (diffHours < 48) return `Yesterday at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Transform database approval to UI format
const transformApproval = (approval: any) => {
  return {
    id: approval.id,
    type: approval.type as "design" | "content" | "video" | "document",
    title: approval.title,
    client: approval.client_name,
    submittedBy: {
      name: approval.submitted_by_name || "Unknown",
      initials: approval.submitted_by_initials || "UN",
    },
    submittedAt: formatSubmissionTime(approval.created_at),
    priority: approval.priority as "high" | "medium" | "low",
    description: approval.description || "",
    status: approval.status as "pending" | "approved" | "declined",
    approvedAt: approval.reviewed_at ? formatReviewedTime(approval.reviewed_at) : undefined,
    declinedAt: approval.reviewed_at ? formatReviewedTime(approval.reviewed_at) : undefined,
    reason: approval.decline_reason || undefined,
  };
};

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const { user, currentOrganization } = useAuth();
  const orgId = currentOrganization?.org_id || null;
  const userId = user?.id || null;

  // Fetch all approvals
  const { approvals: allApprovals, loading, error, approve, decline, refresh } = useApprovals({ orgId });

  // Transform and categorize approvals
  const transformedApprovals = useMemo(() => allApprovals.map(transformApproval), [allApprovals]);

  const pendingApprovals = useMemo(
    () => transformedApprovals.filter((a) => a.status === "pending"),
    [transformedApprovals]
  );

  const approved = useMemo(
    () => transformedApprovals.filter((a) => a.status === "approved"),
    [transformedApprovals]
  );

  const declined = useMemo(
    () => transformedApprovals.filter((a) => a.status === "declined"),
    [transformedApprovals]
  );

  const handleApprove = async (id: string) => {
    if (!userId) return;
    try {
      await approve(id, userId);
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  const handleDecline = async (id: string) => {
    if (!userId) return;
    try {
      await decline(id, userId, "Needs revisions");
    } catch (err) {
      console.error("Failed to decline:", err);
    }
  };

  const handleApproveAll = async () => {
    if (!userId) return;
    try {
      await Promise.all(pendingApprovals.map((a) => approve(a.id, userId)));
    } catch (err) {
      console.error("Failed to approve all:", err);
    }
  };

  const getFilteredApprovals = (approvalList: typeof pendingApprovals) => {
    if (priorityFilter === "all") return approvalList;
    return approvalList.filter((a) => a.priority === priorityFilter);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ModernSidebar userRole="owner" />

      <div className="flex-1 ml-[280px]">
        {/* Header */}
        <header className="h-[70px] bg-white border-b border-gray-200 flex items-center px-8 gap-6">
          <h1 className="text-2xl font-bold text-unite-navy">Approvals</h1>

          <div className="flex-1" />

          {pendingApprovals.length > 0 && (
            <Button
              onClick={handleApproveAll}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white gap-2 hover:opacity-90"
            >
              <CheckCircle className="h-4 w-4" />
              Approve All ({pendingApprovals.length})
            </Button>
          )}
        </header>

        {/* Content */}
        <main className="p-8">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-unite-teal mx-auto mb-4" />
                <p className="text-gray-600">Loading approvals...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Error Loading Approvals</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content - Only show when not loading */}
          {!loading && !error && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Pending"
              value={pendingApprovals.length.toString()}
              trend={{ value: "Awaiting review", label: "requires attention" }}
              icon={Clock}
              variant="orange"
            />
            <StatsCard
              title="Approved Today"
              value={approved.filter((a) => a.approvedAt?.includes("Today") || a.approvedAt?.includes("Just now")).length.toString()}
              trend={{ value: `${approved.length} total`, label: "all time" }}
              icon={CheckCircle}
              variant="teal"
            />
            <StatsCard
              title="Declined"
              value={declined.length.toString()}
              trend={{ value: "Needs revision", label: "feedback sent" }}
              icon={XCircle}
              variant="blue"
            />
            <StatsCard
              title="High Priority"
              value={pendingApprovals.filter((a) => a.priority === "high").length.toString()}
              trend={{ value: "Urgent", label: "review first" }}
              icon={AlertCircle}
              variant="gold"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="pending">
                Pending ({pendingApprovals.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approved.length})
              </TabsTrigger>
              <TabsTrigger value="declined">
                Declined ({declined.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Tab */}
            <TabsContent value="pending">
              {pendingApprovals.length > 0 ? (
                <>
                  {/* Priority Filter */}
                  <div className="flex gap-2 mb-6">
                    <Button
                      size="sm"
                      variant={priorityFilter === "all" ? "default" : "outline"}
                      onClick={() => setPriorityFilter("all")}
                      className={priorityFilter === "all" ? "bg-unite-teal hover:bg-unite-teal/90 text-white" : ""}
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant={priorityFilter === "high" ? "default" : "outline"}
                      onClick={() => setPriorityFilter("high")}
                      className={priorityFilter === "high" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                    >
                      High Priority
                    </Button>
                    <Button
                      size="sm"
                      variant={priorityFilter === "medium" ? "default" : "outline"}
                      onClick={() => setPriorityFilter("medium")}
                      className={priorityFilter === "medium" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : ""}
                    >
                      Medium
                    </Button>
                    <Button
                      size="sm"
                      variant={priorityFilter === "low" ? "default" : "outline"}
                      onClick={() => setPriorityFilter("low")}
                      className={priorityFilter === "low" ? "bg-gray-600 hover:bg-gray-700 text-white" : ""}
                    >
                      Low
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {getFilteredApprovals(pendingApprovals).map((approval) => (
                      <ApprovalCard
                        key={approval.id}
                        approval={approval}
                        onApprove={handleApprove}
                        onDecline={handleDecline}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">All caught up!</h3>
                  <p className="text-sm text-gray-500">No pending approvals at the moment.</p>
                </div>
              )}
            </TabsContent>

            {/* Approved Tab */}
            <TabsContent value="approved">
              {approved.length > 0 ? (
                <div className="space-y-4">
                  {approved.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-unite-navy mb-1">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{item.client}</p>
                          <p className="text-xs text-gray-500">
                            Submitted by {item.submittedBy.name} • Approved {item.approvedAt}
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No approved items yet</h3>
                  <p className="text-sm text-gray-500">Approved items will appear here.</p>
                </div>
              )}
            </TabsContent>

            {/* Declined Tab */}
            <TabsContent value="declined">
              {declined.length > 0 ? (
                <div className="space-y-4">
                  {declined.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg border border-red-200 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-unite-navy mb-1">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{item.client}</p>
                          {item.reason && (
                            <p className="text-sm text-red-600 mb-2">
                              <strong>Reason:</strong> {item.reason}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Submitted by {item.submittedBy.name} • Declined {item.declinedAt}
                          </p>
                        </div>
                        <XCircle className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <XCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No declined items</h3>
                  <p className="text-sm text-gray-500">Declined items will appear here.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
