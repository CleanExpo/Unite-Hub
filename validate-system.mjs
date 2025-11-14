#!/usr/bin/env node

/**
 * Unite-Hub System Validation Script
 * Comprehensive health check for all systems
 */

const BASE_URL = 'http://localhost:3008';

const tests = {
  pages: [
    { name: 'Homepage', path: '/', expect: 'Unite-Hub' },
    { name: 'Login', path: '/login', expect: 'Unite-Hub' },
    { name: 'Pricing', path: '/pricing', expect: 'Unite-Hub' },
    { name: 'Dashboard', path: '/dashboard', expect: 'dashboard' },
  ],
  apis: [
    {
      name: 'Database Connection',
      path: '/api/test/db',
      method: 'GET',
      expect: (data) => data.success === true,
    },
    {
      name: 'Stripe Checkout',
      path: '/api/stripe/checkout',
      method: 'POST',
      body: {
        plan: 'starter',
        email: 'test@test.com',
        name: 'Test User',
        orgId: 'default-org',
      },
      expect: (data) => !!data.sessionId,
    },
    {
      name: 'Auth Protected (Should Fail)',
      path: '/api/integrations/list',
      method: 'GET',
      expect: (data) => data.error === 'Unauthorized',
    },
  ],
};

async function testPage(test) {
  try {
    const response = await fetch(`${BASE_URL}${test.path}`);
    const text = await response.text();
    const passed = text.includes(test.expect);
    return { name: test.name, passed, status: response.status };
  } catch (error) {
    return { name: test.name, passed: false, error: error.message };
  }
}

async function testApi(test) {
  try {
    const options = {
      method: test.method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (test.body) {
      options.body = JSON.stringify(test.body);
    }

    const response = await fetch(`${BASE_URL}${test.path}`, options);
    const data = await response.json();
    const passed = test.expect(data);
    return { name: test.name, passed, status: response.status, data };
  } catch (error) {
    return { name: test.name, passed: false, error: error.message };
  }
}

async function runTests() {
  console.log('🔍 Unite-Hub System Validation\n');

  console.log('📄 Testing Pages...');
  for (const test of tests.pages) {
    const result = await testPage(test);
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name} (${result.status})`);
  }

  console.log('\n🔌 Testing API Endpoints...');
  for (const test of tests.apis) {
    const result = await testApi(test);
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name} (${result.status})`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log('\n✨ Validation Complete!');
}

runTests().catch(console.error);
