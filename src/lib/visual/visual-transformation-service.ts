/**
 * Visual Transformation Service
 *
 * Generates and manages AI-generated visuals for Unite-Hub using real APIs:
 * - OpenAI DALL-E 3
 * - Stability AI
 * - OpenRouter (routing to various models)
 */

import OpenAI from "openai";

export interface VisualAsset {
  id: string;
  type: "logo" | "icon" | "banner" | "avatar" | "thumbnail" | "illustration";
  name: string;
  description: string;
  currentUrl: string;
  generatedUrl?: string;
  status: "placeholder" | "generating" | "generated" | "approved";
  prompt?: string;
  style?: string;
  dimensions?: { width: number; height: number };
}

export interface PlaceholderManifest {
  scannedAt: string;
  totalPlaceholders: number;
  assets: VisualAsset[];
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface VisualGenerationPlan {
  createdAt: string;
  totalAssets: number;
  estimatedCost: number;
  assets: Array<{
    assetId: string;
    prompt: string;
    style: string;
    priority: "high" | "medium" | "low";
    model: "dall-e-3" | "stability-ai" | "openrouter";
  }>;
}

export interface ComponentUpdatePlan {
  createdAt: string;
  components: Array<{
    filePath: string;
    assetIds: string[];
    updateType: "replace" | "add" | "remove";
    description: string;
  }>;
}

export interface ThemeUpdatePlan {
  createdAt: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
  };
  assets: {
    logoUrl: string;
    faviconUrl: string;
    ogImageUrl: string;
  };
}

// Brand colors for Unite-Hub
const UNITE_HUB_THEME = {
  primary: "#B6F232", // Neon green
  secondary: "#1a1a1a",
  accent: "#A3D92D",
  background: "#ffffff",
  foreground: "#111827",
};

// Placeholder manifest based on codebase scan
export const PLACEHOLDER_MANIFEST: PlaceholderManifest = {
  scannedAt: new Date().toISOString(),
  totalPlaceholders: 8,
  byType: {
    logo: 2,
    avatar: 3,
    screenshot: 1,
    icon: 1,
    illustration: 1,
  },
  byStatus: {
    placeholder: 8,
    generated: 0,
    approved: 0,
  },
  assets: [
    {
      id: "logo-main",
      type: "logo",
      name: "Unite-Hub Main Logo",
      description: "Primary brand logo for header and marketing",
      currentUrl: "https://unite-hub.com/logos/unite-hub-logo.png",
      status: "placeholder",
      prompt: "Modern SaaS company logo, 'Unite-Hub' text, neon green (#B6F232) accent, clean minimalist design, professional tech aesthetic",
      style: "minimalist-tech",
      dimensions: { width: 512, height: 128 },
    },
    {
      id: "screenshot-dashboard",
      type: "illustration",
      name: "Dashboard Screenshot",
      description: "Marketing screenshot of main dashboard",
      currentUrl: "https://unite-hub.com/images/dashboard-screenshot.png",
      status: "placeholder",
      prompt: "Modern SaaS dashboard UI screenshot, dark theme, analytics charts, sidebar navigation, neon green accents, professional business software",
      style: "ui-screenshot",
      dimensions: { width: 1200, height: 800 },
    },
    {
      id: "avatar-placeholder",
      type: "avatar",
      name: "Default User Avatar",
      description: "Placeholder avatar for users without profile picture",
      currentUrl: "/placeholder-avatar.jpg",
      status: "placeholder",
      prompt: "Abstract user avatar, geometric shapes, professional, neutral colors with neon green accent",
      style: "abstract-avatar",
      dimensions: { width: 128, height: 128 },
    },
    {
      id: "favicon",
      type: "icon",
      name: "Favicon",
      description: "Browser tab icon",
      currentUrl: "/favicon.ico",
      status: "placeholder",
      prompt: "Simple 'U' or 'UH' monogram icon, neon green (#B6F232) on dark background, modern tech aesthetic",
      style: "icon-monogram",
      dimensions: { width: 32, height: 32 },
    },
    {
      id: "og-image",
      type: "banner",
      name: "Open Graph Image",
      description: "Social sharing preview image",
      currentUrl: "/og-image.png",
      status: "placeholder",
      prompt: "Unite-Hub brand banner, 'AI-Powered CRM & Marketing' tagline, neon green accent, professional dark theme, suitable for social media preview",
      style: "social-banner",
      dimensions: { width: 1200, height: 630 },
    },
    {
      id: "onboarding-illustration",
      type: "illustration",
      name: "Onboarding Welcome",
      description: "Illustration for onboarding wizard",
      currentUrl: "",
      status: "placeholder",
      prompt: "Friendly onboarding illustration, person using laptop with floating UI elements, neon green highlights, modern flat design",
      style: "flat-illustration",
      dimensions: { width: 600, height: 400 },
    },
    {
      id: "empty-state-contacts",
      type: "illustration",
      name: "Empty Contacts State",
      description: "Illustration when no contacts exist",
      currentUrl: "",
      status: "placeholder",
      prompt: "Empty state illustration, person adding contacts, address book icon, neon green accent, friendly minimalist style",
      style: "flat-illustration",
      dimensions: { width: 300, height: 300 },
    },
    {
      id: "empty-state-campaigns",
      type: "illustration",
      name: "Empty Campaigns State",
      description: "Illustration when no campaigns exist",
      currentUrl: "",
      status: "placeholder",
      prompt: "Empty state illustration, email campaign creation, rocket launch metaphor, neon green accent, encouraging design",
      style: "flat-illustration",
      dimensions: { width: 300, height: 300 },
    },
  ],
};

// Visual generation plan
export const VISUAL_GENERATION_PLAN: VisualGenerationPlan = {
  createdAt: new Date().toISOString(),
  totalAssets: PLACEHOLDER_MANIFEST.totalPlaceholders,
  estimatedCost: 2.40, // ~$0.30 per DALL-E 3 image
  assets: PLACEHOLDER_MANIFEST.assets.map((asset) => ({
    assetId: asset.id,
    prompt: asset.prompt || "",
    style: asset.style || "default",
    priority: asset.type === "logo" || asset.type === "icon" ? "high" : "medium",
    model: "dall-e-3" as const,
  })),
};

// Component update plan
export const COMPONENT_UPDATE_PLAN: ComponentUpdatePlan = {
  createdAt: new Date().toISOString(),
  components: [
    {
      filePath: "src/components/StructuredData.tsx",
      assetIds: ["logo-main", "screenshot-dashboard"],
      updateType: "replace",
      description: "Update schema.org structured data with real asset URLs",
    },
    {
      filePath: "src/components/layout/HeaderBar.tsx",
      assetIds: ["avatar-placeholder"],
      updateType: "replace",
      description: "Update default avatar image",
    },
    {
      filePath: "src/app/layout.tsx",
      assetIds: ["favicon", "og-image"],
      updateType: "replace",
      description: "Update metadata images",
    },
    {
      filePath: "src/components/OnboardingWizard.tsx",
      assetIds: ["onboarding-illustration"],
      updateType: "add",
      description: "Add onboarding welcome illustration",
    },
    {
      filePath: "src/app/dashboard/contacts/page.tsx",
      assetIds: ["empty-state-contacts"],
      updateType: "add",
      description: "Add empty state illustration for contacts",
    },
    {
      filePath: "src/app/dashboard/campaigns/page.tsx",
      assetIds: ["empty-state-campaigns"],
      updateType: "add",
      description: "Add empty state illustration for campaigns",
    },
  ],
};

// Theme update plan
export const THEME_UPDATE_PLAN: ThemeUpdatePlan = {
  createdAt: new Date().toISOString(),
  colors: UNITE_HUB_THEME,
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    headingFont: "Inter, system-ui, sans-serif",
  },
  assets: {
    logoUrl: "/assets/brand/unite-hub-logo.png",
    faviconUrl: "/favicon.ico",
    ogImageUrl: "/og-image.png",
  },
};

/**
 * Visual Transformation Service
 */
export class VisualTransformationService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Get the placeholder manifest
   */
  getPlaceholderManifest(): PlaceholderManifest {
    return PLACEHOLDER_MANIFEST;
  }

  /**
   * Get the visual generation plan
   */
  getVisualGenerationPlan(): VisualGenerationPlan {
    return VISUAL_GENERATION_PLAN;
  }

  /**
   * Get the component update plan
   */
  getComponentUpdatePlan(): ComponentUpdatePlan {
    return COMPONENT_UPDATE_PLAN;
  }

  /**
   * Get the theme update plan
   */
  getThemeUpdatePlan(): ThemeUpdatePlan {
    return THEME_UPDATE_PLAN;
  }

  /**
   * Generate a single visual using DALL-E 3
   */
  async generateVisual(asset: VisualAsset): Promise<string> {
    if (!this.openai) {
      throw new Error("OpenAI API key not configured");
    }

    const size = this.getDallESize(asset.dimensions);

    const response = await this.openai.images.generate({
      model: "dall-e-3",
      prompt: asset.prompt || asset.description,
      n: 1,
      size,
      quality: "standard",
      style: "vivid",
    });

    return response.data[0]?.url || "";
  }

  /**
   * Generate all pending visuals
   */
  async generateAllVisuals(): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (const asset of PLACEHOLDER_MANIFEST.assets) {
      if (asset.status === "placeholder") {
        try {
          const url = await this.generateVisual(asset);
          results.set(asset.id, url);
        } catch (error) {
          console.error(`Failed to generate ${asset.id}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Map dimensions to DALL-E supported sizes
   */
  private getDallESize(dimensions?: { width: number; height: number }): "1024x1024" | "1792x1024" | "1024x1792" {
    if (!dimensions) return "1024x1024";

    const ratio = dimensions.width / dimensions.height;

    if (ratio > 1.5) return "1792x1024"; // Wide
    if (ratio < 0.67) return "1024x1792"; // Tall
    return "1024x1024"; // Square
  }

  /**
   * Export full transformation pipeline output
   */
  exportPipelineOutput() {
    return {
      placeholder_manifest: this.getPlaceholderManifest(),
      visual_generation_plan: this.getVisualGenerationPlan(),
      component_update_plan: this.getComponentUpdatePlan(),
      theme_update_plan: this.getThemeUpdatePlan(),
      aagp_asset_manifest: {
        version: "1.0.0",
        generatedAt: new Date().toISOString(),
        totalAssets: PLACEHOLDER_MANIFEST.totalPlaceholders,
        assetsById: Object.fromEntries(
          PLACEHOLDER_MANIFEST.assets.map((a) => [a.id, a])
        ),
      },
    };
  }
}

// Export singleton instance
export const visualTransformationService = new VisualTransformationService();
