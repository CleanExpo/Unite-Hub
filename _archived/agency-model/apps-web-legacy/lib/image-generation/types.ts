/* ----------------------------------------
   Image Generation Types
   ---------------------------------------- */

export type AspectRatio = "1:1" | "16:9" | "4:3" | "9:16" | "21:9";
export type Resolution = "1K" | "2K" | "4K";
export type ImageStyle = "modern" | "minimalist" | "bold" | "elegant" | "playful" | "professional";
export type ImageCategory = "hero" | "feature" | "icon" | "avatar" | "background" | "illustration";

/* ----------------------------------------
   Base Configuration
   ---------------------------------------- */
export interface ImageGenerationConfig {
  /** Main prompt describing the image */
  prompt: string;
  /** Context about where the image will be used */
  context: string;
  /** Brand colors to incorporate (HSL values) */
  brandColors: string[];
  /** Aspect ratio of the output image */
  aspectRatio: AspectRatio;
  /** Output resolution */
  resolution: Resolution;
  /** Visual style of the image */
  style: ImageStyle;
  /** Category for organization */
  category: ImageCategory;
  /** Optional negative prompt (things to avoid) */
  negativePrompt?: string;
}

/* ----------------------------------------
   Icon Configuration
   ---------------------------------------- */
export interface IconGenerationConfig {
  /** Description of the icon */
  description: string;
  /** Icon style */
  style: "outline" | "filled" | "duotone" | "gradient";
  /** Primary color (HSL) */
  primaryColor: string;
  /** Secondary color for duotone/gradient (HSL) */
  secondaryColor?: string;
  /** Size in pixels */
  size: 24 | 32 | 48 | 64 | 128;
  /** Background style */
  background?: "transparent" | "circle" | "rounded" | "square";
}

/* ----------------------------------------
   Generated Image Result
   ---------------------------------------- */
export interface GeneratedImage {
  /** Unique identifier */
  id: string;
  /** Base64 encoded image data */
  data: string;
  /** MIME type */
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  /** Generated alt text */
  altText: string;
  /** Thinking/reasoning from the model */
  thinking?: string;
  /** Original configuration */
  config: ImageGenerationConfig;
  /** Timestamp of generation */
  createdAt: Date;
  /** File path if saved */
  filePath?: string;
}

/* ----------------------------------------
   Generated Icon Result
   ---------------------------------------- */
export interface GeneratedIcon {
  /** Unique identifier */
  id: string;
  /** SVG content or base64 image */
  content: string;
  /** Format type */
  format: "svg" | "png";
  /** Generated name for the icon */
  name: string;
  /** Original configuration */
  config: IconGenerationConfig;
  /** Timestamp of generation */
  createdAt: Date;
  /** File path if saved */
  filePath?: string;
}

/* ----------------------------------------
   Brand Asset
   ---------------------------------------- */
export interface BrandAsset {
  /** Unique identifier */
  id: string;
  /** Asset type */
  type: "image" | "icon" | "illustration";
  /** File path relative to public */
  path: string;
  /** Alt text for accessibility */
  altText: string;
  /** Category for organization */
  category: ImageCategory;
  /** Tags for searchability */
  tags: string[];
  /** Original generation config */
  config: ImageGenerationConfig | IconGenerationConfig;
  /** Creation timestamp */
  createdAt: Date;
  /** Usage locations in the codebase */
  usedIn?: string[];
}

/* ----------------------------------------
   Asset Manifest
   ---------------------------------------- */
export interface AssetManifest {
  /** Version of the manifest */
  version: string;
  /** Last updated timestamp */
  lastUpdated: Date;
  /** All tracked assets */
  assets: BrandAsset[];
}

/* ----------------------------------------
   Generation Options
   ---------------------------------------- */
export interface GenerationOptions {
  /** Whether to save the generated asset */
  save?: boolean;
  /** Custom filename (without extension) */
  filename?: string;
  /** Subdirectory within public/images */
  subdirectory?: string;
  /** Whether to optimize the image */
  optimize?: boolean;
  /** Add to asset manifest */
  trackInManifest?: boolean;
}

/* ----------------------------------------
   API Response Types
   ---------------------------------------- */
export interface ImageGenerationResponse {
  success: boolean;
  image?: GeneratedImage;
  error?: string;
}

export interface IconGenerationResponse {
  success: boolean;
  icon?: GeneratedIcon;
  error?: string;
}

/* ----------------------------------------
   Prompt Templates
   ---------------------------------------- */
export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
  defaultConfig: Partial<ImageGenerationConfig>;
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  hero: {
    name: "Hero Image",
    description: "Full-width hero section background or illustration",
    template: `Create a {style} hero image for {context}.
The image should be visually striking and professional.
Color palette: {colors}
Style: {style}
Must convey: {message}`,
    variables: ["context", "colors", "style", "message"],
    defaultConfig: {
      aspectRatio: "16:9",
      resolution: "2K",
      category: "hero",
    },
  },
  featureIcon: {
    name: "Feature Icon",
    description: "Icon for feature cards or service listings",
    template: `Design a {style} icon representing {concept}.
The icon should be clear and recognizable at small sizes.
Primary color: {primaryColor}
Style: {iconStyle}`,
    variables: ["concept", "primaryColor", "iconStyle", "style"],
    defaultConfig: {
      aspectRatio: "1:1",
      resolution: "1K",
      category: "icon",
    },
  },
  illustration: {
    name: "Illustration",
    description: "Custom illustration for content sections",
    template: `Create a {style} illustration depicting {scene}.
The illustration should be {mood} and align with a {industry} brand.
Color palette: {colors}`,
    variables: ["scene", "mood", "industry", "colors", "style"],
    defaultConfig: {
      aspectRatio: "4:3",
      resolution: "2K",
      category: "illustration",
    },
  },
  avatar: {
    name: "Avatar",
    description: "Profile avatar or team member placeholder",
    template: `Generate a {style} avatar image.
Style: Professional, friendly
Background: {background}
This is for a {context} profile.`,
    variables: ["background", "context", "style"],
    defaultConfig: {
      aspectRatio: "1:1",
      resolution: "1K",
      category: "avatar",
    },
  },
};
