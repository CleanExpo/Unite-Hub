/**
 * 🧪 COMPREHENSIVE TEST SUITE CONFIGURATION
 * Tests everything we build with Docker integration
 */

export interface TestConfig {
  baseUrl: string
  timeout: number
  retries: number
  parallel: boolean
  dockerEnabled: boolean
  logLevel: 'silent' | 'error' | 'warn' | 'info' | 'debug'
  categories: TestCategory[]
}

export interface TestCategory {
  name: string
  enabled: boolean
  priority: 'critical' | 'high' | 'medium' | 'low'
  timeout: number
  endpoints: string[]
  dependencies: string[]
  authentication: boolean
}

export const COMPREHENSIVE_TEST_CONFIG: TestConfig = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3001',
  timeout: 30000,
  retries: 3,
  parallel: true,
  dockerEnabled: true,
  logLevel: 'info',
  categories: [
    {
      name: 'Core Infrastructure',
      enabled: true,
      priority: 'critical',
      timeout: 10000,
      endpoints: ['/api/health', '/api/debug/connection'],
      dependencies: [],
      authentication: false
    },
    {
      name: 'Authentication & Security',
      enabled: true,
      priority: 'critical',
      timeout: 15000,
      endpoints: [
        '/api/auth/mfa',
        '/api/permissions',
        '/api/roles',
        '/api/user-roles',
        '/api/setup-admin'
      ],
      dependencies: ['Core Infrastructure'],
      authentication: true
    },
    {
      name: 'CRM Core System',
      enabled: true,
      priority: 'critical',
      timeout: 20000,
      endpoints: [
        '/api/crm/dashboard',
        '/api/crm/clients',
        '/api/crm/projects',
        '/api/crm/users',
        '/api/crm/sync'
      ],
      dependencies: ['Authentication & Security'],
      authentication: true
    },
    {
      name: 'CRM Messaging & Communication',
      enabled: true,
      priority: 'high',
      timeout: 15000,
      endpoints: [
        '/api/crm/messaging/messages',
        '/api/crm/messaging/channels',
        '/api/crm/messaging/threads',
        '/api/crm/messaging/reactions',
        '/api/crm/messaging/typing',
        '/api/crm/comms/email',
        '/api/crm/emails',
        '/api/crm/notifications'
      ],
      dependencies: ['CRM Core System'],
      authentication: true
    },
    {
      name: 'CRM Pipeline & Workflow',
      enabled: true,
      priority: 'high',
      timeout: 15000,
      endpoints: [
        '/api/crm/pipeline/deals',
        '/api/crm/pipeline/stages',
        '/api/crm/pipeline/automation',
        '/api/crm/workflows',
        '/api/crm/tasks',
        '/api/crm/activities'
      ],
      dependencies: ['CRM Core System'],
      authentication: true
    },
    {
      name: 'AI & Analytics',
      enabled: true,
      priority: 'high',
      timeout: 30000,
      endpoints: [
        '/api/ai/predictions',
        '/api/ai/monitor',
        '/api/ai/deployments',
        '/api/ai/revolution',
        '/api/ai/threats',
        '/api/advanced-analytics',
        '/api/cognitive-analytics',
        '/api/market-intelligence'
      ],
      dependencies: ['Authentication & Security'],
      authentication: true
    },
    {
      name: 'Business Intelligence',
      enabled: true,
      priority: 'medium',
      timeout: 25000,
      endpoints: [
        '/api/cognitive-business-intelligence',
        '/api/advanced-financial-intelligence',
        '/api/innovation-framework',
        '/api/ecosystem',
        '/api/platform-evolution'
      ],
      dependencies: ['AI & Analytics'],
      authentication: true
    },
    {
      name: 'Autonomous Systems',
      enabled: true,
      priority: 'medium',
      timeout: 20000,
      endpoints: [
        '/api/autonomous-customer-experience',
        '/api/autonomous-infrastructure',
        '/api/autonomous-monitoring',
        '/api/self-healing',
        '/api/threat-detection'
      ],
      dependencies: ['AI & Analytics'],
      authentication: true
    },
    {
      name: 'Communication & Content',
      enabled: true,
      priority: 'medium',
      timeout: 15000,
      endpoints: [
        '/api/ai-communication',
        '/api/content-generation',
        '/api/ai-workflow',
        '/api/ai-gateway',
        '/api/ai-innovation'
      ],
      dependencies: ['AI & Analytics'],
      authentication: true
    },
    {
      name: 'Compliance & Monitoring',
      enabled: true,
      priority: 'high',
      timeout: 15000,
      endpoints: [
        '/api/compliance/cookie-consent',
        '/api/compliance-automation',
        '/api/monitoring/site-crawler',
        '/api/ecosystem-orchestration'
      ],
      dependencies: ['Core Infrastructure'],
      authentication: false
    },
    {
      name: 'Public APIs',
      enabled: true,
      priority: 'medium',
      timeout: 10000,
      endpoints: [
        '/api/contact',
        '/api/consultations',
        '/api/newsletter/subscribe',
        '/api/sitemap',
        '/api/sitemap/visual'
      ],
      dependencies: ['Core Infrastructure'],
      authentication: false
    },
    {
      name: 'E-commerce & Payment',
      enabled: true,
      priority: 'high',
      timeout: 20000,
      endpoints: [
        '/api/payment/create-intent',
        '/api/crm/bundles'
      ],
      dependencies: ['Authentication & Security'],
      authentication: true
    },
    {
      name: 'Marketing & Analytics',
      enabled: true,
      priority: 'medium',
      timeout: 15000,
      endpoints: [
        '/api/marketing/leads',
        '/api/push/subscribe',
        '/api/push/unsubscribe'
      ],
      dependencies: ['Core Infrastructure'],
      authentication: false
    },
    {
      name: 'Admin & Management',
      enabled: true,
      priority: 'high',
      timeout: 15000,
      endpoints: [
        '/api/admin/users',
        '/api/users',
        '/api/organizations',
        '/api/projects',
        '/api/setup-database'
      ],
      dependencies: ['Authentication & Security'],
      authentication: true
    },
    {
      name: 'Testing & Development',
      enabled: true,
      priority: 'low',
      timeout: 10000,
      endpoints: [
        '/api/test/dashboard',
        '/api/test/email-service',
        '/api/test/redis-connection',
        '/api/test/stripe-connection',
        '/api/test/supabase-connection',
        '/api/hello'
      ],
      dependencies: [],
      authentication: false
    },
    {
      name: 'Real-time & Socket',
      enabled: true,
      priority: 'medium',
      timeout: 15000,
      endpoints: [
        '/api/socket.io'
      ],
      dependencies: ['Core Infrastructure'],
      authentication: true
    },
    {
      name: 'Production Readiness',
      enabled: true,
      priority: 'critical',
      timeout: 20000,
      endpoints: [
        '/api/production-readiness'
      ],
      dependencies: ['Core Infrastructure'],
      authentication: false
    }
  ]
}

export const DOCKER_CONFIG = {
  containerName: 'unite-group-app',
  logPath: '/var/log/unite-group',
  healthCheckInterval: 5000,
  maxLogLines: 1000,
  logFilters: {
    errors: ['ERROR', 'FATAL', 'CRITICAL'],
    warnings: ['WARN', 'WARNING'],
    performance: ['slow', 'timeout', 'memory'],
    security: ['unauthorized', 'forbidden', 'invalid_token']
  }
}
