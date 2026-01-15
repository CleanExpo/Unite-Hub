/**
 * synthex check business-id Command
 *
 * Validates business identifiers against government registries
 *
 * Usage:
 *   synthex check business-id --country AU --id "12345678901"
 *   synthex check business-id --country NZ --id "9429030477537"
 */

import { Command } from 'commander';
import { logger } from '../../utils/logger.js';
import { businessValidator } from '../../services/validation/business-validator.js';

export function createBusinessIdCommand(): Command {
  const command = new Command('business-id');

  command
    .description('Validate business identifiers (ABN, NZBN)')
    .option('-c, --country <country>', 'Country code (AU, NZ)')
    .option('-i, --id <id>', 'Business identifier number')
    .option('--strict', 'Enable strict validation (queries government API)')
    .option('--no-cache', 'Disable cache (force fresh validation)')
    .action(async (options) => {
      try {
        await runBusinessIdCheck(options);
      } catch (error) {
        await logger.error('Business ID validation failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runBusinessIdCheck(options: {
  country?: string;
  id?: string;
  strict?: boolean;
  cache?: boolean;
}): Promise<void> {
  // Validate country
  if (!options.country) {
    await logger.error('Country is required');
    await logger.info('Available countries: AU (Australia), NZ (New Zealand)');
    await logger.divider();
    await logger.example('synthex check business-id --country AU --id "12345678901"');
    await logger.example('synthex check business-id --country NZ --id "9429030477537"');
    process.exit(1);
  }

  const country = options.country.toUpperCase();

  if (country !== 'AU' && country !== 'NZ') {
    await logger.error(`Unknown country: ${options.country}`);
    await logger.info('Available countries: AU (Australia), NZ (New Zealand)');
    process.exit(1);
  }

  // Validate ID
  if (!options.id) {
    await logger.error('Business ID is required');
    await logger.divider();

    if (country === 'AU') {
      await logger.info('Australian Business Number (ABN) format: 11 digits');
      await logger.example('synthex check business-id --country AU --id "12345678901"');
    } else {
      await logger.info('New Zealand Business Number (NZBN) format: 13 digits');
      await logger.example('synthex check business-id --country NZ --id "9429030477537"');
    }

    process.exit(1);
  }

  const useCache = options.cache !== false; // Default to true
  const strict = options.strict === true; // Default to false

  await logger.header(`${country === 'AU' ? 'Australian' : 'New Zealand'} Business ID Validation`);

  if (strict) {
    await logger.info('Mode: Strict (querying government API)');
  } else {
    await logger.info('Mode: Local (check digit validation only)');
    await logger.info('Add --strict flag for government database lookup');
  }

  await logger.divider();

  const spinner = await logger.spinner('Validating business ID...');

  try {
    const result = await businessValidator.validate(country as 'AU' | 'NZ', options.id, {
      useCache,
      strict,
    });

    if (!result.isValid) {
      spinner.fail('Invalid business ID');
      await logger.divider();
      await logger.error(result.error || 'Validation failed');
      process.exit(1);
    }

    spinner.succeed(
      result.cached
        ? 'Valid business ID (from cache)'
        : strict
        ? 'Valid business ID (verified with government registry)'
        : 'Valid business ID (local validation)'
    );

    // Display result
    await logger.divider();
    await logger.header('Business Details');

    if (country === 'AU') {
      await logger.keyValue('ABN', result.formattedId);
    } else {
      await logger.keyValue('NZBN', result.formattedId);
    }

    if (result.entityName) {
      await logger.keyValue('Entity', result.entityName);
    }

    if (result.status) {
      const statusColor =
        result.status === 'active'
          ? '✓ Active'
          : result.status === 'cancelled'
          ? '✗ Cancelled'
          : '⚠ Inactive';
      await logger.keyValue('Status', statusColor);
    }

    if (result.gstRegistered !== undefined) {
      await logger.keyValue('GST Registered', result.gstRegistered ? 'Yes' : 'No');
    }

    if (result.registeredDate) {
      await logger.keyValue('Registered', result.registeredDate);
    }

    if (result.recordUrl) {
      await logger.divider();
      await logger.info('View full record:');
      await logger.url(result.recordUrl);
    }

    // Cache info
    if (result.cached && result.cacheExpiry) {
      await logger.divider();
      await logger.info(`Cached result (expires: ${result.cacheExpiry.toLocaleString()})`);
    }

    // Validation source
    await logger.divider();
    await logger.keyValue('Validation Source', getValidationSourceLabel(result.validationSource));

    if (result.error) {
      await logger.divider();
      await logger.warn(result.error);
    }
  } catch (error) {
    spinner.fail('Validation error');
    throw error;
  }
}

function getValidationSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    ABR: 'Australian Business Register (ABR)',
    NZBN: 'NZ Companies Office',
    local: 'Local check digit validation',
    cache: 'Cached result (24h)',
  };

  return labels[source] || source;
}
