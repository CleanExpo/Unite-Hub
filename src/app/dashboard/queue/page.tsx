"use client";

import React, { useState, useEffect } from "react";
import { ListFilter, Clock, CheckCircle, XCircle, RotateCcw } from "lucide-react";
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
        return <CheckCircle className="w-4 h-4 text-[#00FF88]" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-[#FF4444]" />;
      default:
        return <Clock className="w-4 h-4 text-[#FFB800]" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/30",
      approved: "bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/30",
      rejected: "bg-[#FF4444]/10 text-[#FF4444] border-[#FF4444]/30",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Main container */}
      <div className="relative z-10 h-screen p-4 flex justify-center items-center">
        <div className="w-full max-w-[1600px] h-[calc(100vh-32px)] bg-white/[0.02] rounded-sm shadow-2xl flex overflow-hidden border border-white/[0.06]">
          {/* Left Sidebar */}
          {/* Main Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <ListFilter className="w-5 h-5 text-[#00F5FF]" />
                  Review Queue
                </h1>
                <p className="text-sm text-white/50">
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
                    className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                      filter === f
                        ? "bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/30"
                        : "text-white/50 hover:text-white hover:bg-white/[0.04]"
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
                <div className="w-8 h-8 border-2 border-[#00F5FF] border-t-transparent rounded-sm animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-white/50">
                <ListFilter className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg">No items in queue</p>
                <p className="text-sm">Content will appear here when generated</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 flex items-center gap-4 hover:bg-white/[0.04] transition-colors"
                  >
                    {/* Thumbnail */}
                    {item.thumbnailUrl && (
                      <div className="w-16 h-16 rounded-sm overflow-hidden bg-[#050505] flex-shrink-0">
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
                      <p className="text-sm text-white/50">
                        {item.type} • {item.platform || "Multi-platform"}
                      </p>
                    </div>

                    {/* Status */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium border ${getStatusBadge(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </div>

                    {/* Actions */}
                    <button
                      type="button"
                      className="text-white/50 hover:text-[#00F5FF] transition-colors p-2"
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
