"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Wand2, Loader2 } from "lucide-react";
import { TemplateCard } from "./TemplateCard";
import { TemplateFilters } from "./TemplateFilters";
import { TemplateSearch } from "./TemplateSearch";
import { TemplateEditor } from "./TemplateEditor";
import { VariationsModal } from "./VariationsModal";
import { BulkActions } from "./BulkActions";
import { TemplateStats } from "./TemplateStats";
import { QuickActions } from "./QuickActions";
import { Checkbox } from "@/components/ui/checkbox";

interface TemplateLibraryProps {
  clientId: string;
}

export function TemplateLibrary({ clientId }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [clientId, selectedPlatform, selectedCategory, showFavorites, searchQuery]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedPlatform) params.append("platform", selectedPlatform);
      if (selectedCategory) params.append("category", selectedCategory);
      if (showFavorites) params.append("favoriteOnly", "true");

      const response = await fetch(
        `/api/clients/${clientId}/social-templates?${params}`
      );
      const data = await response.json();
      setTemplates(sortTemplates(data.templates || [], sortBy));
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortTemplates = (templates: any[], sort: string) => {
    const sorted = [...templates];
    switch (sort) {
      case "newest":
        return sorted.sort((a, b) => b.createdAt - a.createdAt);
      case "oldest":
        return sorted.sort((a, b) => a.createdAt - b.createdAt);
      case "most_used":
        return sorted.sort((a, b) => b.usageCount - a.usageCount);
      case "least_used":
        return sorted.sort((a, b) => a.usageCount - b.usageCount);
      case "alphabetical":
        return sorted.sort((a, b) =>
          a.templateName.localeCompare(b.templateName)
        );
      default:
        return sorted;
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query) {
      fetchTemplates();
      return;
    }

    try {
      const response = await fetch(
        `/api/social-templates/search?clientId=${clientId}&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();
      setTemplates(sortTemplates(data.templates || [], sortBy));
    } catch (error) {
      console.error("Error searching templates:", error);
    }
  };

  const handleFavorite = async (templateId: string) => {
    try {
      await fetch(`/api/social-templates/${templateId}/favorite`, {
        method: "POST",
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleEdit = (template: any) => {
    setCurrentTemplate(template);
    setShowEditor(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Delete this template?")) return;

    try {
      await fetch(`/api/social-templates/${templateId}`, {
        method: "DELETE",
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const handleCopy = async (text: string) => {
    // Track usage when copied
    const template = templates.find((t) => t.copyText === text);
    if (template) {
      await fetch(`/api/social-templates/${template._id}/track-usage`, {
        method: "POST",
      });
    }
  };

  const handleViewVariations = (template: any) => {
    setCurrentTemplate(template);
    setShowVariations(true);
  };

  const handleGenerateVariations = async (
    templateId: string,
    tones: string[]
  ) => {
    try {
      await fetch(`/api/social-templates/${templateId}/variations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tones }),
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error generating variations:", error);
    }
  };

  const handleSaveTemplate = async (template: any) => {
    try {
      if (template._id) {
        await fetch(`/api/social-templates/${template._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates: template }),
        });
      }
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const handleGenerateTemplates = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/social-templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          platform: selectedPlatform || "facebook",
          category: selectedCategory || "promotional",
          count: 10,
        }),
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error generating templates:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await fetch("/api/social-templates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", templateIds: selectedIds }),
      });
      setSelectedIds([]);
      fetchTemplates();
    } catch (error) {
      console.error("Error bulk deleting:", error);
    }
  };

  const handleBulkFavorite = async (favorite: boolean) => {
    try {
      await fetch("/api/social-templates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: favorite ? "favorite" : "unfavorite",
          templateIds: selectedIds,
        }),
      });
      setSelectedIds([]);
      fetchTemplates();
    } catch (error) {
      console.error("Error bulk favoriting:", error);
    }
  };

  const handleExport = async (format: "json" | "csv") => {
    try {
      const response = await fetch("/api/social-templates/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          format,
          templateIds: selectedIds.length > 0 ? selectedIds : undefined,
        }),
      });

      if (format === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `social-templates-${Date.now()}.csv`;
        a.click();
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `social-templates-${Date.now()}.json`;
        a.click();
      }
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === templates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(templates.map((t) => t._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <TemplateStats clientId={clientId} />

      {/* Quick Actions */}
      <QuickActions clientId={clientId} onRefresh={fetchTemplates} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Copy Templates</h2>
          <p className="text-gray-600">
            Browse, search, and manage your social media copy templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowEditor(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
          <Button onClick={handleGenerateTemplates} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                AI Generate (10)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <TemplateFilters
            selectedPlatform={selectedPlatform}
            selectedCategory={selectedCategory}
            showFavorites={showFavorites}
            sortBy={sortBy}
            onPlatformChange={setSelectedPlatform}
            onCategoryChange={setSelectedCategory}
            onToggleFavorites={() => setShowFavorites(!showFavorites)}
            onSortChange={(sort) => {
              setSortBy(sort);
              setTemplates(sortTemplates(templates, sort));
            }}
            onClearFilters={() => {
              setSelectedPlatform(null);
              setSelectedCategory(null);
              setShowFavorites(false);
            }}
          />
        </div>

        <div className="col-span-9 space-y-4">
          <TemplateSearch onSearch={handleSearch} />

          {/* Bulk Actions */}
          <BulkActions
            selectedIds={selectedIds}
            onClearSelection={() => setSelectedIds([])}
            onBulkDelete={handleBulkDelete}
            onBulkFavorite={handleBulkFavorite}
            onExport={handleExport}
          />

          {/* Templates Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No templates found</p>
              <Button onClick={handleGenerateTemplates}>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Your First Templates
              </Button>
            </div>
          ) : (
            <>
              {templates.length > 0 && (
                <div className="flex items-center gap-2 pb-2">
                  <Checkbox
                    checked={selectedIds.length === templates.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-gray-600">Select All</span>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div key={template._id} className="flex gap-2">
                    <Checkbox
                      checked={selectedIds.includes(template._id)}
                      onCheckedChange={() => toggleSelect(template._id)}
                      className="mt-4"
                    />
                    <TemplateCard
                      template={template}
                      onFavorite={handleFavorite}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onCopy={handleCopy}
                      onViewVariations={handleViewVariations}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <TemplateEditor
        template={currentTemplate}
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setCurrentTemplate(null);
        }}
        onSave={handleSaveTemplate}
      />

      <VariationsModal
        template={currentTemplate}
        isOpen={showVariations}
        onClose={() => {
          setShowVariations(false);
          setCurrentTemplate(null);
        }}
        onGenerateMore={handleGenerateVariations}
      />
    </div>
  );
}
