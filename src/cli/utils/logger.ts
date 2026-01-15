/**
 * Synthex CLI Logger
 *
 * Provides colored console output with chalk and loading spinners with ora
 */

// Note: Using dynamic imports for ESM-only packages (chalk, ora)
// These will be imported at runtime

export class Logger {
  private chalk: any;
  private ora: any;
  private initialized: boolean = false;

  async init() {
    if (this.initialized) return;

    // Dynamic imports for ESM-only packages
    const chalkModule = await import('chalk');
    const oraModule = await import('ora');

    this.chalk = chalkModule.default;
    this.ora = oraModule.default;
    this.initialized = true;
  }

  /**
   * Success message with checkmark
   */
  async success(message: string): Promise<void> {
    await this.init();
    console.log(this.chalk.green('✓'), message);
  }

  /**
   * Error message with cross
   */
  async error(message: string): Promise<void> {
    await this.init();
    console.error(this.chalk.red('✗'), message);
  }

  /**
   * Warning message with warning sign
   */
  async warn(message: string): Promise<void> {
    await this.init();
    console.warn(this.chalk.yellow('⚠'), message);
  }

  /**
   * Info message with info sign
   */
  async info(message: string): Promise<void> {
    await this.init();
    console.log(this.chalk.blue('ℹ'), message);
  }

  /**
   * Plain log without prefix
   */
  log(message: string): void {
    console.log(message);
  }

  /**
   * Create a spinner
   */
  async spinner(text: string): Promise<any> {
    await this.init();
    return this.ora(text).start();
  }

  /**
   * Print header with formatting
   */
  async header(text: string): Promise<void> {
    await this.init();
    console.log('\n' + this.chalk.bold.cyan(text) + '\n');
  }

  /**
   * Print key-value pair
   */
  async keyValue(key: string, value: string, indent: number = 2): Promise<void> {
    await this.init();
    const padding = ' '.repeat(indent);
    console.log(padding + this.chalk.dim(key + ':'), value);
  }

  /**
   * Print section divider
   */
  divider(): void {
    console.log('');
  }

  /**
   * Print error details for debugging
   */
  async errorDetails(error: Error | unknown): Promise<void> {
    await this.init();

    if (error instanceof Error) {
      console.error(this.chalk.red('Error:'), error.message);

      if (error.stack && process.env.DEBUG === 'true') {
        console.error(this.chalk.dim('Stack trace:'));
        console.error(this.chalk.dim(error.stack));
      }
    } else {
      console.error(this.chalk.red('Error:'), error);
    }
  }

  /**
   * Print table
   */
  async table(headers: string[], rows: string[][]): Promise<void> {
    await this.init();

    // Calculate column widths
    const widths = headers.map((h, i) => {
      const maxRowWidth = Math.max(...rows.map((r) => (r[i] || '').length));
      return Math.max(h.length, maxRowWidth);
    });

    // Print header
    const headerRow = headers
      .map((h, i) => this.chalk.bold(h.padEnd(widths[i])))
      .join('  ');
    console.log(headerRow);

    // Print separator
    const separator = widths.map((w) => '-'.repeat(w)).join('  ');
    console.log(this.chalk.dim(separator));

    // Print rows
    rows.forEach((row) => {
      const formattedRow = row.map((cell, i) => (cell || '').padEnd(widths[i])).join('  ');
      console.log(formattedRow);
    });
  }

  /**
   * Print JSON with syntax highlighting
   */
  async json(data: any, indent: number = 2): Promise<void> {
    await this.init();
    const json = JSON.stringify(data, null, indent);
    console.log(this.chalk.dim(json));
  }

  /**
   * Print command usage example
   */
  async example(command: string): Promise<void> {
    await this.init();
    console.log(this.chalk.dim('  $ ') + this.chalk.cyan(command));
  }

  /**
   * Print URL
   */
  async url(url: string): Promise<void> {
    await this.init();
    console.log(this.chalk.underline.blue(url));
  }
}

// Singleton instance
export const logger = new Logger();
