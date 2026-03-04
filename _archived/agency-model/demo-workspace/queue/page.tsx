"use client";

import React from "react";
import { CheckCircle, Clock, Filter, SortAsc } from "lucide-react";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { ApprovalCard, ContentType } from "@/components/workspace/ApprovalCard";
import { Button } from "@/components/ui/button";

interface QueueItem {
  id: string;
  title: string;
  type: ContentType;
  platform?: string;
  thumbnailUrl?: string;
  previewText?: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
}

export default function ReviewQueuePage() {
  const queueItems: QueueItem[] = [
    {
      id: "queue-1",
      title: "VEO3 Video - Summer Campaign (TikTok)",
      type: "video",
      platform: "tiktok",
      thumbnailUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop",
      previewText: "Check out our summer collection! Fresh styles, bold looks.",
      priority: "high",
      createdAt: "2 hours ago",
    },
    {
      id: "queue-2",
      title: "Banana Creative - Banner Set",
      type: "banner",
      platform: "meta",
      thumbnailUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop",
      priority: "medium",
      createdAt: "4 hours ago",
    },
    {
      id: "queue-3",
      title: "Blog Post - SEO Optimized",
      type: "blog",
      thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
      previewText: "10 Tips for Summer Marketing Success",
      priority: "low",
      createdAt: "1 day ago",
    },
  ];

  const handleApprove = (id: string) => {
    console.log("Approved:", id);
    alert(`Content ${id} approved! (Demo mode)`);
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
            linear-gradient(180deg, #0a1f2e 0%, #071318 100%)
          `,
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
            <header className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Review Queue</h1>
                  </div>
                  <p className="text-sm text-gray-400">
                    {queueItems.length} items awaiting your approval
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-cyan-900/50 text-gray-400 hover:text-white">
                    <Filter className="w-4 h-4 mr-2" /> Filter
                  </Button>
                  <Button variant="outline" size="sm" className="border-cyan-900/50 text-gray-400 hover:text-white">
                    <SortAsc className="w-4 h-4 mr-2" /> Sort
                  </Button>
                </div>
              </div>
            </header>

            {/* Queue Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">High Priority</span>
                </div>
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">Medium Priority</span>
                </div>
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400 font-medium">Low Priority</span>
                </div>
                <span className="text-2xl font-bold text-white">1</span>
              </div>
            </div>

            {/* Queue Items */}
            <h2 className="text-lg font-semibold text-white mb-4">Pending Approval</h2>
            <div className="flex gap-5 overflow-x-auto pb-4">
              {queueItems.map((item, index) => (
                <ApprovalCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  type={item.type}
                  platform={item.platform}
                  thumbnailUrl={item.thumbnailUrl}
                  previewText={item.previewText}
                  isHighlighted={item.priority === "high"}
                  onApprove={handleApprove}
                  onIterate={handleIterate}
                />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
