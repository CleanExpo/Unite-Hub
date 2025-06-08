/**
 * Resource Optimizer Module
 * 
 * This module provides utilities for optimizing resource loading and usage
 * to enhance performance under high traffic conditions.
 */

/**
 * Resource type for optimization
 */
export enum ResourceType {
  JS = 'javascript',
  CSS = 'css',
  FONT = 'font',
  IMAGE = 'image',
  MEDIA = 'media',
  DOCUMENT = 'document',
}

/**
 * Resource priority levels
 */
export enum ResourcePriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  OPTIONAL = 'optional',
}

/**
 * Loading strategy for resources
 */
export enum LoadingStrategy {
  EAGER = 'eager',        // Load immediately
  LAZY = 'lazy',          // Load when visible
  IDLE = 'idle',          // Load during browser idle time
  ONDEMAND = 'ondemand',  // Load on explicit user action
  PREFETCH = 'prefetch',  // Prefetch for future use
  PRELOAD = 'preload',    // Preload for current page
  PRECONNECT = 'preconnect', // Preconnect to domain
}

/**
 * Resource definition for optimization
 */
export interface Resource {
  /**
   * Unique identifier for the resource
   */
  id: string;
  
  /**
   * URL or path to the resource
   */
  url: string;
  
  /**
   * Type of resource
   */
  type: ResourceType;
  
  /**
   * Priority level for loading
   */
  priority: ResourcePriority;
  
  /**
   * Loading strategy
   */
  loading: LoadingStrategy;
  
  /**
   * Whether the resource is essential for page functionality
   */
  essential?: boolean;
  
  /**
   * Whether to load the resource asynchronously
   */
  async?: boolean;
  
  /**
   * Whether to defer loading until after page load
   */
  defer?: boolean;
  
  /**
   * Conditions for loading the resource
   */
  conditions?: {
    /**
     * Screen width in pixels above which to load the resource
     */
    minWidth?: number;
    
    /**
     * Screen width in pixels below which to load the resource
     */
    maxWidth?: number;
    
    /**
     * Whether to load only on mobile devices
     */
    onlyMobile?: boolean;
    
    /**
     * Whether to load only on desktop devices
     */
    onlyDesktop?: boolean;
    
    /**
     * Specific user events that trigger loading
     */
    events?: string[];
    
    /**
     * Load only when specific feature is enabled
     */
    featureEnabled?: string;
  };
  
  /**
   * Size of the resource in bytes
   */
  size?: number;
  
  /**
   * Media query for loading the resource
   */
  media?: string;
  
  /**
   * Time to live in seconds for caching
   */
  ttl?: number;
  
  /**
   * Custom attributes to add to the resource tag
   */
  attributes?: Record<string, string>;
}

/**
 * Resource optimization configuration
 */
export interface ResourceOptimizerConfig {
  /**
   * Whether to enable resource optimization
   * @default true in production, false in development
   */
  enabled: boolean;
  
  /**
   * Maximum number of critical resources to load
   * @default 5
   */
  maxCriticalResources: number;
  
  /**
   * Threshold for deferring resources in bytes
   * @default 50000 (50 KB)
   */
  deferThreshold: number;
  
  /**
   * Whether to use intersection observer for lazy loading
   * @default true
   */
  useLazyLoading: boolean;
  
  /**
   * Whether to preload critical fonts
   * @default true
   */
  preloadCriticalFonts: boolean;
  
  /**
   * Whether to use font display swap
   * @default true
   */
  useFontSwap: boolean;
  
  /**
   * Whether to inline critical CSS
   * @default true in production, false in development
   */
  inlineCriticalCss: boolean;
  
  /**
   * Whether to defer non-critical JavaScript
   * @default true
   */
  deferNonCriticalJs: boolean;
  
  /**
   * Whether to use resource hints (preload, prefetch, etc.)
   * @default true
   */
  useResourceHints: boolean;
}

/**
 * Default resource optimizer configuration
 */
export const defaultResourceOptimizerConfig: ResourceOptimizerConfig = {
  enabled: process.env.NODE_ENV === 'production',
  maxCriticalResources: 5,
  deferThreshold: 50000, // 50 KB
  useLazyLoading: true,
  preloadCriticalFonts: true,
  useFontSwap: true,
  inlineCriticalCss: process.env.NODE_ENV === 'production',
  deferNonCriticalJs: true,
  useResourceHints: true,
};

// Current configuration
let currentConfig: ResourceOptimizerConfig = { ...defaultResourceOptimizerConfig };

/**
 * Get the current resource optimizer configuration
 * @returns Current resource optimizer configuration
 */
export function getResourceOptimizerConfig(): ResourceOptimizerConfig {
  return currentConfig;
}

/**
 * Set the resource optimizer configuration
 * @param config Resource optimizer configuration
 */
export function setResourceOptimizerConfig(config: Partial<ResourceOptimizerConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
  };
}

/**
 * Generate resource hints for a page
 * @param resources List of resources to generate hints for
 * @returns HTML string with resource hints
 */
export function generateResourceHints(resources: Resource[]): string {
  if (!currentConfig.enabled || !currentConfig.useResourceHints) {
    return '';
  }
  
  let hints = '';
  
  // Process critical resources first
  const criticalResources = resources
    .filter(r => r.priority === ResourcePriority.CRITICAL)
    .slice(0, currentConfig.maxCriticalResources);
  
  // Preload critical fonts
  if (currentConfig.preloadCriticalFonts) {
    const criticalFonts = criticalResources.filter(r => r.type === ResourceType.FONT);
    
    for (const font of criticalFonts) {
      hints += `<link rel="preload" href="${font.url}" as="font" type="font/woff2" crossorigin${font.media ? ` media="${font.media}"` : ''}>\n`;
    }
  }
  
  // Preload critical CSS
  const criticalCss = criticalResources.filter(r => r.type === ResourceType.CSS);
  for (const css of criticalCss) {
    hints += `<link rel="preload" href="${css.url}" as="style"${css.media ? ` media="${css.media}"` : ''}>\n`;
  }
  
  // Preload critical JS
  const criticalJs = criticalResources.filter(r => r.type === ResourceType.JS);
  for (const js of criticalJs) {
    hints += `<link rel="preload" href="${js.url}" as="script">\n`;
  }
  
  // Preload critical images
  const criticalImages = criticalResources.filter(r => r.type === ResourceType.IMAGE);
  for (const image of criticalImages) {
    hints += `<link rel="preload" href="${image.url}" as="image"${image.media ? ` media="${image.media}"` : ''}>\n`;
  }
  
  // Prefetch high priority resources
  const highPriorityResources = resources
    .filter(r => r.priority === ResourcePriority.HIGH && r.loading === LoadingStrategy.PREFETCH);
  
  for (const resource of highPriorityResources) {
    hints += `<link rel="prefetch" href="${resource.url}">\n`;
  }
  
  // Preconnect to domains
  const preconnectResources = resources
    .filter(r => r.loading === LoadingStrategy.PRECONNECT);
  
  const domains = new Set<string>();
  for (const resource of preconnectResources) {
    try {
      const domain = new URL(resource.url).origin;
      domains.add(domain);
    } catch (e) {
      // Skip invalid URLs
    }
  }
  
  Array.from(domains).forEach(domain => {
    hints += `<link rel="preconnect" href="${domain}" crossorigin>\n`;
  });
  
  return hints;
}

/**
 * Generate script tags for JavaScript resources
 * @param resources List of JS resources to generate tags for
 * @returns HTML string with script tags
 */
export function generateScriptTags(resources: Resource[]): string {
  if (!currentConfig.enabled) {
    // In development or when disabled, return normal script tags
    return resources
      .filter(r => r.type === ResourceType.JS)
      .map(r => {
        const attrs = r.attributes || {};
        const attrsString = Object.entries(attrs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');
        
        return `<script src="${r.url}" ${attrsString}></script>`;
      })
      .join('\n');
  }
  
  // Optimize for production
  const criticalJS = resources
    .filter(r => r.type === ResourceType.JS && r.priority === ResourcePriority.CRITICAL);
  
  const highJS = resources
    .filter(r => r.type === ResourceType.JS && r.priority === ResourcePriority.HIGH);
  
  const nonCriticalJS = resources
    .filter(r => 
      r.type === ResourceType.JS && 
      ![ResourcePriority.CRITICAL, ResourcePriority.HIGH].includes(r.priority)
    );
  
  let scriptTags = '';
  
  // Critical JS - load immediately
  for (const js of criticalJS) {
    const attrs = js.attributes || {};
    const attrsString = Object.entries(attrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    scriptTags += `<script src="${js.url}" ${attrsString}></script>\n`;
  }
  
  // High priority JS - load with high priority but async
  for (const js of highJS) {
    const attrs = js.attributes || {};
    attrs.async = 'true';
    
    const attrsString = Object.entries(attrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    scriptTags += `<script src="${js.url}" ${attrsString}></script>\n`;
  }
  
  // Non-critical JS - defer loading
  if (currentConfig.deferNonCriticalJs) {
    for (const js of nonCriticalJS) {
      const attrs = js.attributes || {};
      attrs.defer = 'true';
      
      const attrsString = Object.entries(attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      
      scriptTags += `<script src="${js.url}" ${attrsString}></script>\n`;
    }
  } else {
    // Load normally if deferring is disabled
    for (const js of nonCriticalJS) {
      const attrs = js.attributes || {};
      const attrsString = Object.entries(attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      
      scriptTags += `<script src="${js.url}" ${attrsString}></script>\n`;
    }
  }
  
  return scriptTags;
}

/**
 * Generate style tags for CSS resources
 * @param resources List of CSS resources to generate tags for
 * @param inlineCritical Whether to inline critical CSS
 * @returns HTML string with style tags
 */
export function generateStyleTags(
  resources: Resource[],
  inlineCritical: boolean = currentConfig.inlineCriticalCss
): string {
  if (!currentConfig.enabled) {
    // In development or when disabled, return normal style tags
    return resources
      .filter(r => r.type === ResourceType.CSS)
      .map(r => {
        const attrs = r.attributes || {};
        const attrsString = Object.entries(attrs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');
        
        return `<link rel="stylesheet" href="${r.url}" ${attrsString}>`;
      })
      .join('\n');
  }
  
  // Optimize for production
  const criticalCSS = resources
    .filter(r => r.type === ResourceType.CSS && r.priority === ResourcePriority.CRITICAL);
  
  const nonCriticalCSS = resources
    .filter(r => r.type === ResourceType.CSS && r.priority !== ResourcePriority.CRITICAL);
  
  let styleTags = '';
  
  // Critical CSS - either inline or load with high priority
  for (const css of criticalCSS) {
    if (inlineCritical && css.attributes?.['data-inline-content']) {
      // Inline the CSS content if available
      styleTags += `<style id="${css.id}">${css.attributes['data-inline-content']}</style>\n`;
    } else {
      // Otherwise load normally
      const attrs = css.attributes || {};
      const attrsString = Object.entries(attrs)
        .filter(([key]) => key !== 'data-inline-content')
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      
      styleTags += `<link rel="stylesheet" href="${css.url}" ${attrsString}>\n`;
    }
  }
  
  // Non-critical CSS - load with lower priority
  for (const css of nonCriticalCSS) {
    const attrs = css.attributes || {};
    attrs.media = attrs.media || 'print';
    attrs.onload = `this.media='${css.media || 'all'}'`;
    
    const attrsString = Object.entries(attrs)
      .filter(([key]) => key !== 'data-inline-content')
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    styleTags += `<link rel="stylesheet" href="${css.url}" ${attrsString}>\n`;
  }
  
  return styleTags;
}

/**
 * Generate font loading optimizations
 * @param resources List of font resources to optimize
 * @returns HTML string with font loading optimizations
 */
export function generateFontOptimizations(resources: Resource[]): string {
  if (!currentConfig.enabled || !currentConfig.useFontSwap) {
    return '';
  }
  
  const fontResources = resources.filter(r => r.type === ResourceType.FONT);
  if (fontResources.length === 0) {
    return '';
  }
  
  // Create font-display: swap CSS
  let fontCSS = '<style>\n';
  fontCSS += '/* Font display optimization */\n';
  fontCSS += '@font-face {\n';
  fontCSS += '  font-display: swap;\n';
  fontCSS += '}\n';
  fontCSS += '</style>\n';
  
  return fontCSS;
}

/**
 * Generate complete set of optimized resource tags
 * @param resources List of resources to optimize
 * @returns HTML string with optimized resource tags
 */
export function generateOptimizedResources(resources: Resource[]): string {
  if (!currentConfig.enabled) {
    return '';
  }
  
  let html = '';
  
  // Add resource hints (preload, prefetch, preconnect)
  html += generateResourceHints(resources);
  
  // Add font optimizations
  html += generateFontOptimizations(resources);
  
  // Add style tags
  html += generateStyleTags(resources);
  
  // Add script tags
  html += generateScriptTags(resources);
  
  return html;
}

/**
 * Check if user agent is mobile
 * @param userAgent User agent string
 * @returns Whether the user agent is mobile
 */
export function isMobileUserAgent(userAgent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/**
 * Filter resources based on conditions
 * @param resources List of resources to filter
 * @param userAgent User agent string
 * @param screenWidth Screen width in pixels
 * @param enabledFeatures List of enabled features
 * @returns Filtered list of resources
 */
export function filterResourcesByConditions(
  resources: Resource[],
  userAgent: string = '',
  screenWidth: number = 1920,
  enabledFeatures: string[] = []
): Resource[] {
  const isMobile = isMobileUserAgent(userAgent);
  
  return resources.filter(resource => {
    const conditions = resource.conditions;
    if (!conditions) {
      return true;
    }
    
    // Check screen width conditions
    if (conditions.minWidth && screenWidth < conditions.minWidth) {
      return false;
    }
    
    if (conditions.maxWidth && screenWidth > conditions.maxWidth) {
      return false;
    }
    
    // Check device type conditions
    if (conditions.onlyMobile && !isMobile) {
      return false;
    }
    
    if (conditions.onlyDesktop && isMobile) {
      return false;
    }
    
    // Check feature flag conditions
    if (conditions.featureEnabled && !enabledFeatures.includes(conditions.featureEnabled)) {
      return false;
    }
    
    return true;
  });
}
