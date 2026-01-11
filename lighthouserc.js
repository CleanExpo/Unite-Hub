/**
 * Lighthouse CI Configuration
 * Enforces performance budgets and accessibility standards
 *
 * Usage:
 * - Local: lhci autorun
 * - CI: lhci ci
 * - Upload: lhci upload --configPath=lighthouserc.js
 */

export default {
  // CI configuration
  ci: {
    // Pages to audit
    collect: {
      url: [
        'http://localhost:3008/',
        'http://localhost:3008/health-check',
        'http://localhost:3008/dashboard',
      ],
      numberOfRuns: 3,
      staticDistDir: './.next/static',
      headless: true,
      chromePath: '/usr/bin/google-chrome-stable',
    },

    // Performance budgets
    assert: {
      preset: 'lighthouse:recommended',

      assertions: {
        // Core Web Vitals
        'largest-contentful-paint': [
          'error',
          { maxNumericValue: 2500, aggregationMethod: 'median-run' },
        ],
        'first-contentful-paint': [
          'error',
          { maxNumericValue: 1800, aggregationMethod: 'median-run' },
        ],
        'cumulative-layout-shift': [
          'error',
          { maxNumericValue: 0.1, aggregationMethod: 'median-run' },
        ],
        'interaction-to-next-paint': [
          'error',
          { maxNumericValue: 200, aggregationMethod: 'median-run' },
        ],

        // Performance score
        'categories:performance': [
          'error',
          { minScore: 0.9, aggregationMethod: 'median-run' },
        ],
        'categories:accessibility': [
          'error',
          { minScore: 0.95, aggregationMethod: 'median-run' },
        ],
        'categories:best-practices': [
          'error',
          { minScore: 0.9, aggregationMethod: 'median-run' },
        ],
        'categories:seo': [
          'error',
          { minScore: 0.95, aggregationMethod: 'median-run' },
        ],

        // Security & compliance
        'unsized-images': ['error', { minScore: 1 }],
        'modern-image-formats': ['warn'],
        'offscreen-images': ['warn'],
        'render-blocking-resources': [
          'warn',
          { maxLength: 3, aggregationMethod: 'median-run' },
        ],

        // JavaScript bundles
        'unused-javascript': [
          'warn',
          { maxLength: 500000, aggregationMethod: 'median-run' }, // 500KB
        ],
        'unused-css': ['warn'],

        // Third-party impact
        'third-party-summary': [
          'warn',
          { maxNumericValue: 250000, aggregationMethod: 'median-run' },
        ], // 250KB

        // Timing metrics
        'speed-index': [
          'error',
          { maxNumericValue: 3000, aggregationMethod: 'median-run' },
        ],
        'total-blocking-time': [
          'error',
          { maxNumericValue: 200, aggregationMethod: 'median-run' },
        ],

        // Server metrics
        'server-response-time': [
          'error',
          { maxNumericValue: 600, aggregationMethod: 'median-run' },
        ], // 600ms

        // Resource hints
        'preload-fonts': ['warn'],
        'font-display': ['warn'],
      },
    },

    // Upload results to Lighthouse CI Server
    upload: {
      target: 'temporary-public-storage',
      // Or use Lighthouse CI server:
      // target: 'lhci',
      // serverBaseUrl: 'https://lhci.example.com/',
      // token: process.env.LHCI_TOKEN,
      // configPath: './lhci-config.js',
    },

    // GitHub check annotations
    github: {
      appToken: process.env.LHCI_GITHUB_APP_TOKEN,
      uploadArtifacts: true,
      commentOnPr: true,
    },

    // Slack notifications
    slackToken: process.env.LHCI_SLACK_TOKEN,

    // Polling configuration for async audits
    allowlist: [
      'localhost',
      'health-check.example.com',
      'app.unite-hub.com',
    ],

    // Timeout settings
    maxWaitForLoad: 45000, // 45 seconds
    maxWaitForFcp: 30000, // 30 seconds
    pauseAfterLoadMs: 5250,
    pauseAfterNetworkQuietMs: 5250,
    networkQuietThresholdMs: 5250,

    // Browser settings
    disableStorageReset: false,
    emulatedFormFactor: 'mobile', // Test mobile first
    throttlingMethod: 'devtools',
    throttling: {
      rttMs: 40,
      throughputKbps: 11024,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
  },

  // Server configuration (optional - for self-hosted CI)
  server: {
    port: 3001,
    storage: {
      storageMethod: 'sql',
      sqlDialect: 'postgres',
      uri: process.env.LHCI_DATABASE_URL || 'postgres://localhost/lhci',
    },
    lhciStatusPageUrl: 'http://localhost:3001',
    allowedHeaders: ['x-custom-header'],
    basicAuth: {
      username: process.env.LHCI_USERNAME,
      password: process.env.LHCI_PASSWORD,
    },
  },

  // Wizard configuration
  wizard: {
    skipAudit: false,
    skipUpload: false,
  },

  // Log level
  logLevel: 'info',

  // Experimental features
  experimental: {
    noto: false,
    useHashUrls: true,
  },
};
