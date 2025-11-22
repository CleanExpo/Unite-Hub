"use client";

import React, { useState, useEffect } from "react";
import { ListFilter, Clock, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface QueueItem {
  id: string;
  title: string;
  type: string;
  platform: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  thumbnailUrl?: string;
}

export default function ReviewQueuePage() {
  const { user, currentOrganization } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const workspaceId = currentOrganization?.org_id || "demo";

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(`/api/content/pending?workspaceId=${workspaceId}`, {
          headers: {
            ...(session && { Authorization: `Bearer ${session.access_token}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          setItems(data.content || []);
        }
      } catch (error) {
        console.error("Error fetching queue:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, [workspaceId]);

  const filteredItems = items.filter(item => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <div className="min-h-screen bg-[#071318] relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(20, 184, 166, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(8, 145, 178, 0.08) 0%, transparent 60%),
            linear-gradient(180deg, #0a1f2e 0%, #071318 100%)
          `,
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main container */}
      <div className="relative z-10 h-screen p-4 flex justify-center items-center">
        <div className="w-full max-w-[1600px] h-[calc(100vh-32px)] bg-[#0a1f2e]/40 backdrop-blur-xl rounded-2xl shadow-2xl flex overflow-hidden border border-cyan-800/20">
          {/* Left Sidebar */}
          <WorkspaceSidebar />

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <ListFilter className="w-5 h-5 text-cyan-400" />
                  Review Queue
                </h1>
                <p className="text-sm text-gray-400">
                  View and manage all content in the approval pipeline
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filter === f
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "text-gray-400 hover:text-white hover:bg-[#0d2137]/60"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </header>

            {/* Queue List */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <ListFilter className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg">No items in queue</p>
                <p className="text-sm">Content will appear here when generated</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0d2137]/40 border border-cyan-900/20 rounded-xl p-4 flex items-center gap-4 hover:bg-[#0d2137]/60 transition-colors"
                  >
                    {/* Thumbnail */}
                    {item.thumbnailUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#071318] flex-shrink-0">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{item.title}</h3>
                      <p className="text-sm text-gray-400">
                        {item.type} • {item.platform || "Multi-platform"}
                      </p>
                    </div>

                    {/* Status */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </div>

                    {/* Actions */}
                    <button
                      type="button"
                      className="text-gray-400 hover:text-cyan-400 transition-colors p-2"
                      title="View details"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
