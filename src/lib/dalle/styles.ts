/**
 * Style Definitions and Color Palettes for DALL-E
 *
 * Pre-defined styles and color schemes for consistent
 * brand imagery across all generated concepts.
 */

export interface StyleDefinition {
  name: string;
  description: string;
  characteristics: string[];
  colorPalettes: ColorPalette[];
  suitableFor: string[];
}

export interface ColorPalette {
  name: string;
  colors: string[]; // Hex colors
  mood: string;
}

/**
 * Pre-defined style library
 */
const STYLE_LIBRARY: Record<string, StyleDefinition> = {
  modern: {
    name: "Modern",
    description: "Clean, contemporary design with bold typography and geometric shapes",
    characteristics: [
      "clean lines",
      "geometric shapes",
      "bold typography",
      "minimalist composition",
      "contemporary aesthetic",
    ],
    colorPalettes: [
      {
        name: "Tech Blue",
        colors: ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD"],
        mood: "Professional, trustworthy, innovative",
      },
      {
        name: "Vibrant Gradient",
        colors: ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981"],
        mood: "Energetic, creative, modern",
      },
    ],
    suitableFor: ["tech", "saas", "startup", "finance"],
  },

  minimalist: {
    name: "Minimalist",
    description: "Simple, elegant design with abundant white space and subtle colors",
    characteristics: [
      "abundant white space",
      "simple forms",
      "subtle colors",
      "elegant typography",
      "refined composition",
    ],
    colorPalettes: [
      {
        name: "Monochrome",
        colors: ["#000000", "#4B5563", "#9CA3AF", "#F3F4F6"],
        mood: "Sophisticated, timeless, elegant",
      },
      {
        name: "Soft Pastels",
        colors: ["#FEE2E2", "#FEF3C7", "#D1FAE5", "#DBEAFE"],
        mood: "Calm, gentle, approachable",
      },
    ],
    suitableFor: ["luxury", "lifestyle", "wellness", "fashion"],
  },

  bold: {
    name: "Bold",
    description: "High-contrast, vibrant design with strong visual impact",
    characteristics: [
      "high contrast",
      "vibrant colors",
      "strong focal points",
      "dynamic composition",
      "impactful imagery",
    ],
    colorPalettes: [
      {
        name: "Neon Pop",
        colors: ["#FF00FF", "#00FFFF", "#FFFF00", "#FF0080"],
        mood: "Energetic, youthful, attention-grabbing",
      },
      {
        name: "Fire & Ice",
        colors: ["#DC2626", "#F59E0B", "#3B82F6", "#1E293B"],
        mood: "Dramatic, powerful, intense",
      },
    ],
    suitableFor: ["entertainment", "sports", "food", "retail"],
  },

  organic: {
    name: "Organic",
    description: "Natural, earthy design with flowing forms and nature-inspired elements",
    characteristics: [
      "natural textures",
      "flowing forms",
      "earthy tones",
      "organic shapes",
      "nature-inspired",
    ],
    colorPalettes: [
      {
        name: "Earth Tones",
        colors: ["#78350F", "#92400E", "#065F46", "#1E40AF"],
        mood: "Grounded, authentic, sustainable",
      },
      {
        name: "Forest Green",
        colors: ["#14532D", "#15803D", "#22C55E", "#86EFAC"],
        mood: "Fresh, natural, eco-friendly",
      },
    ],
    suitableFor: ["wellness", "organic", "eco", "health"],
  },

  professional: {
    name: "Professional",
    description: "Corporate, trustworthy design with balanced composition",
    characteristics: [
      "balanced composition",
      "professional aesthetics",
      "trustworthy imagery",
      "clear hierarchy",
      "corporate polish",
    ],
    colorPalettes: [
      {
        name: "Corporate Blue",
        colors: ["#1E3A8A", "#2563EB", "#60A5FA", "#E0F2FE"],
        mood: "Trustworthy, stable, professional",
      },
      {
        name: "Executive Gray",
        colors: ["#1F2937", "#4B5563", "#9CA3AF", "#F3F4F6"],
        mood: "Sophisticated, formal, authoritative",
      },
    ],
    suitableFor: ["b2b", "corporate", "finance", "legal"],
  },

  creative: {
    name: "Creative",
    description: "Artistic, experimental design with unique compositions",
    characteristics: [
      "artistic composition",
      "experimental layouts",
      "unique perspectives",
      "creative imagery",
      "innovative aesthetics",
    ],
    colorPalettes: [
      {
        name: "Artist Palette",
        colors: ["#7C3AED", "#EC4899", "#F59E0B", "#10B981"],
        mood: "Creative, expressive, innovative",
      },
      {
        name: "Sunset Gradient",
        colors: ["#7C2D12", "#DC2626", "#F59E0B", "#FCD34D"],
        mood: "Warm, inviting, inspiring",
      },
    ],
    suitableFor: ["creative", "agency", "art", "design"],
  },

  luxury: {
    name: "Luxury",
    description: "Premium, high-end design with elegant details",
    characteristics: [
      "premium materials",
      "elegant details",
      "sophisticated palette",
      "refined composition",
      "high-end aesthetics",
    ],
    colorPalettes: [
      {
        name: "Gold & Black",
        colors: ["#000000", "#1F2937", "#F59E0B", "#FDE68A"],
        mood: "Luxurious, exclusive, premium",
      },
      {
        name: "Royal Purple",
        colors: ["#4C1D95", "#7C3AED", "#C4B5FD", "#F3E8FF"],
        mood: "Elegant, prestigious, refined",
      },
    ],
    suitableFor: ["luxury", "premium", "jewelry", "high-end"],
  },

  playful: {
    name: "Playful",
    description: "Fun, energetic design with whimsical elements",
    characteristics: [
      "playful elements",
      "bright colors",
      "fun composition",
      "energetic vibes",
      "approachable aesthetics",
    ],
    colorPalettes: [
      {
        name: "Candy Colors",
        colors: ["#EC4899", "#F59E0B", "#8B5CF6", "#10B981"],
        mood: "Fun, cheerful, energetic",
      },
      {
        name: "Pastel Rainbow",
        colors: ["#FCA5A5", "#FCD34D", "#86EFAC", "#93C5FD"],
        mood: "Playful, friendly, approachable",
      },
    ],
    suitableFor: ["kids", "entertainment", "food", "lifestyle"],
  },
};

/**
 * Get style definition by name
 */
export function getStyleDefinition(styleName: string): StyleDefinition {
  return STYLE_LIBRARY[styleName.toLowerCase()] || STYLE_LIBRARY.modern;
}

/**
 * Get all available styles
 */
export function getAllStyles(): StyleDefinition[] {
  return Object.values(STYLE_LIBRARY);
}

/**
 * Recommend style based on industry
 */
export function recommendStyleForIndustry(industry: string): StyleDefinition {
  const industryLower = industry.toLowerCase();

  if (industryLower.includes("tech") || industryLower.includes("saas")) {
    return STYLE_LIBRARY.modern;
  }
  if (industryLower.includes("luxury") || industryLower.includes("premium")) {
    return STYLE_LIBRARY.luxury;
  }
  if (industryLower.includes("wellness") || industryLower.includes("health")) {
    return STYLE_LIBRARY.organic;
  }
  if (industryLower.includes("corporate") || industryLower.includes("b2b")) {
    return STYLE_LIBRARY.professional;
  }
  if (industryLower.includes("creative") || industryLower.includes("agency")) {
    return STYLE_LIBRARY.creative;
  }
  if (industryLower.includes("kids") || industryLower.includes("children")) {
    return STYLE_LIBRARY.playful;
  }

  return STYLE_LIBRARY.modern; // Default
}

/**
 * Extract color palette from brand assets
 */
export function extractBrandColors(brandColors: string[]): ColorPalette {
  return {
    name: "Brand Colors",
    colors: brandColors,
    mood: "Brand-specific palette",
  };
}

/**
 * Generate complementary colors
 */
export function generateComplementaryColors(baseColor: string): string[] {
  // Remove # if present
  const hex = baseColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Generate complementary, triadic, and analogous colors
  const complementary = `#${(255 - r).toString(16).padStart(2, "0")}${(255 - g).toString(16).padStart(2, "0")}${(255 - b).toString(16).padStart(2, "0")}`;

  const lighter = `#${Math.min(255, r + 50).toString(16).padStart(2, "0")}${Math.min(255, g + 50).toString(16).padStart(2, "0")}${Math.min(255, b + 50).toString(16).padStart(2, "0")}`;

  const darker = `#${Math.max(0, r - 50).toString(16).padStart(2, "0")}${Math.max(0, g - 50).toString(16).padStart(2, "0")}${Math.max(0, b - 50).toString(16).padStart(2, "0")}`;

  return [baseColor, complementary, lighter, darker];
}

/**
 * Validate color palette
 */
export function validateColorPalette(colors: string[]): boolean {
  if (colors.length < 1 || colors.length > 5) {
    return false;
  }

  // Check valid hex colors
  const hexRegex = /^#?([0-9A-Fa-f]{6})$/;
  return colors.every((color) => hexRegex.test(color));
}
