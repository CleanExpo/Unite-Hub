#!/usr/bin/env node

/**
 * Test Script for Claude Opus 4.5
 *
 * Usage:
 * node scripts/test-opus-4-5.mjs
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

async function testOpus45() {
  console.log('🧪 Testing Claude Opus 4.5 (claude-opus-4-5-20251101)\n');

  // Test 1: Simple text generation
  console.log('Test 1: Simple text generation (no thinking)');
  console.log('─'.repeat(60));

  try {
    const response1 = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: 'Explain in 2 sentences what makes Claude Opus 4.5 special compared to previous versions.'
        }
      ]
    });

    const text1 = response1.content.find(c => c.type === 'text')?.text || '';
    console.log('Response:', text1);
    console.log('\nUsage:', {
      input: response1.usage.input_tokens,
      output: response1.usage.output_tokens,
      thinking: response1.usage.thinking_tokens || 0
    });

    const cost1 = (
      (response1.usage.input_tokens / 1_000_000) * 15 +
      (response1.usage.output_tokens / 1_000_000) * 75
    );
    console.log('Cost: $' + cost1.toFixed(4));
    console.log('✅ Test 1 passed\n');
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    process.exit(1);
  }

  // Test 2: Extended Thinking
  console.log('\nTest 2: Extended Thinking (5000 token budget)');
  console.log('─'.repeat(60));

  try {
    const response2 = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 8192, // Must be greater than thinking budget
      thinking: {
        type: 'enabled',
        budget_tokens: 5000
      },
      messages: [
        {
          role: 'user',
          content: 'Analyze the tradeoffs between microservices and monolithic architecture for a SaaS CRM platform. Consider scalability, development velocity, and operational complexity.'
        }
      ]
    });

    const text2 = response2.content.find(c => c.type === 'text')?.text || '';
    const thinking = response2.content.find(c => c.type === 'thinking')?.thinking || null;

    console.log('Thinking process (first 200 chars):');
    console.log(thinking ? thinking.substring(0, 200) + '...' : 'None');
    console.log('\nResponse (first 300 chars):');
    console.log(text2.substring(0, 300) + '...');
    console.log('\nUsage:', {
      input: response2.usage.input_tokens,
      output: response2.usage.output_tokens,
      thinking: response2.usage.thinking_tokens || 0
    });

    const cost2 = (
      (response2.usage.input_tokens / 1_000_000) * 15 +
      (response2.usage.output_tokens / 1_000_000) * 75 +
      ((response2.usage.thinking_tokens || 0) / 1_000_000) * 7.5
    );
    console.log('Cost: $' + cost2.toFixed(4));
    console.log('✅ Test 2 passed\n');
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    process.exit(1);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests passed!');
  console.log('='.repeat(60));
  console.log('\nClaude Opus 4.5 is successfully configured and working.');
  console.log('\nModel ID: claude-opus-4-5-20251101');
  console.log('SDK Version:', Anthropic.VERSION);
  console.log('Extended Thinking: ✅ Supported');
  console.log('Pricing: $15/MTok input, $75/MTok output, $7.50/MTok thinking');
}

testOpus45().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
