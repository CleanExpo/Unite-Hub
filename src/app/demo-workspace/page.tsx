"use client";

import React, { useState } from "react";
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
  const [content] = useState<GeneratedContent[]>([
    {
      id: "demo-1",
      title: "VEO3 Video - Summer Campaign (TikTok)",
      type: "video",
      platform: "tiktok",
      previewText: "Summer vibes only! Check out our latest collection...",
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
      previewText: "10 Ways to Boost Your Summer Marketing Strategy",
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  ]);

  const handleApprove = async (id: string) => {
    // Demo - just log
    console.log("Approved:", id);
    alert(`Content ${id} approved! (Demo mode)`);
  };

  const handleIterate = (id: string) => {
    console.log("Iterate:", id);
    alert(`Requested iteration for ${id} (Demo mode)`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-5 flex justify-center items-center">
      <div className="w-full max-w-[1400px] h-[95vh] bg-white rounded-2xl shadow-xl flex overflow-hidden">
        {/* Left Sidebar */}
        <WorkspaceSidebar />

        {/* Main Content */}
        <main className="flex-1 p-6 px-8 overflow-y-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Generative Workspace
              </h1>
              <p className="text-gray-500 text-sm">
                Review and approve AI-generated content
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative text-gray-500 hover:text-gray-700">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                  D
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 text-sm">
                    Demo User
                  </div>
                  <div className="text-gray-500 text-xs">demo@example.com</div>
                </div>
              </div>
            </div>
          </header>

          {/* Approval Cards */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Pending Approval
            </h2>
            <div className="flex gap-5 overflow-x-auto pb-4">
              {content.map((item, index) => (
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
        <aside className="w-[300px] bg-gray-50 border-l border-gray-200 flex flex-col">
          <NexusAssistant />
          <ExecutionTicker />
        </aside>
      </div>
    </div>
  );
}
