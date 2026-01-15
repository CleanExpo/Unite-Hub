/**
 * Tenant Management Command Group
 *
 * Groups all tenant management commands
 */

import { Command } from 'commander';
import { createTenantsCommand } from './tenants.js';
import { createWorkspaceCommand } from './workspace.js';
import { createCredentialsCommand } from './credentials.js';

export function createTenantCommand(): Command {
  const command = new Command('tenant');

  command.description('Multi-tenant management commands');

  // Add subcommands
  command.addCommand(createTenantsCommand());
  command.addCommand(createWorkspaceCommand());
  command.addCommand(createCredentialsCommand());

  return command;
}
