"use client";

import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { ApprovalCard, ContentType } from "@/components/workspace/ApprovalCard";
import { NexusAssistant } from "@/components/workspace/NexusAssistant";
import { ExecutionTicker } from "@/components/workspace/ExecutionTicker";
import { useToast } from "@/hooks/use-toast";

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

export default function GenerativeWorkspacePage() {
  const { user, currentOrganization } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const workspaceId = currentOrganization?.org_id;

  // Fetch generated content for approval
  useEffect(() => {
    const fetchContent = async () => {
      if (!workspaceId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `/api/generated-content?workspaceId=${workspaceId}&status=pending`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setContent(data.content || []);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [workspaceId]);

  // Default demo content if no real content exists
  const displayContent: GeneratedContent[] = content.length > 0 ? content : [
    {
      id: "demo-1",
      title: "VEO3 Video - Summer Campaign (TikTok)",
      type: "video",
      platform: "tiktok",
      previewText: "Generated ad text: Check out our summer collection! New arrivals dropping soon!",
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
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/generated-content/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({ workspaceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve content");
      }

      // Update local state
      setContent((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "deployed" } : item
        )
      );

      toast({
        title: "Content Approved",
        description: "Your content has been deployed successfully.",
      });
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        title: "Approval Failed",
        description: "Could not approve content. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleIterate = (id: string) => {
    toast({
      title: "Iteration Requested",
      description: "AI is regenerating your content with improvements.",
    });
    // TODO: Implement iteration API call
  };

  return (
    <div
      className="min-h-screen bg-gray-100 p-5 flex justify-center items-center"
      style={{
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(230, 240, 255, 0.4) 0%, transparent 20%),
          radial-gradient(circle at 90% 80%, rgba(230, 240, 255, 0.4) 0%, transparent 20%)
        `,
      }}
    >
      <div className="w-full max-w-[1400px] h-[95vh] bg-white rounded-2xl shadow-xl flex overflow-hidden border border-gray-200">
        {/* Left Sidebar */}
        <WorkspaceSidebar />

        {/* Main Content */}
        <main className="flex-1 p-6 px-8 overflow-y-auto bg-white">
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-lg font-semibold text-gray-900">
              Client Dashboard
            </h1>
            <div className="flex items-center gap-5">
              <button className="text-gray-500 hover:text-gray-700">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.email?.split("@")[0] || "User"}
                </span>
              </div>
            </div>
          </header>

          {/* Content Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Generative Workspace: Ready for Approval
            </h2>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B6F232]" />
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-5">
                {displayContent
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
        <aside className="w-[300px] bg-gray-50 border-l border-gray-200 flex flex-col">
          <NexusAssistant workspaceId={workspaceId} />
          <ExecutionTicker workspaceId={workspaceId} />
        </aside>
      </div>
    </div>
  );
}
