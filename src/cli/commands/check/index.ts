/**
 * Check Command Group
 *
 * Groups all validation-related commands
 */

import { Command } from 'commander';
import { createBusinessIdCommand } from './business-id.js';

export function createCheckCommand(): Command {
  const command = new Command('check');

  command.description('Validation commands for business IDs and system health');

  // Add subcommands
  command.addCommand(createBusinessIdCommand());

  return command;
}
