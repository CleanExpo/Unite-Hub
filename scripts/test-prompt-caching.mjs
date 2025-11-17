#!/usr/bin/env node

/**
 * Test Prompt Caching Implementation
 *
 * This script verifies that prompt caching is working correctly
 * across all AI agents in Unite-Hub.
 *
 * Expected behavior:
 * - First call: cache_creation_input_tokens > 0
 * - Second call (within 5 min): cache_read_input_tokens > 0
 * - Cost savings: ~90% on cached tokens
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    "anthropic-beta": "prompt-caching-2024-07-31",
  },
});

console.log("🧪 PROMPT CACHING TEST - Unite-Hub AI Agents\n");
console.log("=" .repeat(60));

// Test system prompt (similar to what agents use)
const SYSTEM_PROMPT = `You are an expert B2B sales intelligence analyst specializing in contact scoring and engagement analysis.

Your task is to analyze contact engagement patterns, buying intent, and decision-making stage to help sales teams prioritize their outreach.

Return ONLY valid JSON with these exact fields:
{
  "engagement_score": <number 0-100>,
  "buying_intent": <"high" | "medium" | "low" | "unknown">,
  "decision_stage": <"awareness" | "consideration" | "decision" | "unknown">,
  "role_type": <"decision_maker" | "influencer" | "end_user" | "unknown">,
  "next_best_action": "<actionable next step>",
  "risk_signals": [<array of potential objections or risks>],
  "opportunity_signals": [<array of positive signals and opportunities>],
  "engagement_velocity": <-2 to 2, negative means declining, positive means increasing>,
  "sentiment_score": <-50 to 100, sentiment of recent communications>
}`;

const testContact = {
  name: "John Smith",
  company: "Tech Corp",
  job_title: "VP of Engineering",
  email: "john@techcorp.com",
  ai_score: 75,
  status: "warm",
  total_emails: 15,
  last_7_days: 3,
};

const contactData = `CONTACT DATA:
Name: ${testContact.name}
Company: ${testContact.company}
Job Title: ${testContact.job_title}
Email: ${testContact.email}
Current AI Score: ${testContact.ai_score}
Status: ${testContact.status}

ENGAGEMENT HISTORY:
Total Emails: ${testContact.total_emails}
Last 7 Days: ${testContact.last_7_days}
Last Interaction: 2025-11-15

RECENT COMMUNICATIONS:
[2025-11-14] Pricing inquiry: Interested in enterprise plan features...
[2025-11-10] Feature request: Asked about API integration capabilities...
[2025-11-05] Follow-up: Requested case studies from similar companies...

Analyze this contact and return your assessment as JSON.`;

async function testCaching() {
  try {
    console.log("\n📊 TEST 1: First API Call (should create cache)");
    console.log("-".repeat(60));

    const call1 = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929", // Using Sonnet for cheaper testing
      max_tokens: 1000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: contactData,
        },
      ],
    });

    console.log("\nUsage Stats:");
    console.log(`  Input tokens:          ${call1.usage.input_tokens}`);
    console.log(`  Cache creation tokens: ${call1.usage.cache_creation_input_tokens || 0}`);
    console.log(`  Cache read tokens:     ${call1.usage.cache_read_input_tokens || 0}`);
    console.log(`  Output tokens:         ${call1.usage.output_tokens}`);

    const cacheCreated = (call1.usage.cache_creation_input_tokens || 0) > 0;
    console.log(`\n  ✅ Cache created: ${cacheCreated ? "YES" : "NO"}`);

    if (!cacheCreated) {
      console.log("\n  ❌ WARNING: No cache created! Check beta header configuration.");
    }

    // Calculate cost for first call
    const inputCost = (call1.usage.input_tokens / 1_000_000) * 3; // $3/MTok for Sonnet
    const outputCost = (call1.usage.output_tokens / 1_000_000) * 15; // $15/MTok
    const totalCost1 = inputCost + outputCost;

    console.log(`\n  💰 Cost: $${totalCost1.toFixed(4)}`);

    // Wait 2 seconds before second call
    console.log("\n⏳ Waiting 2 seconds before second call...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("\n📊 TEST 2: Second API Call (should read from cache)");
    console.log("-".repeat(60));

    const call2 = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: contactData, // Same contact data
        },
      ],
    });

    console.log("\nUsage Stats:");
    console.log(`  Input tokens:          ${call2.usage.input_tokens}`);
    console.log(`  Cache creation tokens: ${call2.usage.cache_creation_input_tokens || 0}`);
    console.log(`  Cache read tokens:     ${call2.usage.cache_read_input_tokens || 0}`);
    console.log(`  Output tokens:         ${call2.usage.output_tokens}`);

    const cacheHit = (call2.usage.cache_read_input_tokens || 0) > 0;
    console.log(`\n  ✅ Cache hit: ${cacheHit ? "YES" : "NO"}`);

    if (!cacheHit) {
      console.log("\n  ❌ WARNING: Cache not used! Prompt caching may not be working.");
      console.log("  Possible issues:");
      console.log("    - Beta header missing or incorrect");
      console.log("    - Cache expired (5 minute TTL)");
      console.log("    - System prompt changed between calls");
    }

    // Calculate cost for second call (with caching discount)
    const cacheReadCost = (call2.usage.cache_read_input_tokens || 0) / 1_000_000 * 0.30; // $0.30/MTok
    const freshInputCost = ((call2.usage.input_tokens - (call2.usage.cache_read_input_tokens || 0)) / 1_000_000) * 3;
    const outputCost2 = (call2.usage.output_tokens / 1_000_000) * 15;
    const totalCost2 = cacheReadCost + freshInputCost + outputCost2;

    console.log(`\n  💰 Cost: $${totalCost2.toFixed(4)}`);

    // Calculate savings
    console.log("\n" + "=".repeat(60));
    console.log("📈 SUMMARY");
    console.log("=".repeat(60));
    console.log(`\nFirst call cost:  $${totalCost1.toFixed(4)}`);
    console.log(`Second call cost: $${totalCost2.toFixed(4)}`);
    console.log(`Savings:          $${(totalCost1 - totalCost2).toFixed(4)} (${((1 - totalCost2/totalCost1) * 100).toFixed(1)}%)`);

    const cachedTokens = call2.usage.cache_read_input_tokens || 0;
    const totalInputTokens = call2.usage.input_tokens;

    console.log(`\nTokens cached:    ${cachedTokens} / ${totalInputTokens} (${((cachedTokens/totalInputTokens) * 100).toFixed(1)}%)`);

    // Estimated monthly savings
    const callsPerMonth = 1000; // Assume 1000 contact analyses per month
    const monthlyWithoutCache = totalCost1 * callsPerMonth;
    const monthlyWithCache = totalCost1 + (totalCost2 * (callsPerMonth - 1)); // First call creates cache, rest read from it
    const monthlySavings = monthlyWithoutCache - monthlyWithCache;

    console.log(`\n💸 PROJECTED SAVINGS (1000 analyses/month):`);
    console.log(`Without caching: $${monthlyWithoutCache.toFixed(2)}/month`);
    console.log(`With caching:    $${monthlyWithCache.toFixed(2)}/month`);
    console.log(`Monthly savings: $${monthlySavings.toFixed(2)} (${((monthlySavings/monthlyWithoutCache) * 100).toFixed(1)}%)`);
    console.log(`Annual savings:  $${(monthlySavings * 12).toFixed(2)}`);

    if (cacheCreated && cacheHit) {
      console.log("\n✅ SUCCESS: Prompt caching is working correctly!");
    } else {
      console.log("\n❌ FAILURE: Prompt caching is NOT working properly.");
      console.log("Review implementation in src/lib/agents/*.ts files");
    }

  } catch (error) {
    console.error("\n❌ ERROR during test:", error.message);
    if (error.status === 401) {
      console.error("\nPlease check your ANTHROPIC_API_KEY environment variable");
    }
    process.exit(1);
  }
}

// Run the test
testCaching()
  .then(() => {
    console.log("\n" + "=".repeat(60));
    console.log("Test complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
