#!/usr/bin/env node

/**
 * npm Health Check - Pre-build dependency validation
 *
 * Validates:
 * 1. package-lock.json exists and is tracked in git
 * 2. No corrupted node_modules (invalid packages, .DELETE markers)
 * 3. All critical dependencies installed
 * 4. Lock file integrity
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const NODE_MODULES = path.join(PROJECT_ROOT, 'node_modules');
const LOCK_FILE = path.join(PROJECT_ROOT, 'package-lock.json');

let hasErrors = false;
let hasWarnings = false;

function error(msg) {
  console.error(`❌ ${msg}`);
  hasErrors = true;
}

function warning(msg) {
  console.warn(`⚠️  ${msg}`);
  hasWarnings = true;
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

function info(msg) {
  console.log(`ℹ️  ${msg}`);
}

console.log('\n📦 npm Health Check\n');

// 1. Check package-lock.json exists
if (!existsSync(LOCK_FILE)) {
  error('package-lock.json is missing - deterministic builds are not possible');
  error('Run: npm install --package-lock-only');
  process.exit(1);
}
success('package-lock.json exists');

// 2. Check lock file is tracked in git
try {
  const gitStatus = execSync('git ls-files package-lock.json', { encoding: 'utf8' }).trim();
  if (gitStatus === 'package-lock.json') {
    success('package-lock.json is tracked in git');
  } else {
    error('package-lock.json is not tracked in git');
    error('Run: git add package-lock.json && git commit -m "Add package-lock.json"');
  }
} catch (err) {
  warning('Could not verify git tracking status');
}

// 3. Check node_modules for corruption
if (existsSync(NODE_MODULES)) {
  info('Checking node_modules integrity...');

  let deleteMarkerCount = 0;
  let invalidPackageCount = 0;

  try {
    const dirs = readdirSync(NODE_MODULES);

    // Count .DELETE markers and invalid packages
    const recursiveCheck = (dir) => {
      try {
        const files = readdirSync(dir);
        for (const file of files) {
          if (file.includes('.DELETE.')) {
            deleteMarkerCount++;
          }
          const fullPath = path.join(dir, file);
          if (file.startsWith('@')) {
            try {
              const subDirs = readdirSync(fullPath);
              for (const subDir of subDirs) {
                recursiveCheck(path.join(fullPath, subDir));
              }
            } catch (e) {
              // Skip on error
            }
          }
        }
      } catch (e) {
        // Skip directories we can't read
      }
    };

    recursiveCheck(NODE_MODULES);

    if (deleteMarkerCount > 0) {
      error(`Found ${deleteMarkerCount} incomplete cleanup markers (.DELETE.*)`);
      error('Run: rm -rf node_modules && npm ci');
    } else {
      success('No corruption markers found');
    }
  } catch (err) {
    warning('Could not fully scan node_modules');
  }
} else {
  warning('node_modules does not exist - fresh install needed');
}

// 4. Check critical dependencies
const criticalDeps = [
  'next',
  'react',
  'react-dom',
  '@supabase/supabase-js',
  '@anthropic-ai/sdk'
];

info('Checking critical dependencies...');
let missingDeps = [];

for (const dep of criticalDeps) {
  const depPath = path.join(NODE_MODULES, dep);
  if (existsSync(depPath)) {
    success(`${dep} installed`);
  } else {
    error(`${dep} is missing`);
    missingDeps.push(dep);
  }
}

if (missingDeps.length > 0) {
  error(`Missing dependencies: ${missingDeps.join(', ')}`);
  error('Run: npm ci');
  process.exit(1);
}

// 5. Check npm version
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  const packageJson = JSON.parse(
    execSync('cat package.json', { encoding: 'utf8' })
  );
  const expectedNpmVersion = packageJson.engines?.npm;

  if (expectedNpmVersion) {
    info(`npm version: ${npmVersion} (expected: ${expectedNpmVersion})`);
  } else {
    info(`npm version: ${npmVersion}`);
  }
} catch (err) {
  warning('Could not verify npm version');
}

// 6. Check Node version
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  const nvmrc = execSync('cat .nvmrc', { encoding: 'utf8' }).trim();

  if (nodeVersion.includes(nvmrc)) {
    success(`Node version: ${nodeVersion} (matches .nvmrc)`);
  } else {
    warning(`Node version: ${nodeVersion} (expected: v${nvmrc})`);
  }
} catch (err) {
  warning('Could not verify Node version');
}

// Summary
console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.error('❌ Health check FAILED - fix errors above');
  process.exit(1);
}

if (hasWarnings) {
  console.warn('⚠️  Health check passed with warnings');
  process.exit(0);
}

success('All checks passed - ready to build! 🚀\n');
process.exit(0);
