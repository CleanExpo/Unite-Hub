"use client";

import React from "react";
import { Archive, Search, Filter, Download, Calendar, Eye } from "lucide-react";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface VaultItem {
  id: string;
  title: string;
  type: "video" | "banner" | "blog" | "social";
  thumbnailUrl: string;
  platform: string;
  deployedAt: string;
  performance: {
    views: number;
    engagement: string;
  };
}

export default function VaultPage() {
  const vaultItems: VaultItem[] = [
    {
      id: "vault-1",
      title: "Spring Collection Launch Video",
      type: "video",
      thumbnailUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop",
      platform: "TikTok",
      deployedAt: "Mar 15, 2025",
      performance: { views: 45200, engagement: "8.2%" },
    },
    {
      id: "vault-2",
      title: "Holiday Sale Banner Set",
      type: "banner",
      thumbnailUrl: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop",
      platform: "Meta",
      deployedAt: "Dec 20, 2024",
      performance: { views: 128000, engagement: "3.5%" },
    },
    {
      id: "vault-3",
      title: "SEO Blog - Fashion Trends 2025",
      type: "blog",
      thumbnailUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      platform: "Website",
      deployedAt: "Jan 10, 2025",
      performance: { views: 8900, engagement: "12.1%" },
    },
    {
      id: "vault-4",
      title: "Instagram Carousel - New Arrivals",
      type: "social",
      thumbnailUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=300&fit=crop",
      platform: "Instagram",
      deployedAt: "Feb 28, 2025",
      performance: { views: 23400, engagement: "6.8%" },
    },
  ];

  return (
    <div className="min-h-screen bg-bg-base relative overflow-hidden">
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
        <div className="w-full max-w-[1600px] h-[calc(100vh-32px)] bg-bg-raised/40 backdrop-blur-xl rounded-2xl shadow-2xl flex overflow-hidden border border-cyan-800/20">
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
                      <Archive className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white">The Vault</h1>
                  </div>
                  <p className="text-sm text-gray-400">
                    All your deployed content with performance metrics
                  </p>
                </div>
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Download className="w-4 h-4 mr-2" /> Export All
                </Button>
              </div>
            </header>

            {/* Search and Filter */}
            <div className="flex gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search deployed content..."
                  className="pl-10 bg-bg-card/60 border-cyan-900/30 text-white placeholder:text-gray-500"
                />
              </div>
              <Button variant="outline" className="border-cyan-900/50 text-gray-400 hover:text-white">
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
            </div>

            {/* Vault Grid */}
            <div className="grid grid-cols-2 gap-4">
              {vaultItems.map((item) => (
                <Card key={item.id} className="bg-bg-card/60 border-cyan-900/30 hover:border-cyan-500/30 transition-colors overflow-hidden">
                  <div className="relative h-40">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                      {item.type}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-white font-medium mb-2 truncate">{item.title}</h3>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {item.deployedAt}
                      </span>
                      <span className="text-cyan-400">{item.platform}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1 text-gray-400">
                          <Eye className="w-3 h-3" /> {item.performance.views.toLocaleString()}
                        </span>
                        <span className="text-emerald-400">{item.performance.engagement}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 h-7 px-2">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
