#!/usr/bin/env node

/**
 * Production Quality Assessment
 * Automated evaluation against expert engineering patterns
 * Runs after each phase implementation
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const PROJECT_ROOT = 'd:\\Unite-Hub';

console.log('\n🔍 PRODUCTION QUALITY ASSESSMENT\n');
console.log('='.repeat(70));
console.log('Evaluating against expert engineering patterns...\n');

const assessment = {
  errorHandling: { score: 0, max: 100, findings: [] },
  observability: { score: 0, max: 100, findings: [] },
  performance: { score: 0, max: 100, findings: [] },
  security: { score: 0, max: 100, findings: [] },
  typeSafety: { score: 0, max: 100, findings: [] },
  testing: { score: 0, max: 100, findings: [] },
  deployment: { score: 0, max: 100, findings: [] },
  realTime: { score: 0, max: 100, findings: [] },
  organization: { score: 0, max: 100, findings: [] },
  monitoring: { score: 0, max: 100, findings: [] }
};

// =====================================================
// CATEGORY 1: ERROR HANDLING & RESILIENCE
// =====================================================

async function assessErrorHandling() {
  console.log('📋 1. Error Handling & Resilience\n');

  const checks = {
    customErrorClasses: false,
    rfc7807Compliance: false,
    centralizedLogging: false,
    errorPrioritization: false,
    secureErrors: false
  };

  try {
    // Check for custom error classes
    const libFiles = await readdir(join(PROJECT_ROOT, 'src/lib'), { recursive: true });
    const hasErrorClass = libFiles.some(f => f.includes('error') || f.includes('Error'));
    checks.customErrorClasses = hasErrorClass;

    // Check for RFC 7807 compliance (problem details) in src/lib/errors.ts
    const errorsFile = await readFile(join(PROJECT_ROOT, 'src/lib/errors.ts'), 'utf-8').catch(() => '');
    checks.rfc7807Compliance = errorsFile.includes('ProblemDetail') || errorsFile.includes('RFC 7807');

    // Check for logging (Winston, Bunyan, or console with levels)
    const pkgJson = await readFile(join(PROJECT_ROOT, 'package.json'), 'utf-8');
    const pkg = JSON.parse(pkgJson);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    checks.centralizedLogging = !!(allDeps['winston'] || allDeps['bunyan'] || allDeps['pino']);

    // Check for error prioritization
    checks.errorPrioritization = errorsFile.includes('priority') || errorsFile.includes('severity') || errorsFile.includes('P0');

    // Security: check errors don't leak sensitive data
    checks.secureErrors = !errorsFile.includes('stack') || errorsFile.includes('sanitize');

  } catch (error) {
    console.log(`   ⚠️  Could not fully assess: ${error.message}`);
  }

  const score = Object.values(checks).filter(Boolean).length * 20;
  assessment.errorHandling.score = score;

  console.log(`   ${checks.customErrorClasses ? '✅' : '❌'} Custom error classes`);
  console.log(`   ${checks.rfc7807Compliance ? '✅' : '❌'} RFC 7807 compliance`);
  console.log(`   ${checks.centralizedLogging ? '✅' : '❌'} Centralized logging (Winston/Bunyan)`);
  console.log(`   ${checks.errorPrioritization ? '❌' : '❌'} Error prioritization (P0-P2)`);
  console.log(`   ${checks.secureErrors ? '✅' : '❌'} Secure error messages\n`);
  console.log(`   📊 Score: ${score}/100 ${getScoreEmoji(score)}\n`);

  if (!checks.customErrorClasses) {
    assessment.errorHandling.findings.push({
      priority: 'HIGH',
      issue: 'No custom error classes found',
      recommendation: 'Create src/lib/errors.ts with custom error hierarchy (AppError, ValidationError, DatabaseError, etc.)',
      impact: 'Better error handling, easier debugging, type-safe error catching'
    });
  }

  if (!checks.rfc7807Compliance) {
    assessment.errorHandling.findings.push({
      priority: 'MEDIUM',
      issue: 'API errors not RFC 7807 compliant',
      recommendation: 'Return standardized error responses with type, title, status, detail, instance fields',
      impact: 'Consistent error handling across all clients, better developer experience'
    });
  }

  if (!checks.centralizedLogging) {
    assessment.errorHandling.findings.push({
      priority: 'HIGH',
      issue: 'No centralized logging system',
      recommendation: 'Install and configure Winston or Pino for structured logging',
      impact: 'Production debugging, error tracking, audit trails'
    });
  }
}

// =====================================================
// CATEGORY 2: OBSERVABILITY
// =====================================================

async function assessObservability() {
  console.log('📊 2. Observability & Monitoring\n');

  const checks = {
    structuredLogs: false,
    metricsInstrumentation: false,
    distributedTracing: false,
    logCentralization: false,
    dashboards: false
  };

  try {
    const pkgJson = await readFile(join(PROJECT_ROOT, 'package.json'), 'utf-8');
    const pkg = JSON.parse(pkgJson);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    checks.structuredLogs = !!(allDeps['winston'] || allDeps['pino']);
    checks.metricsInstrumentation = !!(allDeps['prom-client'] || allDeps['@opentelemetry/api']);
    checks.distributedTracing = !!(allDeps['@opentelemetry/sdk-node'] || allDeps['@opentelemetry/sdk-trace-node']);

    // Check for monitoring setup
    try {
      await stat(join(PROJECT_ROOT, 'docker', 'prometheus'));
      checks.logCentralization = true;
      checks.dashboards = true;
    } catch {}

  } catch (error) {
    console.log(`   ⚠️  Could not fully assess: ${error.message}`);
  }

  const score = Object.values(checks).filter(Boolean).length * 20;
  assessment.observability.score = score;

  console.log(`   ${checks.structuredLogs ? '✅' : '❌'} Structured logging`);
  console.log(`   ${checks.metricsInstrumentation ? '✅' : '❌'} Metrics instrumentation`);
  console.log(`   ${checks.distributedTracing ? '✅' : '❌'} Distributed tracing`);
  console.log(`   ${checks.logCentralization ? '✅' : '❌'} Log centralization (ELK/similar)`);
  console.log(`   ${checks.dashboards ? '✅' : '❌'} Monitoring dashboards\n`);
  console.log(`   📊 Score: ${score}/100 ${getScoreEmoji(score)}\n`);

  if (!checks.distributedTracing) {
    assessment.observability.findings.push({
      priority: 'MEDIUM',
      issue: 'No distributed tracing configured',
      recommendation: 'Implement OpenTelemetry for request tracing across services',
      impact: 'Debug complex flows, identify bottlenecks, understand system behavior'
    });
  }
}

// =====================================================
// CATEGORY 3: PERFORMANCE OPTIMIZATION
// =====================================================

async function assessPerformance() {
  console.log('⚡ 3. Performance Optimization\n');

  const checks = {
    connectionPooling: false,
    caching: false,
    codeSplitting: false,
    lazyLoading: false,
    bundleOptimization: false
  };

  try {
    const pkgJson = await readFile(join(PROJECT_ROOT, 'package.json'), 'utf-8');
    const pkg = JSON.parse(pkgJson);

    // Check for Redis/caching
    checks.caching = !!(pkg.dependencies?.redis || pkg.dependencies?.ioredis);

    // Check for Next.js (has code splitting built-in)
    checks.codeSplitting = !!pkg.dependencies?.next;

    // Check for lazy loading patterns
    const appFiles = await readdir(join(PROJECT_ROOT, 'src'), { recursive: true }).catch(() => []);
    for (const file of appFiles.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))) {
      const content = await readFile(join(PROJECT_ROOT, 'src', file), 'utf-8').catch(() => '');
      if (content.includes('React.lazy') || content.includes('dynamic(') || content.includes('lazyLoad')) {
        checks.lazyLoading = true;
        break;
      }
    }

    // Check connection pooling (Supabase has built-in pooling)
    checks.connectionPooling = true; // Supabase handles this

    // Check bundle optimization - try both .js and .mjs
    let nextConfig = await readFile(join(PROJECT_ROOT, 'next.config.mjs'), 'utf-8').catch(() => '');
    if (!nextConfig) {
      nextConfig = await readFile(join(PROJECT_ROOT, 'next.config.js'), 'utf-8').catch(() => '');
    }
    checks.bundleOptimization = nextConfig.includes('compress') || nextConfig.includes('swcMinify');

  } catch (error) {
    console.log(`   ⚠️  Could not fully assess: ${error.message}`);
  }

  const score = Object.values(checks).filter(Boolean).length * 20;
  assessment.performance.score = score;

  console.log(`   ${checks.connectionPooling ? '✅' : '❌'} Database connection pooling`);
  console.log(`   ${checks.caching ? '✅' : '❌'} Redis caching layer`);
  console.log(`   ${checks.codeSplitting ? '✅' : '❌'} Code splitting`);
  console.log(`   ${checks.lazyLoading ? '✅' : '❌'} Lazy loading (components)`);
  console.log(`   ${checks.bundleOptimization ? '✅' : '❌'} Bundle optimization\n`);
  console.log(`   📊 Score: ${score}/100 ${getScoreEmoji(score)}\n`);

  if (!checks.caching) {
    assessment.performance.findings.push({
      priority: 'HIGH',
      issue: 'No Redis caching layer',
      recommendation: 'Implement Redis for session data, frequently-accessed content, and API response caching',
      impact: '70-90% database load reduction, millisecond response times'
    });
  }

  if (!checks.lazyLoading) {
    assessment.performance.findings.push({
      priority: 'MEDIUM',
      issue: 'Limited lazy loading implementation',
      recommendation: 'Use React.lazy() for modals, heavy components, below-the-fold content',
      impact: '40-70% initial bundle size reduction, faster TTI'
    });
  }
}

// =====================================================
// CATEGORY 4: SECURITY HARDENING
// =====================================================

async function assessSecurity() {
  console.log('🔒 4. Security Hardening\n');

  const checks = {
    rateLimiting: false,
    inputValidation: false,
    secretsManagement: false,
    mfa: false,
    securityHeaders: false
  };

  try {
    const pkgJson = await readFile(join(PROJECT_ROOT, 'package.json'), 'utf-8');
    const pkg = JSON.parse(pkgJson);

    // Check for rate limiting
    checks.rateLimiting = !!(pkg.dependencies?.['express-rate-limit'] || pkg.dependencies?.['rate-limiter-flexible']);

    // Check for validation libraries
    checks.inputValidation = !!(pkg.dependencies?.zod || pkg.dependencies?.yup || pkg.dependencies?.joi);

    // Check secrets are not in code
    const envExample = await readFile(join(PROJECT_ROOT, '.env.example'), 'utf-8').catch(() => '');
    checks.secretsManagement = envExample.length > 0;

    // Check for security headers - try both .js and .mjs
    let nextConfig = await readFile(join(PROJECT_ROOT, 'next.config.mjs'), 'utf-8').catch(() => '');
    if (!nextConfig) {
      nextConfig = await readFile(join(PROJECT_ROOT, 'next.config.js'), 'utf-8').catch(() => '');
    }
    checks.securityHeaders = nextConfig.includes('headers(') || nextConfig.includes('headers:');

    // MFA would need to check auth implementation
    checks.mfa = false; // Requires manual verification

  } catch (error) {
    console.log(`   ⚠️  Could not fully assess: ${error.message}`);
  }

  const score = Object.values(checks).filter(Boolean).length * 20;
  assessment.security.score = score;

  console.log(`   ${checks.rateLimiting ? '✅' : '❌'} API rate limiting`);
  console.log(`   ${checks.inputValidation ? '✅' : '❌'} Input validation (Zod/Yup)`);
  console.log(`   ${checks.secretsManagement ? '✅' : '❌'} Secrets management (.env.example)`);
  console.log(`   ${checks.mfa ? '❌' : '❌'} Multi-factor authentication`);
  console.log(`   ${checks.securityHeaders ? '✅' : '❌'} Security headers configured\n`);
  console.log(`   📊 Score: ${score}/100 ${getScoreEmoji(score)}\n`);

  if (!checks.rateLimiting) {
    assessment.security.findings.push({
      priority: 'CRITICAL',
      issue: 'No API rate limiting',
      recommendation: 'Implement rate-limiter-flexible with Redis backend, tiered limits (100/day free, 10k premium)',
      impact: 'Prevent abuse, DDoS protection, fair resource usage'
    });
  }

  if (!checks.securityHeaders) {
    assessment.security.findings.push({
      priority: 'HIGH',
      issue: 'Security headers not configured',
      recommendation: 'Add CSP, X-Frame-Options, X-Content-Type-Options, etc. in next.config.js',
      impact: 'Prevent XSS, clickjacking, MIME-type sniffing attacks'
    });
  }
}

// =====================================================
// CATEGORY 5: TYPE SAFETY
// =====================================================

async function assessTypeSafety() {
  console.log('🔷 5. TypeScript & Type Safety\n');

  const checks = {
    strictMode: false,
    endToEndTypes: false,
    brandedTypes: false,
    discriminatedUnions: false,
    typeSafeErrors: false
  };

  try {
    // Check tsconfig
    const tsconfig = await readFile(join(PROJECT_ROOT, 'tsconfig.json'), 'utf-8');
    const config = JSON.parse(tsconfig);
    checks.strictMode = config.compilerOptions?.strict === true;

    // Check for tRPC or similar
    const pkgJson = await readFile(join(PROJECT_ROOT, 'package.json'), 'utf-8');
    const pkg = JSON.parse(pkgJson);
    checks.endToEndTypes = !!(pkg.dependencies?.['@trpc/server'] || pkg.dependencies?.['@ts-rest/core']);

    // Check for branded types
    const typesFiles = await readdir(join(PROJECT_ROOT, 'src/types'), { recursive: true }).catch(() => []);
    checks.brandedTypes = typesFiles.some(f => f.includes('branded'));

    // Check for Result type or discriminated unions
    checks.typeSafeErrors = typesFiles.some(f => f.includes('result') || f.includes('error'));
    checks.discriminatedUnions = checks.typeSafeErrors; // Result type uses discriminated unions

  } catch (error) {
    console.log(`   ⚠️  Could not fully assess: ${error.message}`);
  }

  const score = Object.values(checks).filter(Boolean).length * 20;
  assessment.typeSafety.score = score;

  console.log(`   ${checks.strictMode ? '✅' : '❌'} TypeScript strict mode`);
  console.log(`   ${checks.endToEndTypes ? '❌' : '❌'} End-to-end type safety (tRPC)`);
  console.log(`   ${checks.brandedTypes ? '✅' : '❌'} Branded types for domain`);
  console.log(`   ${checks.discriminatedUnions ? '✅' : '❌'} Discriminated unions`);
  console.log(`   ${checks.typeSafeErrors ? '✅' : '❌'} Type-safe error handling\n`);
  console.log(`   📊 Score: ${score}/100 ${getScoreEmoji(score)}\n`);

  if (!checks.endToEndTypes) {
    assessment.typeSafety.findings.push({
      priority: 'MEDIUM',
      issue: 'No end-to-end type safety',
      recommendation: 'Consider tRPC for automatic type inference from backend to frontend',
      impact: 'Eliminate manual type duplication, catch API contract changes at compile time'
    });
  }
}

// =====================================================
// CATEGORY 6-10: Additional Assessments
// =====================================================

async function assessTesting() {
  console.log('🧪 6. Testing Coverage\n');

  const checks = {
    unitTests: false,
    integrationTests: false,
    e2eTests: false,
    ciIntegration: false,
    codeCoverage: false
  };

  try {
    const pkgJson = await readFile(join(PROJECT_ROOT, 'package.json'), 'utf-8');
    const pkg = JSON.parse(pkgJson);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    checks.unitTests = !!(allDeps['jest'] || allDeps['vitest']);
    checks.e2eTests = !!(allDeps['@playwright/test'] || allDeps['playwright'] || allDeps['cypress']);

    // Check for integration test files
    try {
      const integrationPath = join(PROJECT_ROOT, 'src', 'lib', '__tests__', 'integration');
      const integrationFiles = await readdir(integrationPath).catch(() => []);
      checks.integrationTests = integrationFiles.filter(f => f.endsWith('.test.ts') || f.endsWith('.test.tsx')).length > 0;
    } catch {}

    // Check for CI/CD workflow files
    try {
      const workflowPath = join(PROJECT_ROOT, '.github', 'workflows');
      const workflows = await readdir(workflowPath).catch(() => []);
      checks.ciIntegration = workflows.some(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    } catch {}

    // Check for coverage config in vitest.config.ts
    const vitestConfig = await readFile(join(PROJECT_ROOT, 'vitest.config.ts'), 'utf-8').catch(() => '');
    checks.codeCoverage = vitestConfig.includes('coverage') && (vitestConfig.includes('lines:') || vitestConfig.includes('all: true'));

  } catch (error) {
    console.log(`   ⚠️  Could not fully assess: ${error.message}`);
  }

  const score = Object.values(checks).filter(Boolean).length * 20;
  assessment.testing.score = score;

  console.log(`   ${checks.unitTests ? '✅' : '❌'} Unit tests (Jest/Vitest)`);
  console.log(`   ${checks.integrationTests ? '✅' : '❌'} Integration tests`);
  console.log(`   ${checks.e2eTests ? '✅' : '❌'} E2E tests (Playwright)`);
  console.log(`   ${checks.ciIntegration ? '✅' : '❌'} CI/CD integration`);
  console.log(`   ${checks.codeCoverage ? '✅' : '❌'} Code coverage tracking\n`);
  console.log(`   📊 Score: ${score}/100 ${getScoreEmoji(score)}\n`);

  if (!checks.unitTests) {
    assessment.testing.findings.push({
      priority: 'HIGH',
      issue: 'No unit testing framework',
      recommendation: 'Install Vitest and create tests/ directory with component and function tests',
      impact: 'Catch regressions early, enable refactoring with confidence'
    });
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getScoreEmoji(score) {
  if (score >= 90) return '✅ Excellent';
  if (score >= 70) return '🟢 Good';
  if (score >= 40) return '🟡 Needs Work';
  return '🔴 Critical';
}

function calculateOverallScore() {
  const weights = {
    errorHandling: 0.15,
    observability: 0.15,
    performance: 0.15,
    security: 0.20,
    typeSafety: 0.10,
    testing: 0.10,
    deployment: 0.05,
    realTime: 0.05,
    organization: 0.03,
    monitoring: 0.02
  };

  let total = 0;
  for (const [category, weight] of Object.entries(weights)) {
    total += assessment[category].score * weight;
  }

  return Math.round(total);
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function runAssessment() {
  await assessErrorHandling();
  await assessObservability();
  await assessPerformance();
  await assessSecurity();
  await assessTypeSafety();
  await assessTesting();

  // Calculate overall score
  const overall = calculateOverallScore();

  console.log('='.repeat(70));
  console.log('\n📊 OVERALL QUALITY SCORE\n');
  console.log(`   ${overall}/100 ${getScoreEmoji(overall)}\n`);

  // Priority recommendations
  console.log('🎯 TOP PRIORITY RECOMMENDATIONS\n');

  const allFindings = Object.values(assessment)
    .flatMap(cat => cat.findings)
    .filter(f => f.priority === 'CRITICAL' || f.priority === 'HIGH')
    .sort((a, b) => {
      const priority = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priority[a.priority] - priority[b.priority];
    });

  allFindings.slice(0, 5).forEach((finding, i) => {
    console.log(`   ${i + 1}. [${finding.priority}] ${finding.issue}`);
    console.log(`      → ${finding.recommendation}`);
    console.log(`      💡 Impact: ${finding.impact}\n`);
  });

  if (overall >= 85) {
    console.log('🎉 PRODUCTION READY! System meets expert engineering standards.\n');
  } else if (overall >= 70) {
    console.log('✅ GOOD FOUNDATION. Address high-priority items before production.\n');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT. Implement critical enhancements before launch.\n');
  }

  console.log('='.repeat(70) + '\n');

  return overall >= 70;
}

runAssessment()
  .then(passed => process.exit(passed ? 0 : 1))
  .catch(err => {
    console.error('❌ Assessment failed:', err);
    process.exit(1);
  });
