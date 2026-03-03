/* ----------------------------------------
   Pattern Validator
   ----------------------------------------
   Quality assurance system for detecting
   forbidden generic patterns and ensuring
   design system compliance.
   ---------------------------------------- */

/* ----------------------------------------
   Forbidden Pattern Definitions
   ---------------------------------------- */
export interface ForbiddenPattern {
  id: string;
  name: string;
  category: "color" | "spacing" | "typography" | "component" | "layout" | "icon" | "image";
  description: string;
  detector: RegExp | ((content: string) => boolean);
  severity: "error" | "warning" | "info";
  suggestion: string;
}

export const forbiddenPatterns: ForbiddenPattern[] = [
  // Color Patterns
  {
    id: "raw-blue-500",
    name: "Raw Tailwind Blue",
    category: "color",
    description: "Using raw blue-500 instead of brand colors",
    detector: /\b(bg|text|border|ring|shadow)-blue-500\b/g,
    severity: "error",
    suggestion: "Use brand-primary, brand-secondary, or brand-accent instead",
  },
  {
    id: "raw-gray-palette",
    name: "Raw Gray Palette",
    category: "color",
    description: "Using raw gray instead of semantic neutrals",
    detector: /\b(bg|text|border)-gray-(100|200|300|400|500|600|700|800|900)\b/g,
    severity: "warning",
    suggestion: "Use muted, muted-foreground, or card for neutral colors",
  },
  {
    id: "hardcoded-hex",
    name: "Hardcoded Hex Colors",
    category: "color",
    description: "Using hardcoded hex colors instead of CSS variables",
    detector: /\b(bg|text|border|fill|stroke)-\[#[A-Fa-f0-9]{3,6}\]/g,
    severity: "error",
    suggestion: "Use design system color tokens (brand-primary, success, etc.)",
  },
  {
    id: "raw-indigo",
    name: "Raw Indigo Palette",
    category: "color",
    description: "Using raw indigo instead of brand colors",
    detector: /\b(bg|text|border)-indigo-(100|200|300|400|500|600|700|800|900)\b/g,
    severity: "error",
    suggestion: "Use brand colors instead of raw indigo",
  },

  // Typography Patterns
  {
    id: "raw-font-size",
    name: "Raw Font Size",
    category: "typography",
    description: "Using pixel-based font sizes",
    detector: /\btext-\[\d+px\]/g,
    severity: "warning",
    suggestion: "Use Tailwind text scale (text-sm, text-base, text-lg, etc.)",
  },
  {
    id: "missing-tracking",
    name: "Missing Letter Spacing",
    category: "typography",
    description: "Headings without tracking classes",
    detector: (content: string) => {
      // Check if there's a heading class without tracking
      const hasHeading = /text-(4xl|5xl|6xl|7xl)/.test(content);
      const hasTracking = /tracking-(tight|tighter|normal)/.test(content);
      return hasHeading && !hasTracking;
    },
    severity: "info",
    suggestion: "Add tracking-tight for large headings",
  },

  // Spacing Patterns
  {
    id: "inconsistent-padding",
    name: "Inconsistent Padding",
    category: "spacing",
    description: "Using non-standard padding values",
    detector: /\bp-(1|3|5|7|9|11)\b/g,
    severity: "info",
    suggestion: "Prefer spacing scale (2, 4, 6, 8, 10, 12, 16, 20, 24)",
  },
  {
    id: "raw-pixel-spacing",
    name: "Raw Pixel Spacing",
    category: "spacing",
    description: "Using pixel-based spacing",
    detector: /\b(p|m|gap|space)(-[xy])?-\[\d+px\]/g,
    severity: "warning",
    suggestion: "Use Tailwind spacing scale instead of pixel values",
  },

  // Component Patterns
  {
    id: "generic-button",
    name: "Generic Button Styles",
    category: "component",
    description: "Using generic button styles instead of Button component",
    detector: /\bbg-blue-500 hover:bg-blue-600\b/g,
    severity: "error",
    suggestion: "Use the Button component with appropriate variant",
  },
  {
    id: "missing-focus-ring",
    name: "Missing Focus Ring",
    category: "component",
    description: "Interactive elements without focus states",
    detector: (content: string) => {
      const hasInteractive = /\b(button|onClick|href)\b/i.test(content);
      const hasFocusState = /\bfocus(-visible)?:/i.test(content);
      return hasInteractive && !hasFocusState;
    },
    severity: "warning",
    suggestion: "Add focus-visible:ring-2 focus-visible:ring-ring for accessibility",
  },
  {
    id: "raw-rounded",
    name: "Inconsistent Border Radius",
    category: "component",
    description: "Using non-standard border radius",
    detector: /\brounded-\[\d+px\]/g,
    severity: "info",
    suggestion: "Use Tailwind rounded scale (rounded-md, rounded-lg, rounded-xl)",
  },

  // Layout Patterns
  {
    id: "hardcoded-width",
    name: "Hardcoded Width",
    category: "layout",
    description: "Using hardcoded pixel widths",
    detector: /\bw-\[\d+px\]/g,
    severity: "warning",
    suggestion: "Use responsive width classes or max-w-* containers",
  },
  {
    id: "missing-container",
    name: "Missing Container",
    category: "layout",
    description: "Section without container constraints",
    detector: (content: string) => {
      const hasSection = /<section[^>]*>/i.test(content);
      const hasContainer = /container|max-w-/i.test(content);
      return hasSection && !hasContainer;
    },
    severity: "info",
    suggestion: "Wrap section content in container or max-w-* for consistent widths",
  },

  // Icon Patterns
  {
    id: "raw-svg-size",
    name: "Raw SVG Size",
    category: "icon",
    description: "Using pixel sizes for icons",
    detector: /\b(h|w)-\[\d+px\]/g,
    severity: "info",
    suggestion: "Use h-4, h-5, h-6 for consistent icon sizing",
  },

  // Image Patterns
  {
    id: "missing-alt",
    name: "Missing Alt Text",
    category: "image",
    description: "Images without alt attributes",
    detector: /<img[^>]*(?!alt=)[^>]*>/g,
    severity: "error",
    suggestion: "Add descriptive alt text for accessibility",
  },
  {
    id: "placeholder-image",
    name: "Placeholder Image",
    category: "image",
    description: "Using placeholder.com or similar generic images",
    detector: /(placeholder\.com|via\.placeholder|placehold\.it|picsum\.photos)/g,
    severity: "warning",
    suggestion: "Use generated images via useImageGeneration hook or custom assets",
  },
];

/* ----------------------------------------
   Validation Result Types
   ---------------------------------------- */
export interface ValidationIssue {
  pattern: ForbiddenPattern;
  matches: string[];
  line?: number;
  column?: number;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/* ----------------------------------------
   Validator Class
   ---------------------------------------- */
export class PatternValidator {
  private patterns: ForbiddenPattern[];
  private customPatterns: ForbiddenPattern[] = [];

  constructor(patterns: ForbiddenPattern[] = forbiddenPatterns) {
    this.patterns = patterns;
  }

  addPattern(pattern: ForbiddenPattern): void {
    this.customPatterns.push(pattern);
  }

  removePattern(id: string): void {
    this.patterns = this.patterns.filter((p) => p.id !== id);
    this.customPatterns = this.customPatterns.filter((p) => p.id !== id);
  }

  getAllPatterns(): ForbiddenPattern[] {
    return [...this.patterns, ...this.customPatterns];
  }

  validate(content: string): ValidationResult {
    const allPatterns = this.getAllPatterns();
    const issues: ValidationIssue[] = [];

    for (const pattern of allPatterns) {
      const matches: string[] = [];

      if (pattern.detector instanceof RegExp) {
        const regex = new RegExp(pattern.detector.source, pattern.detector.flags);
        let match;
        while ((match = regex.exec(content)) !== null) {
          matches.push(match[0]);
        }
      } else if (typeof pattern.detector === "function") {
        if (pattern.detector(content)) {
          matches.push("[Pattern detected]");
        }
      }

      if (matches.length > 0) {
        issues.push({
          pattern,
          matches: [...new Set(matches)], // Remove duplicates
        });
      }
    }

    const summary = {
      errors: issues.filter((i) => i.pattern.severity === "error").length,
      warnings: issues.filter((i) => i.pattern.severity === "warning").length,
      info: issues.filter((i) => i.pattern.severity === "info").length,
    };

    // Calculate score (100 - deductions)
    // Errors: -10, Warnings: -5, Info: -2
    const score = Math.max(
      0,
      100 - summary.errors * 10 - summary.warnings * 5 - summary.info * 2
    );

    return {
      isValid: summary.errors === 0,
      score,
      issues,
      summary,
    };
  }

  validateFile(content: string, filename: string): ValidationResult & { filename: string } {
    const result = this.validate(content);
    return { ...result, filename };
  }

  formatReport(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push("----------------------------------------");
    lines.push("Design System Validation Report");
    lines.push("----------------------------------------");
    lines.push("");
    lines.push(`Score: ${result.score}/100`);
    lines.push(`Status: ${result.isValid ? "PASSED" : "FAILED"}`);
    lines.push("");
    lines.push(`Errors: ${result.summary.errors}`);
    lines.push(`Warnings: ${result.summary.warnings}`);
    lines.push(`Info: ${result.summary.info}`);
    lines.push("");

    if (result.issues.length > 0) {
      lines.push("Issues:");
      lines.push("----------------------------------------");

      for (const issue of result.issues) {
        const icon =
          issue.pattern.severity === "error"
            ? "[ERROR]"
            : issue.pattern.severity === "warning"
            ? "[WARN]"
            : "[INFO]";

        lines.push(`${icon} ${issue.pattern.name}`);
        lines.push(`   Category: ${issue.pattern.category}`);
        lines.push(`   Description: ${issue.pattern.description}`);
        lines.push(`   Matches: ${issue.matches.slice(0, 5).join(", ")}${issue.matches.length > 5 ? "..." : ""}`);
        lines.push(`   Suggestion: ${issue.pattern.suggestion}`);
        lines.push("");
      }
    } else {
      lines.push("No issues found!");
    }

    return lines.join("\n");
  }
}

/* ----------------------------------------
   Singleton Instance
   ---------------------------------------- */
export const validator = new PatternValidator();

/* ----------------------------------------
   Quick Validation Functions
   ---------------------------------------- */
export function validateContent(content: string): ValidationResult {
  return validator.validate(content);
}

export function validateComponent(jsx: string): ValidationResult {
  return validator.validate(jsx);
}

export function isCompliant(content: string): boolean {
  return validator.validate(content).isValid;
}

export function getScore(content: string): number {
  return validator.validate(content).score;
}

/* ----------------------------------------
   React Hook for Development
   ---------------------------------------- */
export function usePatternValidation(content: string): ValidationResult {
  return validator.validate(content);
}

/* ----------------------------------------
   CLI Helper (for build-time validation)
   ---------------------------------------- */
export function printValidationReport(content: string, filename?: string): void {
  const result = filename
    ? validator.validateFile(content, filename)
    : validator.validate(content);

  console.log(validator.formatReport(result));

  if (!result.isValid) {
    console.log("\n⚠️  Fix errors before committing!\n");
  }
}
