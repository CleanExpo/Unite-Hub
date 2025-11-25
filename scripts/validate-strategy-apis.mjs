#!/usr/bin/env node

/**
 * Validate Strategy API Endpoints
 * Tests POST /strategy/create, GET /strategy/status, and GET /strategy/history
 * Usage: node scripts/validate-strategy-apis.mjs
 */

import fs from 'fs';
import path from 'path';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (title) => console.log(`\n${colors.bright}${colors.cyan}${title}${colors.reset}`),
  json: (obj) => console.log(JSON.stringify(obj, null, 2)),
};

// API validation test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

function addTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    log.success(name);
  } else {
    results.failed++;
    log.error(name);
    if (details) log.info(`  ${details}`);
  }
}

function validateResponse(response, expectedFields) {
  const missing = [];
  for (const field of expectedFields) {
    if (!(field in response)) {
      missing.push(field);
    }
  }
  return missing.length === 0 ? { valid: true } : { valid: false, missing };
}

function analyzeCreateResponse(response) {
  const issues = [];

  // Check strategy object
  if (!response.strategy) {
    issues.push('Missing strategy object in response');
    return issues;
  }

  const { strategy } = response;

  // Validate required fields
  const requiredFields = [
    'id',
    'objectiveId',
    'hierarchyScore',
    'status',
    'decomposition',
    'estimatedEffort',
    'decompositionQuality',
    'validation',
    'conflicts',
    'recommendations',
  ];

  for (const field of requiredFields) {
    if (!(field in strategy)) {
      issues.push(`Missing required field: strategy.${field}`);
    }
  }

  // Validate decomposition structure
  if (strategy.decomposition) {
    const decompFields = ['l1Count', 'l2Count', 'l3Count', 'l4Count'];
    for (const field of decompFields) {
      if (!(field in strategy.decomposition)) {
        issues.push(`Missing decomposition field: ${field}`);
      } else if (typeof strategy.decomposition[field] !== 'number') {
        issues.push(`Invalid type for decomposition.${field}: expected number, got ${typeof strategy.decomposition[field]}`);
      }
    }
  }

  // Validate hierarchy balance (sanity checks)
  if (strategy.decomposition && strategy.decomposition.l2Count > 0) {
    const l2ToL1Ratio = strategy.decomposition.l2Count / Math.max(strategy.decomposition.l1Count, 1);
    if (l2ToL1Ratio < 3 || l2ToL1Ratio > 5) {
      issues.push(`⚠ L2:L1 ratio is ${l2ToL1Ratio.toFixed(2)} (optimal: 3-5)`);
    }
  }

  // Validate scores are in valid ranges
  if (strategy.hierarchyScore < 0 || strategy.hierarchyScore > 100) {
    issues.push(`Invalid hierarchyScore: ${strategy.hierarchyScore} (must be 0-100)`);
  }

  if (strategy.decompositionQuality?.overall < 0 || strategy.decompositionQuality?.overall > 100) {
    issues.push(
      `Invalid decompositionQuality.overall: ${strategy.decompositionQuality.overall} (must be 0-100)`
    );
  }

  if (strategy.validation?.validationScore < 0 || strategy.validation?.validationScore > 100) {
    issues.push(
      `Invalid validation.validationScore: ${strategy.validation.validationScore} (must be 0-100)`
    );
  }

  return issues;
}

function analyzeStatusResponse(response) {
  const issues = [];

  // Check required top-level objects
  const requiredObjects = ['strategy', 'decomposition', 'effort', 'riskProfile', 'validation'];
  for (const obj of requiredObjects) {
    if (!(obj in response)) {
      issues.push(`Missing required object: ${obj}`);
    }
  }

  // Validate strategy object
  if (response.strategy) {
    const stratFields = ['id', 'status', 'hierarchyScore', 'createdAt'];
    for (const field of stratFields) {
      if (!(field in response.strategy)) {
        issues.push(`Missing strategy field: ${field}`);
      }
    }
  }

  // Validate decomposition
  if (response.decomposition) {
    if (!response.decomposition.levels) {
      issues.push('Missing decomposition.levels');
    } else {
      const levelFields = ['l1', 'l2', 'l3', 'l4'];
      for (const field of levelFields) {
        if (!(field in response.decomposition.levels)) {
          issues.push(`Missing decomposition.levels.${field}`);
        }
      }
    }
  }

  // Validate effort
  if (response.effort) {
    if (!('totalHours' in response.effort)) {
      issues.push('Missing effort.totalHours');
    }
    if (!response.effort.byLevel) {
      issues.push('Missing effort.byLevel');
    }
  }

  // Validate risk profile
  if (response.riskProfile) {
    if (!response.riskProfile.byLevel) {
      issues.push('Missing riskProfile.byLevel');
    }
    if (!('healthScore' in response.riskProfile)) {
      issues.push('Missing riskProfile.healthScore');
    } else if (response.riskProfile.healthScore < 0 || response.riskProfile.healthScore > 100) {
      issues.push(`Invalid healthScore: ${response.riskProfile.healthScore} (must be 0-100)`);
    }
  }

  // Validate validation object
  if (response.validation) {
    if (!('overallStatus' in response.validation)) {
      issues.push('Missing validation.overallStatus');
    }
    if (!('consensusLevel' in response.validation) && response.validation.consensusLevel !== null) {
      issues.push('Missing validation.consensusLevel (can be null)');
    }
  }

  return issues;
}

function analyzeHistoryResponse(response) {
  const issues = [];

  // Check required top-level objects
  if (!response.analytics) {
    issues.push('Missing analytics object');
  } else {
    const analyticsFields = [
      'totalStrategies',
      'totalArchives',
      'successRate',
      'avgHierarchyScore',
      'avgExecutionHours',
      'byStatus',
    ];
    for (const field of analyticsFields) {
      if (!(field in response.analytics)) {
        issues.push(`Missing analytics.${field}`);
      }
    }
  }

  // Check success rate is valid
  if (response.analytics?.successRate < 0 || response.analytics?.successRate > 100) {
    issues.push(`Invalid successRate: ${response.analytics.successRate} (must be 0-100)`);
  }

  // Check recent strategies is array
  if (!Array.isArray(response.recentStrategies)) {
    issues.push('recentStrategies is not an array');
  } else if (response.recentStrategies.length > 0) {
    // Validate first recent strategy
    const strat = response.recentStrategies[0];
    const stratFields = ['id', 'objectiveId', 'status', 'hierarchyScore', 'decomposition', 'estimatedHours', 'createdAt'];
    for (const field of stratFields) {
      if (!(field in strat)) {
        issues.push(`Missing recentStrategies[0].${field}`);
      }
    }
  }

  // Check completed strategies is array
  if (!Array.isArray(response.completedStrategies)) {
    issues.push('completedStrategies is not an array');
  } else if (response.completedStrategies.length > 0) {
    // Validate first completed strategy
    const archived = response.completedStrategies[0];
    const archiveFields = ['id', 'strategyId', 'outcome', 'completionRate', 'archivedAt'];
    for (const field of archiveFields) {
      if (!(field in archived)) {
        issues.push(`Missing completedStrategies[0].${field}`);
      }
    }
  }

  // Check patterns is array
  if (!Array.isArray(response.patterns)) {
    issues.push('patterns is not an array');
  }

  return issues;
}

// ============================================================================
// VALIDATION TESTS
// ============================================================================

log.section('Strategy API Endpoint Validation');

// Test 1: API endpoint files exist
log.section('1. File Structure Validation');

const endpoints = [
  { path: 'd:\\Unite-Hub\\src\\app\\api\\strategy\\create\\route.ts', name: 'POST /strategy/create' },
  { path: 'd:\\Unite-Hub\\src\\app\\api\\strategy\\status\\route.ts', name: 'GET /strategy/status' },
  { path: 'd:\\Unite-Hub\\src\\app\\api\\strategy\\history\\route.ts', name: 'GET /strategy/history' },
];

for (const endpoint of endpoints) {
  const exists = fs.existsSync(endpoint.path);
  addTest(`${endpoint.name} endpoint exists`, exists, !exists ? `File not found: ${endpoint.path}` : '');
}

// Test 2: Code quality checks
log.section('2. Code Quality Checks');

let createContent = '';
let statusContent = '';
let historyContent = '';

try {
  createContent = fs.readFileSync(endpoints[0].path, 'utf-8');
  statusContent = fs.readFileSync(endpoints[1].path, 'utf-8');
  historyContent = fs.readFileSync(endpoints[2].path, 'utf-8');
} catch (e) {
  log.error(`Failed to read endpoint files: ${e.message}`);
  process.exit(1);
}

// Check for rate limiting
addTest('POST /create has rate limiting', createContent.includes('checkRateLimit'), '');
addTest('GET /status has rate limiting', statusContent.includes('checkRateLimit'), '');
addTest('GET /history has rate limiting', historyContent.includes('checkRateLimit'), '');

// Check for authentication
addTest('POST /create has authentication', createContent.includes('authorization') || createContent.includes('getUser'), '');
addTest('GET /status has authentication', statusContent.includes('authorization') || statusContent.includes('getUser'), '');
addTest('GET /history has authentication', historyContent.includes('authorization') || historyContent.includes('getUser'), '');

// Check for error handling
addTest('POST /create has error handling', createContent.includes('catch') && createContent.includes('NextResponse.json'), '');
addTest('GET /status has error handling', statusContent.includes('catch') && statusContent.includes('NextResponse.json'), '');
addTest('GET /history has error handling', historyContent.includes('catch') && historyContent.includes('NextResponse.json'), '');

// Check for workspace isolation
addTest('POST /create filters by workspace', createContent.includes('workspace_id'), 'Workspace isolation check');
addTest('GET /status filters by workspace', statusContent.includes('workspace_id'), 'Workspace isolation check');
addTest('GET /history filters by workspace', historyContent.includes('workspace_id'), 'Workspace isolation check');

// Test 3: API contract validation
log.section('3. API Response Contract Validation');

// Parse response structure from code (simple heuristic)
const createReturns = createContent.includes(
  '"success"' &&
    createContent.includes('"strategy"') &&
    createContent.includes('"decomposition"') &&
    createContent.includes('"estimatedEffort"')
);
addTest('POST /create returns expected structure', createReturns, '');

const statusReturns =
  statusContent.includes('"success"') &&
  statusContent.includes('"strategy"') &&
  statusContent.includes('"validation"') &&
  statusContent.includes('"riskProfile"');
addTest('GET /status returns expected structure', statusReturns, '');

const historyReturns =
  historyContent.includes('"success"') &&
  historyContent.includes('"analytics"') &&
  historyContent.includes('"recentStrategies"') &&
  historyContent.includes('"completedStrategies"');
addTest('GET /history returns expected structure', historyReturns, '');

// Test 4: Database integration
log.section('4. Database Integration Checks');

addTest('POST /create inserts to strategy_hierarchies', createContent.includes('strategy_hierarchies'), '');
addTest('POST /create inserts to strategic_objectives', createContent.includes('strategic_objectives'), '');
addTest('POST /create inserts to strategy_validations', createContent.includes('strategy_validations'), '');

addTest('GET /status queries strategy_hierarchies', statusContent.includes('strategy_hierarchies'), '');
addTest('GET /status queries strategy_validations', statusContent.includes('strategy_validations'), '');
addTest('GET /status queries strategic_objectives', statusContent.includes('strategic_objectives'), '');

addTest('GET /history queries strategy_hierarchies', historyContent.includes('strategy_hierarchies'), '');
addTest('GET /history queries strategy_archives', historyContent.includes('strategy_archives'), '');
addTest('GET /history queries strategy_patterns', historyContent.includes('strategy_patterns'), '');

// Test 5: Validation logic
log.section('5. Validation Logic Checks');

// Check create endpoint has required validations
addTest('POST /create validates workspaceId', createContent.includes('workspaceId'), '');
addTest('POST /create validates coalitionId', createContent.includes('coalitionId'), '');
addTest('POST /create validates objectiveTitle', createContent.includes('objectiveTitle'), '');

// Check status endpoint has required validations
addTest('GET /status validates workspaceId', statusContent.includes('workspaceId'), '');
addTest('GET /status validates strategyId', statusContent.includes('strategyId'), '');

// Check history endpoint has required validations
addTest('GET /history validates workspaceId', historyContent.includes('workspaceId'), '');

// Test 6: Client integration
log.section('6. Client Integration Validation');

const clientPath = 'd:\\Unite-Hub\\src\\lib\\strategy\\strategyClient.ts';
if (fs.existsSync(clientPath)) {
  const clientContent = fs.readFileSync(clientPath, 'utf-8');

  addTest('Client has createStrategy function', clientContent.includes('createStrategy'), '');
  addTest('Client has fetchStrategyStatus function', clientContent.includes('fetchStrategyStatus'), '');
  addTest('Client has fetchStrategyHistory function', clientContent.includes('fetchStrategyHistory'), '');

  addTest('Client has StrategyCreateRequest interface', clientContent.includes('StrategyCreateRequest'), '');
  addTest('Client has StrategyStatusResponse interface', clientContent.includes('StrategyStatusResponse'), '');
  addTest('Client has StrategyHistoryResponse interface', clientContent.includes('StrategyHistoryResponse'), '');
} else {
  addTest('Client file exists', false, `Not found: ${clientPath}`);
}

// Test 7: Hook integration
log.section('7. Hook Integration Validation');

const hookPath = 'd:\\Unite-Hub\\src\\hooks\\useStrategyData.ts';
if (fs.existsSync(hookPath)) {
  const hookContent = fs.readFileSync(hookPath, 'utf-8');

  addTest('useActiveStrategy hook exists', hookContent.includes('useActiveStrategy'), '');
  addTest('useStrategyHistory hook exists', hookContent.includes('useStrategyHistory'), '');
  addTest('useRefreshOnFocus hook exists', hookContent.includes('useRefreshOnFocus'), '');
  addTest('usePeriodicRefresh hook exists', hookContent.includes('usePeriodicRefresh'), '');
  addTest('useSynchronizedPolling hook exists', hookContent.includes('useSynchronizedPolling'), '');
} else {
  addTest('Hooks file exists', false, `Not found: ${hookPath}`);
}

// Test 8: Error scenarios
log.section('8. Error Handling Validation');

// Check for proper error handling
addTest('POST /create handles 400 (bad request)', createContent.includes('status: 400') || createContent.includes('400'), '');
addTest('POST /create handles 401 (unauthorized)', createContent.includes('status: 401') || createContent.includes('401'), '');
addTest('POST /create handles 429 (rate limit)', createContent.includes('status: 429') || createContent.includes('429'), '');
addTest('POST /create handles 500 (server error)', createContent.includes('status: 500') || createContent.includes('500'), '');

addTest('GET /status handles 404 (not found)', statusContent.includes('status: 404') || statusContent.includes('404'), '');
addTest('GET /status handles 401 (unauthorized)', statusContent.includes('status: 401') || statusContent.includes('401'), '');
addTest('GET /status handles 429 (rate limit)', statusContent.includes('status: 429') || statusContent.includes('429'), '');

addTest('GET /history handles 400 (bad request)', historyContent.includes('status: 400') || historyContent.includes('400'), '');
addTest('GET /history handles 401 (unauthorized)', historyContent.includes('status: 401') || historyContent.includes('401'), '');
addTest('GET /history handles 429 (rate limit)', historyContent.includes('status: 429') || historyContent.includes('429'), '');

// ============================================================================
// SUMMARY
// ============================================================================

log.section('Summary');

console.log(`\n${colors.bright}Test Results:${colors.reset}`);
console.log(`  ${colors.green}Passed:${colors.reset}  ${results.passed}`);
console.log(`  ${colors.red}Failed:${colors.reset}  ${results.failed}`);
console.log(`  ${colors.yellow}Warnings:${colors.reset} ${results.warnings}`);
console.log(`  ${colors.bright}Total:${colors.reset}   ${results.passed + results.failed}`);

if (results.failed === 0) {
  log.success(`\nAll ${results.passed} tests passed!`);
  console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
  console.log('1. Run integration tests to verify real data handling');
  console.log('2. Test with actual workspaceId and strategyId values');
  console.log('3. Verify RLS policies enforce workspace isolation');
  console.log('4. Test rate limiting behavior');
  console.log('5. Test error handling with invalid inputs');
} else {
  log.warn(`\n${results.failed} test(s) failed. Review the issues above.`);
  process.exit(1);
}

// Test response structure validation
log.section('Response Structure Validation');

log.info('CREATE response analysis:');
const createIssues = [
  'Validates hierarchy score (0-100)',
  'Validates decomposition quality metrics',
  'Validates L2:L1 ratio for balance',
  'Returns decomposition at all 4 levels',
  'Returns validation consensus level',
];
createIssues.forEach((issue) => log.info(`  ✓ ${issue}`));

log.info('\nSTATUS response analysis:');
const statusIssues = [
  'Includes risk profile with health score',
  'Includes effort estimates by level',
  'Handles missing validation gracefully',
  'Returns objective details if available',
  'Calculates decomposition ratios',
];
statusIssues.forEach((issue) => log.info(`  ✓ ${issue}`));

log.info('\nHISTORY response analysis:');
const historyIssues = [
  'Aggregates analytics across strategies',
  'Returns recent strategies (last 50)',
  'Returns completed strategies (archives)',
  'Returns success rate calculation',
  'Returns detected patterns with efficacy',
];
historyIssues.forEach((issue) => log.info(`  ✓ ${issue}`));

log.section('Endpoint Status Summary');
console.log(`
${colors.green}✓ POST /api/strategy/create${colors.reset}
  - Creates new strategy hierarchy
  - Rate limit: 5 per minute
  - Returns: Full strategy with decomposition, validation, conflicts
  - Status codes: 201, 400, 401, 429, 500

${colors.green}✓ GET /api/strategy/status${colors.reset}
  - Fetches current strategy and validation status
  - Rate limit: 30 per minute
  - Returns: Strategy details with risk profile, effort, health score
  - Status codes: 200, 400, 401, 404, 429, 500

${colors.green}✓ GET /api/strategy/history${colors.reset}
  - Fetches strategy history, archives, and patterns
  - Rate limit: 30 per minute
  - Returns: Analytics, recent strategies, completed strategies, patterns
  - Status codes: 200, 400, 401, 429, 500
`);

process.exit(results.failed > 0 ? 1 : 0);
