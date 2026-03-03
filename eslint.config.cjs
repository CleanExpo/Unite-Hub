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

  // Base config for web app
  ...compat
    .extends("next/core-web-vitals", "plugin:@typescript-eslint/recommended")
    .map((config) => ({
      ...config,
      files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
    })),

  // Production code overrides
  {
    files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
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
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];
