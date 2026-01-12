"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionCard } from "@/components/landing-pages/SectionCard";
import { ProgressBar } from "@/components/landing-pages/ProgressBar";
import { SEOOptimizer } from "@/components/landing-pages/SEOOptimizer";
import { DesignPreview } from "@/components/landing-pages/DesignPreview";
import { ExportModal } from "@/components/landing-pages/ExportModal";
import {
  ArrowLeft,
  Download,
  Eye,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { supabaseBrowser } from "@/lib/supabase";

interface Section {
  sectionName: string;
  order: number;
  completed: boolean;
  content?: string;
  variations?: string[];
}

interface SEOData {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
}

interface Checklist {
  id: string;
  title: string;
  pageType: string;
  status: string;
  sections: Section[];
  seoChecklist: SEOData;
  colorScheme?: any;
  copyTips: string[];
  designTips: string[];
}

interface Completion {
  completed: number;
  total: number;
  percentage: number;
}

export default function LandingPageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const checklistId = params.id as string;

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch checklist data
  useEffect(() => {
    const fetchChecklist = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
return;
}

      try {
        const response = await fetch(`/api/landing-pages/${checklistId}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });

        if (response.ok) {
          const result = await response.json();
          setChecklist(result.data);
        }
      } catch (error) {
        console.error("Error fetching checklist:", error);
      }
    };

    fetchChecklist();
  }, [checklistId]);

  // Fetch completion data
  useEffect(() => {
    const fetchCompletion = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
return;
}

      try {
        const response = await fetch(`/api/landing-pages/${checklistId}/completion`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });

        if (response.ok) {
          const result = await response.json();
          setCompletion(result.data);
        }
      } catch (error) {
        console.error("Error fetching completion:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletion();
  }, [checklistId]);

  const handleUpdateSection = async (sectionName: string, updates: any) => {
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/landing-pages/${checklistId}/sections`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sectionName,
          ...updates,
        }),
      });

      if (response.ok) {
        toast({
          title: "Updated",
          description: "Section updated successfully",
        });

        // Refresh checklist data
        const refreshResponse = await fetch(`/api/landing-pages/${checklistId}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        if (refreshResponse.ok) {
          const result = await refreshResponse.json();
          setChecklist(result.data);
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update section",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateSection = async (sectionName: string) => {
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `/api/landing-pages/${checklistId}/regenerate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ sectionName }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Regenerated",
          description: "Section copy regenerated successfully",
        });

        // Refresh checklist data
        const refreshResponse = await fetch(`/api/landing-pages/${checklistId}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        if (refreshResponse.ok) {
          const result = await refreshResponse.json();
          setChecklist(result.data);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate section",
        variant: "destructive",
      });
    }
  };

  const handleToggleComplete = async (sectionName: string, completed: boolean) => {
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/landing-pages/${checklistId}/sections`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sectionName,
          completed,
        }),
      });

      if (response.ok) {
        // Refresh checklist and completion data
        const [checklistRes, completionRes] = await Promise.all([
          fetch(`/api/landing-pages/${checklistId}`, {
            headers: { "Authorization": `Bearer ${session.access_token}` }
          }),
          fetch(`/api/landing-pages/${checklistId}/completion`, {
            headers: { "Authorization": `Bearer ${session.access_token}` }
          })
        ]);

        if (checklistRes.ok) {
          const result = await checklistRes.json();
          setChecklist(result.data);
        }
        if (completionRes.ok) {
          const result = await completionRes.json();
          setCompletion(result.data);
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update section",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSEO = async (updates: any) => {
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/landing-pages/${checklistId}/seo`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast({
          title: "Updated",
          description: "SEO settings updated successfully",
        });

        // Refresh checklist data
        const refreshResponse = await fetch(`/api/landing-pages/${checklistId}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        if (refreshResponse.ok) {
          const result = await refreshResponse.json();
          setChecklist(result.data);
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update SEO",
        variant: "destructive",
      });
    }
  };

  const handleExport = (options: any) => {
    toast({
      title: "Exporting",
      description: `Preparing ${options.format.toUpperCase()} export...`,
    });
    // TODO: Implement actual export functionality
  };

  if (!checklist) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Breadcrumbs items={[
        { label: "Landing Pages", href: "/dashboard/resources/landing-pages" },
        { label: "Edit" }
      ]} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/resources/landing-pages">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{checklist.title}</h1>
              <Badge variant="outline">{checklist.pageType}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {completion?.completed} of {completion?.total} sections completed
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button onClick={() => setIsExportModalOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Progress */}
      {completion && (
        <ProgressBar
          completed={completion.completed}
          total={completion.total}
          percentage={completion.percentage}
        />
      )}

      {/* Main Content */}
      <Tabs defaultValue="checklist" className="space-y-6">
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
        </TabsList>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          {checklist.sections
            .sort((a, b) => a.order - b.order)
            .map((section, idx) => (
              <SectionCard
                key={section.sectionName}
                section={section}
                sectionIndex={idx}
                onUpdate={(updates) =>
                  handleUpdateSection(section.sectionName, updates)
                }
                onRegenerate={() => handleRegenerateSection(section.sectionName)}
                onToggleComplete={(completed) =>
                  handleToggleComplete(section.sectionName, completed)
                }
              />
            ))}
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo">
          <SEOOptimizer
            seoData={checklist.seoChecklist}
            onUpdate={handleUpdateSEO}
          />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <DesignPreview
            sections={checklist.sections}
            colorScheme={checklist.colorScheme}
            onExport={() => setIsExportModalOpen(true)}
          />
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Copy Tips */}
            <div className="rounded-lg border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Copy Writing Tips</h3>
              </div>
              <ul className="space-y-2">
                {checklist.copyTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success-600 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Design Tips */}
            <div className="rounded-lg border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Design Tips</h3>
              </div>
              <ul className="space-y-2">
                {checklist.designTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success-600 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        checklistTitle={checklist.title}
      />
    </div>
  );
}
