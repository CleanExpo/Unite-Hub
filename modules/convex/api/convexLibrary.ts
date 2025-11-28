/**
 * CONVEX Strategy Library API
 *
 * Backend access to CONVEX marketing intelligence frameworks,
 * reasoning patterns, and execution templates.
 */

import fs from "fs";
import path from "path";

// Types
export interface ConvexFramework {
  id: string;
  name: string;
  category: string;
  description: string;
  principles: string[];
  applications: string[];
  kpis?: string[];
  triggers?: Record<string, unknown>;
}

export interface ReasoningPattern {
  id: string;
  name: string;
  description: string;
  steps: string[];
  inputs: string[];
  outputs: string[];
}

export interface ExecutionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: {
    name: string;
    label: string;
    type: "text" | "textarea" | "select";
    placeholder: string;
    required: boolean;
    options?: string[];
  }[];
}

export interface ConvexStrategy {
  id: string;
  name: string;
  framework: string;
  status: "draft" | "active" | "completed";
  score: number;
  inputs: Record<string, string>;
  outputs: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
}

// Module paths
const CONVEX_MODULE_PATH = path.join(process.cwd(), "modules", "convex");
const STRATEGY_LIBRARY_PATH = path.join(CONVEX_MODULE_PATH, "strategy_library.json");
const REASONING_PATTERNS_PATH = path.join(CONVEX_MODULE_PATH, "reasoning_patterns.json");
const TEMPLATES_PATH = path.join(CONVEX_MODULE_PATH, "execution_templates");

// Cache for loaded data
let strategyLibraryCache: Record<string, ConvexFramework[]> | null = null;
let reasoningPatternsCache: Record<string, ReasoningPattern[]> | null = null;

/**
 * Load the CONVEX strategy library
 */
export function loadStrategyLibrary(): Record<string, ConvexFramework[]> {
  if (strategyLibraryCache) {
    return strategyLibraryCache;
  }

  try {
    const data = fs.readFileSync(STRATEGY_LIBRARY_PATH, "utf-8");
    strategyLibraryCache = JSON.parse(data);
    return strategyLibraryCache!;
  } catch (error) {
    console.error("Failed to load CONVEX strategy library:", error);
    return {};
  }
}

/**
 * Load CONVEX reasoning patterns
 */
export function loadReasoningPatterns(): Record<string, ReasoningPattern[]> {
  if (reasoningPatternsCache) {
    return reasoningPatternsCache;
  }

  try {
    const data = fs.readFileSync(REASONING_PATTERNS_PATH, "utf-8");
    reasoningPatternsCache = JSON.parse(data);
    return reasoningPatternsCache!;
  } catch (error) {
    console.error("Failed to load CONVEX reasoning patterns:", error);
    return {};
  }
}

/**
 * Get all framework categories
 */
export function getFrameworkCategories(): string[] {
  const library = loadStrategyLibrary();
  return Object.keys(library);
}

/**
 * Get frameworks by category
 */
export function getFrameworksByCategory(category: string): ConvexFramework[] {
  const library = loadStrategyLibrary();
  return library[category] || [];
}

/**
 * Get a specific framework by ID
 */
export function getFrameworkById(frameworkId: string): ConvexFramework | null {
  const library = loadStrategyLibrary();

  for (const category of Object.values(library)) {
    const framework = category.find(f => f.id === frameworkId);
    if (framework) {
      return framework;
    }
  }

  return null;
}

/**
 * Search frameworks by keyword
 */
export function searchFrameworks(query: string): ConvexFramework[] {
  const library = loadStrategyLibrary();
  const results: ConvexFramework[] = [];
  const lowerQuery = query.toLowerCase();

  for (const category of Object.values(library)) {
    for (const framework of category) {
      if (
        framework.name.toLowerCase().includes(lowerQuery) ||
        framework.description.toLowerCase().includes(lowerQuery) ||
        framework.principles?.some(p => p.toLowerCase().includes(lowerQuery))
      ) {
        results.push(framework);
      }
    }
  }

  return results;
}

/**
 * Get reasoning pattern by ID
 */
export function getReasoningPattern(patternId: string): ReasoningPattern | null {
  const patterns = loadReasoningPatterns();

  for (const category of Object.values(patterns)) {
    const pattern = category.find(p => p.id === patternId);
    if (pattern) {
      return pattern;
    }
  }

  return null;
}

/**
 * Load execution template
 */
export function loadExecutionTemplate(templateId: string): ExecutionTemplate | null {
  try {
    const templatePath = path.join(TEMPLATES_PATH, `${templateId}.json`);
    const data = fs.readFileSync(templatePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to load template ${templateId}:`, error);
    return null;
  }
}

/**
 * Get all available execution templates
 */
export function getAvailableTemplates(): string[] {
  try {
    const files = fs.readdirSync(TEMPLATES_PATH);
    return files
      .filter(f => f.endsWith(".json"))
      .map(f => f.replace(".json", ""));
  } catch (error) {
    console.error("Failed to list execution templates:", error);
    return [];
  }
}

/**
 * Apply CONVEX framework to generate strategy output
 */
export async function applyFramework(
  frameworkId: string,
  inputs: Record<string, string>
): Promise<{
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
}> {
  const framework = getFrameworkById(frameworkId);

  if (!framework) {
    return { success: false, error: `Framework not found: ${frameworkId}` };
  }

  try {
    // Generate output based on framework type
    const output: Record<string, unknown> = {
      framework: framework.name,
      category: framework.category,
      appliedPrinciples: framework.principles,
      recommendations: generateRecommendations(framework, inputs),
      actionItems: generateActionItems(framework, inputs),
      kpis: framework.kpis || [],
      generatedAt: new Date().toISOString()
    };

    return { success: true, output };
  } catch (error) {
    console.error("Framework application failed:", error);
    return { success: false, error: "Failed to apply framework" };
  }
}

/**
 * Generate recommendations based on framework and inputs
 */
function generateRecommendations(
  framework: ConvexFramework,
  inputs: Record<string, string>
): string[] {
  const recommendations: string[] = [];

  // Map framework principles to actionable recommendations
  for (const principle of framework.principles || []) {
    recommendations.push(
      `Apply "${principle}" to your ${inputs.product_name || inputs.primary_keyword || "offering"}`
    );
  }

  // Add category-specific recommendations
  switch (framework.category) {
    case "brand_positioning":
      recommendations.push(
        "Conduct competitor positioning analysis",
        "Define unique value proposition",
        "Create brand messaging hierarchy"
      );
      break;
    case "funnel_design":
      recommendations.push(
        "Map customer journey stages",
        "Identify friction points",
        "Optimize conversion touchpoints"
      );
      break;
    case "seo_patterns":
      recommendations.push(
        "Build semantic content clusters",
        "Implement schema markup",
        "Create pillar content strategy"
      );
      break;
    case "competitor_model":
      recommendations.push(
        "Monitor competitor positioning shifts",
        "Identify market gaps",
        "Develop counterplay strategies"
      );
      break;
    case "offer_architecture":
      recommendations.push(
        "Structure value ladder",
        "Design offer stack",
        "Implement risk reversal"
      );
      break;
  }

  return recommendations;
}

/**
 * Generate action items from framework application
 */
function generateActionItems(
  framework: ConvexFramework,
  inputs: Record<string, string>
): { priority: "high" | "medium" | "low"; action: string; timeline: string }[] {
  const actions: { priority: "high" | "medium" | "low"; action: string; timeline: string }[] = [];

  // Generate priority actions based on framework
  if (framework.applications) {
    for (let i = 0; i < Math.min(framework.applications.length, 5); i++) {
      actions.push({
        priority: i < 2 ? "high" : i < 4 ? "medium" : "low",
        action: framework.applications[i],
        timeline: i < 2 ? "This week" : i < 4 ? "This month" : "Next quarter"
      });
    }
  }

  return actions;
}

/**
 * Clear cached data (useful for development/testing)
 */
export function clearCache(): void {
  strategyLibraryCache = null;
  reasoningPatternsCache = null;
}

/**
 * Get CONVEX module statistics
 */
export function getModuleStats(): {
  frameworkCount: number;
  categoryCount: number;
  patternCount: number;
  templateCount: number;
} {
  const library = loadStrategyLibrary();
  const patterns = loadReasoningPatterns();
  const templates = getAvailableTemplates();

  let frameworkCount = 0;
  for (const category of Object.values(library)) {
    frameworkCount += category.length;
  }

  let patternCount = 0;
  for (const category of Object.values(patterns)) {
    patternCount += category.length;
  }

  return {
    frameworkCount,
    categoryCount: Object.keys(library).length,
    patternCount,
    templateCount: templates.length
  };
}
