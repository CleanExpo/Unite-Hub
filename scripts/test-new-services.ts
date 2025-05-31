#!/usr/bin/env tsx

const SERVICE_URLS = [
  '/en/services/initial-consultation',
  '/en/services/expert-education', 
  '/en/services/software-development',
  '/en/services/strategic-seo',
  '/en/services/business-strategy',
  '/en/services/quality-assurance'
];

async function testServices(baseUrl: string) {
  console.log('🎯 Testing New Services Implementation...\n');
  console.log(`🌐 Base URL: ${baseUrl}\n`);
  
  const results = {
    passed: 0,
    failed: 0,
    details: [] as Array<{url: string, status: number, success: boolean}>
  };

  console.log('📄 Testing New Service Pages:');
  console.log('==================================================');

  for (const serviceUrl of SERVICE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${serviceUrl}`);
      const success = response.status === 200;
      
      results.details.push({
        url: serviceUrl,
        status: response.status,
        success
      });

      if (success) {
        results.passed++;
        console.log(`✅ ${serviceUrl}: ${response.status}`);
      } else {
        results.failed++;
        console.log(`❌ ${serviceUrl}: ${response.status}`);
      }
    } catch (error) {
      results.failed++;
      console.log(`❌ ${serviceUrl}: Network Error`);
      results.details.push({
        url: serviceUrl,
        status: 0,
        success: false
      });
    }
  }

  console.log('\n📊 NEW SERVICES TEST SUMMARY:');
  console.log('==================================================');
  console.log(`✅ Passed: ${results.passed}/${SERVICE_URLS.length}`);
  console.log(`❌ Failed: ${results.failed}/${SERVICE_URLS.length}`);

  if (results.failed === 0) {
    console.log('\n🎉 All new service pages are working perfectly!');
    console.log('🎨 Services redesign implementation complete!');
  } else {
    console.log('\n💥 Some service pages failed. Details:');
    results.details.filter(r => !r.success).forEach(result => {
      console.log(`   ${result.url}: Status ${result.status}`);
    });
  }

  return results.failed === 0;
}

// Get base URL from command line argument
const baseUrl = process.argv[2] || 'https://unite-group-fresh.vercel.app';
testServices(baseUrl).then(success => {
  process.exit(success ? 0 : 1);
});
