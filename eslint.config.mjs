import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// ESLint flat config format
const eslintConfig = [
  // Extend Next.js recommended configs
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Custom rules
  {
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      
      // React rules
      "react/display-name": "off",
      "react-hooks/exhaustive-deps": "warn",
      
      // General rules
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-unused-vars": "off", // Use TypeScript's no-unused-vars instead
      
      // Next.js specific
      "@next/next/no-html-link-for-pages": "error",
    },
    
    // Ignore patterns
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "public/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "coverage/**",
      ".vercel/**",
      "dist/**",
      "build/**",
    ],
  },
  
  // Files configuration
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
];

export default eslintConfig;
