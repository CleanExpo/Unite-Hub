/**
 * Scraper Create Form
 * Form to create a new scraping project
 */

"use client";

import { useState } from "react";

interface Props {
  loading: boolean;
  error: string | null;
  onSuccess: (projectId: string) => void;
  onCancel: () => void;
  onCreate: (payload: any) => Promise<any>;
}

export function ScraperCreateForm({ loading, error, onSuccess, onCancel, onCreate }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    seedUrl: "",
    keywords: [] as string[],
    keywordInput: "",
    maxUrlsToScrape: 20,
    includeImages: true,
    includePricing: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((s) => ({ ...s, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((s) => ({ ...s, [name]: value }));
    }
    setFormError(null);
  };

  const handleAddKeyword = () => {
    const keyword = formData.keywordInput.trim();
    if (!keyword) {
return;
}
    if (formData.keywords.length >= 5) {
      setFormError("Maximum 5 keywords allowed");
      return;
    }
    if (formData.keywords.includes(keyword)) {
      setFormError("Keyword already added");
      return;
    }

    setFormData((s) => ({
      ...s,
      keywords: [...s.keywords, keyword],
      keywordInput: "",
    }));
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData((s) => ({
      ...s,
      keywords: s.keywords.filter((k) => k !== keyword),
    }));
  };

  const handleKeywordKeydown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError("Project name is required");
      return;
    }
    if (!formData.seedUrl.trim()) {
      setFormError("Seed URL is required");
      return;
    }
    if (formData.keywords.length === 0) {
      setFormError("At least one keyword is required");
      return;
    }

    try {
      const result = await onCreate({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        seedUrl: formData.seedUrl.trim(),
        keywords: formData.keywords,
        maxUrlsToScrape: formData.maxUrlsToScrape,
        includeImages: formData.includeImages,
        includePricing: formData.includePricing,
      });

      if (result) {
        onSuccess(result.projectId);
      }
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-lg bg-bg-card border border-border-base p-8">
        <h2 className="text-2xl font-bold mb-6">Create New Project</h2>

        {(error || formError) && (
          <div className="rounded-lg bg-error-500/10 border border-error-500/20 p-4 mb-6">
            <p className="text-error-500 text-sm">{error || formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., AI Tools Comparison"
              className="w-full px-4 py-3 rounded-lg bg-bg-input border border-border-base text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional: Describe what you're researching"
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-bg-input border border-border-base text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all resize-none"
            />
          </div>

          {/* Seed URL */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Starting URL *
            </label>
            <input
              type="text"
              name="seedUrl"
              value={formData.seedUrl}
              onChange={handleInputChange}
              placeholder="e.g., openai.com"
              className="w-full px-4 py-3 rounded-lg bg-bg-input border border-border-base text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all"
            />
            <p className="text-xs text-text-secondary mt-1">
              The main domain to start from (system will find related URLs)
            </p>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Keywords * (Max 5)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={formData.keywordInput}
                onChange={handleInputChange}
                onKeyDown={handleKeywordKeydown}
                name="keywordInput"
                placeholder="Type keyword and press Enter"
                className="flex-1 px-4 py-3 rounded-lg bg-bg-input border border-border-base text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                disabled={loading}
                className="px-4 py-3 rounded-lg bg-accent-500 hover:bg-accent-400 disabled:bg-text-muted disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                Add
              </button>
            </div>

            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((kw) => (
                  <div key={kw} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-500/10 border border-accent-500/30">
                    <span className="text-accent-400 text-sm font-medium">{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="hover:text-accent-300 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-text-secondary mt-2">
              Be specific: "AI pricing" works better than "AI"
            </p>
          </div>

          {/* Max URLs */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Maximum URLs to Scrape
            </label>
            <input
              type="number"
              name="maxUrlsToScrape"
              value={formData.maxUrlsToScrape}
              onChange={handleInputChange}
              min="5"
              max="50"
              className="w-full px-4 py-3 rounded-lg bg-bg-input border border-border-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all"
            />
            <p className="text-xs text-text-secondary mt-1">
              More URLs = longer scraping time (5-50 recommended)
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-bg-hover transition-colors">
              <input
                type="checkbox"
                name="includeImages"
                checked={formData.includeImages}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-border-base bg-bg-input accent-accent-500"
              />
              <span className="text-sm text-text-primary font-medium">Include Images</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-bg-hover transition-colors">
              <input
                type="checkbox"
                name="includePricing"
                checked={formData.includePricing}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-border-base bg-bg-input accent-accent-500"
              />
              <span className="text-sm text-text-primary font-medium">Extract Pricing Data</span>
            </label>
          </div>

          {/* Duration Info */}
          <div className="bg-info-500/10 rounded-lg p-4 border border-info-500/20">
            <p className="text-sm text-info-500 font-medium mb-1">Estimated Time</p>
            <p className="text-xs text-text-secondary">
              {formData.keywords.length === 0
                ? "N/A"
                : `${Math.ceil(formData.maxUrlsToScrape * 0.5)}-${Math.ceil(formData.maxUrlsToScrape * 1.5)} minutes`}
              {" for "}
              {formData.maxUrlsToScrape}
              {" URLs"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-border-base">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg border border-border-base hover:border-text-secondary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-primary font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg bg-accent-500 hover:bg-accent-400 disabled:bg-text-muted disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Starting...
                </>
              ) : (
                "Start Scraping"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
