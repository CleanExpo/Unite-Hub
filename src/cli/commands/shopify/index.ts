/**
 * Shopify Command Group
 *
 * Groups all Shopify-related commands
 */

import { Command } from 'commander';
import { createProductsCommand } from './products.js';
import { createOrdersCommand } from './orders.js';
import { createSyncCommand } from './sync.js';

export function createShopifyCommand(): Command {
  const command = new Command('shopify');

  command.description('Shopify integration commands');

  // Add subcommands
  command.addCommand(createProductsCommand());
  command.addCommand(createOrdersCommand());
  command.addCommand(createSyncCommand());

  return command;
}
