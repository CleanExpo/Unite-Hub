/**
 * Bundle Optimizer Module
 * 
 * This module provides utilities for optimizing JavaScript bundles
 * and implementing code splitting strategies.
 */

import React from 'react';

/**
 * Bundle optimization configuration
 */
export interface BundleOptimizerConfig {
  /**
   * Whether to enable bundle optimization
   * @default true in production, false in development
   */
  enabled: boolean;
  
  /**
   * Maximum bundle size in bytes before triggering a split
   * @default 200000 (200 KB)
   */
  maxBundleSize: number;
  
  /**
   * Maximum number of initial chunks
   * @default 5
   */
  maxInitialChunks: number;
  
  /**
   * Whether to enable dynamic imports
   * @default true
   */
  useDynamicImports: boolean;
  
  /**
   * Whether to use module/nomodule pattern for differential loading
   * @default true
   */
  useDifferentialLoading: boolean;
  
  /**
   * Whether to include polyfills for legacy browsers
   * @default false
   */
  includePolyfills: boolean;
  
  /**
   * Routes to prefetch
   */
  prefetchRoutes: string[];
}

/**
 * Default bundle optimizer configuration
 */
export const defaultBundleOptimizerConfig: BundleOptimizerConfig = {
  enabled: process.env.NODE_ENV === 'production',
  maxBundleSize: 200000, // 200 KB
  maxInitialChunks: 5,
  useDynamicImports: true,
  useDifferentialLoading: true,
  includePolyfills: false,
  prefetchRoutes: [],
};

// Current configuration
let currentConfig: BundleOptimizerConfig = { ...defaultBundleOptimizerConfig };

/**
 * Get the current bundle optimizer configuration
 * @returns Current bundle optimizer configuration
 */
export function getBundleOptimizerConfig(): BundleOptimizerConfig {
  return currentConfig;
}

/**
 * Set the bundle optimizer configuration
 * @param config Bundle optimizer configuration
 */
export function setBundleOptimizerConfig(config: Partial<BundleOptimizerConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
  };
}

/**
 * Dynamic import with preload support
 * @param modulePath Module path to import
 * @returns Promise that resolves to the imported module
 */
export function dynamicImport<T>(modulePath: string): Promise<T> {
  // Create a preload link if in the browser
  if (typeof window !== 'undefined' && currentConfig.enabled && currentConfig.useDynamicImports) {
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'script';
    preloadLink.href = modulePath;
    document.head.appendChild(preloadLink);
  }
  
  // Return dynamic import
  // @ts-ignore - Next.js handles this dynamically
  return import(modulePath);
}

/**
 * Code-split component with preload support
 * 
 * This is a type-level helper for Next.js dynamic imports
 * @example
 * ```tsx
 * const DynamicComponent = dynamicComponent(() => import('../components/HeavyComponent'));
 * ```
 */
export type DynamicComponentImport<P> = () => Promise<{
  default: React.ComponentType<P>;
}>;

/**
 * Generate module/nomodule script tags for differential loading
 * @param modernSrc Modern JS bundle URL
 * @param legacySrc Legacy JS bundle URL
 * @returns HTML string with script tags
 */
export function generateDifferentialLoadingTags(modernSrc: string, legacySrc: string): string {
  if (!currentConfig.enabled || !currentConfig.useDifferentialLoading) {
    return `<script src="${modernSrc}"></script>`;
  }
  
  return `
    <script type="module" src="${modernSrc}"></script>
    <script nomodule src="${legacySrc}"></script>
  `;
}

/**
 * Generate link prefetch tags for routes
 * @param routes Routes to prefetch
 * @returns HTML string with prefetch link tags
 */
export function generateRoutePrefetchTags(routes: string[] = currentConfig.prefetchRoutes): string {
  if (!currentConfig.enabled || routes.length === 0) {
    return '';
  }
  
  return routes
    .map(route => `<link rel="prefetch" href="${route}">`)
    .join('\n');
}

/**
 * Create a bundle split point
 * This is a marker function that can be used to indicate where code splitting should occur.
 * It doesn't do anything at runtime, but can be used by bundler plugins to identify split points.
 * @example
 * ```ts
 * // This is a good place to split the bundle
 * createBundleSplitPoint('admin-features');
 * 
 * // Heavy admin features code...
 * ```
 */
export function createBundleSplitPoint(name: string): void {
  // This function doesn't do anything at runtime
  // It's just a marker for bundler plugins
}

/**
 * Preload a dynamic component
 * @param importFn Function that imports the component
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  if (typeof window !== 'undefined' && currentConfig.enabled && currentConfig.useDynamicImports) {
    // Start loading the component but don't wait for it
    importFn().catch(() => {
      // Ignore errors during preloading
    });
  }
}

/**
 * Helper to determine if a module should be dynamically imported
 * @param modulePath Path to the module
 * @returns Whether the module should be dynamically imported
 */
export function shouldDynamicImport(modulePath: string): boolean {
  if (!currentConfig.enabled || !currentConfig.useDynamicImports) {
    return false;
  }
  
  // Never dynamic import critical modules
  const criticalModules = [
    '/lib/core/',
    '/components/layout/',
    '/components/common/',
    'react',
    'react-dom',
    'next',
  ];
  
  for (const criticalModule of criticalModules) {
    if (modulePath.includes(criticalModule)) {
      return false;
    }
  }
  
  // Always dynamic import large feature modules
  const featureModules = [
    '/features/',
    '/dashboard/',
    '/admin/',
    '/blog/',
    '/editor/',
  ];
  
  for (const featureModule of featureModules) {
    if (modulePath.includes(featureModule)) {
      return true;
    }
  }
  
  // Default to not dynamically importing
  return false;
}

/**
 * Utility to check if a module should be included in the main bundle
 * @param modulePath Module path
 * @returns Whether the module should be included in the main bundle
 */
export function shouldIncludeInMainBundle(modulePath: string): boolean {
  return !shouldDynamicImport(modulePath);
}
