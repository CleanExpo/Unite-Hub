"use client";

import React from "react";
import { Bell } from "lucide-react";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { ApprovalCard, ContentType } from "@/components/workspace/ApprovalCard";
import { NexusAssistant } from "@/components/workspace/NexusAssistant";
import { ExecutionTicker } from "@/components/workspace/ExecutionTicker";

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

export default function DemoWorkspacePage() {
  // Demo content with built-in fallback designs (no image generation needed)
  const content: GeneratedContent[] = [
    {
      id: "demo-1",
      title: "VEO3 Video - Summer Campaign (TikTok)",
      type: "video",
      platform: "tiktok",
      previewText: "Check out our summer collection! Fresh styles, bold looks. Shop now and get 20% off!",
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-2",
      title: "Banana Creative - Omni-channel Banner Set",
      type: "banner",
      platform: "meta",
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-3",
      title: "Generative Blog Post - SEO & Images",
      type: "blog",
      previewText: "10 Tips for Summer Marketing Success",
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  ];

  const handleApprove = async (id: string) => {
    // Demo - just log
    console.log("Approved:", id);
    alert(`Content ${id} approved and deployed! (Demo mode)`);
  };

  const handleIterate = (id: string) => {
    console.log("Iterate:", id);
    alert(`Requested iteration for ${id} (Demo mode)`);
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
                <h1 className="text-xl font-bold text-white mb-1">
                  Generative Workspace
                </h1>
                <p className="text-sm text-gray-400">
                  3 items ready for approval
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
                      Demo User
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
                    3 Pending
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-medium border border-emerald-500/30">
                    12 Deployed Today
                  </span>
                </div>
              </div>

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
            </section>
          </main>

          {/* Right Sidebar */}
          <aside className="w-[320px] bg-[#0a1f2e]/60 backdrop-blur-sm border-l border-cyan-900/30 flex flex-col">
            <NexusAssistant workspaceId="demo" />
            <ExecutionTicker workspaceId="demo" />
          </aside>
        </div>
      </div>
    </div>
  );
}
