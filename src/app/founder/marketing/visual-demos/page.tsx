/**
 * Visual Demo Library Page
 * Browse animation presets, hero styles, and visual inspiration
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer, Section, ChatbotSafeZone } from "@/ui/layout/AppGrid";
import { SectionHeader } from "@/ui/components/SectionHeader";
import { Card, CardContent } from "@/ui/components/Card";
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Eye,
  Copy,
  Loader2,
  Layout,
  Square,
  Grid,
  Image,
  Share2,
  Wand2,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface VisualDemo {
  id: string;
  slug: string;
  title: string;
  category: "hero" | "section" | "card" | "gallery" | "social";
  persona: string | null;
  description: string | null;
  config: {
    animation?: string;
    intensity?: "subtle" | "normal" | "dramatic";
    [key: string]: unknown;
  };
  created_at: string;
}

const CATEGORY_CONFIG = {
  hero: { icon: Layout, color: "text-purple-600 bg-purple-100", label: "Hero Sections" },
  section: { icon: Square, color: "text-info-600 bg-info-100", label: "Page Sections" },
  card: { icon: Grid, color: "text-success-600 bg-success-100", label: "Cards" },
  gallery: { icon: Image, color: "text-warning-600 bg-warning-100", label: "Galleries" },
  social: { icon: Share2, color: "text-pink-600 bg-pink-100", label: "Social Media" },
};

const PERSONA_OPTIONS = ["saas", "trade", "agency", "nonprofit", "ecommerce", "professional"];

export default function VisualDemosPage() {
  const [demos, setDemos] = useState<VisualDemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [personaFilter, setPersonaFilter] = useState<string>("all");
  const [previewDemo, setPreviewDemo] = useState<VisualDemo | null>(null);

  useEffect(() => {
    fetchDemos();
  }, []);

  const fetchDemos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/founder/marketing/visual-demos");
      if (res.ok) {
        const data = await res.json();
        setDemos(data.demos || []);
      } else {
        // Mock data from seed
        setDemos([
          {
            id: "1",
            slug: "beam-sweep-hero",
            title: "Beam Sweep Hero",
            category: "hero",
            persona: "saas",
            description: "Horizontal light sweep animation for tech hero sections",
            config: { animation: "beam-sweep-alpha", intensity: "normal" },
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            slug: "clip-fade-service",
            title: "Clip Fade Service Hero",
            category: "hero",
            persona: "trade",
            description: "Elegant iris reveal for service-based businesses",
            config: { animation: "clip-fade-radiance", intensity: "subtle" },
            created_at: new Date().toISOString(),
          },
          {
            id: "3",
            slug: "card-morph-portfolio",
            title: "Card Morph Portfolio",
            category: "card",
            persona: "agency",
            description: "Smooth card transitions for portfolio galleries",
            config: { animation: "switching-card-morph", intensity: "normal" },
            created_at: new Date().toISOString(),
          },
          {
            id: "4",
            slug: "quantum-glow-ai",
            title: "Quantum Glow AI Feature",
            category: "section",
            persona: "saas",
            description: "Ethereal glow effect for AI/tech product features",
            config: { animation: "quantum-glow-pulse", intensity: "dramatic" },
            created_at: new Date().toISOString(),
          },
          {
            id: "5",
            slug: "soft-morph-nonprofit",
            title: "Soft Morph Nonprofit",
            category: "hero",
            persona: "nonprofit",
            description: "Gentle organic transitions for trust-focused brands",
            config: { animation: "soft-material-morph", intensity: "subtle" },
            created_at: new Date().toISOString(),
          },
          {
            id: "6",
            slug: "parallax-scroll-ecom",
            title: "Parallax Scroll E-commerce",
            category: "gallery",
            persona: "ecommerce",
            description: "Smooth parallax scrolling for product showcases",
            config: { animation: "parallax-depth", intensity: "normal" },
            created_at: new Date().toISOString(),
          },
          {
            id: "7",
            slug: "instagram-grid-fade",
            title: "Instagram Grid Fade",
            category: "social",
            persona: "agency",
            description: "Coordinated grid reveal for social media previews",
            config: { animation: "grid-cascade", intensity: "normal" },
            created_at: new Date().toISOString(),
          },
          {
            id: "8",
            slug: "minimalist-agency",
            title: "Minimalist Agency Hero",
            category: "hero",
            persona: "agency",
            description: "Clean, typography-focused hero with subtle motion",
            config: { animation: "text-reveal", intensity: "subtle" },
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch visual demos:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDemos = demos.filter((demo) => {
    const matchesSearch =
      demo.title.toLowerCase().includes(search.toLowerCase()) ||
      demo.description?.toLowerCase().includes(search.toLowerCase()) ||
      demo.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || demo.category === categoryFilter;
    const matchesPersona = personaFilter === "all" || demo.persona === personaFilter;
    return matchesSearch && matchesCategory && matchesPersona;
  });

  const categoryCounts = demos.reduce((acc, demo) => {
    acc[demo.category] = (acc[demo.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <PageContainer>
      <ChatbotSafeZone>
        <SectionHeader
          icon={Sparkles}
          title="Visual Demo Library"
          description="Browse animation presets, hero styles, and visual inspiration for landing pages"
        />

        {/* Category Overview */}
        <Section className="mt-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <CategoryPill
              active={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
              label="All"
              count={demos.length}
            />
            {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
              <CategoryPill
                key={category}
                active={categoryFilter === category}
                onClick={() => setCategoryFilter(category)}
                label={config.label}
                count={categoryCounts[category] || 0}
                icon={config.icon}
                color={config.color}
              />
            ))}
          </div>
        </Section>

        {/* Filters */}
        <Section className="mt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search demos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-border-subtle rounded-lg bg-bg-card focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
              </div>
              <select
                value={personaFilter}
                onChange={(e) => setPersonaFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-border-subtle rounded-lg bg-bg-card"
              >
                <option value="all">All Personas</option>
                {PERSONA_OPTIONS.map((persona) => (
                  <option key={persona} value={persona} className="capitalize">
                    {persona.charAt(0).toUpperCase() + persona.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Link
                href="/founder/visual-engine"
                className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded-lg hover:bg-bg-hover"
              >
                <Wand2 className="w-4 h-4" />
                Style Wizard
              </Link>
              <button className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors">
                <Plus className="w-4 h-4" />
                Add Demo
              </button>
            </div>
          </div>
        </Section>

        {/* Demos Grid */}
        <Section className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
            </div>
          ) : filteredDemos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-text-secondary mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  No demos found
                </h3>
                <p className="text-sm text-text-tertiary mb-4">
                  Try adjusting your filters or add a new visual demo.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDemos.map((demo) => (
                <DemoCard key={demo.id} demo={demo} onPreview={() => setPreviewDemo(demo)} />
              ))}
            </div>
          )}
        </Section>

        {/* Animation Wizard CTA */}
        <Section className="mt-8">
          <Card className="border-2 border-dashed border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
            <CardContent className="py-8 text-center">
              <Wand2 className="w-10 h-10 mx-auto text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Animation Style Wizard
              </h3>
              <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
                Answer a few questions about your brand, industry, and preferences to get personalized
                animation recommendations.
              </p>
              <Link
                href="/founder/visual-engine"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Wand2 className="w-5 h-5" />
                Start Wizard
              </Link>
            </CardContent>
          </Card>
        </Section>

        {/* Preview Modal */}
        {previewDemo && (
          <DemoPreviewModal demo={previewDemo} onClose={() => setPreviewDemo(null)} />
        )}
      </ChatbotSafeZone>
    </PageContainer>
  );
}

interface CategoryPillProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: typeof Layout;
  color?: string;
}

function CategoryPill({ active, onClick, label, count, icon: Icon, color }: CategoryPillProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? "bg-accent-600 text-white"
          : "bg-bg-hover text-text-muted dark:text-text-secondary hover:bg-bg-hover"
      }`}
    >
      {Icon && <Icon className={`w-4 h-4 ${active ? "" : color?.split(" ")[0]}`} />}
      {label}
      <span
        className={`px-1.5 py-0.5 rounded text-xs ${
          active ? "bg-bg-card/20" : "bg-bg-hover dark:bg-bg-raised"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

interface DemoCardProps {
  demo: VisualDemo;
  onPreview: () => void;
}

function DemoCard({ demo, onPreview }: DemoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const categoryConfig = CATEGORY_CONFIG[demo.category];
  const intensityColors = {
    subtle: "bg-bg-hover text-text-muted",
    normal: "bg-info-100 text-info-600",
    dramatic: "bg-purple-100 text-purple-600",
  };

  return (
    <Card
      className="group hover:border-accent-500 transition-all overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview Area */}
      <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
        {/* Animated Preview Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-24 h-24 rounded-lg bg-gradient-to-r from-accent-500 to-purple-500 opacity-50 transition-transform duration-700 ${
              isHovered ? "scale-110 rotate-6" : "scale-100 rotate-0"
            }`}
          />
        </div>

        {/* Overlay Actions */}
        <div
          className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition-opacity ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={onPreview}
            className="p-2 bg-bg-card rounded-full hover:bg-bg-hover transition-colors"
          >
            <Play className="w-5 h-5 text-text-primary" />
          </button>
          <button className="p-2 bg-bg-card rounded-full hover:bg-bg-hover transition-colors">
            <Eye className="w-5 h-5 text-text-primary" />
          </button>
          <button className="p-2 bg-bg-card rounded-full hover:bg-bg-hover transition-colors">
            <Copy className="w-5 h-5 text-text-primary" />
          </button>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <div className={`px-2 py-1 rounded text-xs font-medium ${categoryConfig.color}`}>
            {categoryConfig.label}
          </div>
        </div>
      </div>

      <CardContent className="pt-4">
        <h3 className="font-semibold text-text-primary mb-1 group-hover:text-accent-600 transition-colors">
          {demo.title}
        </h3>
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
          {demo.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {demo.persona && (
              <span className="px-2 py-0.5 text-xs bg-bg-hover text-text-secondary rounded capitalize">
                {demo.persona}
              </span>
            )}
            {demo.config.intensity && (
              <span
                className={`px-2 py-0.5 text-xs rounded ${
                  intensityColors[demo.config.intensity as keyof typeof intensityColors]
                }`}
              >
                {demo.config.intensity}
              </span>
            )}
          </div>
          <Zap className="w-4 h-4 text-warning-500" />
        </div>
      </CardContent>
    </Card>
  );
}

interface DemoPreviewModalProps {
  demo: VisualDemo;
  onClose: () => void;
}

function DemoPreviewModal({ demo, onClose }: DemoPreviewModalProps) {
  const categoryConfig = CATEGORY_CONFIG[demo.category];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Preview Area */}
        <div className="relative h-80 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-48 h-48 rounded-2xl bg-gradient-to-r from-accent-500 to-purple-500 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-bg-card/10 hover:bg-bg-card/20 rounded-full transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${categoryConfig.color}`}>
                  <categoryConfig.icon className="w-5 h-5" />
                </div>
                <span className="text-sm text-text-tertiary">{categoryConfig.label}</span>
              </div>
              <h2 className="text-2xl font-bold text-text-primary">{demo.title}</h2>
              <p className="text-text-secondary mt-1">{demo.description}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-bg-hover dark:bg-bg-elevated/50 rounded-lg">
              <p className="text-xs text-text-tertiary mb-1">Animation</p>
              <p className="font-medium text-text-primary">
                {demo.config.animation || "Default"}
              </p>
            </div>
            <div className="p-4 bg-bg-hover dark:bg-bg-elevated/50 rounded-lg">
              <p className="text-xs text-text-tertiary mb-1">Intensity</p>
              <p className="font-medium text-text-primary capitalize">
                {demo.config.intensity || "Normal"}
              </p>
            </div>
            <div className="p-4 bg-bg-hover dark:bg-bg-elevated/50 rounded-lg">
              <p className="text-xs text-text-tertiary mb-1">Persona</p>
              <p className="font-medium text-text-primary capitalize">
                {demo.persona || "Universal"}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg"
            >
              Close
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm border border-border-subtle rounded-lg hover:bg-bg-hover">
              <Copy className="w-4 h-4" />
              Copy Config
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-accent-600 text-white rounded-lg hover:bg-accent-700">
              <Zap className="w-4 h-4" />
              Use This Style
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
