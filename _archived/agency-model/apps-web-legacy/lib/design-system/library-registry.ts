/* ----------------------------------------
   UI Library Registry
   ----------------------------------------
   Central registry for UI component libraries
   with sourcing preferences and integration patterns.
   ---------------------------------------- */

/* ----------------------------------------
   Library Types
   ---------------------------------------- */
export interface UILibrary {
  name: string;
  url: string;
  type: string;
  strengths: string[];
  useFor: string[];
  integration: string;
  priority: number; // Lower = higher priority
}

export type ComponentCategory =
  | "hero"
  | "features"
  | "pricing"
  | "testimonials"
  | "cta"
  | "navigation"
  | "footer"
  | "cards"
  | "forms"
  | "modals"
  | "tables"
  | "charts"
  | "animations"
  | "ai-interface"
  | "icons";

/* ----------------------------------------
   Primary Libraries
   ---------------------------------------- */
export const primaryLibraries: Record<string, UILibrary> = {
  styleUI: {
    name: "StyleUI",
    url: "https://www.styleui.dev/",
    type: "shadcn/ui extension",
    strengths: [
      "Pre-built sections (heroes, features, pricing)",
      "Full page templates (dashboards, landing pages)",
      "Beautiful, accessible components",
    ],
    useFor: ["Hero sections", "Feature grids", "Pricing tables", "Complete page layouts"],
    integration: "Copy-paste, shadcn-compatible",
    priority: 1,
  },
  kokonutUI: {
    name: "KokonutUI",
    url: "https://kokonutui.com/",
    type: "Tailwind + shadcn + Motion",
    strengths: [
      "100+ beautiful modern components",
      "Built with Framer Motion animations",
      "Design system focused",
    ],
    useFor: [
      "Interactive components with motion",
      "Modern card designs",
      "Animated interfaces",
      "Upload/file components",
    ],
    integration: "Copy-paste with Motion dependency",
    priority: 2,
  },
  cultUI: {
    name: "Cult UI",
    url: "https://www.cult-ui.com/",
    type: "shadcn-compatible blocks & templates",
    strengths: [
      "AI SDK agent patterns (orchestrator, routing, multi-step)",
      "Gemini Flash integration blocks",
      "Full-stack Next.js templates",
      "Design engineer focused",
    ],
    useFor: [
      "AI chat interfaces",
      "Agent orchestration UIs",
      "Image generation/editing interfaces",
      "Landing pages with animations",
      "SEO tools and dashboards",
    ],
    integration: "Copy-paste, includes AI SDK patterns",
    priority: 3,
  },
  motionPrimitives: {
    name: "Motion Primitives",
    url: "https://motion-primitives.com/",
    type: "Animation-focused UI kit",
    strengths: [
      "Beautifully designed motion components",
      "Easy copy-paste",
      "Open source",
      "Built for engineers and designers",
    ],
    useFor: [
      "Text animations (scramble, reveal, typewriter)",
      "Page transitions",
      "Micro-interactions",
      "Scroll-triggered animations",
      "Loading states",
    ],
    integration: "Copy-paste, Framer Motion based",
    priority: 4,
  },
  promptKit: {
    name: "Prompt Kit",
    url: "https://www.prompt-kit.com/",
    type: "AI interface building blocks",
    strengths: [
      "Core components for AI apps",
      "High-quality, accessible",
      "Customizable AI interfaces",
    ],
    useFor: [
      "Chat interfaces",
      "Prompt input fields",
      "AI response displays",
      "Message threading",
      "File upload for AI",
    ],
    integration: "shadcn-compatible, copy-paste",
    priority: 5,
  },
};

/* ----------------------------------------
   Secondary Libraries
   ---------------------------------------- */
export const secondaryLibraries: Record<string, UILibrary> = {
  magicUI: {
    name: "Magic UI",
    url: "https://magicui.design/",
    type: "Animated components + effects",
    strengths: [
      "50+ animated components",
      "Framer Motion based",
      "Beautiful micro-interactions",
    ],
    useFor: [
      "Landing page animations",
      "Background effects",
      "Text reveal effects",
      "Button hover states",
      "Card animations",
    ],
    integration: "Copy-paste",
    priority: 6,
  },
  aceternityUI: {
    name: "Aceternity UI",
    url: "https://ui.aceternity.com/",
    type: "React + Tailwind + Framer Motion",
    strengths: [
      "Stunning visual effects",
      "3D components",
      "Parallax effects",
      "Background animations",
    ],
    useFor: [
      "Hero sections with 3D effects",
      "Parallax scrolling",
      "Spotlight effects",
      "Animated gradients",
      "Bento grids",
    ],
    integration: "Copy-paste with dependencies",
    priority: 7,
  },
  tremor: {
    name: "Tremor",
    url: "https://www.tremor.so/",
    type: "Dashboard-focused UI",
    strengths: ["Charts and analytics", "Data-rich interfaces", "Internal tools"],
    useFor: ["Analytics dashboards", "KPI displays", "Data tables", "Metric cards"],
    integration: "npm install",
    priority: 8,
  },
};

/* ----------------------------------------
   Component-to-Library Mapping
   ---------------------------------------- */
export const componentSourceMap: Record<ComponentCategory, string[]> = {
  hero: ["styleUI", "kokonutUI", "aceternityUI"],
  features: ["styleUI", "kokonutUI", "cultUI"],
  pricing: ["styleUI", "kokonutUI"],
  testimonials: ["styleUI", "kokonutUI"],
  cta: ["styleUI", "kokonutUI", "magicUI"],
  navigation: ["kokonutUI", "styleUI"],
  footer: ["styleUI", "kokonutUI"],
  cards: ["kokonutUI", "styleUI", "magicUI"],
  forms: ["kokonutUI", "promptKit"],
  modals: ["kokonutUI", "styleUI"],
  tables: ["tremor", "kokonutUI"],
  charts: ["tremor"],
  animations: ["motionPrimitives", "magicUI", "aceternityUI"],
  "ai-interface": ["promptKit", "cultUI"],
  icons: ["Custom generated", "Lucide React"],
};

/* ----------------------------------------
   Library Lookup Functions
   ---------------------------------------- */
export function getLibraryForComponent(category: ComponentCategory): UILibrary[] {
  const libraryNames = componentSourceMap[category] || [];
  const allLibraries = { ...primaryLibraries, ...secondaryLibraries };

  return libraryNames
    .map((name) => allLibraries[name])
    .filter(Boolean)
    .sort((a, b) => a.priority - b.priority);
}

export function getPrimaryLibrary(category: ComponentCategory): UILibrary | null {
  const libraries = getLibraryForComponent(category);
  return libraries[0] || null;
}

export function getAllLibraries(): UILibrary[] {
  return [
    ...Object.values(primaryLibraries),
    ...Object.values(secondaryLibraries),
  ].sort((a, b) => a.priority - b.priority);
}

export function getLibraryByName(name: string): UILibrary | null {
  const allLibraries = { ...primaryLibraries, ...secondaryLibraries };
  return allLibraries[name] || null;
}

/* ----------------------------------------
   Sourcing Workflow
   ---------------------------------------- */
export interface SourcingRecommendation {
  category: ComponentCategory;
  primarySource: UILibrary | null;
  alternativeSources: UILibrary[];
  customGenerationRecommended: boolean;
  notes: string;
}

export function getSourcingRecommendation(
  category: ComponentCategory
): SourcingRecommendation {
  const libraries = getLibraryForComponent(category);
  const primary = libraries[0] || null;
  const alternatives = libraries.slice(1);

  // Check if custom generation is recommended
  const customRecommended =
    category === "icons" ||
    (category === "hero" && libraries.length === 0);

  let notes = "";
  if (primary) {
    notes = `Primary source: ${primary.name}. ${primary.integration}`;
  } else if (customRecommended) {
    notes = "Use Gemini image generation for custom assets.";
  } else {
    notes = "Consider custom implementation with shadcn/ui base.";
  }

  return {
    category,
    primarySource: primary,
    alternativeSources: alternatives,
    customGenerationRecommended: customRecommended,
    notes,
  };
}

/* ----------------------------------------
   Priority Hierarchy
   ---------------------------------------- */
export const sourcingHierarchy = [
  "1. Project custom components (/components/ui/)",
  "2. Generated via Gemini image pipeline",
  "3. Primary libraries (StyleUI, KokonutUI, Cult UI, Motion Primitives, Prompt Kit)",
  "4. Secondary libraries (Magic UI, Aceternity, Tremor)",
  "5. shadcn/ui base components",
  "NEVER: Generic defaults without customization",
] as const;

/* ----------------------------------------
   Integration Patterns
   ---------------------------------------- */
export const integrationPatterns = {
  copyPaste: {
    description: "Copy component code directly into project",
    steps: [
      "Find component in library",
      "Copy source code",
      "Paste into components directory",
      "Adjust imports and styling",
      "Update to use design tokens",
    ],
  },
  npmInstall: {
    description: "Install as npm dependency",
    steps: [
      "Install package: pnpm add [package]",
      "Import components as needed",
      "Override styles with design tokens",
      "Consider tree-shaking for bundle size",
    ],
  },
  customGeneration: {
    description: "Generate custom assets via Gemini",
    steps: [
      "Define asset requirements",
      "Use useImageGeneration hook",
      "Generate with brand constraints",
      "Save to public/images/",
      "Track in asset manifest",
    ],
  },
} as const;
