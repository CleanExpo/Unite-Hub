/**
 * Stripe Integration Test Suite
 *
 * Run these tests to verify your Stripe integration is working correctly
 */

import {
  getOrCreateCustomer,
  getProducts,
  PLAN_TIERS,
  calculateProration,
} from "./client";

/**
 * Test 1: Verify environment variables
 */
export async function testEnvironmentVariables(): Promise<{
  success: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  if (!process.env.STRIPE_SECRET_KEY) {
    errors.push("STRIPE_SECRET_KEY is not set");
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    errors.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
  }

  if (!process.env.STRIPE_PRICE_ID_STARTER) {
    errors.push("STRIPE_PRICE_ID_STARTER is not set");
  }

  if (!process.env.STRIPE_PRICE_ID_PROFESSIONAL) {
    errors.push("STRIPE_PRICE_ID_PROFESSIONAL is not set");
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    errors.push("STRIPE_WEBHOOK_SECRET is not set");
  }

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    errors.push("NEXT_PUBLIC_CONVEX_URL is not set");
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Test 2: Verify Stripe API connection
 */
export async function testStripeConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await getProducts();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Test 3: Verify price IDs exist in Stripe
 */
export async function testPriceIds(): Promise<{
  success: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const { prices } = await getProducts();

    const starterPriceId = PLAN_TIERS.starter.priceId;
    const professionalPriceId = PLAN_TIERS.professional.priceId;

    const starterPrice = prices.find((p) => p.id === starterPriceId);
    if (!starterPrice) {
      errors.push(`Starter price ID not found: ${starterPriceId}`);
    }

    const professionalPrice = prices.find((p) => p.id === professionalPriceId);
    if (!professionalPrice) {
      errors.push(`Professional price ID not found: ${professionalPriceId}`);
    }

    return {
      success: errors.length === 0,
      errors,
    };
  } catch (error: any) {
    return {
      success: false,
      errors: [error.message],
    };
  }
}

/**
 * Test 4: Test customer creation
 */
export async function testCustomerCreation(): Promise<{
  success: boolean;
  customerId?: string;
  error?: string;
}> {
  try {
    const testEmail = `test-${Date.now()}@unite-hub.test`;
    const customer = await getOrCreateCustomer({
      email: testEmail,
      name: "Test User",
      organizationId: "test-org-id",
      metadata: {
        test: "true",
      },
    });

    return {
      success: true,
      customerId: customer.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Test 5: Verify webhook endpoint is accessible
 */
export async function testWebhookEndpoint(): Promise<{
  success: boolean;
  status?: number;
  error?: string;
}> {
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/stripe/webhook`;
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "test",
      },
      body: JSON.stringify({}),
    });

    // We expect a 400 (bad signature) or 500 (no secret), not a network error
    return {
      success: response.status === 400 || response.status === 500,
      status: response.status,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Test 6: Verify plan configuration
 */
export function testPlanConfiguration(): {
  success: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check Starter plan
  if (PLAN_TIERS.starter.price !== 24900) {
    errors.push("Starter plan price should be 24900 (249 AUD)");
  }

  if (PLAN_TIERS.starter.currency !== "aud") {
    errors.push("Starter plan currency should be 'aud'");
  }

  // Check Professional plan
  if (PLAN_TIERS.professional.price !== 54900) {
    errors.push("Professional plan price should be 54900 (549 AUD)");
  }

  if (PLAN_TIERS.professional.currency !== "aud") {
    errors.push("Professional plan currency should be 'aud'");
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<{
  passed: number;
  failed: number;
  results: Array<{
    test: string;
    success: boolean;
    details: any;
  }>;
}> {
  const results: Array<{
    test: string;
    success: boolean;
    details: any;
  }> = [];

  // Test 1: Environment variables
  console.log("Test 1: Checking environment variables...");
  const envTest = await testEnvironmentVariables();
  results.push({
    test: "Environment Variables",
    success: envTest.success,
    details: envTest,
  });

  // Test 2: Stripe connection
  console.log("Test 2: Testing Stripe API connection...");
  const connectionTest = await testStripeConnection();
  results.push({
    test: "Stripe API Connection",
    success: connectionTest.success,
    details: connectionTest,
  });

  // Test 3: Price IDs
  console.log("Test 3: Verifying price IDs...");
  const priceTest = await testPriceIds();
  results.push({
    test: "Price IDs",
    success: priceTest.success,
    details: priceTest,
  });

  // Test 4: Customer creation
  console.log("Test 4: Testing customer creation...");
  const customerTest = await testCustomerCreation();
  results.push({
    test: "Customer Creation",
    success: customerTest.success,
    details: customerTest,
  });

  // Test 5: Webhook endpoint
  console.log("Test 5: Testing webhook endpoint...");
  const webhookTest = await testWebhookEndpoint();
  results.push({
    test: "Webhook Endpoint",
    success: webhookTest.success,
    details: webhookTest,
  });

  // Test 6: Plan configuration
  console.log("Test 6: Verifying plan configuration...");
  const planTest = testPlanConfiguration();
  results.push({
    test: "Plan Configuration",
    success: planTest.success,
    details: planTest,
  });

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return { passed, failed, results };
}

/**
 * Format test results for console output
 */
export function formatTestResults(results: Awaited<ReturnType<typeof runAllTests>>) {
  console.log("\n========================================");
  console.log("Stripe Integration Test Results");
  console.log("========================================\n");

  results.results.forEach((result, index) => {
    const status = result.success ? "✓ PASS" : "✗ FAIL";
    const color = result.success ? "\x1b[32m" : "\x1b[31m";
    console.log(`${color}${status}\x1b[0m Test ${index + 1}: ${result.test}`);

    if (!result.success && result.details.errors) {
      result.details.errors.forEach((error: string) => {
        console.log(`  - ${error}`);
      });
    }

    if (!result.success && result.details.error) {
      console.log(`  - ${result.details.error}`);
    }
  });

  console.log("\n========================================");
  console.log(
    `Total: ${results.passed} passed, ${results.failed} failed`
  );
  console.log("========================================\n");
}

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    const results = await runAllTests();
    formatTestResults(results);
    process.exit(results.failed > 0 ? 1 : 0);
  })();
}
