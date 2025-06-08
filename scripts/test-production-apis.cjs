#!/usr/bin/env node

/**
 * Production API Testing Script
 * Tests all critical API endpoints to ensure they're working properly
 */

const baseUrl = process.env.TEST_URL || 'http://localhost:3000';

const testEndpoints = [
  // Health & System
  { path: '/api/health', method: 'GET', critical: true },
  
  // Authentication
  { path: '/api/auth/mfa', method: 'GET', critical: true },
  
  // CRM Core
  { path: '/api/crm/dashboard', method: 'GET', critical: true },
  { path: '/api/crm/clients', method: 'GET', critical: true },
  { path: '/api/crm/projects', method: 'GET', critical: true },
  { path: '/api/crm/tasks', method: 'GET', critical: true },
  { path: '/api/crm/activities', method: 'GET', critical: true },
  
  // CRM Messaging
  { path: '/api/crm/messaging/channels', method: 'GET', critical: true },
  { path: '/api/crm/messaging/messages', method: 'GET', critical: true },
  
  // Business Services
  { path: '/api/consultations', method: 'GET', critical: true },
  { path: '/api/contact', method: 'GET', critical: false },
  
  // AI Services
  { path: '/api/ai/predictions', method: 'GET', critical: false },
  { path: '/api/ai/monitor', method: 'GET', critical: false },
  
  // Infrastructure
  { path: '/api/test/supabase-connection', method: 'GET', critical: true },
  { path: '/api/test/redis-connection', method: 'GET', critical: false },
  { path: '/api/test/stripe-connection', method: 'GET', critical: false },
];

async function testEndpoint(endpoint) {
  try {
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const status = response.status;
    const isSuccess = status >= 200 && status < 300;
    const isAuthError = status === 401 || status === 403;
    
    return {
      ...endpoint,
      status,
      responseTime,
      isSuccess,
      isAuthError,
      error: null
    };
  } catch (error) {
    return {
      ...endpoint,
      status: 0,
      responseTime: 0,
      isSuccess: false,
      isAuthError: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log(`🚀 Testing APIs at: ${baseUrl}`);
  console.log('=' * 50);
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    process.stdout.write(`Testing ${endpoint.path}... `);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.isSuccess) {
      console.log(`✅ ${result.status} (${result.responseTime}ms)`);
    } else if (result.isAuthError) {
      console.log(`🔐 ${result.status} Auth Required (${result.responseTime}ms)`);
    } else {
      console.log(`❌ ${result.status} ${result.error || 'Failed'} (${result.responseTime}ms)`);
    }
  }
  
  console.log('\n' + '=' * 50);
  console.log('📊 SUMMARY:');
  
  const successful = results.filter(r => r.isSuccess).length;
  const authRequired = results.filter(r => r.isAuthError).length;
  const failed = results.filter(r => !r.isSuccess && !r.isAuthError).length;
  const criticalFailed = results.filter(r => r.critical && !r.isSuccess && !r.isAuthError).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`🔐 Auth Required: ${authRequired}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`🚨 Critical Failed: ${criticalFailed}/${results.length}`);
  
  if (criticalFailed > 0) {
    console.log('\n🚨 CRITICAL FAILURES:');
    results
      .filter(r => r.critical && !r.isSuccess && !r.isAuthError)
      .forEach(r => console.log(`   - ${r.path}: ${r.status} ${r.error || 'Failed'}`));
    
    process.exit(1);
  }
  
  const avgResponseTime = results
    .filter(r => r.responseTime > 0)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.responseTime > 0).length;
  
  console.log(`⏱️ Average Response Time: ${Math.round(avgResponseTime)}ms`);
  
  if (avgResponseTime > 5000) {
    console.log('⚠️ WARNING: High response times detected');
  }
  
  console.log('\n🎉 API testing completed!');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint };
