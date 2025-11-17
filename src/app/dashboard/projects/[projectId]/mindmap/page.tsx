"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { InteractiveMindmap } from "@/components/mindmap/InteractiveMindmap";
import { AISuggestionsPanel } from "@/components/mindmap/AISuggestionsPanel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

  const projectId = params.projectId as string;

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

  // =====================================================
  // NODE CRUD OPERATIONS
  // =====================================================

  const handleNodeUpdate = async (nodeId: string, updates: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/mindmap/nodes/${nodeId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update node");
      }

      // Refresh mindmap data
      await fetchMindmap();
    } catch (error) {
      console.error("Failed to update node:", error);
      toast({
        title: "Error",
        description: "Failed to update node",
        variant: "destructive",
      });
    }
  };

  const handleNodeDelete = async (nodeId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/mindmap/nodes/${nodeId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete node");
      }

      toast({
        title: "Success",
        description: "Node deleted successfully",
      });

      await fetchMindmap();
    } catch (error) {
      console.error("Failed to delete node:", error);
      toast({
        title: "Error",
        description: "Failed to delete node",
        variant: "destructive",
      });
    }
  };

  const handleNodeCreate = async (node: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !mindmapData) return;

      const response = await fetch(
        `/api/mindmap/${mindmapData.mindmap.id}/nodes`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(node),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create node");
      }

      toast({
        title: "Success",
        description: "Node created successfully",
      });

      await fetchMindmap();
    } catch (error) {
      console.error("Failed to create node:", error);
      toast({
        title: "Error",
        description: "Failed to create node",
        variant: "destructive",
      });
    }
  };

  // =====================================================
  // CONNECTION OPERATIONS
  // =====================================================

  const handleConnectionCreate = async (connection: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !mindmapData) return;

      const response = await fetch(
        `/api/mindmap/${mindmapData.mindmap.id}/connections`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(connection),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create connection");
      }

      toast({
        title: "Success",
        description: "Connection created successfully",
      });

      await fetchMindmap();
    } catch (error) {
      console.error("Failed to create connection:", error);
      toast({
        title: "Error",
        description: "Failed to create connection",
        variant: "destructive",
      });
    }
  };

  // =====================================================
  // AI OPERATIONS
  // =====================================================

  const handleTriggerAI = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !mindmapData) return;

      toast({
        title: "Analyzing...",
        description: "AI is analyzing your mindmap. This may take a few seconds.",
      });

      const response = await fetch(
        `/api/mindmap/${mindmapData.mindmap.id}/ai-analyze`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_type: "full",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze mindmap");
      }

      const result = await response.json();

      toast({
        title: "Analysis Complete",
        description: `Generated ${result.suggestions.length} suggestions`,
      });

      await fetchMindmap();
    } catch (error) {
      console.error("Failed to analyze mindmap:", error);
      toast({
        title: "Error",
        description: "AI analysis failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptSuggestion = async (suggestionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/mindmap/suggestions/${suggestionId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "accepted" }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept suggestion");
      }

      toast({
        title: "Success",
        description: "Suggestion accepted",
      });

      await fetchMindmap();
    } catch (error) {
      console.error("Failed to accept suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to accept suggestion",
        variant: "destructive",
      });
    }
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/mindmap/suggestions/${suggestionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to dismiss suggestion");
      }

      toast({
        title: "Success",
        description: "Suggestion dismissed",
      });

      await fetchMindmap();
    } catch (error) {
      console.error("Failed to dismiss suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss suggestion",
        variant: "destructive",
      });
    }
  };

  const handleApplySuggestion = async (suggestionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/mindmap/suggestions/${suggestionId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to apply suggestion");
      }

      toast({
        title: "Success",
        description: "Suggestion applied to mindmap",
      });

      await fetchMindmap();
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to apply suggestion",
        variant: "destructive",
      });
    }
  };

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <p className="text-sm text-gray-600">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mindmap (2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <InteractiveMindmap
            mindmapId={mindmapData.mindmap.id}
            initialNodes={mindmapData.nodes}
            initialConnections={mindmapData.connections}
            onNodeUpdate={handleNodeUpdate}
            onNodeDelete={handleNodeDelete}
            onConnectionCreate={handleConnectionCreate}
            onNodeCreate={handleNodeCreate}
            onTriggerAI={handleTriggerAI}
          />
        </div>

        {/* Suggestions Panel (1/3 width on large screens) */}
        <div className="lg:col-span-1">
          <AISuggestionsPanel
            suggestions={mindmapData.suggestions}
            onAccept={handleAcceptSuggestion}
            onDismiss={handleDismissSuggestion}
            onApply={handleApplySuggestion}
            isLoading={refreshing}
          />
        </div>
      </div>
    </div>
  );
}
