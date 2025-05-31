interface SmokeTestResult {
  passed: boolean;
  status: number;
  message: string;
  endpoint: string;
}

const criticalPaths = [
  { path: '/', name: 'Homepage', method: 'GET' },
  { path: '/en/services/business-intelligence', name: 'Business Intelligence Service', method: 'GET' },
  { path: '/en/services/security-compliance', name: 'Security Compliance Service', method: 'GET' },
  { path: '/en/login', name: 'Login Page', method: 'GET' },
  { path: '/api/health', name: 'Health Check API', method: 'GET' }
];

const functionalityTests = [
  {
    path: '/api/compliance/cookie-consent',
    name: 'Cookie Consent API',
    method: 'POST',
    body: {
      sessionId: 'test-session-' + Date.now(),
      preferences: {
        necessary: true,
        preferences: false,
        analytics: false,
        marketing: false
      }
    }
  }
];

export async function runSmokeTests(baseUrl: string): Promise<boolean> {
  console.log('🔍 Running post-deployment smoke tests...\n');
  console.log(`🌐 Testing deployment: ${baseUrl}\n`);
  
  let allPassed = true;
  const results: SmokeTestResult[] = [];
  
  // Test critical paths
  console.log('📄 Testing Critical Pages:');
  console.log('='.repeat(50));
  
  for (const test of criticalPaths) {
    try {
      const response = await fetch(`${baseUrl}${test.path}`, {
        method: test.method,
        headers: {
          'User-Agent': 'Deployment-Smoke-Test/1.0'
        }
      });
      
      const result: SmokeTestResult = {
        passed: response.ok,
        status: response.status,
        message: response.ok ? 'OK' : `Failed with status ${response.status}`,
        endpoint: test.path
      };
      
      results.push(result);
      
      if (response.ok) {
        console.log(`✅ ${test.name}: ${response.status}`);
      } else {
        console.error(`❌ ${test.name}: ${response.status} - ${response.statusText}`);
        allPassed = false;
      }
    } catch (error) {
      const result: SmokeTestResult = {
        passed: false,
        status: 0,
        message: error instanceof Error ? error.message : 'Network error',
        endpoint: test.path
      };
      
      results.push(result);
      console.error(`❌ ${test.name}: Network Error - ${result.message}`);
      allPassed = false;
    }
  }
  
  // Test functionality
  console.log('\n🔧 Testing Critical Functionality:');
  console.log('='.repeat(50));
  
  for (const test of functionalityTests) {
    try {
      const response = await fetch(`${baseUrl}${test.path}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Deployment-Smoke-Test/1.0'
        },
        body: test.body ? JSON.stringify(test.body) : undefined
      });
      
      const result: SmokeTestResult = {
        passed: response.ok,
        status: response.status,
        message: response.ok ? 'API Working' : `Failed with status ${response.status}`,
        endpoint: test.path
      };
      
      results.push(result);
      
      if (response.ok) {
        console.log(`✅ ${test.name}: ${response.status}`);
        
        // Try to parse response for additional validation
        try {
          const data = await response.json();
          if (data.message) {
            console.log(`   📝 Response: ${data.message}`);
          }
        } catch {
          // Response might not be JSON, that's okay
        }
      } else {
        console.error(`❌ ${test.name}: ${response.status} - ${response.statusText}`);
        
        // Try to get error details
        try {
          const errorData = await response.json();
          if (errorData.error) {
            console.error(`   📝 Error: ${errorData.error}`);
          }
        } catch {
          // Response might not be JSON
        }
        
        allPassed = false;
      }
    } catch (error) {
      const result: SmokeTestResult = {
        passed: false,
        status: 0,
        message: error instanceof Error ? error.message : 'Network error',
        endpoint: test.path
      };
      
      results.push(result);
      console.error(`❌ ${test.name}: Network Error - ${result.message}`);
      allPassed = false;
    }
  }
  
  // Summary
  console.log('\n📊 SMOKE TEST SUMMARY:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (allPassed) {
    console.log('\n🎉 All smoke tests passed! Deployment is healthy.');
  } else {
    console.log('\n💥 Some smoke tests failed. Please investigate.');
    
    // Show failed tests
    const failed = results.filter(r => !r.passed);
    if (failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      failed.forEach(f => {
        console.log(`   ${f.endpoint}: ${f.message}`);
      });
    }
  }
  
  return allPassed;
}

// CLI interface
if (require.main === module) {
  const baseUrl = process.argv[2];
  
  if (!baseUrl) {
    console.error('Usage: tsx scripts/post-deploy-tests.ts <baseUrl>');
    console.error('Example: tsx scripts/post-deploy-tests.ts https://your-app.vercel.app');
    process.exit(1);
  }
  
  runSmokeTests(baseUrl).then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Smoke tests failed with error:', error);
    process.exit(1);
  });
}
