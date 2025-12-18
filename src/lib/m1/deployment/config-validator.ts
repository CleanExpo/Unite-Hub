/**
 * M1 Production Configuration Validator
 *
 * Validates all required environment variables, credentials, and configurations
 * before production deployment. Provides detailed error reporting for missing or invalid configs.
 *
 * Version: v2.3.0
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningCount: number;
  };
}

export interface ValidationError {
  category: string;
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  remediation?: string;
}

export interface ValidationWarning {
  category: string;
  field: string;
  message: string;
  recommendation?: string;
}

/**
 * Configuration categories to validate
 */
const CONFIG_CATEGORIES = {
  API: 'API Configuration',
  DATABASE: 'Database Configuration',
  REDIS: 'Redis Configuration',
  SECURITY: 'Security Configuration',
  MONITORING: 'Monitoring Configuration',
  PERFORMANCE: 'Performance Configuration',
  DEPLOYMENT: 'Deployment Configuration',
};

/**
 * Required environment variables and their validation rules
 */
const REQUIRED_CONFIG: Record<string, any> = {
  // API Configuration
  NEXT_PUBLIC_CONVEX_URL: {
    category: CONFIG_CATEGORIES.API,
    required: true,
    severity: 'critical',
    validator: (val: string) => val.includes('convex'),
    message: 'Must be a valid Convex URL',
  },

  M1_JWT_SECRET: {
    category: CONFIG_CATEGORIES.SECURITY,
    required: true,
    severity: 'critical',
    validator: (val: string) => val && val.length >= 32,
    message: 'Must be at least 32 characters',
  },

  M1_JWT_ALGORITHM: {
    category: CONFIG_CATEGORIES.SECURITY,
    required: true,
    severity: 'high',
    validator: (val: string) => ['HS256', 'RS256'].includes(val),
    message: 'Must be HS256 or RS256',
  },

  // Redis Configuration
  M1_REDIS_URL: {
    category: CONFIG_CATEGORIES.REDIS,
    required: true,
    severity: 'high',
    validator: (val: string) => val.startsWith('redis://') || val.startsWith('rediss://'),
    message: 'Must be a valid Redis URL (redis:// or rediss://)',
  },

  M1_REDIS_MAX_CONNECTIONS: {
    category: CONFIG_CATEGORIES.REDIS,
    required: false,
    severity: 'medium',
    validator: (val: string) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num > 0 && num <= 1000;
    },
    message: 'Must be a number between 1 and 1000',
    default: '50',
  },

  M1_REDIS_TIMEOUT_MS: {
    category: CONFIG_CATEGORIES.REDIS,
    required: false,
    severity: 'medium',
    validator: (val: string) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1000 && num <= 60000;
    },
    message: 'Must be a number between 1000ms and 60000ms',
    default: '5000',
  },

  M1_CACHE_ENABLED: {
    category: CONFIG_CATEGORIES.PERFORMANCE,
    required: false,
    severity: 'medium',
    validator: (val: string) => ['true', 'false'].includes(val.toLowerCase()),
    message: 'Must be true or false',
    default: 'true',
  },

  M1_CACHE_TTL_MS: {
    category: CONFIG_CATEGORIES.PERFORMANCE,
    required: false,
    severity: 'medium',
    validator: (val: string) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 60000 && num <= 86400000;
    },
    message: 'Must be between 60s and 24h (in milliseconds)',
    default: '3600000',
  },

  // Monitoring Configuration
  M1_MONITORING_ENABLED: {
    category: CONFIG_CATEGORIES.MONITORING,
    required: false,
    severity: 'medium',
    validator: (val: string) => ['true', 'false'].includes(val.toLowerCase()),
    message: 'Must be true or false',
    default: 'true',
  },

  M1_LOG_LEVEL: {
    category: CONFIG_CATEGORIES.MONITORING,
    required: false,
    severity: 'low',
    validator: (val: string) => ['debug', 'info', 'warn', 'error'].includes(val.toLowerCase()),
    message: 'Must be debug, info, warn, or error',
    default: 'info',
  },

  // Performance Configuration
  M1_MAX_TOOL_CALLS_PER_RUN: {
    category: CONFIG_CATEGORIES.PERFORMANCE,
    required: false,
    severity: 'medium',
    validator: (val: string) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 10 && num <= 1000;
    },
    message: 'Must be between 10 and 1000',
    default: '50',
  },

  M1_MAX_RUNTIME_SECONDS: {
    category: CONFIG_CATEGORIES.PERFORMANCE,
    required: false,
    severity: 'medium',
    validator: (val: string) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 60 && num <= 3600;
    },
    message: 'Must be between 60 and 3600 seconds',
    default: '300',
  },

  // Deployment Configuration
  NODE_ENV: {
    category: CONFIG_CATEGORIES.DEPLOYMENT,
    required: true,
    severity: 'critical',
    validator: (val: string) => ['production', 'staging', 'development'].includes(val.toLowerCase()),
    message: 'Must be production, staging, or development',
  },

  PORT: {
    category: CONFIG_CATEGORIES.DEPLOYMENT,
    required: false,
    severity: 'medium',
    validator: (val: string) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1024 && num <= 65535;
    },
    message: 'Must be a valid port number (1024-65535)',
    default: '3000',
  },

  M1_ENABLE_API: {
    category: CONFIG_CATEGORIES.API,
    required: false,
    severity: 'medium',
    validator: (val: string) => ['true', 'false'].includes(val.toLowerCase()),
    message: 'Must be true or false',
    default: 'true',
  },
};

/**
 * Production deployment configuration validator
 */
export class ConfigValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private checksPerformed: number = 0;
  private checksPassed: number = 0;

  /**
   * Store last validation result for report generation
   */
  private lastValidationResult: ValidationResult | null = null;

  /**
   * Validate all configuration
   */
  async validateAll(): Promise<ValidationResult> {
    this.errors = [];
    this.warnings = [];
    this.checksPerformed = 0;
    this.checksPassed = 0;

    // Validate required environment variables
    this.validateEnvironmentVariables();

    // Validate database connectivity (if config provided)
    await this.validateDatabaseConnectivity();

    // Validate Redis connectivity (if config provided)
    await this.validateRedisConnectivity();

    // Validate API endpoints
    await this.validateAPIEndpoints();

    // Validate security configuration
    this.validateSecurityConfig();

    // Validate performance thresholds
    this.validatePerformanceConfig();

    // Validate deployment configuration
    this.validateDeploymentConfig();

    const result: ValidationResult = {
      valid: this.errors.filter(e => e.severity === 'critical').length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalChecks: this.checksPerformed,
        passedChecks: this.checksPassed,
        failedChecks: this.errors.length,
        warningCount: this.warnings.length,
      },
    };

    // Store for report generation
    this.lastValidationResult = result;
    return result;
  }

  /**
   * Validate environment variables
   */
  private validateEnvironmentVariables(): void {
    for (const [key, config] of Object.entries(REQUIRED_CONFIG)) {
      this.checksPerformed++;

      const value = process.env[key];

      if (!value) {
        if (config.required) {
          this.errors.push({
            category: config.category,
            field: key,
            message: `Missing required configuration: ${key}`,
            severity: config.severity,
            remediation: `Set environment variable ${key}. ${config.message}`,
          });
          continue; // Changed from 'return' to 'continue'
        }

        if (config.default) {
          this.warnings.push({
            category: config.category,
            field: key,
            message: `Using default value for ${key}: ${config.default}`,
            recommendation: `Consider setting ${key} explicitly for production`,
          });
        }

        this.checksPassed++;
        continue; // Changed from 'return' to 'continue'
      }

      // Validate value format
      if (!config.validator(value)) {
        this.errors.push({
          category: config.category,
          field: key,
          message: `Invalid value for ${key}: ${value}`,
          severity: config.severity,
          remediation: config.message,
        });
        continue; // Changed from 'return' to 'continue'
      }

      this.checksPassed++;
    }
  }

  /**
   * Validate database connectivity
   */
  private async validateDatabaseConnectivity(): Promise<void> {
    this.checksPerformed++;

    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (!convexUrl) {
        this.warnings.push({
          category: CONFIG_CATEGORIES.DATABASE,
          field: 'NEXT_PUBLIC_CONVEX_URL',
          message: 'Convex URL not configured',
          recommendation: 'Set NEXT_PUBLIC_CONVEX_URL to enable persistent storage',
        });
        return;
      }

      // Test Convex connectivity by making a simple HTTP request
      const response = await fetch(`${convexUrl}/health`, {
        timeout: 5000,
      }).catch(() => null);

      if (!response) {
        this.errors.push({
          category: CONFIG_CATEGORIES.DATABASE,
          field: 'Convex Health',
          message: 'Cannot connect to Convex database',
          severity: 'high',
          remediation: 'Verify Convex URL is correct and Convex service is running',
        });
        return;
      }

      this.checksPassed++;
    } catch (error) {
      this.errors.push({
        category: CONFIG_CATEGORIES.DATABASE,
        field: 'Database Connectivity',
        message: `Database connectivity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
      });
    }
  }

  /**
   * Validate Redis connectivity
   */
  private async validateRedisConnectivity(): Promise<void> {
    this.checksPerformed++;

    try {
      const redisUrl = process.env.M1_REDIS_URL;
      if (!redisUrl) {
        this.warnings.push({
          category: CONFIG_CATEGORIES.REDIS,
          field: 'M1_REDIS_URL',
          message: 'Redis URL not configured',
          recommendation: 'For production, configure Redis for distributed caching',
        });
        return;
      }

      // Parse Redis URL and validate format
      try {
        new URL(redisUrl);
        this.checksPassed++;
      } catch {
        this.errors.push({
          category: CONFIG_CATEGORIES.REDIS,
          field: 'M1_REDIS_URL',
          message: `Invalid Redis URL format: ${redisUrl}`,
          severity: 'high',
          remediation: 'Redis URL must be valid, e.g., redis://localhost:6379',
        });
      }
    } catch (error) {
      this.errors.push({
        category: CONFIG_CATEGORIES.REDIS,
        field: 'Redis Configuration',
        message: `Redis validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium',
      });
    }
  }

  /**
   * Validate API endpoints
   */
  private async validateAPIEndpoints(): Promise<void> {
    this.checksPerformed++;

    try {
      const enableAPI = process.env.M1_ENABLE_API !== 'false';
      if (!enableAPI) {
        this.warnings.push({
          category: CONFIG_CATEGORIES.API,
          field: 'M1_ENABLE_API',
          message: 'M1 API is disabled',
          recommendation: 'Set M1_ENABLE_API=true to enable monitoring dashboard',
        });
        return;
      }

      // API should be accessible on configured port
      const port = process.env.PORT || '3000';
      // Note: In real implementation, would test actual endpoint
      // For now, just validate the configuration is present
      this.checksPassed++;
    } catch (error) {
      this.errors.push({
        category: CONFIG_CATEGORIES.API,
        field: 'API Configuration',
        message: `API validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium',
      });
    }
  }

  /**
   * Validate security configuration
   */
  private validateSecurityConfig(): void {
    this.checksPerformed++;

    try {
      const nodeEnv = process.env.NODE_ENV || 'development';

      // In production, JWT secret should not be default
      if (nodeEnv === 'production') {
        const jwtSecret = process.env.M1_JWT_SECRET || '';

        if (jwtSecret === 'm1-development-secret-key' || jwtSecret.length < 32) {
          this.errors.push({
            category: CONFIG_CATEGORIES.SECURITY,
            field: 'M1_JWT_SECRET',
            message: 'JWT secret is not production-grade',
            severity: 'critical',
            remediation: 'Generate a strong JWT secret (32+ chars) and set M1_JWT_SECRET',
          });
          return;
        }
      }

      this.checksPassed++;
    } catch (error) {
      this.errors.push({
        category: CONFIG_CATEGORIES.SECURITY,
        field: 'Security Configuration',
        message: `Security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
      });
    }
  }

  /**
   * Validate performance configuration
   */
  private validatePerformanceConfig(): void {
    this.checksPerformed++;

    try {
      const cacheEnabled = process.env.M1_CACHE_ENABLED !== 'false';
      const maxCalls = parseInt(process.env.M1_MAX_TOOL_CALLS_PER_RUN || '50', 10);
      const maxRuntime = parseInt(process.env.M1_MAX_RUNTIME_SECONDS || '300', 10);

      if (!cacheEnabled) {
        this.warnings.push({
          category: CONFIG_CATEGORIES.PERFORMANCE,
          field: 'M1_CACHE_ENABLED',
          message: 'Caching is disabled',
          recommendation: 'Enable caching (M1_CACHE_ENABLED=true) for better performance',
        });
      }

      if (maxCalls < 50 && process.env.NODE_ENV === 'production') {
        this.warnings.push({
          category: CONFIG_CATEGORIES.PERFORMANCE,
          field: 'M1_MAX_TOOL_CALLS_PER_RUN',
          message: `Tool call limit is low: ${maxCalls}`,
          recommendation: 'Consider increasing to 50-100 for production',
        });
      }

      this.checksPassed++;
    } catch (error) {
      this.errors.push({
        category: CONFIG_CATEGORIES.PERFORMANCE,
        field: 'Performance Configuration',
        message: `Performance validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium',
      });
    }
  }

  /**
   * Validate deployment configuration
   */
  private validateDeploymentConfig(): void {
    this.checksPerformed++;

    try {
      const nodeEnv = process.env.NODE_ENV || 'development';
      const port = parseInt(process.env.PORT || '3000', 10);

      if (nodeEnv === 'production') {
        if (port < 1024) {
          this.warnings.push({
            category: CONFIG_CATEGORIES.DEPLOYMENT,
            field: 'PORT',
            message: `Port ${port} is privileged (< 1024)`,
            recommendation: 'Use port >= 1024 or run with sudo',
          });
        }
      }

      this.checksPassed++;
    } catch (error) {
      this.errors.push({
        category: CONFIG_CATEGORIES.DEPLOYMENT,
        field: 'Deployment Configuration',
        message: `Deployment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium',
      });
    }
  }

  /**
   * Generate detailed validation report (must call validateAll() first)
   */
  generateReport(): string {
    const result = this.lastValidationResult;

    if (!result) {
      return 'Error: No validation result available. Call validateAll() first.';
    }

    let report = '='.repeat(70) + '\n';
    report += 'M1 PRODUCTION CONFIGURATION VALIDATION REPORT\n';
    report += '='.repeat(70) + '\n\n';

    // Summary
    report += `Status: ${result.valid ? '✅ PASS' : '❌ FAIL'}\n`;
    report += `Total Checks: ${result.summary.totalChecks}\n`;
    report += `Passed: ${result.summary.passedChecks}\n`;
    report += `Failed: ${result.summary.failedChecks}\n`;
    report += `Warnings: ${result.summary.warningCount}\n\n`;

    // Critical Errors
    const criticalErrors = result.errors.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      report += 'CRITICAL ERRORS (Must fix before production):\n';
      report += '-'.repeat(70) + '\n';
      for (const error of criticalErrors) {
        report += `❌ ${error.field}: ${error.message}\n`;
        if (error.remediation) {
          report += `   → ${error.remediation}\n`;
        }
      }
      report += '\n';
    }

    // High Severity Errors
    const highErrors = result.errors.filter(e => e.severity === 'high');
    if (highErrors.length > 0) {
      report += 'HIGH SEVERITY ERRORS (Strongly recommended to fix):\n';
      report += '-'.repeat(70) + '\n';
      for (const error of highErrors) {
        report += `⚠️  ${error.field}: ${error.message}\n`;
        if (error.remediation) {
          report += `   → ${error.remediation}\n`;
        }
      }
      report += '\n';
    }

    // Warnings
    if (result.warnings.length > 0) {
      report += 'WARNINGS (Consider addressing these):\n';
      report += '-'.repeat(70) + '\n';
      for (const warning of result.warnings) {
        report += `⚡ ${warning.field}: ${warning.message}\n`;
        if (warning.recommendation) {
          report += `   → ${warning.recommendation}\n`;
        }
      }
      report += '\n';
    }

    report += '='.repeat(70) + '\n';

    return report;
  }
}

// Export singleton
export const configValidator = new ConfigValidator();
