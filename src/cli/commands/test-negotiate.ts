/**
 * synthex test Commands
 *
 * Testing commands for A2A negotiation and other features
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { A2ANegotiationService } from '../services/commerce/a2a-negotiation.js';

export function createTestCommand(): Command {
  const command = new Command('test');

  command.description('Testing commands for A2A negotiation');

  // synthex test negotiate --agent-id "BuyerAgent_Test" --target-sku "SKU_DEHUMID_01"
  command
    .command('negotiate')
    .description('Test agent-to-agent price negotiation')
    .requiredOption('--agent-id <id>', 'Buyer agent ID for testing')
    .requiredOption('--target-sku <sku>', 'Target product SKU')
    .option('--starting-bid <price>', 'Starting bid price')
    .option('--max-bid <price>', 'Maximum bid price')
    .option('--quantity <number>', 'Purchase quantity', '1')
    .action(async (options) => {
      try {
        await runNegotiationTest(options);
      } catch (error) {
        await logger.error('Negotiation test failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runNegotiationTest(options: {
  agentId: string;
  targetSku: string;
  startingBid?: string;
  maxBid?: string;
  quantity?: string;
}): Promise<void> {
  await logger.header('A2A: Agent-to-Agent Negotiation Test');
  await logger.divider();

  await logger.info(`Buyer Agent: ${options.agentId}`);
  await logger.info(`Target SKU: ${options.targetSku}`);
  if (options.startingBid) {
    await logger.info(`Starting Bid: $${options.startingBid}`);
  }
  if (options.maxBid) {
    await logger.info(`Max Bid: $${options.maxBid}`);
  }
  await logger.info(`Quantity: ${options.quantity}`);
  await logger.divider();

  const spinner = await logger.spinner('Initiating negotiation protocol...');

  try {
    const service = new A2ANegotiationService();

    const result = await service.testNegotiation({
      agentId: options.agentId,
      targetSku: options.targetSku,
      startingBid: options.startingBid ? parseFloat(options.startingBid) : undefined,
      maxBid: options.maxBid ? parseFloat(options.maxBid) : undefined,
      quantity: parseInt(options.quantity || '1', 10),
    });

    spinner.stop();

    // Show outcome
    if (result.outcome === 'accepted') {
      await logger.success('✓ Negotiation Successful!');
    } else if (result.outcome === 'rejected') {
      await logger.warn('✗ Negotiation Failed');
    } else {
      await logger.warn('⏱ Negotiation Timeout');
    }

    await logger.divider();

    await logger.header('Negotiation Summary');
    await logger.keyValue('Session ID', result.session.id);
    await logger.keyValue('Outcome', result.outcome.toUpperCase());
    await logger.keyValue('Iterations', result.iterations.toString());
    await logger.keyValue('Duration', `${result.duration}ms`);

    if (result.finalPrice) {
      await logger.keyValue('Final Price', `$${result.finalPrice.toFixed(2)}`);
    }

    if (result.savings) {
      await logger.keyValue('Savings', `$${result.savings.toFixed(2)} (${((result.savings / (result.finalPrice! + result.savings)) * 100).toFixed(1)}%)`);
    }

    // Show negotiation transcript
    if (result.offers.length > 0) {
      await logger.divider();
      await logger.header('Negotiation Transcript');

      for (let i = 0; i < result.offers.length; i++) {
        const offer = result.offers[i];
        const agentLabel = offer.agentType === 'buyer' ? '🛒 BUYER' : '🏪 SELLER';

        await logger.info(`${i + 1}. ${agentLabel} → $${offer.offerPrice.toFixed(2)}`);
        await logger.info(`   "${offer.message}"`);
        await logger.divider();
      }
    }

    await logger.info('');

    if (result.outcome === 'accepted') {
      await logger.success('Deal closed successfully!');
      await logger.info(`Final negotiated price: $${result.finalPrice!.toFixed(2)}`);

      if (result.savings) {
        await logger.success(`You saved: $${result.savings.toFixed(2)}`);
      }
    } else {
      await logger.warn('No deal was reached.');
      await logger.info('Agents could not agree on a mutually acceptable price.');
    }

    await logger.info('');
    await logger.example('Protocol Details:');
    await logger.example('  - Multi-round negotiation with AI-powered justifications');
    await logger.example('  - Seller has 30% max discount constraint');
    await logger.example('  - Maximum 5 iteration rounds');
    await logger.example('  - Agents meet halfway with each counter-offer');
  } catch (error) {
    spinner.fail('Negotiation test failed');
    throw error;
  }
}
