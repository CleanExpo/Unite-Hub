"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import MindmapCanvas from "@/components/mindmap/MindmapCanvas";
import AISuggestionPanel from "@/components/mindmap/panels/AISuggestionPanel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// =====================================================
// TYPES
// =====================================================

interface MindmapData {
  mindmap: {
    id: string;
    project_id: string;
    version: number;
  };
  nodes: any[];
  connections: any[];
  suggestions: any[];
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function MindmapPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentOrganization } = useAuth();

  const projectId = params.projectId as string;
  const workspaceId = currentOrganization?.org_id || '';

  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =====================================================
  // FETCH MINDMAP DATA
  // =====================================================

  const fetchMindmap = useCallback(async () => {
    try {
      setRefreshing(true);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to view mindmaps",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/mindmap`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch mindmap");
      }

      const data = await response.json();

      // If mindmap doesn't exist, create it
      if (!data.exists) {
        const createResponse = await fetch(`/api/projects/${projectId}/mindmap`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (createResponse.ok) {
          const createdData = await createResponse.json();
          // Fetch the complete mindmap data
          const refreshResponse = await fetch(`/api/projects/${projectId}/mindmap`, {
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          });
          const refreshedData = await refreshResponse.json();
          setMindmapData(refreshedData);
        }
      } else {
        setMindmapData(data);
      }
    } catch (error) {
      console.error("Failed to fetch mindmap:", error);
      toast({
        title: "Error",
        description: "Failed to load mindmap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, toast, router]);

  useEffect(() => {
    fetchMindmap();
  }, [fetchMindmap]);

  // Event handlers are now managed by individual components (MindmapCanvas and AISuggestionPanel)

  // =====================================================
  // RENDER
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mindmapData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Mindmap not found</p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Project Mindmap</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Version {mindmapData.mindmap.version} • {mindmapData.nodes.length}{" "}
              nodes
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchMindmap}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-1" />
          )}
          Refresh
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mindmap Canvas */}
        <div className="flex-1">
          <MindmapCanvas
            projectId={projectId}
            workspaceId={workspaceId}
            mindmapId={mindmapData.mindmap.id}
          />
        </div>

        {/* AI Suggestions Panel */}
        <AISuggestionPanel
          mindmapId={mindmapData.mindmap.id}
          workspaceId={workspaceId}
        />
      </div>
    </div>
  );
}
