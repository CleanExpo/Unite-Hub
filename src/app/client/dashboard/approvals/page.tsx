"use client";

/**
 * Client Approvals Dashboard
 * Phase 35: Integrity Framework
 *
 * Review and approve/reject AI-generated content
 */

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Filter, Cpu } from "lucide-react";
import AIModelBadge from "@/components/ui/visual/AIModelBadge";
import type { AIModel } from "@/components/ui/visual/AIModelBadge";

interface ApprovalItem {
  id: string;
  item_type: string;
  item_id: string;
  status: "pending" | "approved" | "rejected";
  model_used: string;
  description: string | null;
  generated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    // Mock data for now - would call API
    setApprovals([
      {
        id: "1",
        item_type: "concept",
        item_id: "abc123",
        status: "pending",
        model_used: "openai",
        description: "Homepage wireframe concept",
        generated_at: new Date().toISOString(),
        approved_at: null,
        rejected_at: null,
      },
      {
        id: "2",
        item_type: "video",
        item_id: "def456",
        status: "pending",
        model_used: "veo3",
        description: "Product showcase video concept",
        generated_at: new Date(Date.now() - 86400000).toISOString(),
        approved_at: null,
        rejected_at: null,
      },
    ]);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setApprovals((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "approved", approved_at: new Date().toISOString() }
          : item
      )
    );
  };

  const handleReject = async (id: string) => {
    setApprovals((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "rejected", rejected_at: new Date().toISOString() }
          : item
      )
    );
  };

  const filteredApprovals = approvals.filter((item) =>
    filter === "all" ? true : item.status === filter
  );

  const counts = {
    pending: approvals.filter((a) => a.status === "pending").length,
    approved: approvals.filter((a) => a.status === "approved").length,
    rejected: approvals.filter((a) => a.status === "rejected").length,
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Approval Inbox
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Review and approve AI-generated content before use
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
            <Clock className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {counts.pending}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Pending</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {counts.approved}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">Approved</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
            <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {counts.rejected}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">Rejected</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Approvals List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Cpu className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No {filter === "all" ? "" : filter} approvals
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApprovals.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.description || `${item.item_type} concept`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Generated {formatDate(item.generated_at)}
                    </p>
                  </div>
                  <AIModelBadge
                    model={item.model_used as AIModel}
                    generatedAt={item.generated_at}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      item.status === "pending"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : item.status === "approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>

                  {item.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(item.id)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
