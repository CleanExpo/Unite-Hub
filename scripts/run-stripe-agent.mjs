#!/usr/bin/env node

/**
 * Stripe Agent Runner
 *
 * CLI interface for Stripe billing operations:
 * - Setup products and prices
 * - Audit configuration
 * - Generate reports
 * - Sync products from Stripe
 *
 * Usage:
 *   npm run stripe:setup       # Create products and prices
 *   npm run stripe:audit       # Audit configuration
 *   npm run stripe:report      # Generate billing report
 *   npm run stripe:sync        # Sync from Stripe dashboard
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// =============================================================================
// CONFIGURATION
// =============================================================================

const PRICING_TIERS = {
  starter: {
    name: 'Unite Hub Starter',
    description: 'Basic CRM and email integration for growing businesses',
    monthlyPrice: 49500, // $495.00 AUD (GST included) in cents
    annualPrice: 495000, // $4,950.00 AUD (GST included) in cents (2 months free)
    currency: 'aud',
    features: ['500 contacts', 'Email integration', 'Basic AI scoring', 'Email support'],
  },
  professional: {
    name: 'Unite Hub Professional',
    description: 'Full CRM with AI-powered marketing automation',
    monthlyPrice: 89500, // $895.00 AUD (GST included) in cents
    annualPrice: 895000, // $8,950.00 AUD (GST included) in cents
    currency: 'aud',
    features: ['Unlimited contacts', 'AI lead scoring', 'Drip campaigns', 'Priority support'],
  },
  elite: {
    name: 'Unite Hub Elite',
    description: 'Enterprise-grade with white-label and custom integrations',
    monthlyPrice: 129500, // $1,295.00 AUD (GST included) in cents
    annualPrice: 1295000, // $12,950.00 AUD (GST included) in cents
    currency: 'aud',
    features: ['Everything in Pro', 'White-label', 'Custom integrations', 'Dedicated support'],
  },
};

// =============================================================================
// STRIPE CLIENT
// =============================================================================

function getStripeClient(mode = 'test') {
  const secretKey =
    mode === 'test'
      ? process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY
      : process.env.STRIPE_LIVE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(`Stripe ${mode} secret key not configured`);
  }

  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
  });
}

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key);
}

// =============================================================================
// COMMANDS
// =============================================================================

/**
 * Setup all products and prices in Stripe
 */
async function setupProducts(mode = 'test') {
  console.log(`\n🚀 Setting up Stripe products (${mode.toUpperCase()} mode)...\n`);

  const stripe = getStripeClient(mode);
  const results = {
    products: {},
    prices: {},
  };

  for (const [tier, config] of Object.entries(PRICING_TIERS)) {
    console.log(`Creating ${tier} tier...`);

    // Create product
    const product = await stripe.products.create({
      name: config.name,
      description: config.description,
      metadata: {
        tier,
        features: config.features.join(','),
      },
    });

    results.products[tier] = product.id;
    console.log(`  ✓ Product: ${product.id}`);

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: config.monthlyPrice,
      currency: config.currency || 'aud',
      recurring: { interval: 'month' },
      metadata: { tier, billing: 'monthly', gst_included: 'true' },
    });

    results.prices[`${tier}_monthly`] = monthlyPrice.id;
    console.log(`  ✓ Monthly Price: ${monthlyPrice.id} ($${config.monthlyPrice / 100} AUD/mo inc GST)`);

    // Create annual price
    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: config.annualPrice,
      currency: config.currency || 'aud',
      recurring: { interval: 'year' },
      metadata: { tier, billing: 'annual', gst_included: 'true' },
    });

    results.prices[`${tier}_annual`] = annualPrice.id;
    console.log(`  ✓ Annual Price: ${annualPrice.id} ($${config.annualPrice / 100} AUD/yr inc GST)`);
  }

  // Generate .env additions
  console.log('\n📝 Add these to your .env.local:\n');
  const prefix = mode === 'test' ? 'STRIPE_TEST' : 'STRIPE_LIVE';
  console.log(`${prefix}_PRICE_STARTER=${results.prices.starter_monthly}`);
  console.log(`${prefix}_PRICE_STARTER_ANNUAL=${results.prices.starter_annual}`);
  console.log(`${prefix}_PRICE_PRO=${results.prices.professional_monthly}`);
  console.log(`${prefix}_PRICE_PRO_ANNUAL=${results.prices.professional_annual}`);
  console.log(`${prefix}_PRICE_ELITE=${results.prices.elite_monthly}`);
  console.log(`${prefix}_PRICE_ELITE_ANNUAL=${results.prices.elite_annual}`);

  console.log('\n✅ Setup complete!\n');
  return results;
}

/**
 * Audit Stripe configuration
 */
async function auditConfiguration() {
  console.log('\n🔍 Auditing Stripe configuration...\n');

  const results = {
    status: 'healthy',
    checks: {},
    recommendations: [],
  };

  // Check environment variables
  const envVars = {
    test: [
      'STRIPE_TEST_SECRET_KEY',
      'STRIPE_TEST_WEBHOOK_SECRET',
      'STRIPE_TEST_PRICE_STARTER',
      'STRIPE_TEST_PRICE_PRO',
      'STRIPE_TEST_PRICE_ELITE',
      'NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY',
    ],
    live: [
      'STRIPE_LIVE_SECRET_KEY',
      'STRIPE_LIVE_WEBHOOK_SECRET',
      'STRIPE_LIVE_PRICE_STARTER',
      'STRIPE_LIVE_PRICE_PRO',
      'STRIPE_LIVE_PRICE_ELITE',
      'NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY',
    ],
    legacy: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
  };

  console.log('Environment Variables:');
  console.log('─'.repeat(50));

  // Test mode
  const testMissing = envVars.test.filter((v) => !process.env[v]);
  console.log(`  TEST mode: ${testMissing.length === 0 ? '✓ Complete' : `✗ Missing ${testMissing.length}`}`);
  if (testMissing.length > 0) {
    testMissing.forEach((v) => console.log(`    - ${v}`));
    results.recommendations.push('Configure TEST mode environment variables');
  }

  // Live mode
  const liveMissing = envVars.live.filter((v) => !process.env[v]);
  console.log(`  LIVE mode: ${liveMissing.length === 0 ? '✓ Complete' : `✗ Missing ${liveMissing.length}`}`);
  if (liveMissing.length > 0) {
    liveMissing.forEach((v) => console.log(`    - ${v}`));
    results.recommendations.push('Configure LIVE mode environment variables before production');
  }

  // Legacy fallback
  const legacyPresent = envVars.legacy.filter((v) => process.env[v]);
  if (legacyPresent.length > 0) {
    console.log(`  Legacy fallback: ✓ ${legacyPresent.length} variables available`);
  }

  results.checks.env_vars = {
    test: { missing: testMissing.length, status: testMissing.length === 0 ? 'pass' : 'fail' },
    live: { missing: liveMissing.length, status: liveMissing.length === 0 ? 'pass' : 'warn' },
    legacy: { available: legacyPresent.length },
  };

  // Check Stripe connection
  console.log('\nStripe Connection:');
  console.log('─'.repeat(50));

  try {
    const stripe = getStripeClient('test');
    const products = await stripe.products.list({ limit: 10 });
    console.log(`  ✓ Connected to Stripe (TEST mode)`);
    console.log(`  ✓ Found ${products.data.length} products`);

    results.checks.stripe_connection = { status: 'pass', products: products.data.length };
  } catch (error) {
    console.log(`  ✗ Failed to connect: ${error.message}`);
    results.checks.stripe_connection = { status: 'fail', error: error.message };
    results.status = 'degraded';
  }

  // Check prices
  console.log('\nPrice Configuration:');
  console.log('─'.repeat(50));

  const priceChecks = ['STARTER', 'PRO', 'ELITE'];
  for (const tier of priceChecks) {
    const testPrice = process.env[`STRIPE_TEST_PRICE_${tier}`];
    const livePrice = process.env[`STRIPE_LIVE_PRICE_${tier}`];

    if (testPrice) {
      try {
        const stripe = getStripeClient('test');
        const price = await stripe.prices.retrieve(testPrice);
        console.log(`  ✓ ${tier} (TEST): $${price.unit_amount / 100}/${price.recurring?.interval}`);
      } catch {
        console.log(`  ✗ ${tier} (TEST): Invalid price ID`);
      }
    } else {
      console.log(`  - ${tier} (TEST): Not configured`);
    }
  }

  // Overall status
  if (testMissing.length > 3 || !results.checks.stripe_connection?.status === 'pass') {
    results.status = 'critical';
  } else if (testMissing.length > 0 || liveMissing.length > 3) {
    results.status = 'degraded';
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`Overall Status: ${results.status.toUpperCase()}`);
  console.log('═'.repeat(50));

  if (results.recommendations.length > 0) {
    console.log('\nRecommendations:');
    results.recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  }

  console.log('');
  return results;
}

/**
 * Generate billing report
 */
async function generateReport(period = 'month') {
  console.log(`\n📊 Generating billing report (${period})...\n`);

  const stripe = getStripeClient('test');
  const supabase = getSupabase();

  // Get date range
  const now = new Date();
  const startDate = new Date(now.getFullYear(), period === 'month' ? now.getMonth() : 0, 1);

  // Fetch subscriptions from Stripe
  const subscriptions = await stripe.subscriptions.list({
    created: { gte: Math.floor(startDate.getTime() / 1000) },
    limit: 100,
  });

  // Fetch invoices
  const invoices = await stripe.invoices.list({
    created: { gte: Math.floor(startDate.getTime() / 1000) },
    status: 'paid',
    limit: 100,
  });

  // Calculate metrics
  const totalRevenue = invoices.data.reduce((sum, inv) => sum + inv.amount_paid, 0) / 100;
  const activeSubscriptions = subscriptions.data.filter((s) => s.status === 'active').length;
  const mrr =
    subscriptions.data
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + (s.items.data[0]?.price?.unit_amount || 0), 0) / 100;

  const report = {
    period: `${startDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`,
    revenue: {
      total: totalRevenue,
      currency: 'USD',
    },
    subscriptions: {
      active: activeSubscriptions,
      total: subscriptions.data.length,
      mrr,
    },
    invoices: {
      paid: invoices.data.length,
      total_amount: totalRevenue,
    },
  };

  console.log('═'.repeat(50));
  console.log('BILLING REPORT');
  console.log('═'.repeat(50));
  console.log(`Period: ${report.period}`);
  console.log('─'.repeat(50));
  console.log(`Total Revenue: $${report.revenue.total.toFixed(2)}`);
  console.log(`Active Subscriptions: ${report.subscriptions.active}`);
  console.log(`MRR: $${report.subscriptions.mrr.toFixed(2)}`);
  console.log(`Paid Invoices: ${report.invoices.paid}`);
  console.log('═'.repeat(50));

  return report;
}

/**
 * Sync products from Stripe
 */
async function syncProducts(mode = 'test') {
  console.log(`\n🔄 Syncing products from Stripe (${mode.toUpperCase()} mode)...\n`);

  const stripe = getStripeClient(mode);

  const products = await stripe.products.list({ active: true, limit: 100 });
  const prices = await stripe.prices.list({ active: true, limit: 100 });

  console.log('Products:');
  console.log('─'.repeat(50));
  products.data.forEach((p) => {
    console.log(`  ${p.id}: ${p.name}`);
    const productPrices = prices.data.filter((pr) => pr.product === p.id);
    productPrices.forEach((pr) => {
      console.log(`    └─ ${pr.id}: $${pr.unit_amount / 100}/${pr.recurring?.interval || 'one-time'}`);
    });
  });

  return { products: products.data, prices: prices.data };
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const command = process.argv[2] || 'audit';
  const mode = process.argv[3] || 'test';

  console.log('╔════════════════════════════════════════════════╗');
  console.log('║           STRIPE AGENT - Unite Hub             ║');
  console.log('╚════════════════════════════════════════════════╝');

  try {
    switch (command) {
      case 'setup':
        await setupProducts(mode);
        break;

      case 'audit':
        await auditConfiguration();
        break;

      case 'report':
        await generateReport(mode === 'year' ? 'year' : 'month');
        break;

      case 'sync':
        await syncProducts(mode);
        break;

      case 'help':
      default:
        console.log(`
Usage: npm run stripe:<command> [mode]

Commands:
  setup [test|live]   Create products and prices in Stripe
  audit               Audit configuration and connectivity
  report [month|year] Generate billing report
  sync [test|live]    Sync products from Stripe dashboard

Examples:
  npm run stripe:setup test    # Setup TEST mode products
  npm run stripe:setup live    # Setup LIVE mode products
  npm run stripe:audit         # Check configuration
  npm run stripe:report        # Monthly billing report
  npm run stripe:sync          # List existing products
`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
