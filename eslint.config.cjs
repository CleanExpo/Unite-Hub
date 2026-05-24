const path = require("path");
const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: path.join(__dirname, "apps/web"),
  resolvePluginsRelativeTo: path.join(__dirname, "apps/web"),
});

module.exports = [
  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/.turbo/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
    ],
  },

  // Base config for web app (apps/web/ legacy path + src/ rebuild path)
  ...compat
    .extends("next/core-web-vitals", "plugin:@typescript-eslint/recommended")
    .map((config) => ({
      ...config,
      files: ["apps/web/**/*.{js,jsx,ts,tsx}", "src/**/*.{js,jsx,ts,tsx}"],
    })),

  // Production code overrides
  {
    files: ["apps/web/**/*.{js,jsx,ts,tsx}", "src/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Test files - relaxed rules
  {
    files: [
      "apps/web/**/__tests__/**/*.{js,jsx,ts,tsx}",
      "apps/web/**/*.test.{js,jsx,ts,tsx}",
      "apps/web/**/*.spec.{js,jsx,ts,tsx}",
      "apps/web/**/tests/**/*.{js,jsx,ts,tsx}",
      "apps/web/**/e2e/**/*.{js,jsx,ts,tsx}",
      "src/**/__tests__/**/*.{js,jsx,ts,tsx}",
      "src/**/*.test.{js,jsx,ts,tsx}",
      "src/**/*.spec.{js,jsx,ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // Service-role key placement guard. process.env.SUPABASE_SERVICE_ROLE_KEY
  // may only be accessed from:
  //   - src/lib/supabase/service.ts (the canonical centralized client)
  //   - src/instrumentation.ts (env-var validation only, not client construction)
  //   - src/lib/ai/features/mcp.ts (MCP server authToken — separate concern)
  //   - src/app/api/** (API routes are server-only by design)
  // See .claude/audits/REFRESHED-AUDIT-2026-05-24.md § Service-Role Usage.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/supabase/service.ts",
      "src/instrumentation.ts",
      "src/lib/ai/features/mcp.ts",
      "src/app/api/**/*",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env'][property.name='SUPABASE_SERVICE_ROLE_KEY']",
          message:
            "SUPABASE_SERVICE_ROLE_KEY must only be accessed via src/lib/supabase/service.ts (or the three documented exception files / API routes). See .claude/audits/REFRESHED-AUDIT-2026-05-24.md § Service-Role Usage.",
        },
      ],
    },
  },
];
