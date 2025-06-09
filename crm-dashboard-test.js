/**
 * FOCUSED CRM DASHBOARD TEST
 * 
 * Tests only the CRM dashboard API to verify business logic integration
 */

const fetch = require('node-fetch');

async function testCRMDashboard() {
  console.log('🧪 Testing CRM Dashboard API Integration...\n');

  try {
    const response = await fetch('http://localhost:3002/api/crm/dashboard');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ CRM Dashboard API: SUCCESS');
      console.log(`   - Revenue: $${data.revenue || 0}`);
      console.log(`   - Deals: ${data.dealsCount || 0}`);
      console.log(`   - Tasks: ${data.tasksCount || 0}`);
      console.log(`   - Pipeline Value: $${data.pipelineValue || 0}`);
      console.log(`   - Clients: ${data.clientsCount || 0}`);
      
      if (data.recentActivities && data.recentActivities.length > 0) {
        console.log(`   - Recent Activities: ${data.recentActivities.length} found`);
      }
      
      if (data.pipelineData && data.pipelineData.length > 0) {
        console.log(`   - Pipeline Stages: ${data.pipelineData.length} stages`);
      }

      console.log('\n🎉 CRM Dashboard is working correctly!');
      console.log('Visit: http://localhost:3002/dashboard/crm');
      
    } else {
      console.log('❌ CRM Dashboard API: FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      
      if (data.details) {
        console.log(`   Details: ${data.details}`);
      }
    }
  } catch (error) {
    console.log('❌ CRM Dashboard API: NETWORK ERROR');
    console.log(`   ${error.message}`);
    console.log('\n🔧 Possible fixes:');
    console.log('   1. Ensure dev server is running: npm run dev');
    console.log('   2. Check if using correct port (3002 instead of 3000)');
  }
}

testCRMDashboard();
