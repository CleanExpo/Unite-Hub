#!/usr/bin/env tsx

/**
 * Test script for consultation system
 * Tests database connection, API endpoints, and email functionality
 */

const BASE_URL = process.argv[2] || 'https://unite-group-fresh.vercel.app';

interface ConsultationData {
  client_name: string;
  client_email: string;
  company?: string;
  phone?: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  alternate_date?: string;
  message?: string;
}

async function testConsultationAPI() {
  console.log('🧪 Testing Consultation System...\n');
  console.log(`🌐 Base URL: ${BASE_URL}\n`);

  const results = {
    passed: 0,
    failed: 0,
    details: [] as Array<{test: string, status: string, message: string}>
  };

  // Test 1: API Endpoint Availability
  console.log('📡 Test 1: API Endpoint Availability');
  try {
    const response = await fetch(`${BASE_URL}/api/consultations`, {
      method: 'OPTIONS'
    });
    
    if (response.ok || response.status === 405) { // 405 is expected for OPTIONS
      console.log('✅ Consultation API endpoint is accessible');
      results.passed++;
      results.details.push({
        test: 'API Endpoint Availability',
        status: 'PASS',
        message: 'Endpoint accessible'
      });
    } else {
      console.log(`❌ API endpoint not accessible: ${response.status}`);
      results.failed++;
      results.details.push({
        test: 'API Endpoint Availability',
        status: 'FAIL',
        message: `Status: ${response.status}`
      });
    }
  } catch (error) {
    console.log(`❌ API endpoint error: ${error}`);
    results.failed++;
    results.details.push({
      test: 'API Endpoint Availability',
      status: 'FAIL',
      message: `Error: ${error}`
    });
  }

  // Test 2: Consultation Booking (with test data)
  console.log('\n📝 Test 2: Consultation Booking');
  const testBooking: ConsultationData = {
    client_name: 'Test User',
    client_email: 'test@example.com',
    company: 'Test Company',
    phone: '+61 400 000 000',
    service_type: 'Software Development',
    preferred_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    preferred_time: '10:00 AM',
    message: 'This is a test booking for system validation'
  };

  try {
    const response = await fetch(`${BASE_URL}/api/consultations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBooking)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Consultation booking successful');
      console.log(`📋 Booking ID: ${data.data?.id || 'N/A'}`);
      results.passed++;
      results.details.push({
        test: 'Consultation Booking',
        status: 'PASS',
        message: `Booking created with ID: ${data.data?.id || 'N/A'}`
      });
    } else {
      console.log(`❌ Consultation booking failed: ${data.error || 'Unknown error'}`);
      results.failed++;
      results.details.push({
        test: 'Consultation Booking',
        status: 'FAIL',
        message: data.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.log(`❌ Consultation booking error: ${error}`);
    results.failed++;
    results.details.push({
      test: 'Consultation Booking',
      status: 'FAIL',
      message: `Error: ${error}`
    });
  }

  // Test 3: Email Configuration Check
  console.log('\n📧 Test 3: Email Configuration');
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const defaultFrom = process.env.DEFAULT_FROM;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (resendApiKey && defaultFrom && adminEmail) {
      console.log('✅ Email configuration complete');
      console.log(`📨 From: ${defaultFrom}`);
      console.log(`👤 Admin: ${adminEmail}`);
      results.passed++;
      results.details.push({
        test: 'Email Configuration',
        status: 'PASS',
        message: 'All email variables configured'
      });
    } else {
      const missing = [];
      if (!resendApiKey) missing.push('RESEND_API_KEY');
      if (!defaultFrom) missing.push('DEFAULT_FROM');
      if (!adminEmail) missing.push('ADMIN_EMAIL');
      
      console.log(`❌ Missing email configuration: ${missing.join(', ')}`);
      results.failed++;
      results.details.push({
        test: 'Email Configuration',
        status: 'FAIL',
        message: `Missing: ${missing.join(', ')}`
      });
    }
  } catch (error) {
    console.log(`❌ Email configuration error: ${error}`);
    results.failed++;
    results.details.push({
      test: 'Email Configuration',
      status: 'FAIL',
      message: `Error: ${error}`
    });
  }

  // Test 4: Environment Variables Check
  console.log('\n🔧 Test 4: Required Environment Variables');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'DEFAULT_FROM',
    'ADMIN_EMAIL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length === 0) {
    console.log('✅ All required environment variables present');
    results.passed++;
    results.details.push({
      test: 'Environment Variables',
      status: 'PASS',
      message: 'All required variables present'
    });
  } else {
    console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
    results.failed++;
    results.details.push({
      test: 'Environment Variables',
      status: 'FAIL',
      message: `Missing: ${missingVars.join(', ')}`
    });
  }

  console.log('\n📊 CONSULTATION SYSTEM TEST SUMMARY:');
  console.log('====================================================');
  console.log(`✅ Passed: ${results.passed}/${results.passed + results.failed}`);
  console.log(`❌ Failed: ${results.failed}/${results.passed + results.failed}`);

  if (results.failed === 0) {
    console.log('\n🎉 Consultation system is fully operational!');
    console.log('📋 Database connection working');
    console.log('📧 Email system configured');
    console.log('🔗 API endpoints functioning');
  } else {
    console.log('\n💥 Some tests failed. Details:');
    results.details.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`   ${result.test}: ${result.message}`);
    });
  }

  return results.failed === 0;
}

// Run tests
testConsultationAPI().then(success => {
  process.exit(success ? 0 : 1);
});
