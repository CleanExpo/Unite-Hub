#!/usr/bin/env tsx

/**
 * Test script for the HybridAISystem
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Import after loading env vars
import { hybridAI } from '../src/lib/ai-agent/hybrid/hybrid-ai-system';

async function testAISystem() {
  console.log('🤖 AI SYSTEM TEST');
  console.log('==================\n');

  // Check configuration
  console.log('✅ AI System Configured:', hybridAI.isConfigured());
  console.log('✅ Available Providers:', hybridAI.getAvailableProviders());
  console.log('\n');

  // Test basic generation
  try {
    console.log('🧪 Testing basic AI generation...');
    const response = await hybridAI.generateResponse(
      'Say "Hello, Unite Group!" in a creative way.'
    );
    
    console.log('✅ Response received!');
    console.log('Provider:', response.provider);
    console.log('Model:', response.model);
    console.log('Response:', response.content);
    console.log('Tokens used:', response.usage?.total_tokens || 'N/A');
  } catch (error) {
    console.error('❌ AI generation failed:', error instanceof Error ? error.message : error);
  }

  console.log('\n🏁 AI System test complete');
}

// Run test
testAISystem().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
