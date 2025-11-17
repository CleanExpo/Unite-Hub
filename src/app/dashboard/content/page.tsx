"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentPreview } from "@/components/ContentPreview";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function ContentPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [contents, setContents] = useState<any[]>([]);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (workspaceLoading) return;
    loadContent();
  }, [workspaceId, workspaceLoading]);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Fetch from database
      const response = await fetch(
        `/api/content?workspace=${workspaceId}`
      );
      const { content } = await response.json();
      setContents(content || []);
    } catch (error) {
      console.error("Failed to load content:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateBulkContent = async (type: string) => {
    setGenerating(true);
    try {
      const response = await fetch(
        "/api/agents/content-personalization",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate_bulk",
            workspaceId,
            contentType: type,
          }),
        }
      );
      const { result } = await response.json();
      console.log(`Generated: ${result.generated}, Errors: ${result.errors}`);
      await loadContent();
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Content Hub" }]} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Content Hub
          </h1>
          <p className="text-slate-400">AI-generated personalized content</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => generateBulkContent("followup")}
            disabled={generating}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-blue-500/50 gap-2"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Generate Followups
          </Button>
          <Button
            onClick={() => generateBulkContent("proposal")}
            disabled={generating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/50 gap-2"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Generate Proposals
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="drafts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        {/* Drafts */}
        <TabsContent value="drafts" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : contents.filter((c) => c.status === "draft").length === 0 ? (
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
              <CardContent className="pt-6 text-center py-12">
                <p className="text-slate-400 mb-4">No drafts yet</p>
                <Button
                  onClick={() => generateBulkContent("followup")}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-blue-500/50"
                >
                  Generate Content
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contents
                .filter((c) => c.status === "draft")
                .map((content) => (
                  <Card
                    key={content.id}
                    className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 cursor-pointer hover:border-blue-600/50 transition-all group"
                    onClick={() => setSelectedContent(content)}
                  >
                    <CardHeader>
                      <CardTitle className="text-white text-lg group-hover:text-blue-400 transition-colors">
                        {content.title}
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Score: {content.personalization_score}/100
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-300 line-clamp-3 mb-3">
                        {content.generated_text}
                      </p>
                      <div className="flex gap-2">
                        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          {content.content_type}
                        </Badge>
                        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Draft</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Approved */}
        <TabsContent value="approved">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-slate-400">
                {contents.filter((c) => c.status === "approved").length} approved
                content ready to send
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sent */}
        <TabsContent value="sent">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-slate-400">
                {contents.filter((c) => c.status === "sent").length} emails sent
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Content Preview */}
      {selectedContent && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Preview
          </h2>
          <ContentPreview
            content={selectedContent}
            onApprove={() => console.log("Approve")}
            onEdit={() => console.log("Edit")}
            onSend={() => console.log("Send")}
          />
        </div>
      )}
    </div>
  );
}
