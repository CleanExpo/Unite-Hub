"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function NewProjectPage() {
  const router = useRouter();
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const { currentOrganization } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    client_name: "",
    description: "",
    status: "on-track" as "on-track" | "at-risk" | "delayed" | "completed",
    priority: "medium" as "high" | "medium" | "low",
    progress: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!workspaceId || !currentOrganization) {
        throw new Error("Workspace or organization not found");
      }

      // Get session token for authentication
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          workspace_id: workspaceId,
          org_id: currentOrganization.org_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      const data = await response.json();

      // Redirect to the new project's mindmap
      router.push(`/dashboard/projects/${data.project.id}/mindmap`);
    } catch (err) {
      console.error("Error creating project:", err);
      setError(err instanceof Error ? err.message : "Failed to create project");
      setIsSubmitting(false);
    }
  };

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F5FF]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/dashboard/projects" },
          { label: "New Project" }
        ]}
      />

      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Create New Project
          </h1>
          <p className="text-white/50">Add a new project to your workspace</p>
        </div>
      </div>

      {error && (
        <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-sm p-4">
          <p className="text-[#FF4444] text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Project Title *
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., E-Commerce Platform Redesign"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="bg-white/[0.02] border border-white/[0.06] text-white placeholder:text-white/40"
            />
          </div>

          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="client_name" className="text-white">
              Client Name *
            </Label>
            <Input
              id="client_name"
              type="text"
              placeholder="e.g., Acme Corporation"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              required
              className="bg-white/[0.02] border border-white/[0.06] text-white placeholder:text-white/40"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the project goals, deliverables, and key features..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="bg-white/[0.02] border border-white/[0.06] text-white placeholder:text-white/40"
            />
          </div>

          {/* Status and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-white">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger className="bg-white/[0.02] border border-white/[0.06] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-track">On Track</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-white">
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
              >
                <SelectTrigger className="bg-white/[0.02] border border-white/[0.06] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Label htmlFor="progress" className="text-white">
              Initial Progress: {formData.progress}%
            </Label>
            <input
              id="progress"
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting || !formData.title || !formData.client_name}
            className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                Creating...
              </>
            ) : (
              "Create Project & Open Mindmap"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
