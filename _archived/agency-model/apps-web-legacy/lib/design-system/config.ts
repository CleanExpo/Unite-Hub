/* ----------------------------------------
   Design System Configuration
   ----------------------------------------
   Central configuration for brand, typography,
   spacing, and component preferences.
   ---------------------------------------- */

/* ----------------------------------------
   Brand Configuration
   ---------------------------------------- */
export interface BrandConfig {
  name: string;
  industry: string;
  targetAudience: string;
  visualStyle: "modern" | "bold" | "elegant" | "playful" | "professional";
  colorScheme: "light" | "dark" | "adaptive";
  designTrend: "glassmorphism" | "neumorphism" | "flat" | "material" | "minimal";
  voice: {
    tone: "professional" | "friendly" | "authoritative" | "casual";
    languageStyle: "formal" | "conversational" | "technical";
  };
}

export const brandConfig: BrandConfig = {
  name: "PROJECT_NAME",
  industry: "Technology",
  targetAudience: "Professionals and businesses",
  visualStyle: "modern",
  colorScheme: "adaptive",
  designTrend: "minimal",
  voice: {
    tone: "professional",
    languageStyle: "conversational",
  },
};

/* ----------------------------------------
   Typography Configuration
   ---------------------------------------- */
export interface TypographyConfig {
  headings: Record<"h1" | "h2" | "h3" | "h4" | "h5" | "h6", string>;
  body: Record<"large" | "default" | "small", string>;
  special: Record<string, string>;
}

export const typographyConfig: TypographyConfig = {
  headings: {
    h1: "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
    h2: "text-3xl md:text-4xl font-semibold tracking-tight",
    h3: "text-2xl md:text-3xl font-semibold",
    h4: "text-xl md:text-2xl font-medium",
    h5: "text-lg md:text-xl font-medium",
    h6: "text-base md:text-lg font-medium",
  },
  body: {
    large: "text-lg leading-relaxed",
    default: "text-base leading-normal",
    small: "text-sm leading-snug",
  },
  special: {
    heroTagline: "text-xl md:text-2xl text-muted-foreground font-light",
    cardTitle: "text-lg font-semibold text-foreground",
    cardDescription: "text-sm text-muted-foreground leading-relaxed",
    ctaButton: "text-base font-semibold tracking-wide",
    caption: "text-xs text-muted-foreground",
    overline: "text-xs font-semibold uppercase tracking-widest text-muted-foreground",
  },
};

/* ----------------------------------------
   Spacing Configuration
   ---------------------------------------- */
export interface SpacingConfig {
  sections: Record<string, string>;
  container: string;
  cards: Record<string, string>;
  components: Record<string, string>;
}

export const spacingConfig: SpacingConfig = {
  sections: {
    vertical: "py-16 md:py-24 lg:py-32",
    verticalSmall: "py-8 md:py-12 lg:py-16",
    verticalLarge: "py-24 md:py-32 lg:py-40",
  },
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  cards: {
    padding: "p-6 md:p-8",
    gap: "gap-6 md:gap-8",
    grid: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  },
  components: {
    buttonPadding: "px-6 py-3 md:px-8 md:py-4",
    inputPadding: "px-4 py-3",
    iconSpacing: "mr-3",
  },
};

/* ----------------------------------------
   Component Preferences
   ---------------------------------------- */
export interface ComponentPreferences {
  uiFramework: string;
  styling: string;
  icons: string[];
  animations: string;
  forms: string;
}

export const componentPreferences: ComponentPreferences = {
  uiFramework: "shadcn/ui + custom extensions",
  styling: "Tailwind CSS v4 with CSS variables",
  icons: ["Custom generated", "Lucide React", "Heroicons"],
  animations: "CSS animations + Framer Motion for complex",
  forms: "React Hook Form + Zod validation",
};

/* ----------------------------------------
   Color Tokens (for reference)
   ---------------------------------------- */
export const colorTokens = {
  brand: {
    primary: "hsl(var(--brand-primary))",
    secondary: "hsl(var(--brand-secondary))",
    accent: "hsl(var(--brand-accent))",
  },
  semantic: {
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    error: "hsl(var(--error))",
    info: "hsl(var(--info))",
  },
  surface: {
    elevated: "hsl(var(--surface-elevated))",
    recessed: "hsl(var(--surface-recessed))",
    overlay: "hsl(var(--surface-overlay))",
  },
} as const;

/* ----------------------------------------
   Animation Tokens (for reference)
   ---------------------------------------- */
export const animationTokens = {
  timing: {
    spring: "var(--ease-spring)",
    smooth: "var(--ease-smooth)",
    bounce: "var(--ease-bounce)",
    outExpo: "var(--ease-out-expo)",
  },
  duration: {
    fast: "var(--duration-fast)",
    normal: "var(--duration-normal)",
    slow: "var(--duration-slow)",
  },
} as const;

/* ----------------------------------------
   Full Design System Export
   ---------------------------------------- */
export const designSystem = {
  brand: brandConfig,
  typography: typographyConfig,
  spacing: spacingConfig,
  components: componentPreferences,
  colors: colorTokens,
  animation: animationTokens,
} as const;

export type DesignSystem = typeof designSystem;

/* ----------------------------------------
   Helper Functions
   ---------------------------------------- */
export function getHeadingClasses(level: keyof TypographyConfig["headings"]): string {
  return typographyConfig.headings[level];
}

export function getBodyClasses(size: keyof TypographyConfig["body"]): string {
  return typographyConfig.body[size];
}

export function getSpecialClasses(type: string): string {
  return typographyConfig.special[type] || "";
}

export function getSectionSpacing(size: "small" | "default" | "large" = "default"): string {
  switch (size) {
    case "small":
      return spacingConfig.sections.verticalSmall;
    case "large":
      return spacingConfig.sections.verticalLarge;
    default:
      return spacingConfig.sections.vertical;
  }
}

export function getContainerClasses(): string {
  return spacingConfig.container;
}
