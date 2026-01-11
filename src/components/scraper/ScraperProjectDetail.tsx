/**
 * Scraper Project Detail
 * Shows project status and results (products, pricing, images, article outline)
 */

"use client";

import { useState } from "react";
import { ScraperProject, ScraperResults } from "@/hooks/useScraper";
import { formatDistanceToNow } from "date-fns";

interface Props {
  project: ScraperProject;
  results: ScraperResults | null;
  loading: boolean;
  onBack: () => void;
  onDelete: () => void;
}

type TabType = "overview" | "products" | "pricing" | "images" | "outline";

export function ScraperProjectDetail({ project, results, loading, onBack, onDelete }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const isCompleted = project.status === "completed";
  const isFailed = project.status === "failed";
  const isProcessing = !isCompleted && !isFailed;

  const tabs: Array<{ id: TabType; label: string; badge?: number }> = [
    { id: "overview", label: "Overview" },
    { id: "products", label: "Products", badge: results?.allProducts.length },
    { id: "pricing", label: "Pricing", badge: results?.allPricing.length },
    { id: "images", label: "Images", badge: results?.allImages.length },
    { id: "outline", label: "Article" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-bg-card border border-border-base p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-text-secondary">{project.description}</p>
            )}
          </div>
          <button
            onClick={onBack}
            className="text-text-secondary hover:text-accent-500 transition-colors text-lg"
          >
            ←
          </button>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isCompleted
                    ? "bg-success-500"
                    : isFailed
                    ? "bg-error-500"
                    : "bg-yellow-500 animate-pulse"
                }`}
              ></div>
              <p className="font-semibold capitalize">{project.status.replace(/_/g, " ")}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">URLs Found</p>
            <p className="text-2xl font-bold text-accent-500">{project.total_urls_found}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Scraped</p>
            <p className="text-2xl font-bold text-success-500">{project.total_urls_scraped}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Failed</p>
            <p className="text-2xl font-bold text-error-500">{project.total_urls_failed}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mt-6 pt-6 border-t border-border-base">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">
                {project.progress.stage.charAt(0).toUpperCase() + project.progress.stage.slice(1)}
              </p>
              <p className="text-sm text-text-secondary">
                {project.progress.current} / {project.progress.total}
              </p>
            </div>
            <div className="h-3 bg-bg-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-500"
                style={{
                  width: `${
                    project.progress.total > 0
                      ? (project.progress.current / project.progress.total) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {isFailed && project.error_message && (
          <div className="mt-6 pt-6 border-t border-border-base">
            <div className="rounded-lg bg-error-500/10 border border-error-500/20 p-4">
              <p className="text-sm font-semibold text-error-500 mb-1">Error</p>
              <p className="text-sm text-text-secondary">{project.error_message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      {isCompleted && (
        <>
          <div className="flex gap-1 border-b border-border-base">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium border-b-2 transition-colors relative ${
                  activeTab === tab.id
                    ? "border-accent-500 text-accent-500"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-400 text-xs font-semibold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-screen">
            {activeTab === "overview" && (
              <ScraperOverviewTab project={project} results={results} />
            )}
            {activeTab === "products" && results && (
              <ScraperProductsTab products={results.allProducts} />
            )}
            {activeTab === "pricing" && results && (
              <ScraperPricingTab pricing={results.allPricing} />
            )}
            {activeTab === "images" && results && (
              <ScraperImagesTab images={results.allImages} />
            )}
            {activeTab === "outline" && results && (
              <ScraperOutlineTab outline={results.articleOutline} />
            )}
          </div>
        </>
      )}

      {/* Delete Button */}
      <div className="flex justify-end gap-3 pt-6 border-t border-border-base">
        <button
          onClick={onDelete}
          className="px-6 py-3 rounded-lg border border-error-500/30 hover:border-error-500/50 hover:bg-error-500/5 text-error-500 font-medium transition-colors"
        >
          Delete Project
        </button>
      </div>
    </div>
  );
}

// ============================================
// Tab Components
// ============================================

function ScraperOverviewTab({
  project,
  results,
}: {
  project: ScraperProject;
  results: ScraperResults | null;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-bg-card border border-border-base p-8">
        <h2 className="text-xl font-bold mb-6">Project Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase mb-4">
              Configuration
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-secondary">Seed URL</p>
                <p className="text-sm font-medium text-text-primary">{project.seed_url}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Keywords</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {project.keywords.map((kw) => (
                    <span key={kw} className="px-2 py-1 rounded bg-accent-500/10 text-accent-400 text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase mb-4">
              Results Summary
            </h3>
            {results && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-text-secondary">Total Products Found</p>
                  <p className="text-lg font-bold text-accent-500">
                    {results.allProducts.length}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-text-secondary">Pricing Models Found</p>
                  <p className="text-lg font-bold text-accent-500">
                    {results.allPricing.length}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-text-secondary">Images Extracted</p>
                  <p className="text-lg font-bold text-accent-500">
                    {results.allImages.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScraperProductsTab({
  products,
}: {
  products: Array<{
    name: string;
    description?: string;
    price?: string;
    currency?: string;
    imageUrl?: string;
    url?: string;
    features?: string[];
  }>;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg bg-bg-card border border-border-base p-12 text-center">
        <p className="text-text-secondary">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product, i) => (
        <div key={i} className="rounded-lg bg-bg-card border border-border-base p-6 hover:border-accent-500/50 transition-colors">
          {product.imageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden bg-bg-hover h-32">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <h3 className="font-bold text-text-primary mb-2">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-text-secondary mb-3 line-clamp-2">{product.description}</p>
          )}
          {product.price && (
            <p className="text-lg font-bold text-accent-500 mb-3">
              {product.price}
              {product.currency && ` ${product.currency}`}
            </p>
          )}
          {product.features && product.features.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-secondary uppercase">Features</p>
              <ul className="text-xs text-text-secondary space-y-1">
                {product.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="text-accent-500 mt-1">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ScraperPricingTab({
  pricing,
}: {
  pricing: Array<{
    name: string;
    price?: string;
    currency?: string;
    features?: string[];
    description?: string;
  }>;
}) {
  if (pricing.length === 0) {
    return (
      <div className="rounded-lg bg-bg-card border border-border-base p-12 text-center">
        <p className="text-text-secondary">No pricing models found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-base">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-base bg-bg-hover">
            <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
              Plan Name
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
              Price
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
              Features
            </th>
          </tr>
        </thead>
        <tbody>
          {pricing.map((plan, i) => (
            <tr key={i} className="border-b border-border-base hover:bg-bg-hover transition-colors">
              <td className="px-6 py-4 font-semibold text-text-primary">{plan.name}</td>
              <td className="px-6 py-4 text-accent-500 font-bold">
                {plan.price || "Contact sales"}
                {plan.currency && ` ${plan.currency}`}
              </td>
              <td className="px-6 py-4 text-sm text-text-secondary">
                {plan.features && plan.features.length > 0
                  ? plan.features.join(", ")
                  : "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScraperImagesTab({
  images,
}: {
  images: Array<{
    url: string;
    altText?: string;
    type?: "product" | "feature" | "logo" | "other";
  }>;
}) {
  if (images.length === 0) {
    return (
      <div className="rounded-lg bg-bg-card border border-border-base p-12 text-center">
        <p className="text-text-secondary">No images found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((img, i) => (
        <div key={i} className="rounded-lg overflow-hidden bg-bg-card border border-border-base group">
          <div className="aspect-square bg-bg-hover overflow-hidden">
            <img
              src={img.url}
              alt={img.altText || `Image ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold text-accent-500 uppercase">
              {img.type || "Other"}
            </p>
            {img.altText && (
              <p className="text-xs text-text-secondary line-clamp-2 mt-1">{img.altText}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScraperOutlineTab({
  outline,
}: {
  outline: {
    title: string;
    sections: Array<{
      title: string;
      content: string;
      sources: string[];
    }>;
    highlights: string[];
    callToAction?: string;
  };
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-bg-card border border-border-base p-8">
        <h2 className="text-3xl font-bold mb-4">{outline.title}</h2>

        {outline.highlights && outline.highlights.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-text-secondary uppercase mb-3">
              Key Highlights
            </h3>
            <ul className="space-y-2">
              {outline.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-text-primary">
                  <span className="text-accent-500 mt-1 font-bold">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6 border-t border-border-base pt-6">
          {outline.sections.map((section, i) => (
            <div key={i}>
              <h3 className="text-xl font-bold text-text-primary mb-3">{section.title}</h3>
              <p className="text-text-secondary mb-4">{section.content}</p>
              {section.sources && section.sources.length > 0 && (
                <div className="bg-bg-hover rounded p-3">
                  <p className="text-xs font-semibold text-text-secondary uppercase mb-2">
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {section.sources.map((src, j) => (
                      <a
                        key={j}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent-500 hover:text-accent-400 truncate"
                        title={src}
                      >
                        {src}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {outline.callToAction && (
          <div className="mt-8 pt-6 border-t border-border-base">
            <p className="text-accent-500 font-semibold">{outline.callToAction}</p>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="rounded-lg bg-bg-card border border-border-base p-6">
        <h3 className="font-semibold text-text-primary mb-4">Export Options</h3>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg border border-border-base hover:border-accent-500/50 text-text-secondary hover:text-accent-500 text-sm font-medium transition-colors">
            Copy as Markdown
          </button>
          <button className="px-4 py-2 rounded-lg border border-border-base hover:border-accent-500/50 text-text-secondary hover:text-accent-500 text-sm font-medium transition-colors">
            Download as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
