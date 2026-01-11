/**
 * Code Validator
 * Validates generated UI code for quality, accessibility, and best practices
 */

export interface CodeValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metrics: {
    accessibilityScore: number; // 0-100
    typeScriptScore: number; // 0-100
    performanceScore: number; // 0-100
    overallScore: number; // 0-100 (average)
  };
  suggestions: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  line?: number;
  severity: "error" | "warning";
}

export interface ValidationWarning {
  code: string;
  message: string;
  line?: number;
  suggestions: string[];
}

/**
 * Validate generated React/Next.js code
 */
export function validateCode(
  code: string,
  options?: {
    framework?: "react" | "nextjs";
    strict?: boolean;
  }
): CodeValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  let accessibilityScore = 100;
  let typeScriptScore = 100;
  let performanceScore = 100;

  // ===== TypeScript Checks =====
  const tsErrors = validateTypeScript(code);
  errors.push(...tsErrors.errors);
  typeScriptScore -= tsErrors.errors.length * 15;
  typeScriptScore = Math.max(0, typeScriptScore);

  // ===== Accessibility Checks =====
  const a11yIssues = validateAccessibility(code);
  errors.push(...a11yIssues.errors);
  warnings.push(...a11yIssues.warnings);
  accessibilityScore -= a11yIssues.errors.length * 20;
  accessibilityScore -= a11yIssues.warnings.length * 10;
  accessibilityScore = Math.max(0, accessibilityScore);

  // ===== Performance Checks =====
  const perfIssues = validatePerformance(code);
  warnings.push(...perfIssues.warnings);
  performanceScore -= perfIssues.warnings.length * 15;
  performanceScore = Math.max(0, performanceScore);

  // ===== Best Practices =====
  const practices = validateBestPractices(code, options?.framework);
  warnings.push(...practices.warnings);
  suggestions.push(...practices.suggestions);

  // ===== Code Quality =====
  const quality = validateCodeQuality(code);
  errors.push(...quality.errors);
  warnings.push(...quality.warnings);

  // Calculate overall score
  const overallScore = Math.round(
    (accessibilityScore + typeScriptScore + performanceScore) / 3
  );

  return {
    valid: errors.length === 0,
    errors: deduplicateIssues(errors),
    warnings: deduplicateIssues(warnings),
    metrics: {
      accessibilityScore: Math.max(0, accessibilityScore),
      typeScriptScore: Math.max(0, typeScriptScore),
      performanceScore: Math.max(0, performanceScore),
      overallScore,
    },
    suggestions: [...new Set(suggestions)], // Deduplicate
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateTypeScript(code: string): {
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  // Check for export default
  if (!code.includes("export default") && !code.includes("export function")) {
    errors.push({
      code: "NO_EXPORT",
      message: "Component must export a default component or function",
      severity: "error",
    });
  }

  // Check for proper imports
  if (!code.includes("import") && code.includes("React")) {
    errors.push({
      code: "MISSING_IMPORTS",
      message:
        "TypeScript imports are missing or incomplete. Import React if using React features.",
      severity: "error",
    });
  }

  // Check for untyped props
  const propsPattern = /interface\s+\w+Props|type\s+\w+Props/;
  const hasTypedProps =
    code.includes("interface") ||
    code.includes("type ") ||
    propsPattern.test(code);

  if (code.includes("function") && !hasTypedProps) {
    errors.push({
      code: "UNTYPED_PROPS",
      message:
        "Component props should be properly typed with TypeScript interfaces",
      severity: "error",
    });
  }

  // Check for any types
  const anyCount = (code.match(/:\s*any/g) || []).length;
  if (anyCount > 0) {
    errors.push({
      code: "ANY_TYPE",
      message: `Found ${anyCount} instances of 'any' type. Use specific types instead.`,
      severity: "error",
    });
  }

  return { errors };
}

function validateAccessibility(code: string): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check images have alt text
  const imgTags = code.match(/<img[^>]*>/g) || [];
  imgTags.forEach((img, i) => {
    if (!img.includes('alt="') && !img.includes("alt='")) {
      errors.push({
        code: "IMG_NO_ALT",
        message: `Image ${i + 1} missing alt text attribute`,
        severity: "error",
      });
    }
  });

  // Check buttons have accessible names
  const buttonTags = code.match(/<button[^>]*>/g) || [];
  buttonTags.forEach((btn, i) => {
    const hasLabel =
      btn.includes("aria-label") ||
      btn.includes("aria-labelledby") ||
      btn.match(/>([^<]+)<\/button/);
    if (!hasLabel) {
      warnings.push({
        code: "BTN_NO_LABEL",
        message: `Button ${i + 1} missing accessible name or aria-label`,
        suggestions: [
          "Add aria-label attribute or visible text content",
          "Use semantic button text like 'Submit' instead of 'Click here'",
        ],
      });
    }
  });

  // Check heading hierarchy
  const headings = code.match(/<h[1-6]/g) || [];
  if (headings.length === 0 && code.includes("<header")) {
    warnings.push({
      code: "NO_HEADINGS",
      message: "Page content should have proper heading hierarchy (h1-h6)",
      suggestions: ["Add at least one h1 heading", "Structure content with h2/h3 subheadings"],
    });
  }

  // Check for form labels
  const inputs = code.match(/<input[^>]*>/g) || [];
  inputs.forEach((input, i) => {
    if (!input.includes("aria-label") && !code.includes(`<label for=`)) {
      warnings.push({
        code: "INPUT_NO_LABEL",
        message: `Input field ${i + 1} missing associated label`,
        suggestions: [
          "Use <label htmlFor=\"inputId\"> associated with input",
          "Or add aria-label to the input",
        ],
      });
    }
  });

  // Check for keyboard navigation
  if (code.includes("onClick") && !code.includes("onKeyDown")) {
    warnings.push({
      code: "NO_KEYBOARD_SUPPORT",
      message: "Click handlers should include keyboard support (onKeyDown/onKeyUp)",
      suggestions: ["Add keyboard event handlers for accessibility"],
    });
  }

  // Check contrast (hard to automate, but warn if using very light/dark combos)
  if (code.includes("#fff") && code.includes("#f")) {
    warnings.push({
      code: "CONTRAST_WARNING",
      message: "Light text on light background may have contrast issues",
      suggestions: [
        "Use WCAG AAA contrast ratios (4.5:1 for normal text)",
        "Test with automated contrast checker",
      ],
    });
  }

  return { errors, warnings };
}

function validatePerformance(code: string): {
  warnings: ValidationWarning[];
} {
  const warnings: ValidationWarning[] = [];

  // Check for inline function definitions in JSX (causes re-renders)
  const inlineFunctions = code.match(/onClick=\{.*?=>/g) || [];
  if (inlineFunctions.length > 0) {
    warnings.push({
      code: "INLINE_FUNCTIONS",
      message: `Found ${inlineFunctions.length} inline function definitions that may cause unnecessary re-renders`,
      suggestions: [
        "Move function definitions outside JSX",
        "Use useCallback for memoization if needed",
      ],
    });
  }

  // Check for missing React.memo on child components
  if (
    code.includes("children") &&
    !code.includes("React.memo") &&
    !code.includes("useMemo")
  ) {
    warnings.push({
      code: "MISSING_MEMOIZATION",
      message: "Components with children props may benefit from memoization",
      suggestions: [
        "Consider wrapping with React.memo if children don't change often",
        "Use useMemo for expensive computations",
      ],
    });
  }

  // Check for missing keys in lists
  if (
    code.includes(".map(") &&
    !code.includes("key=") &&
    !code.includes("key:")
  ) {
    warnings.push({
      code: "MISSING_LIST_KEYS",
      message: "List items should have a key prop for efficient rendering",
      suggestions: ["Add unique key prop to each item in .map() calls"],
    });
  }

  // Check for large bundle imports
  if (code.includes("import * as") || code.includes("import lodash")) {
    warnings.push({
      code: "LARGE_IMPORT",
      message: "Importing entire libraries may increase bundle size",
      suggestions: [
        "Use named imports instead of wildcard imports",
        "Consider tree-shaking compatible libraries",
      ],
    });
  }

  return { warnings };
}

function validateBestPractices(
  code: string,
  framework?: "react" | "nextjs"
): {
  warnings: ValidationWarning[];
  suggestions: string[];
} {
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Next.js specific
  if (framework === "nextjs") {
    if (!code.includes("'use client'") && code.includes("useState")) {
      warnings.push({
        code: "MISSING_USE_CLIENT",
        message:
          'Next.js components using hooks should have "use client" directive',
        suggestions: ["Add 'use client' at the top of interactive components"],
      });
    }

    if (code.includes("img") && !code.includes("Image from 'next/image'")) {
      suggestions.push(
        "Use Next.js <Image> component for automatic optimization"
      );
    }
  }

  // React patterns
  if (code.includes("useEffect") && !code.includes("[]")) {
    warnings.push({
      code: "MISSING_DEPENDENCIES",
      message: "useEffect missing dependency array",
      suggestions: ["Add proper dependency array to useEffect"],
    });
  }

  // CSS best practices
  if (code.includes("style=") && code.includes("{")) {
    suggestions.push(
      "Consider using Tailwind classes or CSS-in-JS instead of inline styles"
    );
  }

  // Code organization
  if (code.length > 500 && !code.includes("export function")) {
    suggestions.push(
      "Consider breaking large components into smaller sub-components"
    );
  }

  // Comments and documentation
  if (!code.includes("/**") && !code.includes("//")) {
    suggestions.push("Add JSDoc comments to document component purpose and props");
  }

  return { warnings, suggestions };
}

function validateCodeQuality(code: string): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for unused variables
  const varMatches = code.match(/(?:const|let|var)\s+(\w+)/g) || [];
  const usedVars = new Set();

  varMatches.forEach((match) => {
    const varName = match.split(/\s+/)[1];
    if (varName && code.includes(varName)) {
      usedVars.add(varName);
    }
  });

  // Check for console statements
  if (code.includes("console.log")) {
    warnings.push({
      code: "DEBUG_CODE",
      message: "Found console.log statements in production code",
      suggestions: ["Remove or convert to proper logging"],
    });
  }

  // Check for hardcoded strings
  const stringCount = (code.match(/"[^"]*"/g) || []).length;
  if (stringCount > 10) {
    suggestions.push(
      "Consider moving hardcoded strings to constants or translations file"
    );
  }

  // Check for proper JSX closing
  if (code.includes("<") && !code.includes("/>") && !code.match(/<\/\w+>/)) {
    errors.push({
      code: "UNCLOSED_JSX",
      message: "JSX elements may be unclosed or malformed",
      severity: "error",
    });
  }

  return { errors, warnings };
}

// ============================================================================
// Utility Functions
// ============================================================================

function deduplicateIssues<T extends { code: string }>(issues: T[]): T[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    if (seen.has(issue.code)) return false;
    seen.add(issue.code);
    return true;
  });
}

/**
 * Get human-readable validation summary
 */
export function getSummary(result: CodeValidationResult): string {
  const lines = [
    `Overall Score: ${result.metrics.overallScore}/100`,
    `  - Accessibility: ${result.metrics.accessibilityScore}/100`,
    `  - TypeScript: ${result.metrics.typeScriptScore}/100`,
    `  - Performance: ${result.metrics.performanceScore}/100`,
    "",
    `Errors: ${result.errors.length}`,
    `Warnings: ${result.warnings.length}`,
    `Suggestions: ${result.suggestions.length}`,
  ];

  if (result.errors.length > 0) {
    lines.push("");
    lines.push("Critical Issues:");
    result.errors.slice(0, 3).forEach((e) => {
      lines.push(`  ❌ ${e.message}`);
    });
    if (result.errors.length > 3) {
      lines.push(`  ... and ${result.errors.length - 3} more`);
    }
  }

  return lines.join("\n");
}
