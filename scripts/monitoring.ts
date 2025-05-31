#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  database?: string;
  compliance?: {
    ready: boolean;
    tables: Record<string, boolean>;
  };
  environment?: {
    hasSupabaseUrl: boolean;
    hasAnonKey: boolean;
    hasServiceKey: boolean;
  };
  timestamp: string;
  version?: string;
}

interface MonitoringAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  deployment?: string;
}

export class DeploymentMonitor {
  private baseUrl: string;
  private alertWebhook?: string;
  
  constructor(baseUrl: string, alertWebhook?: string) {
    this.baseUrl = baseUrl;
    this.alertWebhook = alertWebhook;
  }
  
  async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      
      if (!response.ok) {
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        };
      }
      
      const healthData = await response.json();
      return healthData;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async runContinuousMonitoring(intervalMinutes: number = 5): Promise<void> {
    console.log(`🔍 Starting continuous monitoring every ${intervalMinutes} minutes...`);
    console.log(`📊 Monitoring: ${this.baseUrl}`);
    console.log('='.repeat(60));
    
    let consecutiveFailures = 0;
    const maxFailures = 3;
    
    const monitor = async () => {
      const timestamp = new Date().toLocaleString();
      console.log(`\n⏰ Health check at ${timestamp}`);
      
      try {
        const health = await this.checkHealth();
        
        if (health.status === 'healthy') {
          console.log('✅ System healthy');
          if (health.compliance?.ready) {
            console.log('✅ Compliance system ready');
          } else {
            console.log('⚠️  Compliance system not ready');
          }
          consecutiveFailures = 0;
        } else {
          consecutiveFailures++;
          console.log(`❌ System unhealthy (${consecutiveFailures}/${maxFailures})`);
          
          await this.sendAlert({
            level: consecutiveFailures >= maxFailures ? 'critical' : 'warning',
            message: `Health check failed ${consecutiveFailures} times`,
            timestamp: new Date().toISOString(),
            deployment: this.baseUrl
          });
          
          if (consecutiveFailures >= maxFailures) {
            await this.triggerEmergencyResponse();
          }
        }
      } catch (error) {
        consecutiveFailures++;
        console.error(`💥 Monitoring error: ${error}`);
        
        await this.sendAlert({
          level: 'error',
          message: `Monitoring system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
          deployment: this.baseUrl
        });
      }
    };
    
    // Initial check
    await monitor();
    
    // Set up interval monitoring
    setInterval(monitor, intervalMinutes * 60 * 1000);
  }
  
  async triggerEmergencyResponse(): Promise<void> {
    console.log('\n🚨 TRIGGERING EMERGENCY RESPONSE');
    console.log('='.repeat(60));
    
    await this.sendAlert({
      level: 'critical',
      message: 'CRITICAL: System unhealthy for extended period - triggering emergency rollback',
      timestamp: new Date().toISOString(),
      deployment: this.baseUrl
    });
    
    try {
      console.log('🔄 Attempting emergency rollback...');
      const { stdout } = await execAsync('npm run rollback:emergency');
      console.log('✅ Emergency rollback completed');
      console.log(stdout);
      
      await this.sendAlert({
        level: 'info',
        message: 'Emergency rollback completed successfully',
        timestamp: new Date().toISOString(),
        deployment: this.baseUrl
      });
    } catch (error) {
      console.error('💥 Emergency rollback failed:', error);
      
      await this.sendAlert({
        level: 'critical',
        message: `Emergency rollback FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        deployment: this.baseUrl
      });
    }
  }
  
  async sendAlert(alert: MonitoringAlert): Promise<void> {
    const alertMessage = `[${alert.level.toUpperCase()}] ${alert.message}`;
    console.log(`📢 Alert: ${alertMessage}`);
    
    if (this.alertWebhook) {
      try {
        await fetch(this.alertWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: alertMessage,
            timestamp: alert.timestamp,
            deployment: alert.deployment
          })
        });
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    }
  }
  
  async runSmokeTestMonitoring(): Promise<boolean> {
    console.log('🧪 Running smoke test monitoring...');
    
    try {
      const { runSmokeTests } = await import('./post-deploy-tests');
      const result = await runSmokeTests(this.baseUrl);
      
      if (result) {
        await this.sendAlert({
          level: 'info',
          message: 'Smoke tests passed - system functioning correctly',
          timestamp: new Date().toISOString(),
          deployment: this.baseUrl
        });
      } else {
        await this.sendAlert({
          level: 'error',
          message: 'Smoke tests failed - system may have issues',
          timestamp: new Date().toISOString(),
          deployment: this.baseUrl
        });
      }
      
      return result;
    } catch (error) {
      await this.sendAlert({
        level: 'error',
        message: `Smoke test monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        deployment: this.baseUrl
      });
      
      return false;
    }
  }
  
  async generateHealthReport(): Promise<void> {
    console.log('\n📊 GENERATING HEALTH REPORT');
    console.log('='.repeat(60));
    
    const health = await this.checkHealth();
    const smokeTestResult = await this.runSmokeTestMonitoring();
    
    console.log('\n📋 SYSTEM STATUS SUMMARY:');
    console.log(`Status: ${health.status}`);
    console.log(`Database: ${health.database || 'Unknown'}`);
    console.log(`Compliance Ready: ${health.compliance?.ready ? 'Yes' : 'No'}`);
    console.log(`Environment Variables: ${health.environment ? 'Configured' : 'Missing'}`);
    console.log(`Smoke Tests: ${smokeTestResult ? 'Passing' : 'Failing'}`);
    console.log(`Last Check: ${health.timestamp}`);
    console.log(`Version: ${health.version || 'Unknown'}`);
    
    if (health.compliance?.tables) {
      console.log('\n📊 COMPLIANCE TABLES STATUS:');
      Object.entries(health.compliance.tables).forEach(([table, status]) => {
        console.log(`  ${table}: ${status ? '✅' : '❌'}`);
      });
    }
    
    if (health.environment) {
      console.log('\n🔧 ENVIRONMENT STATUS:');
      console.log(`  Supabase URL: ${health.environment.hasSupabaseUrl ? '✅' : '❌'}`);
      console.log(`  Anon Key: ${health.environment.hasAnonKey ? '✅' : '❌'}`);
      console.log(`  Service Key: ${health.environment.hasServiceKey ? '✅' : '❌'}`);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const url = args[1] || process.env.DEPLOYMENT_URL;
  
  if (!url) {
    console.error('Usage: tsx scripts/monitoring.ts <command> <deployment-url>');
    console.error('Commands: health, monitor, report, smoke-test');
    console.error('Example: tsx scripts/monitoring.ts health https://your-app.vercel.app');
    process.exit(1);
  }
  
  const webhook = process.env.ALERT_WEBHOOK_URL;
  const monitor = new DeploymentMonitor(url, webhook);
  
  try {
    switch (command) {
      case 'health':
        const health = await monitor.checkHealth();
        console.log('Health Status:', health);
        process.exit(health.status === 'healthy' ? 0 : 1);
        break;
        
      case 'monitor':
        const interval = parseInt(args[2]) || 5;
        await monitor.runContinuousMonitoring(interval);
        break;
        
      case 'report':
        await monitor.generateHealthReport();
        break;
        
      case 'smoke-test':
        const smokeResult = await monitor.runSmokeTestMonitoring();
        process.exit(smokeResult ? 0 : 1);
        break;
        
      default:
        console.error('Unknown command:', command);
        process.exit(1);
    }
  } catch (error) {
    console.error('💥 Monitoring failed:', error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}
