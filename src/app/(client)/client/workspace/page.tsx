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

  // Generate images for demo content
  const [generatingImages, setGeneratingImages] = useState(false);
  const [demoImages, setDemoImages] = useState<Record<string, string>>({});

  // Generate real images when component mounts
  useEffect(() => {
    const generateDemoImages = async () => {
      if (content.length > 0 || generatingImages) return;

      setGeneratingImages(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        // Generate images for each demo content type
        const prompts = [
          { id: "demo-1", prompt: "Fashion model wearing sunglasses in summer, vibrant colors, TikTok style vertical video thumbnail, influencer aesthetic" },
          { id: "demo-2", prompt: "Fresh yellow bananas product photography, clean white background, professional e-commerce style, high quality studio lighting" },
          { id: "demo-3", prompt: "Modern blog header image, digital marketing concept, SEO analytics dashboard, professional business graphic" },
        ];

        const imagePromises = prompts.map(async ({ id, prompt }) => {
          try {
            const response = await fetch("/api/ai/generate-image", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(session && { Authorization: `Bearer ${session.access_token}` }),
              },
              body: JSON.stringify({
                prompt,
                size: "1024x1024",
                workspaceId: workspaceId || "demo",
              }),
            });

            if (response.ok) {
              const data = await response.json();
              return { id, url: data.imageUrl };
            }
          } catch (error) {
            console.error(`Failed to generate image for ${id}:`, error);
          }
          return { id, url: null };
        });

        const results = await Promise.all(imagePromises);
        const imageMap: Record<string, string> = {};
        results.forEach(({ id, url }) => {
          if (url) imageMap[id] = url;
        });
        setDemoImages(imageMap);
      } catch (error) {
        console.error("Error generating demo images:", error);
      } finally {
        setGeneratingImages(false);
      }
    };

    generateDemoImages();
  }, [content.length, workspaceId, generatingImages]);

  // Default demo content with generated images
  const displayContent: GeneratedContent[] = content.length > 0 ? content : [
    {
      id: "demo-1",
      title: "VEO3 Video - Summer Campaign (TikTok)",
      type: "video",
      platform: "tiktok",
      thumbnailUrl: demoImages["demo-1"],
      previewText: "Generated ad text: Esenpered and noter nescoed 0heck our oonmor and pros prxa seon!",
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-2",
      title: "Banana Creative - Omni-channel Banner Set",
      type: "banner",
      platform: "meta",
      thumbnailUrl: demoImages["demo-2"],
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-3",
      title: "Generative Blog Post - SEO & Images",
      type: "blog",
      thumbnailUrl: demoImages["demo-3"],
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
      className="min-h-screen bg-bg-base p-5 flex justify-center items-center"
      style={{
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(182, 242, 50, 0.05) 0%, transparent 30%),
          radial-gradient(circle at 90% 80%, rgba(182, 242, 50, 0.05) 0%, transparent 30%),
          radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)
        `,
      }}
    >
      <div className="w-full max-w-[1400px] h-[95vh] bg-bg-raised/90 rounded-2xl shadow-2xl flex overflow-hidden border border-border-base/50 backdrop-blur-sm">
        {/* Left Sidebar */}
        <WorkspaceSidebar />

        {/* Main Content */}
        <main className="flex-1 p-6 px-8 overflow-y-auto bg-transparent">
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-lg font-semibold text-white">
              Client Dashboard
            </h1>
            <div className="flex items-center gap-5">
              <button className="text-gray-400 hover:text-[#B6F232] transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-[#B6F232] to-[#3b9ba8] rounded-full" />
                <span className="text-sm font-medium text-gray-300">
                  {user?.email?.split("@")[0] || "User"}
                </span>
              </div>
            </div>
          </header>

          {/* Content Section */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6">
              Generative Workspace: Ready for Approval
            </h2>

            {isLoading || generatingImages ? (
              <div className="flex flex-col justify-center items-center h-64 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B6F232]" />
                <span className="text-sm text-gray-400">
                  {generatingImages ? "Generating AI images..." : "Loading content..."}
                </span>
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
        <aside className="w-[300px] bg-bg-base/80 border-l border-border-base/50 flex flex-col">
          <NexusAssistant workspaceId={workspaceId} />
          <ExecutionTicker workspaceId={workspaceId} />
        </aside>
      </div>
    </div>
  );
}
