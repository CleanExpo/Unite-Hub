/**
 * Auth Command Group
 *
 * Groups all authentication-related commands
 */

import { Command } from 'commander';
import { createLoginCommand } from './login.js';
import { createStatusCommand } from './status.js';
import { createLogoutCommand } from './logout.js';
import { createRefreshCommand } from './refresh.js';

export function createAuthCommand(): Command {
  const command = new Command('auth');

  command.description('Authentication commands for Synthex services');

  // Add subcommands
  command.addCommand(createLoginCommand());
  command.addCommand(createStatusCommand());
  command.addCommand(createLogoutCommand());
  command.addCommand(createRefreshCommand());

  return command;
}
