"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistOverview } from "@/components/landing-pages/ChecklistOverview";
import { Plus, FileText, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FeaturePageWrapper } from "@/components/features/FeaturePageWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { supabaseBrowser } from "@/lib/supabase";

const PAGE_TYPES = [
  { value: "homepage", label: "Homepage" },
  { value: "product", label: "Product Page" },
  { value: "service", label: "Service Page" },
  { value: "lead_capture", label: "Lead Capture" },
  { value: "sales", label: "Sales Page" },
  { value: "event", label: "Event Page" },
];

interface Checklist {
  id: string;
  title: string;
  pageType: string;
  status: string;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

interface Persona {
  id: string;
  personaName: string;
}

interface Stats {
  total: number;
  byStatus: {
    completed: number;
    in_progress: number;
    draft: number;
  };
  avgCompletion: number;
}

export default function LandingPagesPage() {
  return (
    <FeaturePageWrapper
      featureName="Landing Page Checklist"
      description="DIY landing page builder with AI-generated copy"
      icon={<FileText className="h-20 w-20 text-slate-600" />}
    >
      {(clientId) => <LandingPageFeature clientId={clientId} />}
    </FeaturePageWrapper>
  );
}

function LandingPageFeature({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageType, setNewPageType] = useState<string>("");
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // State for data fetching
  const [checklists, setChecklists] = useState<Checklist[] | null>(null);
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch checklists
  useEffect(() => {
    const fetchChecklists = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
return;
}

      try {
        const response = await fetch(`/api/landing-pages?clientId=${clientId}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });

        if (response.ok) {
          const result = await response.json();
          setChecklists(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching checklists:", error);
      }
    };

    fetchChecklists();
  }, [clientId]);

  // Fetch personas
  useEffect(() => {
    const fetchPersonas = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
return;
}

      try {
        const response = await fetch(`/api/personas?clientId=${clientId}&activeOnly=true`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });

        if (response.ok) {
          const result = await response.json();
          setPersonas(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching personas:", error);
      }
    };

    fetchPersonas();
  }, [clientId]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
return;
}

      try {
        const response = await fetch(`/api/landing-pages/stats?clientId=${clientId}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });

        if (response.ok) {
          const result = await response.json();
          setStats(result.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [clientId]);

  const handleCreateChecklist = async () => {
    if (!newPageTitle || !newPageType) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const response = await fetch("/api/landing-pages/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          clientId: clientId,
          pageType: newPageType,
          title: newPageTitle,
          personaId: selectedPersona || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success!",
          description: "Landing page checklist generated successfully",
        });
        setIsCreateDialogOpen(false);
        setNewPageTitle("");
        setNewPageType("");
        setSelectedPersona("");

        // Refresh checklists
        const refreshResponse = await fetch(`/api/landing-pages?clientId=${clientId}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        if (refreshResponse.ok) {
          const result = await refreshResponse.json();
          setChecklists(result.data || []);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate checklist",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
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

      const response = await fetch(`/api/landing-pages/${checklistId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Checklist deleted successfully",
        });

        // Update local state
        setChecklists(prev => prev?.filter(c => c.id !== checklistId) || null);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete checklist",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Breadcrumbs items={[
        { label: "Resources", href: "/dashboard/resources" },
        { label: "Landing Pages" }
      ]} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Landing Page Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create high-converting landing pages with AI-powered copy suggestions
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Landing Page
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Pages</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {stats.byStatus.completed}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                {stats.byStatus.in_progress}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Completion</CardDescription>
              <CardTitle className="text-3xl">{stats.avgCompletion}%</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Checklists */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Pages</TabsTrigger>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="product">Product</TabsTrigger>
          <TabsTrigger value="service">Service</TabsTrigger>
          <TabsTrigger value="lead_capture">Lead Capture</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="event">Event</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {checklists ? (
            <ChecklistOverview
              checklists={checklists}
              onDelete={handleDeleteChecklist}
            />
          ) : (
            <div className="text-center py-12">Loading...</div>
          )}
        </TabsContent>

        {PAGE_TYPES.map(({ value }) => (
          <TabsContent key={value} value={value} className="mt-6">
            {checklists ? (
              <ChecklistOverview
                checklists={checklists.filter((c) => c.pageType === value)}
                onDelete={handleDeleteChecklist}
              />
            ) : (
              <div className="text-center py-12">Loading...</div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Features Section */}
      <Card>
        <CardHeader>
          <CardTitle>Landing Page Builder Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">AI-Generated Copy</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Get professionally written headlines, subheadlines, and body copy
                tailored to your business and target audience
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">A/B Test Variations</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate multiple copy variations for each section to test what
                resonates best with your audience
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">SEO Optimization</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Get SEO-optimized meta titles, descriptions, and keywords to
                improve your page's search visibility
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Landing Page</DialogTitle>
            <DialogDescription>
              Generate an AI-powered landing page checklist with copy suggestions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Product Launch Homepage"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pageType">Page Type *</Label>
              <Select value={newPageType} onValueChange={setNewPageType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select page type" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_TYPES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="persona">Target Persona (Optional)</Label>
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger>
                  <SelectValue placeholder="Select persona" />
                </SelectTrigger>
                <SelectContent>
                  {personas?.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      {persona.personaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                AI will tailor copy to this persona's pain points and goals
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateChecklist}
              disabled={isGenerating || !newPageTitle || !newPageType}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Checklist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
