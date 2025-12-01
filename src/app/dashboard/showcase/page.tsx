"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Sparkles, Code2, Palette, Download, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: "default" | "secondary" | "destructive" | "outline";
  ctaText: string;
  ctaLink: string;
  details: string[];
  status: "new" | "beta" | "stable";
}

const features: Feature[] = [
  {
    id: "component-library",
    title: "Component Library",
    description:
      "Browse, preview, and export production-ready components. Includes search, filtering, and one-click favorites.",
    icon: <Palette className="w-8 h-8" />,
    badge: "Production Ready",
    badgeColor: "default",
    ctaText: "Browse Components",
    ctaLink: "/dashboard/component-library",
    details: [
      "5+ curated template components",
      "Search with 300ms debounce",
      "Filter by 6 categories and 6 styles",
      "Sort by newest, popular, rating, or alphabetical",
      "Pagination support (20 items/page)",
      "View counts and ratings",
      "One-click favorites",
    ],
    status: "stable",
  },
  {
    id: "code-export",
    title: "Code Export System",
    description:
      "Export components in multiple formats: TSX, JSX, CSS, and JSON. Perfect for integration into your projects.",
    icon: <Code2 className="w-8 h-8" />,
    badge: "New Feature",
    badgeColor: "secondary",
    ctaText: "Learn More",
    ctaLink: "/dashboard/component-library",
    details: [
      "Export as TSX with React imports",
      "Export as JSX (plain JavaScript)",
      "Export as CSS with Tailwind @apply",
      "Export as JSON with metadata",
      "Configurable imports and Tailwind inclusion",
      "Auto-generated filenames",
      "Usage tracking",
    ],
    status: "new",
  },
  {
    id: "ai-variants",
    title: "AI Variant Generation",
    description:
      "Automatically generate component variants using Claude AI: dark mode, mobile-optimized, RTL, and custom variants.",
    icon: <Sparkles className="w-8 h-8" />,
    badge: "AI-Powered",
    badgeColor: "secondary",
    ctaText: "Generate Variants",
    ctaLink: "/dashboard/component-library",
    details: [
      "Dark mode variants (Claude-generated)",
      "Mobile-optimized variants (320px-480px)",
      "RTL variants (mirrored properties)",
      "Custom variants from descriptions",
      "Auto-saved to database",
      "Prevents duplicate variants",
      "Auto-updates component flags",
    ],
    status: "new",
  },
  {
    id: "component-collections",
    title: "Curated Collections",
    description:
      "Pre-organized component sets grouped by use case: Landing Pages, SaaS, Corporate websites, and more.",
    icon: <Download className="w-8 h-8" />,
    badge: "Organized",
    badgeColor: "outline",
    ctaText: "Browse Collections",
    ctaLink: "/dashboard/component-library",
    details: [
      "Landing Page Essentials collection",
      "SaaS Starter Kit collection",
      "Corporate Website collection",
      "Featured collections highlight",
      "Enriched with component details",
      "Easy bulk download support",
      "Future: custom collections",
    ],
    status: "stable",
  },
  {
    id: "component-preview",
    title: "Interactive Preview Modal",
    description:
      "Preview components with live customization, see full code, check performance metrics, and copy with one click.",
    icon: <Zap className="w-8 h-8" />,
    badge: "Interactive",
    badgeColor: "outline",
    ctaText: "Try Preview",
    ctaLink: "/dashboard/component-library",
    details: [
      "Live color customizer (color picker + hex)",
      "3-tab interface (Preview, Code, Details)",
      "Syntax-highlighted code display",
      "Copy code with feedback",
      "Accessibility scores (0-100)",
      "Performance scores (0-100)",
      "Feature indicators (Dark Mode, Mobile)",
    ],
    status: "stable",
  },
];

interface StatCard {
  label: string;
  value: string;
  description: string;
}

const stats: StatCard[] = [
  {
    label: "Components",
    value: "5+",
    description: "Production-ready templates",
  },
  {
    label: "Export Formats",
    value: "4",
    description: "TSX, JSX, CSS, JSON",
  },
  {
    label: "Collections",
    value: "3",
    description: "Curated themed sets",
  },
  {
    label: "API Endpoints",
    value: "7",
    description: "Fully documented",
  },
];

export default function ShowcasePage() {
  const { currentOrganization } = useAuth();
  const workspaceId = currentOrganization?.org_id || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <Badge variant="secondary" className="text-sm">
              New Features
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Component Marketplace Showcase
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Discover our new component library with AI-powered variant generation, multiple export formats, and beautiful
            preview interface. Everything you need to build faster.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-white dark:bg-slate-800">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {stat.label}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {features.map((feature) => (
            <Card
              key={feature.id}
              className="bg-white dark:bg-slate-800 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    {feature.icon}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={feature.badgeColor}>{feature.badge}</Badge>
                    {feature.status === "new" && (
                      <Badge className="bg-green-600 text-white">NEW</Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Details List */}
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link href={feature.ctaLink}>
                    <Button className="w-full mt-6 gap-2">
                      {feature.ctaText}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 text-white border-0">
          <CardContent className="pt-12 pb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to explore components?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Access the component library, preview live components, export code, and generate AI variants all from one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/component-library">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto"
                >
                  Open Component Library
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/docs/COMPONENT_MARKETPLACE_QUICKSTART.md">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  View Documentation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Technical Info */}
        <Card className="mt-12 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
            <CardDescription>
              Built with modern technologies for performance and reliability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Database
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>✓ 5 tables with full RLS</li>
                  <li>✓ 14 production indexes</li>
                  <li>✓ Workspace isolation</li>
                  <li>✓ Usage tracking</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  APIs
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>✓ 7 REST endpoints</li>
                  <li>✓ Rate limiting</li>
                  <li>✓ Error handling</li>
                  <li>✓ Pagination support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Frontend
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>✓ React 19 components</li>
                  <li>✓ Framer Motion</li>
                  <li>✓ Dark theme</li>
                  <li>✓ Responsive design</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
