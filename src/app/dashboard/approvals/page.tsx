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
import { useWorkspace } from "@/hooks/useWorkspace";
import { Breadcrumbs } from "@/components/Breadcrumbs";

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

  const { user } = useAuth();
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const userId = user?.id || null;

  // Fetch all approvals
  const { approvals: allApprovals, loading, error, approve, decline, refresh } = useApprovals({ orgId: workspaceId });

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
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Approvals" }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Approvals
          </h1>
          <p className="text-slate-400">Review and approve content submissions</p>
        </div>

        {pendingApprovals.length > 0 && (
          <Button
            onClick={handleApproveAll}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-500/50 gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Approve All ({pendingApprovals.length})
          </Button>
        )}
      </div>
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-slate-400">Loading approvals...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-300">Error Loading Approvals</h3>
              <p className="text-sm text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading */}
      {!loading && !error && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-8 w-8 text-orange-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-slate-400 text-sm font-medium">Pending</h3>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                {pendingApprovals.length}
              </p>
              <p className="text-slate-500 text-xs mt-2">Awaiting review</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="h-8 w-8 text-green-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-slate-400 text-sm font-medium">Approved Today</h3>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {approved.filter((a) => a.approvedAt?.includes("Today") || a.approvedAt?.includes("Just now")).length}
              </p>
              <p className="text-slate-500 text-xs mt-2">{approved.length} total</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <XCircle className="h-8 w-8 text-red-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-slate-400 text-sm font-medium">Declined</h3>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                {declined.length}
              </p>
              <p className="text-slate-500 text-xs mt-2">Needs revision</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-8 w-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-slate-400 text-sm font-medium">High Priority</h3>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {pendingApprovals.filter((a) => a.priority === "high").length}
              </p>
              <p className="text-slate-500 text-xs mt-2">Review first</p>
            </div>
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
                    <button
                      onClick={() => setPriorityFilter("all")}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        priorityFilter === "all"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50"
                          : "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setPriorityFilter("high")}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        priorityFilter === "high"
                          ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/50"
                          : "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                      }`}
                    >
                      High Priority
                    </button>
                    <button
                      onClick={() => setPriorityFilter("medium")}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        priorityFilter === "medium"
                          ? "bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg shadow-yellow-500/50"
                          : "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => setPriorityFilter("low")}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        priorityFilter === "low"
                          ? "bg-gradient-to-r from-slate-600 to-gray-600 text-white shadow-lg shadow-slate-500/50"
                          : "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                      }`}
                    >
                      Low
                    </button>
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
                <div className="text-center py-12 bg-slate-800/50 backdrop-blur-sm rounded-lg border-2 border-dashed border-slate-700/50">
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">All caught up!</h3>
                  <p className="text-sm text-slate-400">No pending approvals at the moment.</p>
                </div>
              )}
            </TabsContent>

            {/* Approved Tab */}
            <TabsContent value="approved">
              {approved.length > 0 ? (
                <div className="space-y-4">
                  {approved.map((item) => (
                    <div key={item.id} className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4 hover:border-green-500/50 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                          <p className="text-sm text-slate-300 mb-2">{item.client}</p>
                          <p className="text-xs text-slate-500">
                            Submitted by {item.submittedBy.name} • Approved {item.approvedAt}
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800/50 backdrop-blur-sm rounded-lg border-2 border-dashed border-slate-700/50">
                  <CheckCircle className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-400 mb-2">No approved items yet</h3>
                  <p className="text-sm text-slate-500">Approved items will appear here.</p>
                </div>
              )}
            </TabsContent>

            {/* Declined Tab */}
            <TabsContent value="declined">
              {declined.length > 0 ? (
                <div className="space-y-4">
                  {declined.map((item) => (
                    <div key={item.id} className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-red-500/30 p-4 hover:border-red-500/50 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                          <p className="text-sm text-slate-300 mb-2">{item.client}</p>
                          {item.reason && (
                            <p className="text-sm text-red-400 mb-2">
                              <strong>Reason:</strong> {item.reason}
                            </p>
                          )}
                          <p className="text-xs text-slate-500">
                            Submitted by {item.submittedBy.name} • Declined {item.declinedAt}
                          </p>
                        </div>
                        <XCircle className="h-5 w-5 text-red-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800/50 backdrop-blur-sm rounded-lg border-2 border-dashed border-slate-700/50">
                  <XCircle className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-400 mb-2">No declined items</h3>
                  <p className="text-sm text-slate-500">Declined items will appear here.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
