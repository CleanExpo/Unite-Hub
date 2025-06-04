#!/usr/bin/env node

/**
 * Weekly Site Monitor - Advanced Implementation with Error Handling
 * Schedules and executes the site crawler weekly with comprehensive logging
 */

import cron from 'node-cron';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WeeklySiteMonitor {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.isRunning = false;
    this.lastRun = null;
    this.errorCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  async init() {
    try {
      // Ensure log directory exists
      await this.ensureLogDirectory();
      
      // Load previous state if exists
      await this.loadState();
      
      // Set up the weekly cron job - runs every Sunday at 2:00 AM
      cron.schedule('0 2 * * 0', async () => {
        await this.runWeeklyCheck();
      }, {
        scheduled: true,
        timezone: "Australia/Brisbane"
      });

      // Set up daily health check - runs every day at 6:00 AM
      cron.schedule('0 6 * * *', async () => {
        await this.runHealthCheck();
      }, {
        scheduled: true,
        timezone: "Australia/Brisbane"
      });

      this.log('Weekly Site Monitor initialized successfully');
      this.log(`Next weekly check: ${this.getNextRunTime()}`);
      
    } catch (error) {
      this.logError('Failed to initialize Weekly Site Monitor', error);
      process.exit(1);
    }
  }

  async ensureLogDirectory() {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }

  async loadState() {
    try {
      const statePath = path.join(this.logDir, 'monitor-state.json');
      const stateData = await fs.readFile(statePath, 'utf8');
      const state = JSON.parse(stateData);
      
      this.lastRun = state.lastRun ? new Date(state.lastRun) : null;
      this.errorCount = state.errorCount || 0;
      
      this.log(`State loaded - Last run: ${this.lastRun}, Error count: ${this.errorCount}`);
    } catch {
      this.log('No previous state found, starting fresh');
    }
  }

  async saveState() {
    try {
      const statePath = path.join(this.logDir, 'monitor-state.json');
      const state = {
        lastRun: this.lastRun,
        errorCount: this.errorCount,
        timestamp: new Date().toISOString()
      };
      
      await fs.writeFile(statePath, JSON.stringify(state, null, 2));
    } catch (error) {
      this.logError('Failed to save state', error);
    }
  }

  async runWeeklyCheck() {
    if (this.isRunning) {
      this.log('Weekly check already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    this.log('Starting weekly site crawler check...');

    try {
      const result = await this.executeCrawlerWithRetry();
      
      if (result.success) {
        this.log('Weekly site crawler completed successfully');
        this.errorCount = 0; // Reset error count on success
        await this.processResults(result.data);
      } else {
        this.errorCount++;
        this.logError(`Weekly check failed (attempt ${this.errorCount})`, result.error);
        await this.handleFailure();
      }

      this.lastRun = new Date();
      await this.saveState();

    } catch (error) {
      this.errorCount++;
      this.logError('Unexpected error during weekly check', error);
      await this.handleFailure();
    } finally {
      this.isRunning = false;
    }
  }

  async runHealthCheck() {
    this.log('Running daily health check...');
    
    try {
      // Quick health check - just verify the crawler script exists and is executable
      const crawlerPath = path.join(__dirname, 'site-crawler.ts');
      await fs.access(crawlerPath);
      
      // Check if there are any recent errors in logs
      const recentErrors = await this.checkRecentErrors();
      
      if (recentErrors.length > 0) {
        this.log(`Health check found ${recentErrors.length} recent errors`);
        await this.notifyHealthIssues(recentErrors);
      } else {
        this.log('Health check passed - no recent errors found');
      }
      
    } catch (error) {
      this.logError('Health check failed', error);
    }
  }

  async executeCrawlerWithRetry() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.log(`Executing crawler (attempt ${attempt}/${this.maxRetries})`);
        
        const result = await this.executeCrawler();
        return { success: true, data: result };
        
      } catch (error) {
        this.logError(`Crawler execution failed (attempt ${attempt})`, error);
        
        if (attempt < this.maxRetries) {
          this.log(`Waiting ${this.retryDelay}ms before retry...`);
          await this.sleep(this.retryDelay);
        }
      }
    }
    
    return { success: false, error: 'Max retries exceeded' };
  }

  async executeCrawler() {
    return new Promise((resolve, reject) => {
      const crawlerPath = path.join(__dirname, 'site-crawler.ts');
      
      // Use tsx to run TypeScript file directly
      const child = spawn('npx', ['tsx', crawlerPath], {
        cwd: path.dirname(__dirname),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'production' }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch {
            resolve({ rawOutput: stdout });
          }
        } else {
          reject(new Error(`Crawler exited with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Set timeout for crawler execution (30 minutes max)
      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Crawler execution timeout'));
      }, 30 * 60 * 1000);
    });
  }

  async processResults(crawlerData) {
    try {
      const timestamp = new Date().toISOString();
      const reportPath = path.join(this.logDir, `crawler-report-${timestamp.split('T')[0]}.json`);
      
      // Save detailed results
      await fs.writeFile(reportPath, JSON.stringify(crawlerData, null, 2));
      
      // Generate summary
      const summary = this.generateSummary(crawlerData);
      await this.saveSummary(summary, timestamp);
      
      // Check for critical issues
      const criticalIssues = this.identifyCriticalIssues(crawlerData);
      if (criticalIssues.length > 0) {
        await this.alertCriticalIssues(criticalIssues);
      }
      
      this.log(`Results processed and saved to ${reportPath}`);
      
    } catch (error) {
      this.logError('Failed to process crawler results', error);
    }
  }

  generateSummary(data) {
    return {
      timestamp: new Date().toISOString(),
      totalPages: data.pages?.length || 0,
      totalErrors: data.errors?.length || 0,
      errorTypes: this.categorizeErrors(data.errors || []),
      performance: data.performance || {},
      recommendations: this.generateRecommendations(data)
    };
  }

  categorizeErrors(errors) {
    const categories = {
      '404': [],
      'api_failure': [],
      'javascript_error': [],
      'timeout': [],
      'authentication': [],
      'other': []
    };

    errors.forEach(error => {
      if (error.status === 404) {
        categories['404'].push(error);
      } else if (error.type === 'api') {
        categories['api_failure'].push(error);
      } else if (error.type === 'javascript') {
        categories['javascript_error'].push(error);
      } else if (error.type === 'timeout') {
        categories['timeout'].push(error);
      } else if (error.type === 'auth') {
        categories['authentication'].push(error);
      } else {
        categories['other'].push(error);
      }
    });

    return categories;
  }

  generateRecommendations(data) {
    const recommendations = [];
    
    if ((data.errors?.length || 0) > 10) {
      recommendations.push('High error count detected - consider immediate investigation');
    }
    
    if (data.performance?.avgLoadTime > 3000) {
      recommendations.push('Page load times are slow - optimize performance');
    }
    
    return recommendations;
  }

  identifyCriticalIssues(data) {
    const critical = [];
    
    // Critical pages that should never fail
    const criticalPages = ['/', '/login', '/dashboard'];
    
    data.errors?.forEach(error => {
      if (criticalPages.some(page => error.url?.includes(page))) {
        critical.push(error);
      }
    });
    
    return critical;
  }

  async handleFailure() {
    if (this.errorCount >= 3) {
      this.log('Multiple consecutive failures detected - sending alert');
      await this.sendAlert();
    }
  }

  async checkRecentErrors() {
    try {
      const logFiles = await fs.readdir(this.logDir);
      const recentErrors = [];
      
      for (const file of logFiles) {
        if (file.includes('error') || file.includes('crawler-report')) {
          const filePath = path.join(this.logDir, file);
          const stats = await fs.stat(filePath);
          
          // Check files from last 24 hours
          if (Date.now() - stats.mtime.getTime() < 24 * 60 * 60 * 1000) {
            const content = await fs.readFile(filePath, 'utf8');
            if (content.includes('error') || content.includes('failed')) {
              recentErrors.push({ file, content: content.substring(0, 500) });
            }
          }
        }
      }
      
      return recentErrors;
    } catch (error) {
      this.logError('Failed to check recent errors', error);
      return [];
    }
  }

  async saveSummary(summary, timestamp) {
    try {
      const summaryPath = path.join(this.logDir, `summary-${timestamp.split('T')[0]}.json`);
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    } catch (error) {
      this.logError('Failed to save summary', error);
    }
  }

  async sendAlert() {
    // Implementation for sending alerts (email, Slack, etc.)
    this.log('ALERT: Multiple failures detected - manual intervention may be required');
    
    // Could integrate with notification services here
    // - Email notification
    // - Slack webhook
    // - SMS alert
    // - Create GitHub issue
  }

  async alertCriticalIssues(issues) {
    this.log(`CRITICAL: ${issues.length} critical issues detected`);
    issues.forEach(issue => {
      this.log(`  - ${issue.type}: ${issue.message} (${issue.url})`);
    });
  }

  async notifyHealthIssues(errors) {
    this.log(`Health issues detected: ${errors.length} recent error(s)`);
  }

  getNextRunTime() {
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(2, 0, 0, 0);
    return nextSunday.toLocaleString();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Also write to log file
    this.writeToLogFile('monitor.log', logMessage);
  }

  logError(message, error) {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ERROR: ${message}`;
    
    if (error) {
      console.error(errorMessage, error);
      this.writeToLogFile('error.log', `${errorMessage}\n${error.stack || error.message}`);
    } else {
      console.error(errorMessage);
      this.writeToLogFile('error.log', errorMessage);
    }
  }

  async writeToLogFile(filename, message) {
    try {
      const logPath = path.join(this.logDir, filename);
      await fs.appendFile(logPath, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Graceful shutdown handling
  setupGracefulShutdown() {
    process.on('SIGINT', async () => {
      this.log('Received SIGINT, shutting down gracefully...');
      await this.saveState();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      this.log('Received SIGTERM, shutting down gracefully...');
      await this.saveState();
      process.exit(0);
    });
  }
}

// Main execution
async function main() {
  try {
    const monitor = new WeeklySiteMonitor();
    monitor.setupGracefulShutdown();
    await monitor.init();
    
    // Keep the process running
    console.log('Weekly Site Monitor is running. Press Ctrl+C to stop.');
    
    // Optional: Run initial check if it's been more than a week since last run
    if (!monitor.lastRun || Date.now() - monitor.lastRun.getTime() > 7 * 24 * 60 * 60 * 1000) {
      console.log('No recent run detected, executing initial check...');
      await monitor.runWeeklyCheck();
    }
    
  } catch (error) {
    console.error('Failed to start Weekly Site Monitor:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default WeeklySiteMonitor;
