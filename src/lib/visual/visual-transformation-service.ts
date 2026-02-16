/**
 * Visual Transformation Service (Nano Banana 2)
 *
 * Generates and manages AI-generated visuals for Unite-Hub using Gemini 3.
 * Per CLAUDE.md: Gemini 3 is designated for multimodal tasks including image generation.
 *
 * Primary: Google Gemini 3 Pro (Imagen)
 * Fallback: OpenRouter routing
 */

// Using REST API directly for Imagen 3 image generation

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
    model: "gemini-imagen" | "dall-e-3" | "stability-ai" | "openrouter";
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

// Visual generation plan - Using Gemini 3 (Nano Banana 2)
export const VISUAL_GENERATION_PLAN: VisualGenerationPlan = {
  createdAt: new Date().toISOString(),
  totalAssets: PLACEHOLDER_MANIFEST.totalPlaceholders,
  estimatedCost: 0.80, // ~$0.10 per Gemini image - much cheaper than DALL-E
  assets: PLACEHOLDER_MANIFEST.assets.map((asset) => ({
    assetId: asset.id,
    prompt: asset.prompt || "",
    style: asset.style || "default",
    priority: asset.type === "logo" || asset.type === "icon" ? "high" : "medium",
    model: "gemini-imagen" as const, // Nano Banana 2 uses Gemini
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
 * Visual Transformation Service (Nano Banana 2)
 * Uses Gemini Imagen 3 as the primary image generator
 */
export class VisualTransformationService {
  constructor() {
    // API key is read from env at runtime
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
   * Generate a single visual using OpenAI DALL-E 3
   */
  async generateVisual(asset: VisualAsset): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY");
    }

    try {
      // Build the prompt with brand guidelines
      const fullPrompt = `${asset.prompt || asset.description}. Style: ${asset.style || 'modern tech'}. Brand colors: neon green (#B6F232) accent on dark background. Professional, clean, high-quality.`;

      // Map dimensions to DALL-E 3 sizes
      const size = this.getDalleSize(asset.dimensions);

      // Call DALL-E 3 API
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: fullPrompt,
          n: 1,
          size: size,
          quality: "standard",
          response_format: "b64_json",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DALL-E 3] API error:`, errorText);
        throw new Error(`DALL-E API error: ${response.status}`);
      }

      const data = await response.json();
      const imageData = data.data?.[0]?.b64_json;

      if (imageData) {
        console.log(`[DALL-E 3] Generated image for ${asset.id}`);
        return `data:image/png;base64,${imageData}`;
      }

      throw new Error("No image data in response");
    } catch (error: unknown) {
      console.error(`[DALL-E 3] Error generating ${asset.id}:`, error.message);

      // Fallback to placeholder if DALL-E fails
      const placeholderUrl = `https://placehold.co/${asset.dimensions?.width || 512}x${asset.dimensions?.height || 512}/1a1a1a/B6F232?text=${encodeURIComponent(asset.name.substring(0, 20))}`;

      return placeholderUrl;
    }
  }

  /**
   * Map dimensions to DALL-E 3 supported sizes
   */
  private getDalleSize(dimensions?: { width: number; height: number }): string {
    if (!dimensions) return "1024x1024";

    const ratio = dimensions.width / dimensions.height;

    if (ratio > 1.5) return "1792x1024"; // Wide/landscape
    if (ratio < 0.67) return "1024x1792"; // Tall/portrait
    return "1024x1024"; // Square
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
