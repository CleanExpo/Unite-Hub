/**
 * Resource Optimizer Component
 * 
 * This component manages resource loading optimizations in Next.js applications.
 * It should be included in the app layout to apply optimizations to all pages.
 */

'use client'

import React, { useEffect, useMemo } from 'react'
import Head from 'next/head'
import { usePathname } from 'next/navigation'
import { 
  ResourceType, 
  ResourcePriority,
  LoadingStrategy,
  Resource,
  generateOptimizedResources,
  filterResourcesByConditions,
  getResourceOptimizerConfig
} from '@/lib/performance/resource-optimizer'

export interface ResourceOptimizerProps {
  /**
   * Resources to optimize
   */
  resources: Resource[];
  
  /**
   * Whether to enable dynamic resource loading based on page
   */
  dynamicLoading?: boolean;
  
  /**
   * Whether to apply optimizations to all resources
   */
  optimizeAll?: boolean;
  
  /**
   * Additional resource definitions by route
   */
  routeResources?: Record<string, Resource[]>;
  
  /**
   * List of enabled features for conditional loading
   */
  enabledFeatures?: string[];
  
  /**
   * Children to render
   */
  children?: React.ReactNode;
}

/**
 * Resource Optimizer Component
 */
export default function ResourceOptimizer({
  resources,
  dynamicLoading = true,
  optimizeAll = true,
  routeResources = {},
  enabledFeatures = [],
  children
}: ResourceOptimizerProps): React.ReactElement {
  // Get current pathname
  const pathname = usePathname();
  
  // Get screen width on client side
  const [screenWidth, setScreenWidth] = React.useState(1920);
  const [userAgent, setUserAgent] = React.useState('');
  
  // Update screen width and user agent on client side
  useEffect(() => {
    setScreenWidth(window.innerWidth);
    setUserAgent(window.navigator.userAgent);
    
    // Update screen width on resize
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Get resources for current route
  const currentRouteResources = useMemo(() => {
    if (!dynamicLoading) {
      return resources;
    }
    
    // Get resources for exact route match
    if (routeResources[pathname]) {
      return [...resources, ...routeResources[pathname]];
    }
    
    // Try to match route patterns
    for (const [route, routeSpecificResources] of Object.entries(routeResources)) {
      // Convert route pattern to regex
      const routePattern = route
        .replace(/\*/g, '.*') // Convert * wildcard to regex .*
        .replace(/\/:[^/]+/g, '/[^/]+'); // Convert /:param to regex /[^/]+
      
      const regex = new RegExp(`^${routePattern}$`);
      
      if (regex.test(pathname)) {
        return [...resources, ...routeSpecificResources];
      }
    }
    
    return resources;
  }, [pathname, resources, routeResources, dynamicLoading]);
  
  // Filter resources based on conditions
  const filteredResources = useMemo(() => {
    return filterResourcesByConditions(
      currentRouteResources,
      userAgent,
      screenWidth,
      enabledFeatures
    );
  }, [currentRouteResources, userAgent, screenWidth, enabledFeatures]);
  
  // Generate optimized resource tags
  const optimizedResources = useMemo(() => {
    if (!optimizeAll) {
      return '';
    }
    
    return generateOptimizedResources(filteredResources);
  }, [filteredResources, optimizeAll]);
  
  // Extract domains for DNS prefetch
  const domains = useMemo(() => {
    const domainSet = new Set<string>();
    
    for (const resource of filteredResources) {
      try {
        const url = new URL(resource.url);
        domainSet.add(url.origin);
      } catch (e) {
        // Skip invalid URLs
      }
    }
    
    return Array.from(domainSet);
  }, [filteredResources]);
  
  return (
    <>
      <Head>
        {/* DNS prefetch for domains */}
        {domains.map((domain) => (
          <link key={domain} rel="dns-prefetch" href={domain} />
        ))}
        
        {/* Add optimized resource tags */}
        {optimizeAll && (
          <div dangerouslySetInnerHTML={{ __html: optimizedResources }} />
        )}
      </Head>
      
      {children}
    </>
  );
}

/**
 * Helper function to create resource definition
 */
export function createResource(
  id: string,
  url: string,
  type: ResourceType,
  priority: ResourcePriority = ResourcePriority.MEDIUM,
  loading: LoadingStrategy = LoadingStrategy.EAGER,
  options: Partial<Omit<Resource, 'id' | 'url' | 'type' | 'priority' | 'loading'>> = {}
): Resource {
  return {
    id,
    url,
    type,
    priority,
    loading,
    ...options
  };
}

/**
 * Predefined resource collections
 */
export const COMMON_RESOURCES: Resource[] = [
  // Common third-party domains for preconnect
  createResource(
    'preconnect-google-fonts',
    'https://fonts.googleapis.com',
    ResourceType.DOCUMENT,
    ResourcePriority.HIGH,
    LoadingStrategy.PRECONNECT
  ),
  createResource(
    'preconnect-google-fonts-static',
    'https://fonts.gstatic.com',
    ResourceType.DOCUMENT,
    ResourcePriority.HIGH,
    LoadingStrategy.PRECONNECT
  ),
  
  // Critical fonts
  createResource(
    'font-inter',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    ResourceType.FONT,
    ResourcePriority.CRITICAL,
    LoadingStrategy.PRELOAD
  ),
];

/**
 * Get resources for the main site
 */
export function getMainSiteResources(): Resource[] {
  return [
    ...COMMON_RESOURCES,
    
    // Critical CSS
    createResource(
      'main-css',
      '/styles/main.css',
      ResourceType.CSS,
      ResourcePriority.CRITICAL,
      LoadingStrategy.PRELOAD
    ),
    
    // Critical JS
    createResource(
      'main-js',
      '/scripts/main.js',
      ResourceType.JS,
      ResourcePriority.CRITICAL,
      LoadingStrategy.EAGER
    ),
    
    // Deferred JS
    createResource(
      'analytics-js',
      '/scripts/analytics.js',
      ResourceType.JS,
      ResourcePriority.LOW,
      LoadingStrategy.IDLE,
      { defer: true }
    ),
  ];
}

/**
 * Get additional resources for the dashboard
 */
export function getDashboardResources(): Resource[] {
  return [
    // Dashboard specific CSS
    createResource(
      'dashboard-css',
      '/styles/dashboard.css',
      ResourceType.CSS,
      ResourcePriority.HIGH,
      LoadingStrategy.EAGER
    ),
    
    // Dashboard specific JS
    createResource(
      'dashboard-js',
      '/scripts/dashboard.js',
      ResourceType.JS,
      ResourcePriority.HIGH,
      LoadingStrategy.EAGER
    ),
    
    // Chart library
    createResource(
      'chart-js',
      'https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js',
      ResourceType.JS,
      ResourcePriority.MEDIUM,
      LoadingStrategy.EAGER,
      { async: true }
    ),
    
    // Deferred resources
    createResource(
      'dashboard-widgets-js',
      '/scripts/dashboard-widgets.js',
      ResourceType.JS,
      ResourcePriority.LOW,
      LoadingStrategy.IDLE,
      { defer: true }
    ),
  ];
}

/**
 * Default route-specific resources
 */
export const DEFAULT_ROUTE_RESOURCES: Record<string, Resource[]> = {
  // Dashboard routes
  '/dashboard': getDashboardResources(),
  '/dashboard/*': getDashboardResources(),
  
  // Large resource only loaded on specific pages
  '/blog': [
    createResource(
      'blog-editor-js',
      '/scripts/blog-editor.js',
      ResourceType.JS,
      ResourcePriority.MEDIUM,
      LoadingStrategy.LAZY,
      { defer: true }
    ),
  ],
};
