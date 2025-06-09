/**
 * API INTEGRATION TEST
 * 
 * Quick test to verify that the CRM APIs are properly connected 
 * to the business logic layer.
 */

const baseUrl = 'http://localhost:3000/api/crm';

async function testCRMIntegration() {
  console.log('🧪 Testing CRM API Integration with Business Logic Layer...\n');

  // Test 1: Dashboard API
  console.log('1️⃣ Testing Dashboard API...');
  try {
    const response = await fetch(`${baseUrl}/dashboard`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Dashboard API: SUCCESS');
      console.log(`   - Revenue: $${data.revenue || 0}`);
      console.log(`   - Deals: ${data.dealsCount || 0}`);
      console.log(`   - Tasks: ${data.tasksCount || 0}`);
      console.log(`   - Pipeline Value: $${data.pipelineValue || 0}`);
    } else {
      console.log('❌ Dashboard API: FAILED');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Dashboard API: NETWORK ERROR');
    console.log(`   ${error.message}`);
  }

  console.log('');

  // Test 2: Deals API
  console.log('2️⃣ Testing Deals API...');
  try {
    const response = await fetch(`${baseUrl}/deals`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Deals API: SUCCESS');
      console.log(`   - Total Deals: ${data.pagination?.total || 0}`);
      console.log(`   - Returned: ${data.data?.length || 0} deals`);
      if (data.analytics) {
        console.log(`   - Total Value: $${data.analytics.totalValue || 0}`);
        console.log(`   - Weighted Value: $${data.analytics.weightedValue || 0}`);
      }
    } else {
      console.log('❌ Deals API: FAILED');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Deals API: NETWORK ERROR');
    console.log(`   ${error.message}`);
  }

  console.log('');

  // Test 3: Tasks API
  console.log('3️⃣ Testing Tasks API...');
  try {
    const response = await fetch(`${baseUrl}/tasks`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Tasks API: SUCCESS');
      console.log(`   - Total Tasks: ${data.pagination?.total || 0}`);
      console.log(`   - Returned: ${data.data?.length || 0} tasks`);
      if (data.analytics) {
        console.log(`   - Completed: ${data.analytics.completedTasks || 0}`);
        console.log(`   - Pending: ${data.analytics.pendingTasks || 0}`);
        console.log(`   - Completion Rate: ${data.analytics.completionRate || 0}%`);
      }
    } else {
      console.log('❌ Tasks API: FAILED');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Tasks API: NETWORK ERROR');
    console.log(`   ${error.message}`);
  }

  console.log('');

  // Test 4: Clients API (existing)
  console.log('4️⃣ Testing Clients API...');
  try {
    const response = await fetch(`${baseUrl}/clients`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Clients API: SUCCESS');
      console.log(`   - Total Clients: ${data.pagination?.total || 0}`);
      console.log(`   - Returned: ${data.data?.length || 0} clients`);
    } else {
      console.log('❌ Clients API: FAILED');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Clients API: NETWORK ERROR');
    console.log(`   ${error.message}`);
  }

  console.log('\n🎉 API Integration Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Start your development server: npm run dev');
  console.log('   2. Run this test: node api-integration-test.js');
  console.log('   3. Visit http://localhost:3000/dashboard/crm to see the working CRM');
}

// For Node.js environments
if (typeof fetch === 'undefined') {
  console.log('💡 To run this test:');
  console.log('   1. Start your Next.js dev server: npm run dev');
  console.log('   2. Install node-fetch: npm install node-fetch');
  console.log('   3. Run: node api-integration-test.js');
  console.log('\nOr test manually by visiting: http://localhost:3000/dashboard/crm');
} else {
  testCRMIntegration();
}

module.exports = { testCRMIntegration };
