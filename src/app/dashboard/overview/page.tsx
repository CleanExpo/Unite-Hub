/* eslint-disable no-console */
"use client";

import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { ApprovalCard, ContentType } from "@/components/workspace/ApprovalCard";
import { NexusAssistant } from "@/components/workspace/NexusAssistant";
import { ExecutionTicker } from "@/components/workspace/ExecutionTicker";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface GeneratedContent {
  id: string;
  title: string;
  type: ContentType;
  platform?: string;
  thumbnailUrl?: string;
  previewText?: string;
  status: "pending" | "approved" | "deployed";
  createdAt: string;
}

// Demo content fallback
const demoContent: GeneratedContent[] = [
  {
    id: "demo-1",
    title: "VEO3 Video - Summer Campaign (TikTok)",
    type: "video",
    platform: "tiktok",
    thumbnailUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop",
    previewText: "Check out our summer collection! Fresh styles, bold looks. Shop now and get 20% off!",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "Banana Creative - Omni-channel Banner Set",
    type: "banner",
    platform: "meta",
    thumbnailUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-3",
    title: "Generative Blog Post - SEO & Images",
    type: "blog",
    thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    previewText: "10 Tips for Summer Marketing Success",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

export default function DashboardOverviewPage() {
  const { user, currentOrganization } = useAuth();
  const [content, setContent] = useState<GeneratedContent[]>(demoContent);
  const [loading, setLoading] = useState(true);
  const [deployedCount, setDeployedCount] = useState(12);

  const workspaceId = currentOrganization?.org_id; // No demo fallback - require valid workspace

  // Fetch pending content on mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(`/api/content/pending?workspaceId=${workspaceId}`, {
          headers: {
            ...(session && { Authorization: `Bearer ${session.access_token}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.content && data.content.length > 0) {
            setContent(data.content);
          }
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        // Keep demo content on error
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [workspaceId]);

  const handleApprove = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Demo mode - just show alert
        alert(`Content approved and deployed! (Demo mode)`);
        setContent(prev => prev.filter(item => item.id !== id));
        setDeployedCount(prev => prev + 1);
        return;
      }

      const response = await fetch("/api/content/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ contentId: id }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        // Remove from pending list
        setContent(prev => prev.filter(item => item.id !== id));
        setDeployedCount(prev => prev + 1);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Failed to approve content");
    }
  };

  const handleIterate = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Demo mode
        const feedback = prompt("Enter feedback for iteration:");
        if (feedback) {
          alert(`Iteration requested with feedback: "${feedback}" (Demo mode)`);
        }
        return;
      }

      const feedback = prompt("Enter feedback for iteration:");
      if (!feedback) return;

      const response = await fetch("/api/content/iterate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ contentId: id, feedback }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Iterate error:", error);
      alert("Failed to request iteration");
    }
  };

  const pendingCount = content.filter(item => item.status === "pending").length;

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
                <h1 className="text-xl font-bold text-white mb-1">
                  Generative Workspace
                </h1>
                <p className="text-sm text-gray-400">
                  {pendingCount} items ready for approval
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative text-gray-400 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-cyan-900/20"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                </button>
                <div className="flex items-center gap-3 bg-[#0d2137]/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-cyan-900/30">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg shadow-lg shadow-cyan-500/20" />
                  <div>
                    <span className="text-sm font-medium text-white block">
                      {user?.email?.split("@")[0] || "Demo User"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Pro Plan
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Content Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  Ready for Approval
                </h2>
                <div className="flex gap-2">
                  <span className="bg-cyan-500/20 text-cyan-400 text-xs px-3 py-1.5 rounded-full font-medium border border-cyan-500/30">
                    {pendingCount} Pending
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-medium border border-emerald-500/30">
                    {deployedCount} Deployed Today
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : pendingCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <p className="text-lg">No pending content</p>
                  <p className="text-sm">All content has been reviewed</p>
                </div>
              ) : (
                <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-cyan-900/50 scrollbar-track-transparent">
                  {content
                    .filter((item) => item.status === "pending")
                    .map((item, index) => (
                      <ApprovalCard
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        type={item.type}
                        platform={item.platform}
                        thumbnailUrl={item.thumbnailUrl}
                        previewText={item.previewText}
                        isHighlighted={index === 0}
                        onApprove={handleApprove}
                        onIterate={handleIterate}
                      />
                    ))}
                </div>
              )}
            </section>
          </main>

          {/* Right Sidebar */}
          <aside className="w-[320px] bg-[#0a1f2e]/60 backdrop-blur-sm border-l border-cyan-900/30 flex flex-col">
            <NexusAssistant workspaceId={workspaceId || ""} />
            <ExecutionTicker workspaceId={workspaceId || ""} />
          </aside>
        </div>
      </div>
    </div>
  );
}
