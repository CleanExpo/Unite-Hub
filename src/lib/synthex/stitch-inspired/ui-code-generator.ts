/**
 * Gemini 3 Pro UI Code Generator
 * Generates React/Next.js components from natural language prompts
 * Emulates Google Stitch functionality using Gemini API
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export type UIFramework = "react" | "nextjs";
export type StylingFramework = "tailwind" | "css-modules";

export interface UIGenerationRequest {
  prompt: string; // "Landing page for plumbing business with hero, 3 features, CTA"
  framework?: UIFramework; // Defaults to 'nextjs'
  styling?: StylingFramework; // Defaults to 'tailwind'
  components?: string[]; // ["hero", "features", "cta", "footer"]
  colorScheme?: {
    primary: string; // e.g., "#3b82f6"
    secondary: string;
    accent: string; // Brand color
  };
  refinements?: string[]; // ["make headline larger", "add testimonials"]
  previousCode?: string; // For refinement operations
  previousVersion?: number; // Track version history
}

export interface ComponentNode {
  name: string;
  type: string; // "hero", "section", "button", etc.
  children?: ComponentNode[];
  props?: Record<string, unknown>;
}

export interface UIGenerationResult {
  code: string; // Full React component code
  componentTree: ComponentNode[]; // Structure for preview
  assets: {
    tailwindConfig?: string;
    typescript: boolean;
  };
  metadata: {
    tokensUsed: number;
    cost: number; // Estimated cost in cents
    generatedAt: string;
    framework: UIFramework;
    styling: StylingFramework;
  };
}

let geminiClient: GoogleGenerativeAI | null = null;
let geminiClientTimestamp = 0;
const GEMINI_CLIENT_TTL = 60000;

function getGeminiClient(): GoogleGenerativeAI {
  const now = Date.now();
  if (
    !geminiClient ||
    now - geminiClientTimestamp > GEMINI_CLIENT_TTL
  ) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY env var not set");
    }
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    geminiClientTimestamp = now;
  }
  return geminiClient;
}

/**
 * Generate UI code from natural language prompt
 */
export async function generateUICode(
  request: UIGenerationRequest
): Promise<UIGenerationResult> {
  const framework = request.framework || "nextjs";
  const styling = request.styling || "tailwind";
  const gemini = getGeminiClient();

  // Get model
  const model = gemini.getGenerativeModel({ model: "gemini-3-pro" });

  // Build prompts
  const systemPrompt = buildSystemPrompt(framework, styling, request.colorScheme);
  const userPrompt = buildUserPrompt(request, framework, styling);

  // Call Gemini 3 Pro
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemPrompt + "\n\n" + userPrompt,
          },
        ],
      },
    ],
  });

  const response = result.response;
  const textContent = response.text();

  const code = extractCodeBlock(textContent);
  const componentTree = parseComponentStructure(code);

  // Generate Tailwind config if needed
  const tailwindConfig =
    styling === "tailwind"
      ? generateTailwindConfig(request.colorScheme)
      : undefined;

  // Get token usage from response
  const tokenCount = result.response.usageMetadata || {
    promptTokenCount: 0,
    candidatesTokenCount: 0,
  };

  return {
    code,
    componentTree,
    assets: {
      tailwindConfig,
      typescript: true,
    },
    metadata: {
      tokensUsed:
        tokenCount.promptTokenCount + (tokenCount.candidatesTokenCount || 0),
      cost: calculateGeminiCost(
        tokenCount.promptTokenCount || 0,
        tokenCount.candidatesTokenCount || 0
      ),
      generatedAt: new Date().toISOString(),
      framework,
      styling,
    },
  };
}

/**
 * Refine existing UI code based on iterative feedback
 */
export async function refineUICode(
  request: UIGenerationRequest & { previousCode: string }
): Promise<UIGenerationResult> {
  if (!request.previousCode) {
    throw new Error("previousCode required for refinement");
  }

  const framework = request.framework || "nextjs";
  const styling = request.styling || "tailwind";
  const gemini = getGeminiClient();

  const model = gemini.getGenerativeModel({ model: "gemini-3-pro" });
  const systemPrompt = buildRefinementSystemPrompt(framework, styling);
  const userPrompt = buildRefinementPrompt(request);

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemPrompt + "\n\n" + userPrompt,
          },
        ],
      },
    ],
  });

  const response = result.response;
  const textContent = response.text();

  const code = extractCodeBlock(textContent);
  const componentTree = parseComponentStructure(code);

  const tokenCount = result.response.usageMetadata || {
    promptTokenCount: 0,
    candidatesTokenCount: 0,
  };

  return {
    code,
    componentTree,
    assets: {
      tailwindConfig:
        styling === "tailwind"
          ? generateTailwindConfig(request.colorScheme)
          : undefined,
      typescript: true,
    },
    metadata: {
      tokensUsed:
        tokenCount.promptTokenCount + (tokenCount.candidatesTokenCount || 0),
      cost: calculateGeminiCost(
        tokenCount.promptTokenCount || 0,
        tokenCount.candidatesTokenCount || 0
      ),
      generatedAt: new Date().toISOString(),
      framework,
      styling,
    },
  };
}

/**
 * Validate generated code for quality and accessibility
 */
export async function validateGeneratedCode(code: string): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  accessibilityScore: number; // 0-100
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let accessibilityScore = 100;

  // Check TypeScript syntax
  if (!code.includes("export default")) {
    errors.push("Missing export default component");
  }

  // Check for hard-coded colors
  const colorPattern = /#[0-9a-f]{6}|rgb\(/gi;
  const hardCodedColors = code.match(colorPattern);
  if (hardCodedColors && hardCodedColors.length > 3) {
    warnings.push(`Found ${hardCodedColors.length} hard-coded colors - use Tailwind theme instead`);
    accessibilityScore -= 10;
  }

  // Check for accessibility attributes
  if (code.includes("<button") && !code.includes("aria-label")) {
    warnings.push("Buttons missing aria-label attributes");
    accessibilityScore -= 5;
  }

  if (code.includes("<img") && !code.includes("alt=")) {
    errors.push("Images missing alt text");
    accessibilityScore -= 15;
  }

  // Check for responsive design
  if (!code.includes("md:") && !code.includes("lg:")) {
    warnings.push("No responsive breakpoints detected");
    accessibilityScore -= 10;
  }

  // Check for semantic HTML
  const semanticTags = ["header", "nav", "main", "section", "article", "footer"];
  const usesSemanticHTML = semanticTags.some((tag) =>
    code.includes(`<${tag}`)
  );
  if (!usesSemanticHTML) {
    warnings.push("Consider using semantic HTML elements");
    accessibilityScore -= 5;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    accessibilityScore: Math.max(0, accessibilityScore),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildSystemPrompt(
  framework: UIFramework,
  styling: StylingFramework,
  colorScheme?: { primary: string; secondary: string; accent: string }
): string {
  return `You are an expert UI/UX designer and ${framework} developer. Generate production-ready component code.

REQUIREMENTS:
1. Use ${framework === "nextjs" ? "Next.js 15 with App Router" : "React 19"} with TypeScript (strict mode)
2. Use ${styling === "tailwind" ? "Tailwind CSS v3" : "CSS Modules"} for styling
3. Ensure full responsiveness (mobile-first, md: and lg: breakpoints)
4. Implement proper accessibility:
   - Semantic HTML (header, nav, main, section, footer)
   - ARIA labels for interactive elements
   - Alt text for all images
   - Focus states for keyboard navigation
5. No hard-coded colors - use design tokens/Tailwind theme
6. Include TypeScript interfaces for props
7. Use meaningful component names
8. Optimize for performance (no unnecessary re-renders)
${
  colorScheme
    ? `
9. Use this color scheme:
   - Primary: ${colorScheme.primary}
   - Secondary: ${colorScheme.secondary}
   - Accent: ${colorScheme.accent}
`
    : ""
}

OUTPUT FORMAT:
\`\`\`tsx
// Your complete component code here
\`\`\``;
}

function buildUserPrompt(
  request: UIGenerationRequest,
  framework: UIFramework,
  styling: StylingFramework
): string {
  let prompt = `Create a ${framework} component for:\n${request.prompt}`;

  if (request.components && request.components.length > 0) {
    prompt += `\n\nInclude these sections: ${request.components.join(", ")}`;
  }

  if (request.refinements && request.refinements.length > 0) {
    prompt += `\n\nApply these refinements:\n${request.refinements.map((r) => `- ${r}`).join("\n")}`;
  }

  return prompt;
}

function buildRefinementSystemPrompt(
  framework: UIFramework,
  styling: StylingFramework
): string {
  return `You are refining an existing ${framework} component.
IMPORTANT: Only modify the specified sections. Keep the rest of the code unchanged.
Return the COMPLETE updated component, not just the changed parts.
Use the same framework (${framework}) and styling (${styling}) as the original.`;
}

function buildRefinementPrompt(request: UIGenerationRequest): string {
  if (!request.refinements || request.refinements.length === 0) {
    throw new Error("No refinements specified");
  }

  return `Previous component:
\`\`\`tsx
${request.previousCode}
\`\`\`

Apply these changes:
${request.refinements.map((r) => `- ${r}`).join("\n")}

Return the complete updated component.`;
}

function extractCodeBlock(text: string): string {
  const match = text.match(/```(?:tsx?|jsx?)?\n([\s\S]*?)```/);
  if (!match) {
    throw new Error("Could not extract code block from response");
  }
  return match[1].trim();
}

function parseComponentStructure(code: string): ComponentNode[] {
  // Simple parser to extract JSX structure
  // This is a basic implementation - a full parser would use AST
  const nodes: ComponentNode[] = [];

  const componentPatterns = [
    { regex: /<header[^>]*>/g, type: "header" },
    { regex: /<nav[^>]*>/g, type: "nav" },
    { regex: /<main[^>]*>/g, type: "main" },
    { regex: /<section[^>]*>/g, type: "section" },
    { regex: /<article[^>]*>/g, type: "article" },
    { regex: /<footer[^>]*>/g, type: "footer" },
    { regex: /<div[^>]*className="[^"]*hero[^"]*"[^>]*>/g, type: "hero" },
    { regex: /<div[^>]*className="[^"]*features[^"]*"[^>]*>/g, type: "features" },
    { regex: /<button[^>]*>/g, type: "button" },
  ];

  for (const pattern of componentPatterns) {
    const matches = code.match(pattern.regex);
    if (matches) {
      matches.forEach((match) => {
        nodes.push({
          name: pattern.type,
          type: pattern.type,
        });
      });
    }
  }

  return nodes;
}

function generateTailwindConfig(
  colorScheme?: {
    primary: string;
    secondary: string;
    accent: string;
  }
): string {
  const colors = colorScheme
    ? `
    colors: {
      primary: '${colorScheme.primary}',
      secondary: '${colorScheme.secondary}',
      accent: '${colorScheme.accent}',
    },`
    : "";

  return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {${colors}
    },
  },
  plugins: [],
}`;
}

function calculateGeminiCost(inputTokens: number, outputTokens: number): number {
  // Gemini 3 Pro pricing (Jan 2026): $0.00075/1K input, $0.003/1K output (in cents)
  const inputCost = (inputTokens * 0.075) / 1000;
  const outputCost = (outputTokens * 0.3) / 1000;
  return Math.round((inputCost + outputCost) * 100); // Return in cents
}
