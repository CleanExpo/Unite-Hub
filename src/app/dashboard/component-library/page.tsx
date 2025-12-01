"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ComponentSearch from "@/components/marketplace/ComponentSearch";
import ComponentFilters from "@/components/marketplace/ComponentFilters";
import ComponentCard from "@/components/marketplace/ComponentCard";
import ComponentPreview from "@/components/marketplace/ComponentPreview";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface Component {
  id: string;
  name: string;
  description: string;
  category: string;
  style_tag: string;
  component_code: string;
  tailwind_classes: string;
  accessibility_score: number;
  performance_score: number;
  has_dark_mode: boolean;
  has_mobile_variant: boolean;
  view_count: number;
  rating: number | null;
  is_featured: boolean;
}

const CATEGORIES = ["header", "hero", "card", "form", "footer", "navigation"];
const STYLES = ["minimalist", "colorful", "dark", "glassmorphic", "modern", "corporate"];

export default function ComponentLibraryPage() {
  const { currentOrganization } = useAuth();
  const workspaceId = currentOrganization?.org_id || "";

  // State Management
  const [components, setComponents] = useState<Component[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "rating" | "alphabetical">(
    "newest"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Debounce search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch components
  const fetchComponents = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("workspaceId", workspaceId);
      params.set("page", currentPage.toString());
      params.set("limit", "20");
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedStyle) params.set("style_tag", selectedStyle);
      if (sortBy) params.set("sort", sortBy);

      const response = await fetch(`/api/marketplace/list?${params}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to fetch components");

      const data = await response.json();
      setComponents(data.data || []);
      setTotalPages(Math.ceil((data.meta?.total || 0) / 20));

      // Extract favorites
      const favSet = new Set(
        data.data?.filter((c: Component) => c.isFavorited).map((c: Component) => c.id) || []
      );
      setFavorites(favSet);
    } catch (error) {
      console.error("Error fetching components:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, currentPage, selectedCategory, selectedStyle, sortBy]);

  // Search components
  const searchComponents = useCallback(async () => {
    if (!workspaceId || !debouncedQuery) {
      fetchComponents();
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("workspaceId", workspaceId);
      params.set("query", debouncedQuery);

      const response = await fetch(`/api/marketplace/search?${params}`);
      if (!response.ok) throw new Error("Failed to search components");

      const data = await response.json();
      setComponents(data.data || []);
      setTotalPages(1);

      // Extract favorites
      const favSet = new Set(
        data.data?.filter((c: Component) => c.isFavorited).map((c: Component) => c.id) || []
      );
      setFavorites(favSet);
    } catch (error) {
      console.error("Error searching components:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, debouncedQuery, fetchComponents]);

  // Initial fetch
  useEffect(() => {
    if (debouncedQuery) {
      searchComponents();
    } else {
      fetchComponents();
    }
  }, [debouncedQuery, fetchComponents, searchComponents]);

  // Toggle favorite
  const handleFavoriteToggle = async (componentId: string) => {
    if (!workspaceId) return;

    try {
      const response = await fetch(
        `/api/marketplace/${componentId}/favorite?workspaceId=${workspaceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error("Failed to toggle favorite");

      const data = await response.json();
      if (data.isFavorited) {
        setFavorites((prev) => new Set([...prev, componentId]));
      } else {
        setFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(componentId);
          return newSet;
        });
      }

      // Refetch to update counts
      if (debouncedQuery) {
        searchComponents();
      } else {
        fetchComponents();
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Handle preview
  const handlePreviewClick = (component: Component) => {
    setSelectedComponent(component);
    setPreviewOpen(true);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedStyle(null);
    setSortBy("newest");
    setCurrentPage(1);
    setSearchQuery("");
  };

  // Export code
  const handleExportCode = (componentId: string, format: "tsx" | "jsx" | "css") => {
    const component = components.find((c) => c.id === componentId);
    if (!component) return;

    let content = "";
    let filename = `${component.name.toLowerCase().replace(/\s+/g, "-")}.${format}`;

    if (format === "tsx" || format === "jsx") {
      content = component.component_code;
    } else if (format === "css") {
      content = `/* ${component.name} - Tailwind Classes */\n@apply ${component.tailwind_classes};`;
    }

    // Create download
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Add to project
  const handleAddToProject = (componentId: string) => {
    console.log("Added component to project:", componentId);
    // TODO: Implement project integration
  };

  if (!workspaceId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-8">
          <p className="text-gray-600 dark:text-gray-400">Loading workspace...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Component Library
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Browse and integrate pre-built, production-ready components into your projects
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Search */}
        <ComponentSearch
          onSearch={setSearchQuery}
          placeholder="Search components by name or description..."
        />

        {/* Filters */}
        <ComponentFilters
          selectedCategory={selectedCategory}
          selectedStyle={selectedStyle}
          sortBy={sortBy}
          categories={CATEGORIES}
          styles={STYLES}
          onCategoryChange={setSelectedCategory}
          onStyleChange={setSelectedStyle}
          onSortChange={setSortBy}
          onClearFilters={handleClearFilters}
        />

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading components...</span>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && components.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No components found</p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Grid */}
        {!loading && components.length > 0 && (
          <>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {components.map((component) => (
                <motion.div
                  key={component.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ComponentCard
                    component={component}
                    isFavorited={favorites.has(component.id)}
                    onFavoriteToggle={() => handleFavoriteToggle(component.id)}
                    onPreviewClick={() => handlePreviewClick(component)}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {selectedComponent && (
        <ComponentPreview
          open={previewOpen}
          component={selectedComponent}
          onOpenChange={setPreviewOpen}
          onAddToProject={handleAddToProject}
          onExportCode={handleExportCode}
        />
      )}
    </div>
  );
}
