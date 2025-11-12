// Test utilities for Claude AI integration
import { createMessage, parseJSONResponse } from './client';
import {
  AUTO_REPLY_SYSTEM_PROMPT,
  PERSONA_SYSTEM_PROMPT,
  buildAutoReplyUserPrompt,
  buildPersonaUserPrompt,
} from './prompts';

// Test data
export const TEST_EMAIL = {
  from: 'test@example.com',
  subject: 'Interested in marketing services',
  body: `Hi there,

I found your website and I'm interested in learning more about your marketing services.

We're a small e-commerce startup selling sustainable fashion items. We currently have about 5,000 followers on Instagram but we're struggling to convert them into customers.

We've tried running some Facebook ads but didn't see great results. Our budget is limited (around $2,000/month) and we need to make every dollar count.

Can you help us?

Best regards,
Sarah`,
};

export const TEST_PERSONA_DATA = {
  emails: [
    {
      from: 'sarah@ecofashion.com',
      subject: 'Marketing help needed',
      body: 'We are a sustainable fashion startup looking to grow our brand...',
    },
    {
      from: 'sarah@ecofashion.com',
      subject: 'Re: Marketing strategy',
      body: 'Our main challenge is converting Instagram followers to customers. We have 5K followers but low engagement.',
    },
  ],
  businessDescription: 'E-commerce startup selling sustainable fashion with focus on eco-friendly materials',
};

// Test auto-reply generation
export async function testAutoReply() {
  console.log('Testing Auto-Reply Generation...');

  try {
    const userPrompt = buildAutoReplyUserPrompt(TEST_EMAIL);
    const message = await createMessage(
      [{ role: 'user', content: userPrompt }],
      AUTO_REPLY_SYSTEM_PROMPT,
      { temperature: 0.7, max_tokens: 3000 }
    );

    const result = parseJSONResponse(message);
    console.log('Auto-Reply Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Auto-Reply Test Failed:', error);
    throw error;
  }
}

// Test persona generation
export async function testPersona() {
  console.log('Testing Persona Generation...');

  try {
    const userPrompt = buildPersonaUserPrompt(TEST_PERSONA_DATA);
    const message = await createMessage(
      [{ role: 'user', content: userPrompt }],
      PERSONA_SYSTEM_PROMPT,
      { temperature: 0.6, max_tokens: 4096 }
    );

    const result = parseJSONResponse(message);
    console.log('Persona Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Persona Test Failed:', error);
    throw error;
  }
}

// Run all tests
export async function runAllTests() {
  console.log('=== Starting Claude AI Integration Tests ===\n');

  const results = {
    autoReply: null as any,
    persona: null as any,
    errors: [] as string[],
  };

  // Test auto-reply
  try {
    results.autoReply = await testAutoReply();
    console.log('✓ Auto-Reply Test Passed\n');
  } catch (error: any) {
    results.errors.push(`Auto-Reply: ${error.message}`);
    console.log('✗ Auto-Reply Test Failed\n');
  }

  // Test persona
  try {
    results.persona = await testPersona();
    console.log('✓ Persona Test Passed\n');
  } catch (error: any) {
    results.errors.push(`Persona: ${error.message}`);
    console.log('✗ Persona Test Failed\n');
  }

  console.log('=== Test Results ===');
  console.log(`Passed: ${2 - results.errors.length}/2`);
  console.log(`Failed: ${results.errors.length}/2`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach((err) => console.log(`- ${err}`));
  }

  return results;
}

// Test API endpoints
export async function testAPIEndpoints() {
  console.log('=== Testing API Endpoints ===\n');

  const endpoints = [
    '/api/ai/auto-reply',
    '/api/ai/persona',
    '/api/ai/strategy',
    '/api/ai/campaign',
    '/api/ai/hooks',
    '/api/ai/mindmap',
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3008${endpoint}`, {
        method: 'GET',
      });
      const data = await response.json();
      results.push({
        endpoint,
        status: response.status,
        success: response.ok,
        data,
      });
      console.log(`✓ ${endpoint}: ${response.status}`);
    } catch (error: any) {
      results.push({
        endpoint,
        status: 'error',
        success: false,
        error: error.message,
      });
      console.log(`✗ ${endpoint}: ${error.message}`);
    }
  }

  console.log('\n=== API Endpoints Test Complete ===');
  return results;
}

// Validation helpers
export function validateAutoReplyResult(result: any): boolean {
  return !!(
    result &&
    result.analysis &&
    result.questions &&
    result.emailTemplate &&
    Array.isArray(result.questions) &&
    result.questions.length >= 4 &&
    result.questions.length <= 6
  );
}

export function validatePersonaResult(result: any): boolean {
  return !!(
    result &&
    result.persona &&
    result.persona.name &&
    result.persona.demographics &&
    result.persona.painPoints &&
    result.persona.goals &&
    result.confidence
  );
}
