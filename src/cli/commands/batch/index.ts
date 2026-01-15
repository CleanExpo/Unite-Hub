/**
 * Batch Operations Command Group
 *
 * Groups all batch operation commands
 */

import { Command } from 'commander';
import { createTenantsCommand } from './tenants.js';
import { createCredentialsCommand } from './credentials.js';
import { createExportCommand } from './export.js';

export function createBatchCommand(): Command {
  const command = new Command('batch');

  command.description('Bulk operations for multiple entities');

  // Add subcommands
  command.addCommand(createTenantsCommand());
  command.addCommand(createCredentialsCommand());
  command.addCommand(createExportCommand());

  return command;
}
