/**
 * Repair CLI - Command-line interface for chunked repairs
 */

import { ServiceRepairManager, RepairPlan, RepairTask } from './service-repair';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface RepairConfig {
  targetDirs: string[];
  excludeDirs: string[];
  filePatterns: string[];
  maxFileSize: number; // in MB
  outputReport: boolean;
  reportPath?: string;
}

export class RepairCLI {
  private config: RepairConfig;
  private repairManager: ServiceRepairManager;

  constructor(config: Partial<RepairConfig> = {}) {
    this.config = {
      targetDirs: ['src'],
      excludeDirs: ['node_modules', 'dist', 'build', '.next'],
      filePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      maxFileSize: 5, // 5MB max per file
      outputReport: true,
      reportPath: './repair-report.json',
      ...config
    };

    this.repairManager = new ServiceRepairManager({
      maxConcurrentRepairs: 2, // Lower concurrency to prevent overload
      repairBatchSize: 3, // Smaller batches
      delayBetweenRepairs: 500, // More delay between repairs
      onProgress: this.handleProgress.bind(this)
    });
  }

  /**
   * Run the repair process
   */
  async run(options: {
    dryRun?: boolean;
    autoFixOnly?: boolean;
    phases?: string[];
  } = {}): Promise<void> {
    console.log('🔧 Starting repair process...\n');

    try {
      // Step 1: Collect files to scan
      const files = await this.collectFiles();
      console.log(`📁 Found ${files.length} files to scan\n`);

      // Step 2: Filter large files to prevent overload
      const processableFiles = await this.filterLargeFiles(files);
      console.log(`✅ ${processableFiles.length} files within size limit\n`);

      // Step 3: Scan for issues in chunks
      console.log('🔍 Scanning for issues...');
      const issues = await this.scanInChunks(processableFiles);
      console.log(`\n📋 Found ${issues.length} issues\n`);

      if (issues.length === 0) {
        console.log('✨ No issues found! Your project is clean.');
        return;
      }

      // Step 4: Create repair plan
      const repairPlan = new RepairPlan(issues);
      const summary = repairPlan.getSummary();
      
      console.log('📊 Issue Summary:');
      Object.entries(summary).forEach(([phase, count]) => {
        if (count > 0) {
          console.log(`   ${phase}: ${count} issues`);
        }
      });
      console.log('');

      // Step 5: Execute repairs phase by phase
      if (!options.dryRun) {
        console.log('🚀 Starting repairs...\n');
      } else {
        console.log('🔍 Running in DRY RUN mode (no changes will be made)\n');
      }

      // Update repair manager options
      this.repairManager = new ServiceRepairManager({
        ...this.repairManager['options'],
        dryRun: options.dryRun || false,
        autoFixOnly: options.autoFixOnly || false
      });

      // Execute repair plan
      await repairPlan.execute(
        this.repairManager,
        this.handlePhaseComplete.bind(this)
      );

      // Step 6: Generate report
      if (this.config.outputReport) {
        await this.generateReport();
      }

      console.log('\n✅ Repair process completed!');

    } catch (error) {
      console.error('\n❌ Repair process failed:', error);
      throw error;
    }
  }

  /**
   * Collect files to scan based on patterns
   */
  private async collectFiles(): Promise<string[]> {
    const files: string[] = [];

    for (const dir of this.config.targetDirs) {
      for (const pattern of this.config.filePatterns) {
        const matches = await glob(path.join(dir, pattern), {
          ignore: this.config.excludeDirs.map(d => `**/${d}/**`),
          absolute: true
        });
        files.push(...matches);
      }
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Filter out large files to prevent overload
   */
  private async filterLargeFiles(files: string[]): Promise<string[]> {
    const maxSizeBytes = this.config.maxFileSize * 1024 * 1024;
    const processableFiles: string[] = [];
    const skippedFiles: string[] = [];

    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        if (stats.size <= maxSizeBytes) {
          processableFiles.push(file);
        } else {
          skippedFiles.push(file);
        }
      } catch (error) {
        console.warn(`⚠️  Could not stat file: ${file}`);
      }
    }

    if (skippedFiles.length > 0) {
      console.log(`\n⚠️  Skipped ${skippedFiles.length} large files (>${this.config.maxFileSize}MB):`);
      skippedFiles.slice(0, 5).forEach(file => {
        console.log(`   - ${path.relative(process.cwd(), file)}`);
      });
      if (skippedFiles.length > 5) {
        console.log(`   ... and ${skippedFiles.length - 5} more`);
      }
    }

    return processableFiles;
  }

  /**
   * Scan files in chunks to prevent overload
   */
  private async scanInChunks(files: string[]): Promise<RepairTask[]> {
    const chunkSize = 20; // Process 20 files at a time
    const chunks = this.chunkArray(files, chunkSize);
    const allIssues: RepairTask[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      process.stdout.write(`\r🔍 Scanning... ${Math.round((i + 1) / chunks.length * 100)}%`);
      
      const chunkIssues = await this.repairManager.scanForIssues(chunk);
      allIssues.push(...chunkIssues);
      
      // Small delay between chunks
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return allIssues;
  }

  /**
   * Handle progress updates
   */
  private handleProgress(current: number, total: number): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(percentage);
    process.stdout.write(`\r${progressBar} ${current}/${total} tasks`);
  }

  /**
   * Handle phase completion
   */
  private handlePhaseComplete(phase: string, results: any): void {
    console.log(`\n✅ Completed phase: ${phase}`);
    console.log(`   Successful: ${results.successful}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Skipped: ${results.skipped}`);
  }

  /**
   * Generate repair report
   */
  private async generateReport(): Promise<void> {
    const history = this.repairManager.getHistory();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: history.length,
        successful: history.filter(r => r.success).length,
        failed: history.filter(r => !r.success).length
      },
      details: history
    };

    if (this.config.reportPath) {
      await fs.writeFile(
        this.config.reportPath,
        JSON.stringify(report, null, 2)
      );
      console.log(`\n📄 Report saved to: ${this.config.reportPath}`);
    }
  }

  /**
   * Create a progress bar
   */
  private createProgressBar(percentage: number): string {
    const width = 30;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${'\x1b[42m \x1b[0m'.repeat(filled)}${' '.repeat(empty)}] ${percentage}%`;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Presets for common repair scenarios
 */
export const RepairPresets = {
  quick: {
    maxConcurrentRepairs: 5,
    repairBatchSize: 10,
    delayBetweenRepairs: 100,
    autoFixOnly: true
  },
  thorough: {
    maxConcurrentRepairs: 2,
    repairBatchSize: 5,
    delayBetweenRepairs: 500,
    autoFixOnly: false
  },
  safe: {
    maxConcurrentRepairs: 1,
    repairBatchSize: 3,
    delayBetweenRepairs: 1000,
    autoFixOnly: false,
    dryRun: true
  }
};

/**
 * Example usage function
 */
export async function runRepairExample() {
  const cli = new RepairCLI({
    targetDirs: ['src'],
    excludeDirs: ['node_modules', 'dist', '.next'],
    filePatterns: ['**/*.ts', '**/*.tsx'],
    maxFileSize: 5,
    outputReport: true
  });

  // Run with safe preset first
  await cli.run({
    dryRun: true,
    autoFixOnly: false
  });
}
