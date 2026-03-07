"use client";

import React, { useState } from "react";
import { Archive, Search, FolderOpen, Image, FileText, Video, Grid, List } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface VaultItem {
  id: string;
  title: string;
  type: "video" | "image" | "blog" | "banner";
  platform: string;
  thumbnailUrl: string;
  createdAt: string;
  deployedAt?: string;
}

// Demo vault items
const demoVaultItems: VaultItem[] = [
  {
    id: "vault-1",
    title: "Summer Collection Launch Video",
    type: "video",
    platform: "TikTok",
    thumbnailUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop",
    createdAt: "2025-01-15T10:00:00Z",
    deployedAt: "2025-01-16T14:30:00Z",
  },
  {
    id: "vault-2",
    title: "Product Feature Banner Set",
    type: "banner",
    platform: "Meta",
    thumbnailUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop",
    createdAt: "2025-01-14T09:00:00Z",
    deployedAt: "2025-01-14T15:00:00Z",
  },
  {
    id: "vault-3",
    title: "SEO Blog Post - Marketing Tips",
    type: "blog",
    platform: "Website",
    thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    createdAt: "2025-01-13T11:00:00Z",
    deployedAt: "2025-01-13T16:00:00Z",
  },
  {
    id: "vault-4",
    title: "Brand Story Video",
    type: "video",
    platform: "YouTube",
    thumbnailUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=400&fit=crop",
    createdAt: "2025-01-12T08:00:00Z",
    deployedAt: "2025-01-12T12:00:00Z",
  },
];

export default function VaultPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredItems = demoVaultItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "image":
      case "banner":
        return <Image className="w-4 h-4" />;
      case "blog":
        return <FileText className="w-4 h-4" />;
      default:
        return <FolderOpen className="w-4 h-4" />;
    }
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
                  <Archive className="w-5 h-5 text-[#00F5FF]" />
                  Content Vault
                </h1>
                <p className="text-sm text-white/40">
                  Browse and reuse previously deployed content
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-sm transition-colors ${
                    viewMode === "grid"
                      ? "bg-[#00F5FF]/10 text-[#00F5FF]"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-sm transition-colors ${
                    viewMode === "list"
                      ? "bg-[#00F5FF]/10 text-[#00F5FF]"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Search and Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vault..."
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/50 transition-colors"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white/[0.02] border border-white/[0.06] rounded-sm px-4 py-2.5 text-white focus:outline-none focus:border-[#00F5FF]/50 transition-colors"
              >
                <option value="all">All Types</option>
                <option value="video">Videos</option>
                <option value="banner">Banners</option>
                <option value="blog">Blog Posts</option>
                <option value="image">Images</option>
              </select>
            </div>

            {/* Content Grid/List */}
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-white/40">
                <Archive className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg">No items found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-sm overflow-hidden hover:border-[#00F5FF]/30 transition-colors cursor-pointer group"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 rounded-sm p-1.5">
                        {getTypeIcon(item.type)}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                      <p className="text-xs text-white/40 mt-1">{item.platform}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 flex items-center gap-4 hover:border-[#00F5FF]/30 transition-colors cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-sm overflow-hidden flex-shrink-0">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{item.title}</h3>
                      <p className="text-sm text-white/40">
                        {item.platform} • Deployed {new Date(item.deployedAt || item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/40">
                      {getTypeIcon(item.type)}
                      <span className="text-sm capitalize">{item.type}</span>
                    </div>
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
