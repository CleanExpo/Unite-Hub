/**
 * Google Merchant Center Command Group
 *
 * Groups all Google Merchant Center-related commands
 */

import { Command } from 'commander';
import { createProductsCommand } from './products.js';

export function createGoogleMerchantCommand(): Command {
  const command = new Command('google-merchant');

  command.description('Google Merchant Center integration commands');

  // Add subcommands
  command.addCommand(createProductsCommand());

  return command;
}
