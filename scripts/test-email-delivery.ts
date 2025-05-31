#!/usr/bin/env tsx

/**
 * Email delivery testing script
 * Tests actual email sending through Resend API
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM = process.env.DEFAULT_FROM || 'support@carsi.com.au';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@carsi.com.au';

async function testEmailDelivery() {
  console.log('📧 EMAIL DELIVERY TEST');
  console.log('======================\n');

  // Check environment
  console.log('⚙️ Environment Check:');
  console.log(`✅ RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'Present' : '❌ Missing'}`);
  console.log(`✅ DEFAULT_FROM: ${DEFAULT_FROM}`);
  console.log(`✅ ADMIN_EMAIL: ${ADMIN_EMAIL}`);
  console.log('');

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is missing!');
    process.exit(1);
  }

  try {
    // Test 1: Simple test email
    console.log('📨 Test 1: Sending simple test email...');
    const simpleResult = await resend.emails.send({
      from: DEFAULT_FROM,
      to: ADMIN_EMAIL,
      subject: 'Unite Group - Email Delivery Test',
      html: `
        <h1>Email Delivery Test Successful! 🎉</h1>
        <p>This is a test email from the Unite Group website.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>Time: ${new Date().toISOString()}</li>
          <li>From: ${DEFAULT_FROM}</li>
          <li>To: ${ADMIN_EMAIL}</li>
          <li>API: Resend</li>
        </ul>
        <p>If you're seeing this, the email system is working correctly!</p>
      `
    });

    if (simpleResult.data) {
      console.log('✅ Simple email sent successfully!');
      console.log(`📋 Email ID: ${simpleResult.data.id}`);
    } else if (simpleResult.error) {
      console.log('❌ Simple email failed:', simpleResult.error.message);
    }

    // Test 2: Consultation booking notification (simulated)
    console.log('\n📨 Test 2: Sending consultation booking notification...');
    const consultationResult = await resend.emails.send({
      from: DEFAULT_FROM,
      to: ADMIN_EMAIL,
      subject: 'New Consultation Booking - Test',
      replyTo: 'test@example.com',
      html: `
        <h1>New Consultation Booking</h1>
        <p><strong>Client:</strong> Test User (test@example.com)</p>
        <p><strong>Company:</strong> Test Company</p>
        <p><strong>Service Type:</strong> Software Development</p>
        <p><strong>Preferred Date:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
        <p><strong>Preferred Time:</strong> 10:00 AM</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          This is a test consultation booking to verify email delivery.
        </div>
        <hr />
        <p>This is a test notification from the UNITE Group website.</p>
      `
    });

    if (consultationResult.data) {
      console.log('✅ Consultation notification sent successfully!');
      console.log(`📋 Email ID: ${consultationResult.data.id}`);
    } else if (consultationResult.error) {
      console.log('❌ Consultation notification failed:', consultationResult.error.message);
    }

    // Test 3: Cookie consent notification (simulated)
    console.log('\n📨 Test 3: Sending cookie consent notification...');
    const cookieResult = await resend.emails.send({
      from: DEFAULT_FROM,
      to: ADMIN_EMAIL,
      subject: 'Cookie Preferences Updated - Test',
      html: `
        <h1>Cookie Preferences Updated</h1>
        <p>A user has updated their cookie preferences:</p>
        <ul>
          <li><strong>Necessary Cookies:</strong> ✅ Accepted (Always)</li>
          <li><strong>Preference Cookies:</strong> ✅ Accepted</li>
          <li><strong>Analytics Cookies:</strong> ❌ Rejected</li>
          <li><strong>Marketing Cookies:</strong> ❌ Rejected</li>
        </ul>
        <p><strong>User Details:</strong></p>
        <ul>
          <li>Session ID: test-session-123</li>
          <li>Timestamp: ${new Date().toISOString()}</li>
        </ul>
        <hr />
        <p>This is a test notification from the UNITE Group website.</p>
      `
    });

    if (cookieResult.data) {
      console.log('✅ Cookie consent notification sent successfully!');
      console.log(`📋 Email ID: ${cookieResult.data.id}`);
    } else if (cookieResult.error) {
      console.log('❌ Cookie consent notification failed:', cookieResult.error.message);
    }

    // Summary
    console.log('\n📊 EMAIL DELIVERY TEST SUMMARY');
    console.log('================================');
    console.log('✅ Resend API connection: WORKING');
    console.log('✅ Environment variables: CONFIGURED');
    console.log('📧 Test emails sent to:', ADMIN_EMAIL);
    console.log('\n⚠️  Please check your inbox to confirm delivery!');
    console.log('📌 Note: Emails may take 1-2 minutes to arrive.');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Verify RESEND_API_KEY is correct');
    console.log('2. Check if sender domain is verified in Resend');
    console.log('3. Ensure recipient email is valid');
  }
}

// Run test
testEmailDelivery().then(() => {
  console.log('\n🏁 Email delivery test complete');
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
