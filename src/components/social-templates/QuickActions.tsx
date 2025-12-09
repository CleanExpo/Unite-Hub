"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wand2, Download, Upload, RefreshCw, Loader2 } from "lucide-react";

interface QuickActionsProps {
  clientId: string;
  onRefresh: () => void;
}

export function QuickActions({ clientId, onRefresh }: QuickActionsProps) {
  const [seeding, setSeeding] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleSeedTemplates = async () => {
    if (!confirm("This will add 250+ pre-built templates. Continue?")) {
return;
}

    setSeeding(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/social-templates/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully added ${data.count} templates!`);
        onRefresh();
      }
    } catch (error) {
      console.error("Error seeding templates:", error);
      alert("Failed to seed templates");
    } finally {
      setSeeding(false);
    }
  };

  const handleQuickGenerate = async () => {
    setGenerating(true);
    try {
      // Generate 10 templates for each platform
      const platforms = ["facebook", "instagram", "tiktok", "linkedin", "twitter"];
      const categories = ["promotional", "educational", "engagement"];

      for (const platform of platforms) {
        for (const category of categories) {
          await fetch("/api/social-templates/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientId,
              platform,
              category,
              count: 2, // 2 per platform per category = 30 total
            }),
          });
        }
      }

      alert("Successfully generated 30 custom templates!");
      onRefresh();
    } catch (error) {
      console.error("Error generating templates:", error);
      alert("Failed to generate templates");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-4 mb-6">
      <h3 className="font-semibold mb-3">Quick Actions</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleSeedTemplates}
          disabled={seeding}
          variant="outline"
        >
          {seeding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Seeding...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Load Pre-Built Templates (250+)
            </>
          )}
        </Button>

        <Button
          onClick={handleQuickGenerate}
          disabled={generating}
          variant="outline"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              AI Generate (30 Custom)
            </>
          )}
        </Button>

        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </Card>
  );
}
