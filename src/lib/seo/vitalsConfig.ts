/**
 * Core Web Vitals Configuration
 *
 * Defines target thresholds and optimization strategies for Google's Core Web Vitals.
 * These metrics directly impact SEO rankings and user experience.
 *
 * @see https://web.dev/vitals/
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/analytics
 */

/**
 * Core Web Vitals Thresholds (in milliseconds or unitless)
 *
 * Google defines three performance bands:
 * - Good: Green (target this)
 * - Needs Improvement: Yellow
 * - Poor: Red (must fix)
 */
export const vitalsThresholds = {
  /**
   * Largest Contentful Paint (LCP)
   * Measures loading performance - when the largest content element becomes visible
   *
   * Target: < 2.5s (Good), 2.5-4.0s (Needs Improvement), > 4.0s (Poor)
   */
  LCP: {
    good: 2500,        // 2.5 seconds
    needsImprovement: 4000,  // 4.0 seconds
    unit: 'ms',
    description: 'Largest Contentful Paint - Loading performance',
    impact: 'High - Direct SEO ranking factor',
  },

  /**
   * Cumulative Layout Shift (CLS)
   * Measures visual stability - unexpected layout shifts during page load
   *
   * Target: < 0.1 (Good), 0.1-0.25 (Needs Improvement), > 0.25 (Poor)
   */
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
    unit: 'score',
    description: 'Cumulative Layout Shift - Visual stability',
    impact: 'High - Affects user experience and SEO',
  },

  /**
   * Interaction to Next Paint (INP)
   * Measures responsiveness - time from user interaction to visual feedback
   *
   * Target: < 200ms (Good), 200-500ms (Needs Improvement), > 500ms (Poor)
   * Replaced First Input Delay (FID) in March 2024
   */
  INP: {
    good: 200,         // 200 milliseconds
    needsImprovement: 500,   // 500 milliseconds
    unit: 'ms',
    description: 'Interaction to Next Paint - Responsiveness',
    impact: 'High - New metric replacing FID',
  },

  /**
   * First Contentful Paint (FCP)
   * Measures perceived load speed - when first content appears
   *
   * Target: < 1.8s (Good), 1.8-3.0s (Needs Improvement), > 3.0s (Poor)
   */
  FCP: {
    good: 1800,        // 1.8 seconds
    needsImprovement: 3000,  // 3.0 seconds
    unit: 'ms',
    description: 'First Contentful Paint - Perceived load speed',
    impact: 'Medium - Affects perceived performance',
  },

  /**
   * Time to First Byte (TTFB)
   * Measures server response time
   *
   * Target: < 800ms (Good), 800-1800ms (Needs Improvement), > 1800ms (Poor)
   */
  TTFB: {
    good: 800,         // 800 milliseconds
    needsImprovement: 1800,  // 1.8 seconds
    unit: 'ms',
    description: 'Time to First Byte - Server response time',
    impact: 'Medium - Foundational for other metrics',
  },
};

/**
 * Performance Optimization Quick Wins
 *
 * Prioritized list of optimizations with estimated impact and effort.
 */
export const optimizationStrategies = {
  /**
   * HIGH PRIORITY - Quick wins with significant impact
   */
  highPriority: [
    {
      category: 'Images',
      issue: 'Unoptimized images causing slow LCP',
      solution: 'Enable Next.js Image Optimization (next/image)',
      implementation: 'Replace <img> tags with <Image> component from next/image',
      expectedImprovement: '30-50% faster LCP',
      effort: 'Low',
      code: `
// Before
<img src="/hero.jpg" alt="Hero" />

// After
import Image from 'next/image';
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={630}
  priority
  quality={85}
/>
      `.trim(),
    },
    {
      category: 'Fonts',
      issue: 'Font loading causing layout shifts (CLS)',
      solution: 'Add font-display: swap to web fonts',
      implementation: 'Use Next.js font optimization with display: swap',
      expectedImprovement: '40-60% better CLS',
      effort: 'Low',
      code: `
// In layout.tsx
import { Geist } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Add this
});
      `.trim(),
    },
    {
      category: 'Layout Shifts',
      issue: 'Missing dimensions causing CLS',
      solution: 'Define explicit width/height for images and iframes',
      implementation: 'Add width and height attributes to all media elements',
      expectedImprovement: '50-70% better CLS',
      effort: 'Low',
      code: `
// Always specify dimensions
<Image
  src="/image.jpg"
  width={800}
  height={600}
  alt="Description"
/>

// Reserve space for dynamic content
<div className="aspect-video bg-gray-200">
  {/* Dynamic content loads here */}
</div>
      `.trim(),
    },
    {
      category: 'JavaScript',
      issue: 'Large JavaScript bundles blocking rendering',
      solution: 'Enable code splitting and lazy loading',
      implementation: 'Use React.lazy() and dynamic imports',
      expectedImprovement: '20-40% faster FCP',
      effort: 'Medium',
      code: `
// Lazy load non-critical components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Disable SSR if not needed
});

// Or with React.lazy()
const AnotherComponent = React.lazy(() => import('./AnotherComponent'));
      `.trim(),
    },
    {
      category: 'Compression',
      issue: 'Uncompressed assets increasing load time',
      solution: 'Enable gzip/brotli compression',
      implementation: 'Configure in Vercel or add to next.config.js',
      expectedImprovement: '40-60% smaller file sizes',
      effort: 'Low',
      code: `
// Vercel automatically enables compression
// For custom servers, add to next.config.js:
module.exports = {
  compress: true,
  // Brotli is preferred over gzip (better compression)
};
      `.trim(),
    },
  ],

  /**
   * MEDIUM PRIORITY - Significant impact, moderate effort
   */
  mediumPriority: [
    {
      category: 'Prefetching',
      issue: 'Slow navigation between pages',
      solution: 'Enable Link prefetching for critical routes',
      implementation: 'Use Next.js Link component with prefetch',
      expectedImprovement: 'Instant page transitions',
      effort: 'Low',
      code: `
import Link from 'next/link';

// Prefetch on hover (default)
<Link href="/pricing" prefetch={true}>
  Pricing
</Link>

// Prefetch critical routes immediately
<Link href="/dashboard" prefetch={true}>
  Dashboard
</Link>
      `.trim(),
    },
    {
      category: 'Third-Party Scripts',
      issue: 'Analytics/chat widgets blocking main thread',
      solution: 'Load third-party scripts asynchronously',
      implementation: 'Use next/script with appropriate strategy',
      expectedImprovement: '15-30% faster INP',
      effort: 'Low',
      code: `
import Script from 'next/script';

// Analytics - load after page interactive
<Script
  src="https://analytics.example.com/script.js"
  strategy="afterInteractive"
/>

// Chat widget - defer until idle
<Script
  src="https://chat.example.com/widget.js"
  strategy="lazyOnload"
/>
      `.trim(),
    },
    {
      category: 'CSS',
      issue: 'Unused CSS increasing bundle size',
      solution: 'Remove unused Tailwind classes',
      implementation: 'Configure Tailwind purge properly',
      expectedImprovement: '30-50% smaller CSS bundles',
      effort: 'Low',
      code: `
// tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Tailwind will automatically purge unused classes
};
      `.trim(),
    },
  ],

  /**
   * LOW PRIORITY - Incremental improvements
   */
  lowPriority: [
    {
      category: 'Caching',
      issue: 'Repeated requests for static assets',
      solution: 'Configure aggressive caching headers',
      implementation: 'Set Cache-Control headers for static assets',
      expectedImprovement: '10-20% faster repeat visits',
      effort: 'Low',
    },
    {
      category: 'CDN',
      issue: 'Slow asset delivery from origin',
      solution: 'Serve assets from CDN',
      implementation: 'Vercel automatically uses global CDN',
      expectedImprovement: '20-40% faster TTFB globally',
      effort: 'Low',
    },
  ],
};

/**
 * Performance Monitoring Configuration
 *
 * Setup for tracking Core Web Vitals in production.
 */
export const monitoringConfig = {
  /**
   * Next.js Web Vitals Reporter
   *
   * Add to app/layout.tsx or _app.tsx
   */
  reportWebVitals: {
    enabled: true,
    endpoints: {
      analytics: '/api/analytics/vitals',
      console: process.env.NODE_ENV === 'development',
    },
    sampleRate: 1.0, // Report 100% of pageviews (adjust in production)
  },

  /**
   * Recommended monitoring tools
   */
  tools: [
    {
      name: 'Google PageSpeed Insights',
      url: 'https://pagespeed.web.dev/',
      type: 'Lab & Field Data',
      cost: 'Free',
    },
    {
      name: 'Chrome User Experience Report (CrUX)',
      url: 'https://developers.google.com/web/tools/chrome-user-experience-report',
      type: 'Field Data',
      cost: 'Free',
    },
    {
      name: 'Lighthouse CI',
      url: 'https://github.com/GoogleChrome/lighthouse-ci',
      type: 'Lab Data (CI/CD)',
      cost: 'Free',
    },
    {
      name: 'Web Vitals Chrome Extension',
      url: 'https://chrome.google.com/webstore/detail/web-vitals/ahfhijdlegdabablpippeagghigmibma',
      type: 'Real-time monitoring',
      cost: 'Free',
    },
    {
      name: 'Vercel Analytics',
      url: 'https://vercel.com/analytics',
      type: 'Real User Monitoring (RUM)',
      cost: 'Free tier available',
    },
  ],
};

/**
 * Performance Budget
 *
 * Define maximum acceptable sizes for assets.
 */
export const performanceBudget = {
  javascript: {
    total: 200, // KB
    perRoute: 50, // KB
  },
  css: {
    total: 50, // KB
    critical: 14, // KB (inline critical CSS)
  },
  images: {
    hero: 150, // KB (compressed)
    thumbnail: 20, // KB
  },
  fonts: {
    total: 100, // KB
  },
  thirdParty: {
    total: 100, // KB (analytics, chat, etc.)
  },
};

/**
 * Synthex-Specific Optimization Checklist
 *
 * Prioritized improvements for the current site.
 */
export const synthexOptimizations = {
  immediate: [
    {
      task: 'Add explicit dimensions to all <Image> components',
      impact: 'High - Prevents CLS',
      location: 'src/app/page.tsx (carousel images, hero images)',
      priority: 'P0',
    },
    {
      task: 'Add priority attribute to hero image',
      impact: 'High - Improves LCP',
      location: 'src/app/page.tsx (line ~436)',
      priority: 'P0',
    },
    {
      task: 'Lazy load below-the-fold sections',
      impact: 'Medium - Improves INP',
      location: 'ScrollReveal components after fold',
      priority: 'P1',
    },
    {
      task: 'Optimize AnimatedElements animations',
      impact: 'Medium - May affect INP',
      location: 'src/components/AnimatedElements',
      priority: 'P1',
    },
    {
      task: 'Add loading="lazy" to carousel images',
      impact: 'Medium - Reduces initial load',
      location: 'src/app/page.tsx (carousel section)',
      priority: 'P1',
    },
  ],

  shortTerm: [
    {
      task: 'Implement skeleton loaders for dynamic content',
      impact: 'Medium - Improves perceived performance',
      location: 'Dashboard pages, pricing section',
      priority: 'P2',
    },
    {
      task: 'Optimize font loading with font-display: swap',
      impact: 'Medium - Reduces CLS',
      location: 'src/app/layout.tsx',
      priority: 'P2',
    },
    {
      task: 'Enable HTTP/2 push for critical resources',
      impact: 'Low - Already handled by Vercel',
      location: 'Vercel configuration',
      priority: 'P3',
    },
  ],

  longTerm: [
    {
      task: 'Implement service worker for offline support',
      impact: 'Low - Nice to have',
      location: 'Progressive Web App (PWA) setup',
      priority: 'P4',
    },
    {
      task: 'Add resource hints (preconnect, dns-prefetch)',
      impact: 'Low - Marginal improvements',
      location: 'src/app/layout.tsx',
      priority: 'P4',
    },
  ],
};

/**
 * Validation function to check if vitals meet thresholds
 */
export function validateVitals(metrics: {
  lcp?: number;
  cls?: number;
  inp?: number;
  fcp?: number;
  ttfb?: number;
}): {
  passed: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (metrics.lcp && metrics.lcp > vitalsThresholds.LCP.good) {
    issues.push(`LCP: ${metrics.lcp}ms (target: <${vitalsThresholds.LCP.good}ms)`);
    recommendations.push('Optimize images with next/image and add priority to hero image');
  }

  if (metrics.cls && metrics.cls > vitalsThresholds.CLS.good) {
    issues.push(`CLS: ${metrics.cls} (target: <${vitalsThresholds.CLS.good})`);
    recommendations.push('Add explicit dimensions to all images and reserve space for dynamic content');
  }

  if (metrics.inp && metrics.inp > vitalsThresholds.INP.good) {
    issues.push(`INP: ${metrics.inp}ms (target: <${vitalsThresholds.INP.good}ms)`);
    recommendations.push('Reduce JavaScript execution time and optimize event handlers');
  }

  if (metrics.fcp && metrics.fcp > vitalsThresholds.FCP.good) {
    issues.push(`FCP: ${metrics.fcp}ms (target: <${vitalsThresholds.FCP.good}ms)`);
    recommendations.push('Reduce render-blocking resources and inline critical CSS');
  }

  if (metrics.ttfb && metrics.ttfb > vitalsThresholds.TTFB.good) {
    issues.push(`TTFB: ${metrics.ttfb}ms (target: <${vitalsThresholds.TTFB.good}ms)`);
    recommendations.push('Optimize server response time and enable edge caching');
  }

  return {
    passed: issues.length === 0,
    issues,
    recommendations,
  };
}
