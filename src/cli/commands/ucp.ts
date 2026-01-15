/**
 * synthex ucp Commands
 *
 * Universal Commerce Protocol for AI-native shopping
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { UCPService } from '../services/commerce/ucp-service.js';

export function createUCPCommand(): Command {
  const command = new Command('ucp');

  command.description('Universal Commerce Protocol for direct offers');

  // synthex ucp enable-offer --product-id "SKU_DEHUMID_01" --discount "10%" --currency "AUD"
  command
    .command('enable-offer')
    .description('Enable direct offer in AI search results')
    .requiredOption('--product-id <id>', 'Product ID or SKU')
    .option('--discount <amount>', 'Discount (percentage like "10%" or fixed like "50.00")')
    .option('--currency <code>', 'Currency code (AUD, USD, NZD)', 'AUD')
    .option('--valid-days <days>', 'Offer validity in days', '30')
    .option('--free-shipping', 'Enable free shipping', false)
    .option('--delivery-days <days>', 'Estimated delivery days', '5')
    .option('--regions <regions>', 'Comma-separated region codes (AU,NZ)', 'AU,NZ')
    .action(async (options) => {
      try {
        await runEnableOffer(options);
      } catch (error) {
        await logger.error('Enable offer failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex ucp disable-offer --offer-id "offer-123"
  command
    .command('disable-offer')
    .description('Disable a direct offer')
    .requiredOption('--offer-id <id>', 'Offer ID')
    .action(async (options) => {
      try {
        await runDisableOffer(options);
      } catch (error) {
        await logger.error('Disable offer failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex ucp list
  command
    .command('list')
    .description('List active offers')
    .option('--limit <number>', 'Number of offers to show', '20')
    .action(async (options) => {
      try {
        await runListOffers(options);
      } catch (error) {
        await logger.error('List offers failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runEnableOffer(options: {
  productId: string;
  discount?: string;
  currency?: string;
  validDays?: string;
  freeShipping?: boolean;
  deliveryDays?: string;
  regions?: string;
}): Promise<void> {
  await logger.header('UCP: Enable Direct Offer');
  await logger.divider();

  await logger.info(`Product: ${options.productId}`);
  if (options.discount) {
    await logger.info(`Discount: ${options.discount}`);
  }
  await logger.info(`Currency: ${options.currency}`);
  await logger.info(`Valid for: ${options.validDays} days`);
  await logger.info(`Free Shipping: ${options.freeShipping ? 'Yes' : 'No'}`);
  await logger.info(`Delivery: ${options.deliveryDays} days`);
  await logger.info(`Regions: ${options.regions}`);
  await logger.divider();

  const spinner = await logger.spinner('Creating direct offer...');

  try {
    const service = new UCPService();

    const result = await service.enableOffer({
      productId: options.productId,
      discount: options.discount,
      currency: options.currency,
      validUntilDays: parseInt(options.validDays || '30', 10),
      freeShipping: options.freeShipping,
      estimatedDeliveryDays: parseInt(options.deliveryDays || '5', 10),
      regions: options.regions?.split(',').map((r) => r.trim()),
    });

    spinner.stop();

    await logger.success('Direct offer enabled!');
    await logger.divider();

    await logger.header('Offer Details');
    await logger.keyValue('Offer ID', result.offer.id);
    await logger.keyValue('SKU', result.offer.sku);
    await logger.keyValue('Title', result.offer.title);
    await logger.keyValue('Base Price', `${result.offer.currency} ${result.offer.basePrice.toFixed(2)}`);
    await logger.keyValue('Offer Price', `${result.offer.currency} ${result.offer.offerPrice.toFixed(2)}`);
    await logger.keyValue('Discount', `${result.offer.discount}${result.offer.discountType === 'percentage' ? '%' : ` ${result.offer.currency}`}`);
    await logger.keyValue('Savings', `${result.offer.currency} ${(result.offer.basePrice - result.offer.offerPrice).toFixed(2)}`);
    await logger.keyValue('Availability', result.offer.availability);
    await logger.keyValue('Valid Until', new Date(result.offer.validUntil).toLocaleDateString());

    await logger.divider();
    await logger.header('Buy Now URL');
    await logger.info(`  ${result.offer.buyNowUrl}`);

    await logger.divider();
    await logger.header('UCP Structured Data (Schema.org)');
    await logger.info(JSON.stringify(result.structuredData, null, 2));

    await logger.divider();
    await logger.header('AI Platform Embed');
    await logger.info(`  ${result.embedUrl}`);

    await logger.info('');
    await logger.success('Offer is now live for AI search results!');
    await logger.info('');
    await logger.example('Manage offer:');
    await logger.example(`  synthex ucp disable-offer --offer-id "${result.offer.id}"`);
    await logger.example('  synthex ucp list');
  } catch (error) {
    spinner.fail('Failed to enable offer');
    throw error;
  }
}

async function runDisableOffer(options: { offerId: string }): Promise<void> {
  await logger.header('UCP: Disable Offer');
  await logger.divider();

  await logger.info(`Offer ID: ${options.offerId}`);
  await logger.divider();

  const spinner = await logger.spinner('Disabling offer...');

  try {
    const service = new UCPService();
    await service.disableOffer(options.offerId);

    spinner.stop();

    await logger.success('Offer disabled successfully!');
  } catch (error) {
    spinner.fail('Failed to disable offer');
    throw error;
  }
}

async function runListOffers(options: { limit?: string }): Promise<void> {
  await logger.header('UCP: Active Offers');
  await logger.divider();

  const spinner = await logger.spinner('Fetching offers...');

  try {
    const service = new UCPService();
    const limit = parseInt(options.limit || '20', 10);
    const offers = await service.getActiveOffers(limit);

    spinner.stop();

    if (offers.length === 0) {
      await logger.info('No active offers found');
      await logger.info('');
      await logger.example('Create an offer:');
      await logger.example('  synthex ucp enable-offer --product-id "SKU_PRODUCT_01" --discount "15%"');
      return;
    }

    await logger.info(`Found ${offers.length} active offers`);
    await logger.divider();

    for (let i = 0; i < offers.length; i++) {
      const offer = offers[i];
      const savings = offer.basePrice - offer.offerPrice;
      const savingsPercent = ((savings / offer.basePrice) * 100).toFixed(1);

      await logger.info(`${i + 1}. ${offer.sku} - ${offer.title}`);
      await logger.info(`   Price: ${offer.currency} ${offer.offerPrice.toFixed(2)} (was ${offer.basePrice.toFixed(2)})`);
      await logger.info(`   Savings: ${savingsPercent}% off (${offer.currency} ${savings.toFixed(2)})`);
      await logger.info(`   Valid until: ${new Date(offer.validUntil).toLocaleDateString()}`);
      await logger.info(`   Status: ${offer.availability}`);
      await logger.divider();
    }

    await logger.info('');
    await logger.example('Disable an offer:');
    await logger.example(`  synthex ucp disable-offer --offer-id "${offers[0].id}"`);
  } catch (error) {
    spinner.fail('Failed to fetch offers');
    throw error;
  }
}
